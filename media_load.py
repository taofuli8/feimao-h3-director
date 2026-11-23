"""Load pictures, audio, and short reference videos for the H3 director."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from .prompt_format import MAX_VIDEO_SECONDS

_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".tif", ".tiff"}


def read_items(raw) -> list[dict]:
    text = str(raw or "").strip() or "[]"
    try:
        data = json.loads(text)
    except Exception as exc:
        raise ValueError(f"素材数据不是有效 JSON: {exc}") from exc
    if isinstance(data, dict):
        data = data.get("items") or []
    if not isinstance(data, list):
        raise ValueError("素材数据必须是数组")
    items = []
    for item in data:
        if isinstance(item, dict) and str(item.get("filename") or item.get("abs_path") or "").strip():
            items.append(item)
    return items


def read_kept(raw) -> list:
    """Like read_items, but keep an empty hole so 首帧 and 尾帧 stay in place."""
    text = str(raw or "").strip() or "[]"
    try:
        data = json.loads(text)
    except Exception as exc:
        raise ValueError(f"素材数据不是有效 JSON: {exc}") from exc
    if isinstance(data, dict):
        data = data.get("items") or data.get("images") or []
    if not isinstance(data, list):
        raise ValueError("素材数据必须是数组")
    kept = []
    for item in data:
        if item is None:
            kept.append(None)
        elif isinstance(item, dict) and str(item.get("filename") or item.get("abs_path") or "").strip():
            kept.append(item)
    while kept and kept[-1] is None:
        kept.pop()
    return kept


def read_slots(raw, count: int) -> list:
    """Fixed slots. A missing tail stays empty; a leading hole stays a leading hole."""
    slots = []
    for item in read_kept(raw):
        slots.append(item)
    while len(slots) < count:
        slots.append(None)
    return slots[:count]


def resolve_item(item: dict) -> Path | None:
    abs_path = str(item.get("abs_path") or "").strip()
    if abs_path:
        path = Path(abs_path)
        if path.is_file():
            return path
    name = str(item.get("filename") or "").strip()
    if not name:
        return None
    try:
        import folder_paths
    except Exception:
        return None
    sub = str(item.get("subfolder") or "").strip().replace("\\", "/").strip("/")
    kind = str(item.get("type") or "input")
    bases = {
        "input": folder_paths.get_input_directory(),
        "output": folder_paths.get_output_directory(),
        "temp": folder_paths.get_temp_directory(),
    }
    base = Path(bases.get(kind, folder_paths.get_input_directory()))
    path = base / sub / name if sub else base / name
    return path if path.is_file() else None


def content_stamp(raw) -> str:
    try:
        items = read_items(raw)
    except Exception as exc:
        return f"invalid:{exc}"
    parts = []
    for item in items:
        path = resolve_item(item)
        if path is None or not path.is_file():
            parts.append(str(item.get("filename") or ""))
            continue
        try:
            stat = path.stat()
            digest = hashlib.sha256()
            with path.open("rb") as handle:
                digest.update(handle.read(65536))
                if stat.st_size > 65536:
                    handle.seek(max(0, stat.st_size - 65536))
                    digest.update(handle.read(65536))
            parts.append(f"{path}:{stat.st_size}:{digest.hexdigest()}")
        except Exception:
            parts.append(f"{path}:unreadable")
    return "|".join(parts)


def cover_resize(image, width: int, height: int):
    """Center-crop to the exact canvas. Matches the 图生 / 首尾帧 workflows."""
    import comfy.utils

    width = int(width)
    height = int(height)
    if width < 1 or height < 1:
        return image
    if int(image.shape[1]) == height and int(image.shape[2]) == width:
        return image
    samples = image[..., :3].movedim(-1, 1)
    samples = comfy.utils.common_upscale(samples, width, height, "lanczos", "center")
    return samples.movedim(1, -1)


def load_image(path: Path):
    import numpy as np
    import torch
    from PIL import Image, ImageOps

    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img)
        img = img.convert("RGB")
        array = np.array(img, dtype=np.float32) / 255.0
    return torch.from_numpy(array).unsqueeze(0)


def stack_images(frames):
    """Letterbox every picture onto one batch so the reverse node can read them in order."""
    import torch

    if not frames:
        return torch.zeros((1, 64, 64, 3), dtype=torch.float32)
    height = max(frame.shape[1] for frame in frames)
    width = max(frame.shape[2] for frame in frames)
    fitted = []
    for frame in frames:
        if frame.shape[1] == height and frame.shape[2] == width:
            fitted.append(frame)
            continue
        canvas = torch.zeros((1, height, width, 3), dtype=frame.dtype)
        top = (height - frame.shape[1]) // 2
        left = (width - frame.shape[2]) // 2
        canvas[:, top:top + frame.shape[1], left:left + frame.shape[2], :] = frame
        fitted.append(canvas)
    return torch.cat(fitted, dim=0)


def _trim_audio(audio: dict, seconds: float) -> dict:
    waveform = audio["waveform"]
    rate = int(audio["sample_rate"])
    limit = max(1, int(float(seconds) * rate))
    if waveform.shape[-1] > limit:
        waveform = waveform[..., :limit].clone()
    return {"waveform": waveform, "sample_rate": rate}


def load_audio(path: Path, max_seconds: float = 30.0) -> dict:
    from comfy_extras.nodes_audio import load

    waveform, sample_rate = load(str(path))
    return _trim_audio({"waveform": waveform.unsqueeze(0), "sample_rate": sample_rate}, max_seconds)


def load_audio_span(path: Path, start: float, seconds: float, limit: float = 15.0) -> tuple[dict, float]:
    """Slice one region out of an audio file. The slice never exceeds `limit` seconds."""
    from comfy_extras.nodes_audio import load

    waveform, sample_rate = load(str(path))
    rate = int(sample_rate)
    waveform = waveform.unsqueeze(0)
    total = waveform.shape[-1] / rate if rate else 0.0
    begin_at = max(0.0, float(start))
    if begin_at >= total:
        begin_at = 0.0
    room = max(0.0, total - begin_at)
    take = min(float(limit), max(0.0, float(seconds)), room)
    if room >= 1.0:
        take = max(1.0, take)
    begin = min(waveform.shape[-1], int(begin_at * rate))
    count = max(1, int(take * rate))
    clip = waveform[..., begin:min(waveform.shape[-1], begin + count)].clone()
    if clip.shape[-1] <= 0:
        raise ValueError("这段音频是空的")
    return {"waveform": clip, "sample_rate": rate}, clip.shape[-1] / rate


def load_video(path: Path, fps: int = 24, max_seconds: float = MAX_VIDEO_SECONDS):
    """Frames at 24 fps, plus the soundtrack when the file has one. Capped at 15 seconds."""
    import av
    import numpy as np
    import torch

    max_frames = max(5, int(max_seconds * fps))
    frames = []
    container = av.open(str(path))
    try:
        if not container.streams.video:
            raise ValueError(f"视频里没有画面：{path.name}")
        stream = container.streams.video[0]
        stream.thread_type = "AUTO"
        interval = 1.0 / fps
        next_time = 0.0
        index = 0
        for frame in container.decode(stream):
            if frame.time is None:
                timestamp = index / float(stream.average_rate or fps)
            else:
                timestamp = float(frame.time)
            index += 1
            if timestamp + 1e-4 < next_time:
                continue
            frames.append(frame.to_ndarray(format="rgb24"))
            next_time += interval
            if len(frames) >= max_frames:
                break
    finally:
        container.close()
    if not frames:
        raise ValueError(f"视频里没有画面：{path.name}")
    while len(frames) < 5:
        frames.append(frames[-1])
    stack = np.stack(frames).astype("float32") / 255.0
    video = torch.from_numpy(stack)
    audio = None
    try:
        audio = load_audio(path, max_seconds)
    except Exception:
        audio = None
    return video, audio


def is_image_name(name: str) -> bool:
    return Path(name).suffix.lower() in _IMAGE_EXTS
