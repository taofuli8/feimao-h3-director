"""Media and script for the H3 director. Settings stay on the director node."""

from __future__ import annotations

import json

from .media_load import content_stamp, read_items, read_kept


def _preset_text(预设, 当前预设, 数字人写法, MV写法, 漫剧写法) -> tuple[str, str]:
    name = str(当前预设 or "").strip() or "数字人"
    try:
        data = json.loads(str(预设 or "").strip() or "[]")
    except json.JSONDecodeError:
        data = []
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and str(item.get("name") or "").strip() == name:
                text = str(item.get("text") or "").strip()
                if text:
                    return name, text
    named = {"数字人": 数字人写法, "MV": MV写法, "漫剧": 漫剧写法}.get(name, "")
    return name, str(named or "").strip()


class FeimaoH3Board:
    @classmethod
    def INPUT_TYPES(cls):
        from .nodes_reverse import COMIC_PROMPT, DIGITAL_PROMPT, MV_PROMPT

        return {
            "required": {
                "images_json": ("STRING", {"default": "[]", "multiline": True}),
                "videos_json": ("STRING", {"default": "[]", "multiline": True}),
                "audios_json": ("STRING", {"default": "[]", "multiline": True}),
                "提示词": ("STRING", {"default": "", "multiline": True}),
                "反推结果": ("STRING", {"multiline": True, "default": ""}),
                "数字人写法": ("STRING", {"multiline": True, "default": DIGITAL_PROMPT}),
                "MV写法": ("STRING", {"multiline": True, "default": MV_PROMPT}),
                "漫剧写法": ("STRING", {"multiline": True, "default": COMIC_PROMPT}),
                "预设": ("STRING", {"multiline": True, "default": ""}),
                "当前预设": ("STRING", {"default": "数字人"}),
                "模式缓存": ("STRING", {"multiline": True, "default": "{}"}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("素材",)
    FUNCTION = "run"
    CATEGORY = "feimao-h3导演台"
    DESCRIPTION = "参考图、参考视频、参考音频和剧本都在这里。把「素材」接到 H3导演设置。"

    @classmethod
    def IS_CHANGED(cls, images_json="[]", videos_json="[]", audios_json="[]", 提示词="", 预设="", 当前预设="数字人", 数字人写法="", MV写法="", 漫剧写法="", **_extra):
        name, text = _preset_text(预设, 当前预设, 数字人写法, MV写法, 漫剧写法)
        return "|".join((
            content_stamp(images_json),
            content_stamp(videos_json),
            content_stamp(audios_json),
            str(提示词),
            name,
            text,
        ))

    def run(self, images_json="[]", videos_json="[]", audios_json="[]", 提示词="", 预设="", 当前预设="数字人", 数字人写法="", MV写法="", 漫剧写法="", **_extra):
        name, text = _preset_text(预设, 当前预设, 数字人写法, MV写法, 漫剧写法)
        payload = json.dumps({
            "images": read_kept(images_json),
            "videos": read_items(videos_json),
            "audios": read_items(audios_json),
            "prompt": str(提示词 or ""),
            "preset_name": name,
            "preset_text": text,
        }, ensure_ascii=False)
        return (payload,)


NODE_CLASS_MAPPINGS = {
    "FeimaoH3Board": FeimaoH3Board,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FeimaoH3Board": "H3素材剧本",
}
