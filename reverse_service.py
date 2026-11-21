"""Run picture reverse inside the director, without queueing the video graph."""

from __future__ import annotations

from .media_load import load_image, read_items, resolve_item, stack_images
from .nodes_reverse import DEFAULT_PROMPT, FORMAT_RULE, _picture_numbers, _qwen_runner, format_pictures
from .prompt_format import referenced


def _llama():
    import sys

    for module in sys.modules.values():
        namespace = getattr(module, "__dict__", None)
        if not isinstance(namespace, dict):
            continue
        if callable(namespace.get("_列出llm文件")) and isinstance(namespace.get("QwenTE模型加载器"), type):
            return namespace
    return None


def reverse_model_choices() -> list[str]:
    namespace = _llama()
    if namespace is None:
        return ["（请先启用千问图像推理）"]
    files = namespace["_列出llm文件"]()
    models = namespace["_过滤可选llm文件"](files, is_mmproj=False)
    return models or ["（请把模型放到 models/LLM）"]


def vision_model_choices() -> list[str]:
    namespace = _llama()
    if namespace is None:
        return ["（请先启用千问图像推理）"]
    files = namespace["_列出llm文件"]()
    models = namespace["_过滤可选llm文件"](files, is_mmproj=True)
    if not models:
        return ["（请把视觉投影 mmproj 放到 models/LLM）"]
    llms = namespace["_过滤可选llm文件"](files, is_mmproj=False)
    preferred = _mmproj(llms[0] if llms else "", models)
    if preferred in models:
        return [preferred, *[item for item in models if item != preferred]]
    return models


def _family(namespace, name: str) -> str:
    low = str(name or "").lower()
    if "flash-next" in low or "flash_next" in low:
        return namespace.get("QWEN38_FLASH_NEXT系列") or "Qwen3.6-VL"
    if "3.8" in low:
        return namespace.get("QWEN38系列") or "Qwen3.6-VL"
    if "3.6" in low:
        return "Qwen3.6-VL"
    if "3.5" in low:
        return "Qwen3.5-VL"
    return "Qwen3-VL"


def _mmproj(name: str, options: list[str]) -> str:
    if not options:
        return "无"
    if len(options) == 1:
        return options[0]
    low = str(name or "").lower()
    for key in ("3.8", "3.6", "3.5", "qwen3"):
        if key in low:
            for item in options:
                if key in item.lower():
                    return item
    return options[0]


def load_reverse_model(name: str, vision: str = ""):
    namespace = _llama()
    if namespace is None:
        raise RuntimeError("找不到千问图像推理。请确认 comfyUI-llama-TE 已启用。")
    chosen = str(name or "").strip()
    if not chosen or chosen.startswith("（"):
        raise RuntimeError("先在反推模型里选一个千问模型。")
    files = namespace["_列出llm文件"]()
    mmprojs = namespace["_过滤可选llm文件"](files, is_mmproj=True)
    if not mmprojs:
        raise RuntimeError("反推需要视觉模型 mmproj。请把 mmproj 放到 models/LLM。")
    chosen_vision = str(vision or "").strip()
    if not chosen_vision or chosen_vision.startswith("（") or chosen_vision not in mmprojs:
        chosen_vision = _mmproj(chosen, mmprojs)
    if not chosen_vision or chosen_vision == "无" or chosen_vision.startswith("（"):
        raise RuntimeError("先在视觉模型里选一个 mmproj。")
    kv = namespace.get("默认KV缓存类型", "默认(F16)")
    loaded = namespace["QwenTE模型加载器"]().load(
        _family(namespace, chosen),
        chosen,
        chosen_vision,
        False,
        False,
        8192,
        -1,
        kv,
        kv,
        False,
        0,
    )
    return loaded[0]


def reverse_script(model_name: str, prompt: str, images, vision: str = "") -> str:
    if isinstance(images, str):
        items = read_items(images)
    elif isinstance(images, list):
        items = [item for item in images if isinstance(item, dict)]
    else:
        items = []
    text = str(prompt or "")
    numbers = [number for number in referenced(text)["image"] if number > 0]
    if not numbers:
        raise ValueError("剧本里还没有图片。先在剧本里 @ 进要反推的参考图。")
    frames = []
    used = []
    for number in numbers:
        item = items[number - 1] if number - 1 < len(items) else None
        path = resolve_item(item) if item else None
        if path is None:
            continue
        frames.append(load_image(path))
        used.append(number)
    if not frames:
        raise ValueError("剧本里的图片没有加载到。确认这些参考图已经上传。")
    batch = stack_images(frames)
    mapping = "，".join(f"第 {index} 帧是 <Picture {number}>" for index, number in enumerate(used, 1))
    ask = "\n".join((
        "只描述每张参考图里真实可见的人物、服装、动作、场景和光线。不要复述剧情，不要编画面里没有的东西。",
        mapping,
        DEFAULT_PROMPT,
        FORMAT_RULE,
    ))
    raw = _qwen_runner()().run(
        load_reverse_model(model_name, vision),
        "逐帧",
        ask,
        "不需要分析",
        24,
        1024,
        1024,
        0.7,
        0.9,
        20,
        1.0,
        0.0,
        0.0,
        0,
        False,
        True,
        图片=batch,
    )
    source = raw[0] if isinstance(raw, (tuple, list)) else raw
    return format_pictures(str(source or ""), len(frames), used or _picture_numbers(text, len(frames)))


def register_reverse_route() -> None:
    try:
        from aiohttp import web
        from server import PromptServer
    except Exception:
        return
    server = PromptServer.instance
    if getattr(server, "_feimao_h3_reverse", False):
        return
    server._feimao_h3_reverse = True

    @server.routes.post("/feimao-h3/reverse")
    async def feimao_h3_reverse(request):
        try:
            data = await request.json()
        except Exception:
            data = {}
        if not isinstance(data, dict):
            data = {}
        try:
            text = reverse_script(
                data.get("model") or "",
                data.get("prompt") or "",
                data.get("images") or [],
                data.get("vision") or "",
            )
        except Exception as exc:
            return web.json_response({"error": str(exc)}, status=400)
        return web.json_response({"text": text})
