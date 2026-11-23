"""H3 director settings. Media and the script come from the board node."""

from __future__ import annotations

import json

from .media_load import content_stamp, cover_resize, load_audio, load_audio_span, load_image, load_video, read_items, read_slots, resolve_item
from .prompt_format import (
    ASPECTS,
    AUDIO_SLOTS,
    IMAGE_SLOTS,
    VIDEO_SLOTS,
    frames_for_seconds,
    h3_canvas,
    referenced,
    render_prompt,
    shift_standalone_audio,
)
from .nodes_reverse import COMIC_PROMPT, DIGITAL_PROMPT, MV_PROMPT
from .reverse_service import reverse_model_choices, vision_model_choices

def _load_slot(kind: str, items: list, index: int, max_seconds: float | None = None):
    if index >= len(items) or items[index] is None:
        return None if kind != "video" else (None, None)
    item = items[index]
    path = resolve_item(item)
    label = item.get("name") or item.get("filename") or index + 1
    if path is None:
        raise ValueError(f"找不到第 {index + 1} 个{_label(kind)}：{label}")
    if kind == "image":
        return load_image(path)
    if kind == "audio":
        return load_audio(path, 30.0 if max_seconds is None else max_seconds)
    video, audio = load_video(path)
    return video, audio


def _label(kind: str) -> str:
    return {"image": "参考图", "audio": "参考音频", "video": "参考视频"}.get(kind, "素材")


MODES = ("多参", "文生", "首帧", "尾帧", "首尾帧", "数字人")
FRAME_MODES = ("首帧", "尾帧", "首尾帧")
PAIR_MODES = ("首尾帧", "数字人")


def _mode(value) -> str:
    text = str(value or "").strip()
    if text == "图生":
        return "首帧"
    return text if text in MODES else "多参"


def _flag(value) -> bool:
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def _board_extra(素材) -> dict:
    text = str(素材 or "").strip()
    if not text:
        return {}
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {}
    if not isinstance(data, dict):
        return {}
    return {
        "preset_name": str(data.get("preset_name") or ""),
        "preset_text": str(data.get("preset_text") or ""),
    }


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


DRIVE_LIMIT = 15.0


def _drive_window(item: dict, video_seconds) -> tuple[float, float, str]:
    """Start and length for the drive audio. Unset crop uses the first 15 seconds."""
    follow = "video" if str(item.get("drive_follow") or "") == "video" else "audio"
    try:
        start = float(item.get("drive_start") or 0)
    except (TypeError, ValueError):
        start = 0.0
    start = max(0.0, start)
    if follow == "video":
        try:
            length = float(video_seconds)
        except (TypeError, ValueError):
            length = 5.0
    else:
        end = item.get("drive_end")
        if end in (None, ""):
            length = DRIVE_LIMIT
        else:
            try:
                length = float(end) - start
            except (TypeError, ValueError):
                length = DRIVE_LIMIT
    length = min(DRIVE_LIMIT, max(1.0, length))
    return start, length, follow


def _frames_for_audio(seconds: float, available: float) -> int:
    frames = frames_for_seconds(min(DRIVE_LIMIT, max(1.0, float(seconds))))
    room = min(DRIVE_LIMIT, max(0.0, float(available)))
    while frames > 5 and frames / 24.0 > room + 0.001:
        frames -= 17
    return frames


def _audio_drive():
    import nodes

    found = nodes.NODE_CLASS_MAPPINGS.get("MiniMaxH3AudioConditioningT8")
    if isinstance(found, type) and callable(getattr(found, "execute", None)):
        return found
    raise RuntimeError("找不到 MiniMax H3 Audio Conditioning (T8)。请确认 minimax-h3-audio-T8 已启用。")


def _condition(mode, clip, vae, audio_vae, prompt, width, height, length, pictures, videos, soundtracks, audios, first_frame=None, last_frame=None, drive_audio=None):
    """文生/首帧/尾帧/首尾帧 and 多参 used to be two separate H3 nodes. Both run in here."""
    from comfy_extras.nodes_minimax_h3 import MiniMaxH3ImageToVideo, MiniMaxH3ReferenceToVideo

    if drive_audio is not None:
        result = _audio_drive().execute(
            clip,
            vae,
            audio_vae,
            prompt,
            width,
            height,
            length,
            "auto",
            "lock_source",
            1.0,
            False,
            0,
            True,
            "max",
            "official_2_to_15s",
            drive_audio=drive_audio,
            first_frame=first_frame,
            last_frame=last_frame,
        )
        return result[0], result[1]
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
            raise ValueError("首帧、尾帧、首尾帧和数字人要接上视频 VAE")
        if mode == "文生":
            first_frame = None
            last_frame = None
        result = MiniMaxH3ImageToVideo.execute(clip, vae, prompt, width, height, length, first_frame=first_frame, last_frame=last_frame)
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
                    "tooltip": "多参用参考模型。文生、首帧、尾帧、首尾帧、数字人用首尾帧模型。首尾帧和数字人只上传一张时，按那一张是首帧还是尾帧来出片。数字人要上传声音驱动，采样和保存单独走，模型和加速 LoRA、步数跟其它模式共用。",
                }),
                "反推结果": ("STRING", {"multiline": True, "default": ""}),
                "数字人写法": ("STRING", {"multiline": True, "default": DIGITAL_PROMPT}),
                "MV写法": ("STRING", {"multiline": True, "default": MV_PROMPT}),
                "漫剧写法": ("STRING", {"multiline": True, "default": COMIC_PROMPT}),
                "预设": ("STRING", {"multiline": True, "default": ""}),
                "当前预设": ("STRING", {"default": "数字人"}),
                "自动扩写": ("BOOLEAN", {
                    "default": False,
                    "tooltip": "打开后，生成前先按剧本和图片扩写，再用扩写结果出片。关掉后，直接按剧本编辑框里的文字出片。",
                }),
                "反推模型": (reverse_model_choices(), {
                    "tooltip": "手动扩写和自动扩写看图、写提示词用的千问主模型。自动扩写关掉时，生成不加载它。",
                }),
                "视觉模型": (vision_model_choices(), {
                    "tooltip": "看图用的视觉投影 mmproj。只在扩写时使用，不影响直接按剧本出片。",
                }),
            },
            "optional": {
                "vae": ("VAE",),
                "audio_vae": ("VAE",),
                "素材": ("STRING", {"forceInput": True, "tooltip": "接 H3素材剧本。图片、视频、音频和剧本以那边为准。"}),
            },
        }

    RETURN_TYPES = ("CONDITIONING", "LATENT", "BOOLEAN")
    RETURN_NAMES = ("正向", "潜空间", "走数字人")
    FUNCTION = "run"
    CATEGORY = "feimao-h3导演台"
    DESCRIPTION = (
        "H3 导演设置。这里放画幅、时长、模式、反推主模型和视觉模型，并送出正向条件和潜空间。"
        "参考图、参考视频、参考音频和剧本在 H3素材剧本上，用「素材」接过来。"
        "多参用参考模型，文生、首帧、尾帧、首尾帧、数字人用首尾帧模型，由页面按模式切换。"
        "走数字人接给模式放行。数字人单独采样、解码和保存，模型、加速 LoRA 和步数跟其它模式共用。"
        "自动扩写默认关闭。打开后，生成前会先扩写，再按扩写结果出片。关掉后，按素材剧本编辑框里的文字出片。"
    )

    @classmethod
    def VALIDATE_INPUTS(cls, 反推模型="", 视觉模型=""):
        return True

    @classmethod
    def IS_CHANGED(cls, images_json="[]", videos_json="[]", audios_json="[]", 提示词="", 宽高比="9:16", 百万像素=1.0, 对齐倍数=32, 秒数=5.0, 模式="多参", clip=None, vae=None, audio_vae=None, 素材=None, 自动扩写=False, 反推模型="", 视觉模型="", **_extra):
        images_json, videos_json, audios_json, 提示词 = _apply_board(素材, images_json, videos_json, audios_json, 提示词)
        extra = _board_extra(素材)
        width, height = h3_canvas(宽高比, 百万像素, 对齐倍数)
        frames = frames_for_seconds(秒数)
        return "|".join((
            _mode(模式),
            "1" if _flag(自动扩写) else "0",
            str(反推模型 or ""),
            str(视觉模型 or ""),
            str(extra.get("preset_name") or ""),
            str(extra.get("preset_text") or ""),
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

    def run(self, images_json="[]", videos_json="[]", audios_json="[]", 提示词="", 宽高比="9:16", 百万像素=1.0, 对齐倍数=32, 秒数=5.0, 模式="多参", clip=None, vae=None, audio_vae=None, 素材=None, 自动扩写=False, 反推模型="", 视觉模型="", **_extra):
        images_json, videos_json, audios_json, 提示词 = _apply_board(素材, images_json, videos_json, audios_json, 提示词)
        mode = _mode(模式)
        if mode in PAIR_MODES:
            images = read_slots(images_json, 2)
        elif mode in ("首帧", "尾帧"):
            images = read_slots(images_json, 1)
        else:
            images = read_items(images_json)[:IMAGE_SLOTS]
        videos = read_items(videos_json)[:VIDEO_SLOTS]
        audios = read_items(audios_json)[:AUDIO_SLOTS]
        drive = mode == "数字人"
        if drive and not (audios and audios[0]):
            raise ValueError("数字人模式要先上传声音驱动")
        drive_audio = None
        run_seconds = float(秒数)
        if drive:
            if audio_vae is None:
                raise ValueError("声音驱动要接上音频 VAE")
            if vae is None:
                raise ValueError("声音驱动要接上视频 VAE")
            item = audios[0]
            path = resolve_item(item)
            if path is None:
                raise ValueError(f"找不到声音驱动：{item.get('name') or item.get('filename') or '音频'}")
            start, requested, _follow = _drive_window(item, 秒数)
            drive_audio, run_seconds = load_audio_span(path, start, requested, DRIVE_LIMIT)
            if run_seconds < 1.0:
                raise ValueError("声音驱动至少需要 1 秒音频")
        if _flag(自动扩写):
            from .reverse_service import expand_script

            extra = _board_extra(素材)
            提示词 = expand_script(
                反推模型,
                视觉模型,
                mode,
                提示词,
                images,
                extra.get("preset_name") or "数字人",
                extra.get("preset_text") or "",
                宽高比,
                run_seconds,
                百万像素,
                对齐倍数,
                drive=drive,
            )
        width, height = h3_canvas(宽高比, 百万像素, 对齐倍数)
        picture_out = []
        first_frame = None
        last_frame = None
        if mode == "多参":
            counts = {"image": len(images), "video": len(videos), "audio": len(audios)}
            names = {"image": "参考图", "video": "参考视频", "audio": "参考音频"}
            for kind, numbers in referenced(提示词).items():
                missing = [number for number in numbers if number > counts[kind]]
                if missing:
                    raise ValueError(f"提示词用了第 {missing[0]} 个{names[kind]}，但这条还没上传")
            mentioned = referenced(提示词)
            for index in range(IMAGE_SLOTS):
                picture_out.append(_load_slot("image", images, index) if index < max(mentioned["image"], default=0) else None)
        else:
            picture_out = [None] * IMAGE_SLOTS
            if mode == "首帧":
                if not images[0]:
                    raise ValueError("首帧模式要先上传首帧")
                first_frame = cover_resize(_load_slot("image", images, 0), width, height)
            elif mode == "尾帧":
                if not images[0]:
                    raise ValueError("尾帧模式要先上传尾帧")
                last_frame = cover_resize(_load_slot("image", images, 0), width, height)
            elif mode in PAIR_MODES:
                if images[0]:
                    first_frame = cover_resize(_load_slot("image", images, 0), width, height)
                if images[1]:
                    last_frame = cover_resize(_load_slot("image", images, 1), width, height)
                if first_frame is None and last_frame is None:
                    raise ValueError("数字人至少上传首帧或尾帧" if mode == "数字人" else "首尾帧至少上传首帧或尾帧")
            picture_out[0] = first_frame
            picture_out[1] = last_frame

        if mode == "多参":
            mentioned = referenced(提示词)
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

        frames = _frames_for_audio(run_seconds, run_seconds) if drive else frames_for_seconds(秒数)
        prompt = render_prompt(提示词)
        if mode == "多参":
            soundtrack_count = sum(1 for item in video_audio_out if item is not None)
            prompt = shift_standalone_audio(prompt, soundtrack_count)
        if clip is None:
            raise ValueError("导演台要接上 CLIP")
        positive, latent = _condition(mode, clip, vae, audio_vae, prompt, width, height, frames, picture_out, video_out, video_audio_out, audio_out, first_frame, last_frame, drive_audio)
        return (positive, latent, mode == "数字人")


NODE_CLASS_MAPPINGS = {
    "FeimaoH3Director": FeimaoH3Director,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FeimaoH3Director": "H3导演设置",
}
