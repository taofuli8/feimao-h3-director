"""Media and script for the H3 director. Settings stay on the director node."""

from __future__ import annotations

import json

from .media_load import content_stamp, read_items


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
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("素材",)
    FUNCTION = "run"
    CATEGORY = "feimao-h3导演台"
    DESCRIPTION = "参考图、参考视频、参考音频和剧本都在这里。把「素材」接到 H3导演设置。"

    @classmethod
    def IS_CHANGED(cls, images_json="[]", videos_json="[]", audios_json="[]", 提示词="", **_extra):
        return "|".join((
            content_stamp(images_json),
            content_stamp(videos_json),
            content_stamp(audios_json),
            str(提示词),
        ))

    def run(self, images_json="[]", videos_json="[]", audios_json="[]", 提示词="", **_extra):
        payload = json.dumps({
            "images": read_items(images_json),
            "videos": read_items(videos_json),
            "audios": read_items(audios_json),
            "prompt": str(提示词 or ""),
        }, ensure_ascii=False)
        return (payload,)


NODE_CLASS_MAPPINGS = {
    "FeimaoH3Board": FeimaoH3Board,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FeimaoH3Board": "H3素材剧本",
}
