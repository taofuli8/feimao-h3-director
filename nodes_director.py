"""H3 director settings. Media and the script come from the board node."""

from __future__ import annotations

import json

from .media_load import content_stamp, cover_resize, load_audio, load_image, load_video, read_items, resolve_item, stack_images
from .prompt_format import (
    ASPECTS,
    AUDIO_SLOTS,
    IMAGE_SLOTS,
    VIDEO_SLOTS,
    frames_for_seconds,
    h3_canvas,
    inventory,
    referenced,
    render_prompt,
    shift_standalone_audio,
)
from .nodes_reverse import COMIC_PROMPT, DIGITAL_PROMPT, MV_PROMPT
from .reverse_service import reverse_model_choices, vision_model_choices

def _load_slot(kind: str, items: list[dict], index: int):
    if index >= len(items):
        return None if kind != "video" else (None, None)
    item = items[index]
    path = resolve_item(item)
    label = item.get("name") or item.get("filename") or index + 1
    if path is None:
        raise ValueError(f"找不到第 {index + 1} 个{_label(kind)}：{label}")
    if kind == "image":
        return load_image(path)
    if kind == "audio":
        return load_audio(path)
    video, audio = load_video(path)
    return video, audio


def _label(kind: str) -> str:
    return {"image": "参考图", "audio": "参考音频", "video": "参考视频"}.get(kind, "素材")


MODES = ("多参", "文生", "图生", "首尾帧")


def _mode(value) -> str:
    text = str(value or "").strip()
    return text if text in MODES else "多参"


def _apply_board(素材, images_json, videos_json, audios_json, 提示词):
    if 素材 is None:
        return images_json, videos_json, audios_json, 提示词
    text = str(素材 or "").strip()
    if not text:
        return "[]", "[]", "[]", ""
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return images_json, videos_json, audios_json, 提示词
    if not isinstance(data, dict):
        return images_json, videos_json, audios_json, 提示词
    return (
        json.dumps(data.get("images") or [], ensure_ascii=False),
        json.dumps(data.get("videos") or [], ensure_ascii=False),
        json.dumps(data.get("audios") or [], ensure_ascii=False),
        str(data.get("prompt") or ""),
    )


def _filled(prefix, values):
    packed = {}
    for index, value in enumerate(values):
        if value is not None:
            packed[f"{prefix}{index}"] = value
    return packed or None


def _condition(mode, clip, vae, audio_vae, prompt, width, height, length, pictures, videos, soundtracks, audios):
    """文生/图生/首尾帧 and 多参 used to be two separate H3 nodes. Both run in here."""
    from comfy_extras.nodes_minimax_h3 import MiniMaxH3ImageToVideo, MiniMaxH3ReferenceToVideo

    if mode == "多参":
        result = MiniMaxH3ReferenceToVideo.execute(
            clip,
            prompt,
            width,
            height,
            length,
            ref_image_size="match",
            vae=vae,
            audio_vae=audio_vae,
            ref_images=_filled("ref_image_", pictures),
            ref_videos=_filled("ref_video_", videos),
            ref_video_audios=_filled("ref_video_audio_", soundtracks),
            ref_audios=_filled("ref_audio_", audios),
        )
    else:
        if vae is None and mode != "文生":
            raise ValueError("图生和首尾帧要接上视频 VAE")
        first = pictures[0] if pictures else None
        last = pictures[1] if mode == "首尾帧" and len(pictures) > 1 else None
        result = MiniMaxH3ImageToVideo.execute(clip, vae, prompt, width, height, length, first_frame=first, last_frame=last)
    return result[0], result[1]


class FeimaoH3Director:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "clip": ("CLIP",),
                "images_json": ("STRING", {"default": "[]", "multiline": True}),
                "videos_json": ("STRING", {"default": "[]", "multiline": True}),
                "audios_json": ("STRING", {"default": "[]", "multiline": True}),
                "提示词": ("STRING", {"default": "", "multiline": True}),
                "宽高比": (list(ASPECTS), {"default": "9:16"}),
                "百万像素": ("FLOAT", {"default": 1.0, "min": 0.1, "max": 16.0, "step": 0.1, "tooltip": "总像素，1 约等于 1024×1024。H3 常用 1 左右。"}),
                "对齐倍数": ("INT", {"default": 32, "min": 1, "max": 128, "step": 1, "tooltip": "宽和高都会对齐到这个倍数。H3 用 32。"}),
                "秒数": ("FLOAT", {"default": 5.0, "min": 1.0, "max": 30.0, "step": 0.5}),
                "模式": (list(MODES), {
                    "default": "多参",
                    "tooltip": "多参用参考模型。文生、图生、首尾帧用首尾帧模型：文生不送图，图生只送首帧，首尾帧送首帧和尾帧。",
                }),
                "反推模型": (reverse_model_choices(), {
                    "tooltip": "反推用的千问主模型。下面一行是配对的视觉模型。",
                }),
                "视觉模型": (vision_model_choices(), {
                    "tooltip": "反推用的视觉投影 mmproj。换主模型时会按版本配一个，也可以自己改。",
                }),
                "反推结果": ("STRING", {"multiline": True, "default": ""}),
                "数字人写法": ("STRING", {"multiline": True, "default": DIGITAL_PROMPT}),
                "MV写法": ("STRING", {"multiline": True, "default": MV_PROMPT}),
                "漫剧写法": ("STRING", {"multiline": True, "default": COMIC_PROMPT}),
                "预设": ("STRING", {"multiline": True, "default": ""}),
                "当前预设": ("STRING", {"default": "数字人"}),
            },
            "optional": {
                "vae": ("VAE",),
                "audio_vae": ("VAE",),
                "素材": ("STRING", {"forceInput": True, "tooltip": "接 H3素材剧本。图片、视频、音频和剧本以那边为准。"}),
            },
        }

    RETURN_TYPES = ("CONDITIONING", "LATENT", "STRING", "IMAGE", "BOOLEAN", "STRING")
    RETURN_NAMES = ("正向", "潜空间", "提示词", "图片反推", "走多参", "素材清单")
    FUNCTION = "run"
    CATEGORY = "feimao-h3导演台"
    DESCRIPTION = (
        "H3 导演设置。这里放画幅、时长、模式、反推主模型和视觉模型，并送出正向条件和潜空间。"
        "参考图、参考视频、参考音频和剧本在 H3素材剧本上，用「素材」接过来。"
        "走多参只用来切换模型：多参接参考模型，另外三种接首尾帧模型。"
    )

    @classmethod
    def IS_CHANGED(cls, images_json="[]", videos_json="[]", audios_json="[]", 提示词="", 宽高比="9:16", 百万像素=1.0, 对齐倍数=32, 秒数=5.0, 模式="多参", clip=None, vae=None, audio_vae=None, 素材=None, **_extra):
        images_json, videos_json, audios_json, 提示词 = _apply_board(素材, images_json, videos_json, audios_json, 提示词)
        width, height = h3_canvas(宽高比, 百万像素, 对齐倍数)
        frames = frames_for_seconds(秒数)
        return "|".join((
            _mode(模式),
            content_stamp(images_json),
            content_stamp(videos_json),
            content_stamp(audios_json),
            str(提示词),
            str(width),
            str(height),
            str(frames),
            str(id(clip)),
            str(id(vae)),
            str(id(audio_vae)),
        ))

    def run(self, images_json="[]", videos_json="[]", audios_json="[]", 提示词="", 宽高比="9:16", 百万像素=1.0, 对齐倍数=32, 秒数=5.0, 模式="多参", clip=None, vae=None, audio_vae=None, 素材=None, **_extra):
        images_json, videos_json, audios_json, 提示词 = _apply_board(素材, images_json, videos_json, audios_json, 提示词)
        mode = _mode(模式)
        images = read_items(images_json)[:IMAGE_SLOTS]
        videos = read_items(videos_json)[:VIDEO_SLOTS]
        audios = read_items(audios_json)[:AUDIO_SLOTS]
        if mode == "图生" and not images:
            raise ValueError("图生要先上传一张首帧")
        if mode == "首尾帧" and len(images) < 2:
            raise ValueError("首尾帧要上传两张图：第一张首帧，第二张尾帧")
        if mode == "多参":
            counts = {"image": len(images), "video": len(videos), "audio": len(audios)}
            names = {"image": "参考图", "video": "参考视频", "audio": "参考音频"}
            for kind, numbers in referenced(提示词).items():
                missing = [number for number in numbers if number > counts[kind]]
                if missing:
                    raise ValueError(f"提示词用了第 {missing[0]} 个{names[kind]}，但这条还没上传")

        mentioned = referenced(提示词) if mode == "多参" else {"image": [], "video": [], "audio": []}
        use_images = {"文生": 0, "图生": 1, "首尾帧": 2}.get(mode, max(mentioned["image"], default=0))
        width, height = h3_canvas(宽高比, 百万像素, 对齐倍数)
        picture_frames = []
        picture_out = []
        for index in range(IMAGE_SLOTS):
            if index >= use_images:
                picture_out.append(None)
                continue
            frame = _load_slot("image", images, index)
            if frame is not None and mode != "多参":
                picture_frames.append(frame)
            if frame is not None and mode in ("图生", "首尾帧"):
                frame = cover_resize(frame, width, height)
            picture_out.append(frame)
        if mode == "多参":
            for number in mentioned["image"]:
                frame = _load_slot("image", images, number - 1)
                if frame is not None:
                    picture_frames.append(frame)

        if mode == "多参":
            use_videos = max(mentioned["video"], default=0)
            use_audios = max(mentioned["audio"], default=0)
            audio_out = [_load_slot("audio", audios, index) if index < use_audios else None for index in range(AUDIO_SLOTS)]
            video_out = []
            video_audio_out = []
            for index in range(VIDEO_SLOTS):
                if index >= use_videos:
                    video_out.append(None)
                    video_audio_out.append(None)
                    continue
                loaded = _load_slot("video", videos, index)
                if loaded == (None, None) or loaded is None:
                    video_out.append(None)
                    video_audio_out.append(None)
                    continue
                frames, soundtrack = loaded
                video_out.append(frames)
                video_audio_out.append(soundtrack)
        else:
            audio_out = [None] * AUDIO_SLOTS
            video_out = [None] * VIDEO_SLOTS
            video_audio_out = [None] * VIDEO_SLOTS

        frames = frames_for_seconds(秒数)
        prompt = render_prompt(提示词)
        if mode == "多参":
            soundtrack_count = sum(1 for item in video_audio_out if item is not None)
            prompt = shift_standalone_audio(prompt, soundtrack_count)
        note = inventory(len(images), len(videos), len(audios), 宽高比, 秒数, 百万像素, 对齐倍数, mode)
        if clip is None:
            raise ValueError("导演台要接上 CLIP")
        positive, latent = _condition(mode, clip, vae, audio_vae, prompt, width, height, frames, picture_out, video_out, video_audio_out, audio_out)
        return (positive, latent, prompt, stack_images(picture_frames), mode == "多参", note)


NODE_CLASS_MAPPINGS = {
    "FeimaoH3Director": FeimaoH3Director,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FeimaoH3Director": "H3导演设置",
}
