"""Reverse the director's uploaded pictures into <Picture N> blocks."""

from __future__ import annotations

import re

from .prompt_format import referenced

_FRAME = re.compile(r"={3,}\s*第\s*(\d+)\s*帧\s*={3,}")
_LEADING_TAG = re.compile(r"^\s*<Picture\s+\d+\s*>\s*", re.IGNORECASE)

DEFAULT_PROMPT = (
    "结合用户想做的视频，用中文描述这张参考图里真实可见的人物、服装、动作、场景和光线。"
    "只写这一张图，整段连成一段中文，不要分段，不要换行，不要编号，不要额外说明。"
)
FORMAT_RULE = "输出必须是一整段中文，不要分段，不要换行，不要标题，不要编号。"
MODES = ("数字人", "MV", "漫剧")
DIGITAL_PROMPT = (
    "数字人口播。剧情栏里已经写好的话是必须说出口的台词，扩写时一条都不能丢。先逐句摘出这些原话，再写六段。每一句都要原样出现在 detailed_description 的说话句里，写成 <d>[Chinese] 原句。 </d>。不许省略，不许概括成说话、介绍或口播，不许改写，不许翻译，不许只留第一句或最后一句。\n"
    "成稿六段的镜头、动作、场景和声音用英文写。中文对白只在说话句里完整出现一次。口型、停顿、换气和表情写在标签外面，标签里只放剧情原句。剧情里的镜头说明不是台词。不要在别的段再抄一遍对白，但 detailed_description 里必须有全部原句。\n"
    "subject_definitions：剧本里的 <Picture N> 写成 Picture N == Subject N。开口的人写成 Subject N (S1)，同一个人编号全程不变。有 <Audio N> 时写明这是 Subject N (S1) 的人声和时间轨，不是背景音乐，也不是画外音。不要从照片猜测音色。不要多写剧本里没有的人，不要把参考图背景里的人当成表演者，也不要用文件名编人物。\n"
    "summary：有参考音频时以 [reference generation + audio reuse] 开头；没有参考音频时以 [reference generation] 开头，不要编音频。写明成片给出的时长、比例和分辨率，并写明一条连续的固定镜头、中近景、单人正面口播。剧情里另有机位或景别时，按剧情来。\n"
    "retention_analysis：人物图写成 fully_preserved，只保留脸、发型、服装、配饰、场景、背景、光线和景别。参考音频写成 fully_copy，原样保留声音、用词、节奏和停顿。没有点名的视频和音频不要写。人物、服装和场景在多镜头里保持连续。\n"
    "detailed_description：写成一条连续固定镜头，景别、背景、光线和人物比例保持不变。脸和上半身在画面中央，一直面对镜头。口型的开合和下颌跟着音节与停顿走，没说话时嘴巴自然闭上。只保留轻微表情、偶尔眨眼、轻微呼吸和很小的头部动作。不要变焦、摇镜、切镜头、走路、转身、换景或夸张手势，也不要加第二个表演者。说话句写明 Subject N (S1)，并把剧情里的每一句原话逐字放进 <d>。有几句就写几句，按音频或总时长排开，每句都要说完。同一句不要在别的镜头再出现一次。\n"
    "overall_soundscape：这段声音就是画面里这个人的声音。有参考音频时保持原音色、语速和停顿，情绪只改变停顿、呼吸、重音和音量，不改基础音色，也不要改成播音腔。没有参考音频时，按剧情写性别、语言、音色、语气和语速，中文用自然普通话。默认只有人声、呼吸和很低的环境底噪。这里不要重写台词。\n"
    "non_diegetic_music：写 N/A。不要加背景音乐、旋律或节奏音效。"
)
MV_PROMPT = (
    "演唱 MV。人物在唱歌，口型对准唱词，身体随节奏轻动。\n"
    "脸、发型和服装保持参考图，灯光和机位可以变化，但不要换成另一个人。\n"
    "唱词用剧情里的原句，不要改成两人对话，也不要写成口播介绍。\n"
    "上传了参考音频时，歌曲以这段音频为准，不要再编一段配乐。没有参考音频时，用一两句写明曲风、速度和情绪。\n"
    "现场只保留空间环境声，不要把唱词再念一遍。\n"
    "没有用到的参考视频不要写进成稿。"
)
COMIC_PROMPT = (
    "漫剧。剧情栏里已经写好的话必须逐字说出来，一条都不能丢。先按顺序摘出每句原话和说话人，再写六段。每一句都要原样出现在 detailed_description 里，写成 <d>[Chinese] 原句。 </d>。不许省略，不许概括成正在说话，不许改写，不许翻译，不许扩写，也不许把同一句再说一遍。\n"
    "成稿只能有这六段，顺序不变：subject_definitions、summary、retention_analysis、detailed_description、overall_soundscape、non_diegetic_music。镜头、动作、场景和声音用英文写，对白保持剧情原文。\n"
    "subject_definitions：剧本里出现几个 <Picture N>，就写几个 Subject，格式是 Picture N == Subject N。要说话的人写成 Subject N (S编号)，同一个人全程同一个编号。不增加人物，不用文件名推断身份，不写参考图里没有的外貌。\n"
    "summary：有参考音频时以 [reference generation + audio reference] 开头；没有参考音频时以 [reference generation] 开头。写明视频内容、成片给出的比例、分辨率、时长、人物和场景，并写明实际参与的参考素材。没有点名的视频和音频不要写。\n"
    "retention_analysis：每个人的脸、发型、服装只跟自己的参考图，不能互换外貌和服装。场景、光线和空间关系保持连续。人物身份全程不变。\n"
    "detailed_description：这是成稿的核心。每个镜头写成 [Shot N] At 00:00.000, 时间从 00:00.000 起，最后一镜落在总时长内。每镜写明人物动作、表情、视线和运镜。默认同一场景、平稳跟拍、中景；剧情另有景别、走位或换地点时按剧情，不要自己加换景。对白按剧情顺序排，说话句先写明是 Subject N (S编号) 亲自开口，再把完整原句放进 <d>。多人对话换人就换说话人，不能串词。按总时长把句子排开，写明最后一句说完的时间，避免被截断。口型、语音、表情和动作同步。\n"
    "overall_soundscape：只写这个地点里真实会有的声音，例如脚步和远处的环境声。不重复对白，不把对白写成环境音，不加无关音效。\n"
    "non_diegetic_music：剧情没有要求配乐时写 N/A。剧情要求有音乐时，只按剧情写乐器、速度和情绪。"
)


def _qwen_runner():
    import sys

    for module in list(sys.modules.values()):
        namespace = getattr(module, "__dict__", None)
        runner = namespace.get("QwenTE图像推理") if isinstance(namespace, dict) else None
        if isinstance(runner, type) and callable(getattr(runner, "run", None)):
            return runner
    raise RuntimeError("找不到千问图像推理。请确认 comfyUI-llama-TE 已启用，并把模型接到这个节点。")


def _blank(image) -> bool:
    if image is None:
        return True
    try:
        count = int(image.shape[0])
    except Exception:
        return True
    if count <= 0:
        return True
    if count == 1 and tuple(image.shape[1:3]) == (64, 64):
        try:
            return float(image.detach().max()) == 0.0
        except Exception:
            return False
    return False


def _one_paragraph(text: str) -> str:
    body = _LEADING_TAG.sub("", str(text or "").strip())
    pieces = [piece.strip() for piece in re.split(r"[\r\n]+", body) if piece.strip()]
    return "".join(pieces)


def _picture_numbers(prompt: str, count: int) -> list[int]:
    numbers = [number for number in referenced(str(prompt or ""))["image"] if number > 0]
    if numbers:
        return numbers[:count]
    return list(range(1, count + 1))


def format_pictures(text: str, count: int, numbers: list[int] | None = None) -> str:
    labels = list(numbers or range(1, max(count, 0) + 1))

    def picture_no(frame_no: int) -> int:
        if 1 <= frame_no <= len(labels):
            return labels[frame_no - 1]
        return frame_no

    body = str(text or "").strip()
    if not body:
        return ""
    parts = _FRAME.split(body)
    blocks = []
    index = 1
    while index + 1 < len(parts):
        number = picture_no(int(parts[index]))
        content = _one_paragraph(parts[index + 1])
        if content:
            blocks.append(f"<Picture {number}>{content}")
        index += 2
    if blocks:
        return "\n\n".join(blocks)
    paragraph = _one_paragraph(body)
    if not paragraph:
        return ""
    return f"<Picture {picture_no(1)}>{paragraph}"


class FeimaoH3Reverse:
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("反推结果",)
    FUNCTION = "run"
    CATEGORY = "feimao-h3导演台"
    OUTPUT_NODE = True
    DESCRIPTION = (
        "点开始反推后，只描述剧本里用到的参考图，按画面里看得到的内容写成 <Picture N>。"
        "剧情从导演台原文提取，图片标签保留。模式分数字人、MV、漫剧，每种有一套可改的 H3 写法。"
        "复制时带上导演台的宽高比、秒数、剧情和反推结果，三种模式复制出来的扩写要求不一样。"
        "没有点开始反推时，沿用上一次的结果，不会重新加载千问。"
    )

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "qwen模型": ("QWENLLAMA", {"lazy": True}),
                "图片": ("IMAGE", {"lazy": True}),
                "用户提示词": ("STRING", {"forceInput": True, "default": ""}),
                "反推要求": ("STRING", {"multiline": True, "default": DEFAULT_PROMPT}),
                "结果": ("STRING", {"multiline": True, "default": ""}),
                "本次执行": ("BOOLEAN", {"default": False}),
                "模式": (list(MODES), {"default": "数字人"}),
                "画幅": ("STRING", {"default": "", "tooltip": "从导演台的宽高比提取"}),
                "时长": ("STRING", {"default": "", "tooltip": "从导演台的秒数提取"}),
                "剧情": ("STRING", {"multiline": True, "default": "", "tooltip": "导演台原文，保留 <Picture N> 等标签"}),
                "数字人写法": ("STRING", {"multiline": True, "default": DIGITAL_PROMPT}),
                "MV写法": ("STRING", {"multiline": True, "default": MV_PROMPT}),
                "漫剧写法": ("STRING", {"multiline": True, "default": COMIC_PROMPT}),
                "编辑预设": ("BOOLEAN", {"default": False, "tooltip": "打开后才显示当前模式的写法，平时收起来"}),
                "预设": ("STRING", {"multiline": True, "default": "", "tooltip": "预设名单。界面上可以改、删、新增。"}),
                "当前预设": ("STRING", {"default": "数字人"}),
            }
        }

    @classmethod
    def IS_CHANGED(cls, **_kwargs):
        return float("nan")

    def check_lazy_status(self, 反推要求="", 结果="", 本次执行=False, 用户提示词="", qwen模型=None, 图片=None, **_extra):
        if not 本次执行:
            return []
        needed = []
        if qwen模型 is None:
            needed.append("qwen模型")
        if 图片 is None:
            needed.append("图片")
        return needed

    def run(self, qwen模型=None, 图片=None, 用户提示词="", 反推要求="", 结果="", 本次执行=False, **_extra):
        if not 本次执行:
            text = str(结果 or "")
        elif _blank(图片):
            if referenced(str(用户提示词 or ""))["image"]:
                raise ValueError("剧本里的图片没有加载到。确认这些参考图已经上传。")
            raise ValueError("剧本里还没有图片。先在剧本里 @ 进要反推的参考图。")
        else:
            count = int(图片.shape[0])
            numbers = _picture_numbers(用户提示词, count)
            mapping = "，".join(f"第 {index} 帧是 <Picture {number}>" for index, number in enumerate(numbers, 1))
            ask = "\n".join((
                "只描述每张参考图里真实可见的人物、服装、动作、场景和光线。不要复述剧情，不要编画面里没有的东西。",
                mapping,
                str(反推要求 or DEFAULT_PROMPT).rstrip(),
                FORMAT_RULE,
            ))
            raw = _qwen_runner()().run(
                qwen模型,
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
                图片=图片,
            )
            source = raw[0] if isinstance(raw, (tuple, list)) else raw
            text = format_pictures(str(source or ""), count, numbers)
        return {"ui": {"text": [text]}, "result": (text,)}


NODE_CLASS_MAPPINGS = {
    "FeimaoH3Reverse": FeimaoH3Reverse,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "FeimaoH3Reverse": "H3反推",
}
