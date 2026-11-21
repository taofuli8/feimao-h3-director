"""H3 director prompt tags, canvas size, and frame count. No Comfy imports."""

from __future__ import annotations

import math
import re

IMAGE_SLOTS = 9
AUDIO_SLOTS = 3
VIDEO_SLOTS = 3
FPS = 24
MAX_VIDEO_SECONDS = 15.0
CANVAS_MULTIPLE = 32

ASPECTS = {
    "16:9": (16, 9),
    "9:16": (9, 16),
    "1:1": (1, 1),
    "4:3": (4, 3),
    "3:4": (3, 4),
    "21:9": (21, 9),
}

_TAG = re.compile(
    r"\{\{img:(\d+)\}\}"
    r"|\{\{vid:(\d+)\}\}"
    r"|\{\{aud:(\d+)\}\}"
    r"|<Picture\s+(\d+)\s*>"
    r"|<Video\s+(\d+)\s*>"
    r"|<Audio\s+(\d+)\s*>"
    r"|@图片\s*(\d+)"
    r"|@图\s*(\d+)"
    r"|@视频\s*(\d+)"
    r"|@音频\s*(\d+)",
    re.IGNORECASE,
)


def normalize_brackets(text: str) -> str:
    return (
        str(text or "")
        .replace("＜", "<")
        .replace("＞", ">")
        .replace("〈", "<")
        .replace("〉", ">")
    )


def _kind_number(match: re.Match) -> tuple[str, int]:
    groups = match.groups()
    kinds = ("image", "video", "audio", "image", "video", "audio", "image", "image", "video", "audio")
    for kind, group in zip(kinds, groups):
        if group:
            return kind, int(group)
    return "image", 0


def shift_standalone_audio(text: str, soundtrack_count: int) -> str:
    """H3 numbers a video's own soundtrack before standalone audio.

    <Audio 1> in the director means the first audio the user uploaded.
    If two reference videos have sound, those occupy <Audio 1> and <Audio 2>,
    and the user's <Audio 1> is sent as <Audio 3>.
    """
    count = max(0, int(soundtrack_count or 0))
    if count == 0:
        return text

    def repl(match: re.Match) -> str:
        return f"<Audio {int(match.group(1)) + count}>"

    return re.sub(r"<Audio\s+(\d+)\s*>", repl, text, flags=re.IGNORECASE)


def render_prompt(text: str) -> str:
    """Turn @ / {{ }} aliases into the tags MiniMax H3 reads."""
    source = normalize_brackets(text)

    def repl(match: re.Match) -> str:
        kind, number = _kind_number(match)
        if number < 1:
            return match.group(0)
        if kind == "video":
            return f"<Video {number}>"
        if kind == "audio":
            return f"<Audio {number}>"
        return f"<Picture {number}>"

    return _TAG.sub(repl, source)


def referenced(text: str) -> dict[str, list[int]]:
    found = {"image": [], "video": [], "audio": []}
    for match in _TAG.finditer(normalize_brackets(text)):
        kind, number = _kind_number(match)
        if number > 0 and number not in found[kind]:
            found[kind].append(number)
    return found


def h3_canvas(aspect: str, megapixels=1.0, multiple=32) -> tuple[int, int]:
    """Width and height from aspect, megapixels, and snap multiple.

    One megapixel is 1024×1024, same as the image prompt node.
    H3 wants the multiple at 32. 9:16 at 1.0 MP lands on 768×1376.
    """
    w_ratio, h_ratio = ASPECTS.get(str(aspect or ""), (9, 16))
    try:
        mp = float(megapixels)
    except (TypeError, ValueError):
        mp = 1.0
    mp = min(16.0, max(0.1, mp))
    try:
        step = int(multiple)
    except (TypeError, ValueError):
        step = CANVAS_MULTIPLE
    step = min(128, max(1, step))
    scale = math.sqrt((mp * 1024 * 1024) / (w_ratio * h_ratio))
    width = max(step, round(w_ratio * scale / step) * step)
    height = max(step, round(h_ratio * scale / step) * step)
    return int(width), int(height)


def frames_for_seconds(seconds) -> int:
    """24 fps, then snap up onto H3's 17k+5 frame grid. 5 seconds -> 124 frames."""
    try:
        value = float(seconds)
    except (TypeError, ValueError):
        value = 5.0
    value = min(30.0, max(1.0, value))
    count = max(5, int(round(value * FPS)))
    return count + (5 - (count % 17)) % 17


def inventory(image_count: int, video_count: int, audio_count: int, aspect: str, seconds, megapixels=1.0, multiple=32, mode="多参") -> str:
    width, height = h3_canvas(aspect, megapixels, multiple)
    frames = frames_for_seconds(seconds)
    size = f"画面 {width}×{height}，{float(seconds):g} 秒，{frames} 帧"
    if mode == "文生":
        return f"文生视频，不使用参考图、参考视频和参考音频。\n{size}"
    if mode == "图生":
        return f"图生视频，用第 1 张图作首帧。\n{size}"
    if mode == "首尾帧":
        return f"首尾帧，第 1 张是首帧，第 2 张是尾帧。\n{size}"
    pictures = " ".join(f"<Picture {i}>" for i in range(1, image_count + 1)) or "无"
    videos = " ".join(f"<Video {i}>" for i in range(1, video_count + 1)) or "无"
    audios = " ".join(f"<Audio {i}>" for i in range(1, audio_count + 1)) or "无"
    return (
        f"参考图 {image_count} 张：{pictures}\n"
        f"参考视频 {video_count} 段：{videos}\n"
        f"参考音频 {audio_count} 段：{audios}\n"
        f"{size}"
    )
