"""Run picture reverse inside the director, without queueing the video graph."""

from __future__ import annotations

from .media_load import load_image, read_items, read_slots, resolve_item, stack_images
from .nodes_reverse import DEFAULT_PROMPT, FORMAT_RULE, _FRAME, _one_paragraph, _qwen_runner
from .prompt_format import h3_canvas, referenced, render_prompt


def _llama():
    import sys

    for module in sys.modules.values():
        namespace = getattr(module, "__dict__", None)
        if not isinstance(namespace, dict):
            continue
        if callable(namespace.get("_列出llm文件")) and isinstance(namespace.get("QwenTE模型加载器"), type):
            return namespace
    return None


def _scan_llm_dir() -> list[str]:
    import os

    try:
        import folder_paths
    except Exception:
        return []
    root = os.path.join(getattr(folder_paths, "models_dir", ""), "LLM")
    if not root or not os.path.isdir(root):
        return []
    found = []
    for dirpath, _, filenames in os.walk(root):
        for name in filenames:
            found.append(os.path.relpath(os.path.join(dirpath, name), root))
    return found


def _llm_files():
    namespace = _llama()
    if namespace is not None:
        try:
            files = namespace["_列出llm文件"]()
            if files:
                return files
        except Exception:
            pass
    return _scan_llm_dir()


def _filter_llm(files, is_mmproj: bool) -> list[str]:
    namespace = _llama()
    if namespace is not None:
        try:
            return namespace["_过滤可选llm文件"](files, is_mmproj=is_mmproj)
        except Exception:
            pass
    allowed = {".gguf", ".safetensors", ".bin"}
    if not is_mmproj:
        allowed.update({".pth", ".pt"})
    import os

    picked = []
    for file_path in files:
        text = str(file_path)
        if ("mmproj" in text.lower()) != is_mmproj:
            continue
        if os.path.splitext(text)[1].lower() not in allowed:
            continue
        picked.append(text)
    return picked


def reverse_model_choices() -> list[str]:
    models = _filter_llm(_llm_files(), False)
    return models or ["（请把模型放到 models/LLM）"]


def vision_model_choices() -> list[str]:
    files = _llm_files()
    models = _filter_llm(files, True)
    if not models:
        return ["（请把视觉投影 mmproj 放到 models/LLM）"]
    llms = _filter_llm(files, False)
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


MODES = ("多参", "文生", "首帧", "尾帧", "首尾帧", "数字人")

MODE_CONTRACT = {
    "多参": (
        "当前是多参，参考图、参考视频和参考音频靠标签送进模型。"
        "成稿只能有这六段，并且按这个顺序各起一行标题：subject_definitions、summary、retention_analysis、detailed_description、overall_soundscape、non_diegetic_music。"
        "subject_definitions 里，用户提示词出现的 <Picture N> 写成 Picture N == Subject N。要开口的人写成 Subject N (S编号)，同一个人编号不变。不要增加没被点名的人。"
        "用户提示词里的 <Picture N>、<Video N>、<Audio N> 原样保留。"
        "每一句台词都写成 <d>[Chinese] 原句。 </d>，不许省略，不许改字。"
        "镜头写成 [Shot N] At 00:00.000, 时间从 00:00.000 起，最后一镜落在总时长内。"
        "summary 有参考音频时以 [reference generation + audio reference] 开头，没有则以 [reference generation] 开头。"
        "脸、服装、场景和光线只采用图片反推。"
    ),
    "文生": (
        "当前是文生，没有参考图。"
        "成稿写成一段 integrated_multimodal_description，写全人物外观、服装、场景、光线、动作和镜头。"
        "不要写 subject_definitions，不要写 <Picture>、<Video>、<Audio>、<Subject>。"
    ),
    "首帧": (
        "当前是首帧。首帧会单独送进模型，写提示词时不用 @，也不要写 <Picture>。"
        "成稿写成一段 integrated_multimodal_description。"
        "人物外观、服装、场景和光线以首帧反推为准，正文重点写动作、表情、口型、镜头和环境变化，不要另造一张脸或另一套衣服。"
        "不要写 subject_definitions，不要写 <Picture>、<Video>、<Audio>、<Subject>。"
    ),
    "尾帧": (
        "当前是尾帧。尾帧会单独送进模型，写提示词时不用 @，也不要写 <Picture>。"
        "成稿写成一段 integrated_multimodal_description，动作是走向这张尾帧，结尾落在尾帧反推的样子上。"
        "不要另造一张脸或另一套衣服，也不要编一个和尾帧无关的开始画面。"
        "不要写 subject_definitions，不要写 <Picture>、<Video>、<Audio>、<Subject>。"
    ),
    "首尾帧": (
        "当前是首尾帧。写提示词时不用 @，也不要写 <Picture>。"
        "成稿写成一段 integrated_multimodal_description。"
        "图片反推里有首帧又有尾帧时，写从首帧走到尾帧，外观以这两张为准。"
        "只有首帧时，按首帧生视频写，不要编一个结束画面。"
        "只有尾帧时，按尾帧生视频写，动作走向这张图，不要编一个开始画面。"
        "不要写 subject_definitions，不要写 <Picture>、<Video>、<Audio>、<Subject>。"
    ),
    "数字人": (
        "当前是数字人。首帧和尾帧按实际上传的那几张锁定，写提示词时不用 @，也不要写 <Picture>。"
        "声音是平台运行时驱动音频，不要写成 <Audio>，不要写音频复用或 audio reuse。"
        "成稿写成一段 integrated_multimodal_description。"
        "两张都有时写从首帧走到尾帧。只有首帧时按首帧写，不要编结束画面。只有尾帧时按尾帧写，不要编开始画面。"
        "不要写 subject_definitions，不要写 <Picture>、<Video>、<Audio>、<Subject>。"
    ),
}


def _mode(value) -> str:
    text = str(value or "").strip()
    if text == "图生":
        return "首帧"
    return text if text in MODES else "多参"


def _items(images) -> list[dict]:
    if isinstance(images, str):
        return read_items(images)
    if isinstance(images, list):
        return [item for item in images if isinstance(item, dict)]
    return []


def _slots(images, count: int) -> list:
    if isinstance(images, str):
        return read_slots(images, count)
    slots = []
    for item in images if isinstance(images, list) else []:
        if isinstance(item, dict) and str(item.get("filename") or item.get("abs_path") or "").strip():
            slots.append(item)
        else:
            slots.append(None)
    while slots and slots[-1] is None:
        slots.pop()
    while len(slots) < count:
        slots.append(None)
    return slots[:count]


def picture_plan(mode: str, prompt: str, images) -> list[tuple[int, str]]:
    """Which uploaded pictures the expander must look at.

    首帧、尾帧 and 首尾帧 use fixed slots. The prompt does not need @.
    首尾帧 may contain only the first slot, only the last slot, or both.
    多参 still follows the pictures named in the script.
    """
    kind = _mode(mode)
    if kind == "文生":
        return []
    if kind == "首帧":
        if _slots(images, 1)[0] is None:
            raise ValueError("首帧模式要先上传首帧")
        return [(0, "首帧")]
    if kind == "尾帧":
        if _slots(images, 1)[0] is None:
            raise ValueError("尾帧模式要先上传尾帧")
        return [(0, "尾帧")]
    if kind in ("首尾帧", "数字人"):
        slots = _slots(images, 2)
        plan = []
        if slots[0] is not None:
            plan.append((0, "首帧"))
        if slots[1] is not None:
            plan.append((1, "尾帧"))
        if not plan:
            raise ValueError("数字人至少上传首帧或尾帧" if kind == "数字人" else "首尾帧至少上传首帧或尾帧")
        return plan
    items = _items(images)
    numbers = [number for number in referenced(str(prompt or ""))["image"] if number > 0]
    if not numbers:
        raise ValueError("剧本里还没有图片。先在剧本里 @ 进要反推的参考图。")
    plan = []
    for number in numbers:
        if number - 1 >= len(items):
            continue
        plan.append((number - 1, f"<Picture {number}>"))
    if not plan:
        raise ValueError("剧本里的图片没有加载到。确认这些参考图已经上传。")
    return plan


def _load_plan(images, plan: list[tuple[int, str]]):
    if isinstance(images, list):
        items = images
    else:
        items = _slots(images, max((index for index, _label in plan), default=-1) + 1)
    frames = []
    labels = []
    for index, label in plan:
        item = items[index] if index < len(items) else None
        path = resolve_item(item) if isinstance(item, dict) else None
        if path is None:
            raise ValueError(f"找不到{label}。确认这张图已经上传。")
        frames.append(load_image(path))
        labels.append(label)
    return frames, labels


def _run_qwen(model, input_mode: str, prompt: str, system: str, unload: bool, image=None, tokens: int = 1024) -> str:
    raw = _qwen_runner()().run(
        model,
        input_mode,
        prompt,
        system,
        24,
        1024,
        tokens,
        0.4 if input_mode == "文本" else 0.7,
        0.8 if input_mode == "文本" else 0.9,
        20,
        1.05 if input_mode == "文本" else 1.0,
        0.0,
        0.0,
        0,
        False,
        unload,
        图片=image,
    )
    source = raw[0] if isinstance(raw, (tuple, list)) else raw
    return str(source or "").strip()


def _unload_qwen() -> None:
    import sys

    for module in list(sys.modules.values()):
        storage = getattr(module, "_QwenStorage", None)
        unload = getattr(storage, "unload", None)
        if callable(unload):
            unload()
            return


def _format_labeled(text: str, labels: list[str]) -> str:
    body = str(text or "").strip()
    parts = _FRAME.split(body)
    found = {}
    index = 1
    while index + 1 < len(parts):
        content = _one_paragraph(parts[index + 1])
        if content:
            found[int(parts[index])] = content
        index += 2
    if found:
        lines = []
        for number, label in enumerate(labels, 1):
            content = found.get(number, "")
            if content:
                lines.append(f"{label}：{content}")
        return "\n\n".join(lines)
    paragraph = _one_paragraph(body)
    if not paragraph:
        return ""
    if len(labels) == 1:
        return f"{labels[0]}：{paragraph}"
    return paragraph


def _clean_draft(text: str) -> str:
    body = str(text or "").strip()
    if body.startswith("```"):
        body = body.split("\n", 1)[-1]
        if body.endswith("```"):
            body = body[: body.rfind("```")]
    return body.strip()


def describe_pictures(model, mode: str, prompt: str, images, unload: bool = False) -> str:
    plan = picture_plan(mode, prompt, images)
    if not plan:
        return ""
    frames, labels = _load_plan(images, plan)
    mapping = "，".join(f"第 {index} 帧是 {label}" for index, label in enumerate(labels, 1))
    ask = "\n".join((
        "只描述每张图里真实可见的人物、服装、动作、场景和光线。不要复述剧情，不要编画面里没有的东西。",
        mapping,
        DEFAULT_PROMPT,
        FORMAT_RULE,
    ))
    raw = _run_qwen(model, "逐帧", ask, "不需要分析", unload, image=stack_images(frames), tokens=1024)
    return _format_labeled(raw, labels)


def _framing(aspect, seconds, megapixels, multiple) -> str:
    width, height = h3_canvas(aspect, megapixels, multiple)
    ratio = str(aspect or "").strip() or "未设"
    try:
        length = f"{float(seconds):g} 秒"
    except (TypeError, ValueError):
        length = "未设秒数"
    if ratio in ("9:16", "3:4"):
        frame = "竖屏，人脸和上半身放在中部"
    elif ratio in ("16:9", "21:9", "4:3"):
        frame = "横屏，可以带上人物两侧的环境"
    elif ratio == "1:1":
        frame = "方画幅，主体居中"
    else:
        frame = "主体放在画面中部"
    return f"成片宽高比 {ratio}，约 {width}×{height}，时长 {length}。{frame}。动作和对白必须在这个时长里做完。"


def _expand_request(mode, prompt, reverse_text, preset_name, preset_text, aspect, seconds, megapixels, multiple, drive=False) -> tuple[str, str]:
    kind = _mode(mode)
    system = "\n".join((
        "你是 MiniMax H3 的提示词扩写。根据用户原来的提示词和图片反推，写成可以直接送进模型的成稿。",
        "只输出成稿正文。不要解释，不要写「成稿如下」，不要用 markdown 代码块。",
        "用户提示词里已经写好的台词必须逐字保留，不许省略、改写或翻译。",
        "图片反推只提供画面里真实可见的外观、服装、场景和光线。反推里没有的不要编。",
        "专项写法如果和当前模式的成稿格式冲突，以当前模式的成稿格式为准。专项写法只决定表演、台词、镜头和声音。",
        MODE_CONTRACT[kind],
    ))
    guide = str(preset_text or "").strip() or "（这个预设是空的，只按上面的官方格式写）"
    seen = str(reverse_text or "").strip() or "（这次没有参考图）"
    user = "\n".join((
        _framing(aspect, seconds, megapixels, multiple),
        "",
        "用户原来的提示词--",
        str(prompt or "").strip() or "（用户还没写提示词）",
        "",
        "图片反推--",
        seen,
        "",
        f"{preset_name or '当前预设'}的写法--",
        guide,
    ))
    if drive:
        user = "\n".join((
            user,
            "",
            "这次上传了平台运行时驱动音频。它只负责驱动人物表演，不要写成 <Audio>，不要写参考音频、fully_copy 或 audio reuse。没有台词或歌词稿时不要编造台词。",
        ))
    return system, user


def expand_script(model_name: str, vision: str, mode: str, prompt: str, images, preset_name: str = "", preset_text: str = "", aspect="9:16", seconds=5, megapixels=1, multiple=32, drive=False) -> str:
    story = render_prompt(prompt)
    if not str(story or "").strip():
        raise ValueError("先写提示词，再扩写")
    picture_plan(mode, story, images)
    model = load_reverse_model(model_name, vision)
    try:
        reverse_text = describe_pictures(model, mode, story, images, unload=False)
        system, user = _expand_request(mode, story, reverse_text, preset_name, preset_text, aspect, seconds, megapixels, multiple, drive=bool(drive))
        draft = _run_qwen(model, "文本", user, system, True, tokens=4096)
    except Exception:
        _unload_qwen()
        raise
    text = _clean_draft(draft)
    if not text:
        raise ValueError("扩写没有得到成稿")
    return text


def reverse_script(model_name: str, prompt: str, images, vision: str = "", mode: str = "多参") -> str:
    model = load_reverse_model(model_name, vision)
    try:
        return describe_pictures(model, mode, render_prompt(prompt), images, unload=True)
    except Exception:
        _unload_qwen()
        raise


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
                data.get("mode") or "多参",
            )
        except Exception as exc:
            return web.json_response({"error": str(exc)}, status=400)
        return web.json_response({"text": text})

    @server.routes.post("/feimao-h3/expand")
    async def feimao_h3_expand(request):
        try:
            data = await request.json()
        except Exception:
            data = {}
        if not isinstance(data, dict):
            data = {}
        try:
            text = expand_script(
                data.get("model") or "",
                data.get("vision") or "",
                data.get("mode") or "多参",
                data.get("prompt") or "",
                data.get("images") or [],
                data.get("preset_name") or "",
                data.get("preset_text") or "",
                data.get("aspect") or "9:16",
                data.get("seconds") if data.get("seconds") not in (None, "") else 5,
                data.get("megapixels") if data.get("megapixels") not in (None, "") else 1,
                data.get("multiple") if data.get("multiple") not in (None, "") else 32,
                drive=bool(data.get("drive")),
            )
        except Exception as exc:
            return web.json_response({"error": str(exc)}, status=400)
        return web.json_response({"text": text})
