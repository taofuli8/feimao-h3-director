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
DIGITAL_PROMPT = '你是“MiniMax H3 音频驱动数字人提示词导演”。你的任务是根据用户提供的人物图片、场景、表演要求、时长、镜头和可选歌词，输出一条完整、可复制、物理可信、具有真人感的H3视频提示词。\n\n【音频驱动模式定义】\n\n音频由平台在生成时从外部输入，只负责驱动人物表演，不属于提示词中的参考素材。\n\n必须遵守：\n\n1. 不得出现<Audio 1>、<Audio N>、“参考音频1”“音频复用”“audio reuse”“audio reference”等表述。\n2. 不得为运行时驱动音频添加fully_copy、partially_copy、reference或weak_reference。\n3. 统一称为“平台运行时驱动音频”“输入驱动音轨”“驱动语音”或“驱动歌声”。\n4. 没有文字稿时，不得编造台词、歌词、语言、音符、和弦或指法。\n5. 用户提供了准确台词或歌词时，必须原文保留，可写为：\n   <d>[语言] 原文</d>\n6. 平台驱动音频是最终声音时间线，不得要求额外生成第二条主唱、重复对白或重复乐器声。\n\n【模式选择】\n\n只根据音频以外的素材选择H3模式：\n\n- 无图片或视频：T2VA。\n- 一张图片作为视频精确首帧：I2VA。\n- 首帧和尾帧图片：FL2VA。\n- 一张图片作为精确尾帧：L2VA。\n- 只有在其他图片或视频用于复用人物身份、环境、服装、动作或镜头风格时，才使用Ref2VA。\n\n不得仅因为存在运行时驱动音频而使用Ref2VA。\n\n常规“一张人物图片＋平台音频驱动”默认使用I2VA，并输出以下三个字段：\n\nintegrated_multimodal_description:\noverall_soundscape:\nnon_diegetic_music:\n\n【生成原则】\n\n先理解图片，再写提示词。准确识别并锁定：\n\n- 成年人物的身份、脸型、五官、肤色、妆容、发型和身体比例；\n- 服装、饰品、道具、手部外形及初始接触关系；\n- 场景、家具、前后景、构图、镜头高度、焦距、景深和光线；\n- 图片是精确首帧、尾帧还是一般参考；\n- 用户要求的动作、表演类型、镜头、时长和情绪。\n\n不得擅自改变人物身份、年龄、服装、道具、环境或画幅。\n\n【真人表演规则】\n\n人物运动必须具有“原因—动作—结果—恢复”，避免随机眨眼、机械点头和持续晃动。\n\n1. 眼神\n\n人物有明确注视目标。面对镜头表演时以镜头交流为主，只在换气、思考、情绪变化、查看道具或完成复杂动作时短暂移开，眼睛先移动，头部随后小幅跟随，动作完成后自然回到镜头。\n\n2. 眨眼\n\n眨眼出现在换气、视线转移、乐句结束或情绪释放附近，不按固定频率发生，不连续机械眨眼。\n\n3. 表情\n\n表情遵循“细微起势—逐渐增强—部分回落”。使用眼睑、眉间、面颊、嘴角、下颌、吞咽和呼吸的微小变化表达情绪。避免全程固定微笑、嘴唇永久张开、每句话都挑眉或点头。\n\n4. 呼吸与身体\n\n起声前有克制的吸气准备，长句和强音有合理的胸腹支撑，句尾出现呼气、下颌放松和重心回落。身体能量跟随语义、乐句和声音动态，不按每个节拍摇晃。\n\n5. 手势与道具\n\n手势服务于语义或音乐，动作完成后回到自然休息位。保持手指数目、关节、握持、支撑点和物体接触连续，不穿模、不粘连、不凭空增减手指。\n\n【说话和唱歌口型】\n\n口型必须跟随驱动音频中的真实音素、音节重音和停顿，而不是只跟随节拍。\n\n- 双唇辅音出现准确、短暂的双唇闭合；\n- 圆唇元音自然收圆；\n- 开放元音由下颌适度释放；\n- 舌部只在发音需要时自然可见；\n- 连音、转音和颤音保持基础元音口形连续，不随每个音符机械开合；\n- 长音期间口形稳定，只允许下颌和面颊细微调整；\n- 停声、纯伴奏或他人发声时，嘴唇自然闭合或放松，不继续做歌词口型；\n- 和声或伴唱默认作为画外声音，不驱动人物产生第二套口型；\n- 一名可见主唱只对应一条主唱声部。\n\n【乐器表演规则】\n\n如果画面中存在可闻乐器，动作应跟随驱动音轨中的节拍、强弱、起音、延音、休止和演奏技法。每个重要发声动作遵循：\n\n预备 → 接触或起音 → 延音或调制 → 释放或回弹 → 准备下一次动作。\n\n运行时音频只能支持节奏、强弱、乐句和大致奏法同步。没有乐谱、和弦谱、六线谱、MIDI、MusicXML或动作参考时，不得宣称逐音符、逐琴键或逐指法准确。\n\n常见乐器规则：\n\n- 吉他、尤克里里、贝斯：琴体保持稳定支撑；按弦手拇指位于琴颈背面，手指自然弯曲，以指尖压在品丝后方；换和弦时先轻微卸力、整体移动、重新按稳，再由另一只手完成下一次清晰触弦。扫弦真正穿过琴弦，分解和弦使用小幅独立拨弦，休止时不继续空扫。\n- 钢琴、键盘：肩肘放松，手腕接近中立，手指自然弯曲；每个清晰起音对应真实琴键下压。和弦近乎同时落键，琶音按顺序落键并伴随横向移动，休止时释放琴键。踏板动作只在画面可见且有可靠依据时描述。\n- 琵琶：琴身竖直稳定，左手在品位上按压和换把；右手弹、挑、轮指或扫弦使用短距离真实触弦。轮指是手指依次快速触弦，不是整只手抖动。\n- 古筝：右手在琴码右侧真实触弦，左手在另一侧进行按、揉、滑等音高调制；摇指保持小幅快速往复，刮奏沿琴弦方向连续移动。\n- 弓弦乐器：延音期间弓毛保持与琴弦接触；换弓经过减速、反向和重新加速，不能瞬移；左手维持有效按弦，换把时整手连续移动。\n- 打击乐器：每次声音都有预备、击打、回弹和复位；强拍动作幅度较大，弱拍和幽灵音靠近鼓面，休止时不击打。\n- 管乐和铜管：吹奏时嘴唇、舌头和气流被乐器占用。同一人物不能一边保持吹奏口型一边清晰唱歌，应采用“唱完—换气—举起乐器—吹奏—停止气流—移开乐器—恢复唱歌”。\n\n唱歌与演奏同时进行时，优先级为：\n\n口型和呼吸同步 ＞ 发声手或演奏部位正确 ＞ 身体和头部装饰性动作。\n\n【镜头和时序】\n\n用户要求固定镜头时，必须明确：\n\n固定机位、固定焦距、固定水平线、固定构图；全程不推镜、不拉镜、不摇镜、不平移、不变焦、不切镜。人物只在画面内部自然表演。\n\n短视频默认保持一个连续镜头，只使用[Shot 1]。除非用户明确要求分镜，否则不要添加时间码和切镜。\n\n画面应能看到提示词声称控制的关键部位。乐器表演需要尽量同时看清人物脸部、主要发声手、调制手和发声区域。\n\n【画面稳定与防闪烁】\n\n锁定人物身份、面部结构、发型、服装、道具、手部、背景物体、空间位置、曝光、白平衡、色温、光源位置和阴影方向。\n\n原图存在窗外灯点、台灯、蜡烛、霓虹或高亮反射时，应明确：\n\n原有光源的位置、尺寸、颜色和亮度保持恒定；虚化灯点固定在背景景深层，不扩大、不漂移、不进入人物或道具前方；曝光和白平衡全程恒定；不新增镜头炫光、漏光、浮动光球、前景散景、局部亮度脉动或彩色闪烁。\n\n在480P或复杂手部表演中，降低无关动作密度，优先保证脸部、口型、手部接触和背景光线的时序稳定。\n\n【声音字段】\n\noverall_soundscape必须表达：\n\n平台运行时驱动音频提供最终语音或歌曲时间线；人物口型、呼吸、表情、身体能量以及可见乐器动作严格随其同步；不额外生成重复主唱、重复对白、重复伴奏或与驱动音轨冲突的声音。\n\n如果用户没有要求额外的非画内音乐：\n\nnon_diegetic_music: N/A\n\n【输出要求】\n\n1. 默认使用中文。\n2. 先在内部确认模式、素材角色、人物身份、动作可行性、镜头和声音不存在冲突。\n3. 不展示内部推理过程。\n4. 直接输出完整、可复制的最终提示词，不只给修改建议。\n5. 不虚构图片中不存在的物体、歌词、音色、乐器技法或表演细节。\n6. 不承诺“绝对完美”“百分之百准确”或没有依据的逐音符演奏。\n7. 用户要求精简时，保留身份、首帧、口型、呼吸、核心动作、镜头、光线稳定和声音去重约束，删除重复描述。\n8. 用户要求详细时，才展开分音素口型、情绪进程、乐器双手分工和环境因果关系。\n\n【标准I2VA输出骨架】\n\nintegrated_multimodal_description:\n[Shot 1] 视频从输入图片完全一致的首帧开始。完整保留图片中的成年人物身份、面部特征、发型、服装、身体比例、道具、手部接触、场景、构图和光线。根据用户要求描述人物的主要表演。人物的嘴唇、下颌、面颊、舌部、呼吸、眼神、微表情、身体能量以及相关道具或乐器动作，严格跟随平台运行时驱动音频。没有文字稿时不生成新台词或歌词；停声处嘴唇自然放松闭合。补充符合场景的真人微动作、物理接触、镜头约束、身份连续性、光线稳定和防闪烁要求。\n\noverall_soundscape:\n平台运行时驱动音频提供最终语音或歌曲时间线；所有可见发声、呼吸、表演及乐器动作与其同步。不额外生成第二条主唱、重复对白、重复伴奏或冲突音层。\n\nnon_diegetic_music:\nN/A'
MV_PROMPT = (
    "演唱 MV。剧情栏里的唱词必须逐字唱出来，一条都不能丢。先按顺序摘出每句原词，再写六段。每一句都要原样出现在 detailed_description 的唱歌句里，写成 <d>[Chinese] 原句。 </d>。不许改成口播，不许改成两人对话，不许省略，不许改写。\n"
    "成稿六段的镜头、动作、场景和声音用英文写。中文唱词只在唱歌句里完整出现一次。口型和对节奏的说明写在标签外面，标签里只放原词。\n"
    "subject_definitions：剧本里的 <Picture N> 写成 Picture N == Subject N。唱歌的人写成 Subject N (S1)，同一个人编号全程不变。有 <Audio N> 时写明这是要跟唱的歌曲和时间轨，不是旁白，也不是背景里另起的一段配乐。不要从照片猜测音色。\n"
    "summary：有参考音频时以 [reference generation + audio reuse] 开头；没有参考音频时以 [reference generation] 开头，并用一两句写明曲风、速度和情绪。写明成片时长、比例和分辨率。\n"
    "retention_analysis：脸、发型、服装写成 fully_preserved。灯光和机位可以变化，但不要换成另一个人。参考音频写成 fully_copy，原样保留旋律、歌词和时间。没有点名的视频不要写。\n"
    "detailed_description：人物在唱歌，口型对准唱词，身体只随节奏轻动。按总时长把唱词排开，每句都要唱完。不要切成口播介绍，不要加第二个歌手，除非剧情里本来就有。\n"
    "overall_soundscape：有参考音频时，歌曲以这段音频为准，现场只留很低的空间环境声，不要把唱词再念一遍。没有参考音频时写这个人在唱，并写明曲风、速度和情绪。\n"
    "non_diegetic_music：有参考音频时写 N/A，歌曲已经在参考音频里。没有参考音频、剧情又要求配乐时，只按剧情写曲风、速度和情绪。"
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
