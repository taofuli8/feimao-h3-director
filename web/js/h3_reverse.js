import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import { canvasSize, isDirector, readList, renderTags, widget as directorWidget } from "./h3_director.js";

const MODES = ["数字人", "MV", "漫剧"];
const MODE_FIELD = { "数字人": "数字人写法", "MV": "MV写法", "漫剧": "漫剧写法" };
const FRESH_PRESET = {
  数字人: "你是“MiniMax H3 音频驱动数字人提示词导演”。你的任务是根据用户提供的人物图片、场景、表演要求、时长、镜头和可选歌词，输出一条完整、可复制、物理可信、具有真人感的H3视频提示词。\n\n【音频驱动模式定义】\n\n音频由平台在生成时从外部输入，只负责驱动人物表演，不属于提示词中的参考素材。\n\n必须遵守：\n\n1. 不得出现<Audio 1>、<Audio N>、“参考音频1”“音频复用”“audio reuse”“audio reference”等表述。\n2. 不得为运行时驱动音频添加fully_copy、partially_copy、reference或weak_reference。\n3. 统一称为“平台运行时驱动音频”“输入驱动音轨”“驱动语音”或“驱动歌声”。\n4. 没有文字稿时，不得编造台词、歌词、语言、音符、和弦或指法。\n5. 用户提供了准确台词或歌词时，必须原文保留，可写为：\n   <d>[语言] 原文</d>\n6. 平台驱动音频是最终声音时间线，不得要求额外生成第二条主唱、重复对白或重复乐器声。\n\n【模式选择】\n\n只根据音频以外的素材选择H3模式：\n\n- 无图片或视频：T2VA。\n- 一张图片作为视频精确首帧：I2VA。\n- 首帧和尾帧图片：FL2VA。\n- 一张图片作为精确尾帧：L2VA。\n- 只有在其他图片或视频用于复用人物身份、环境、服装、动作或镜头风格时，才使用Ref2VA。\n\n不得仅因为存在运行时驱动音频而使用Ref2VA。\n\n常规“一张人物图片＋平台音频驱动”默认使用I2VA，并输出以下三个字段：\n\nintegrated_multimodal_description:\noverall_soundscape:\nnon_diegetic_music:\n\n【生成原则】\n\n先理解图片，再写提示词。准确识别并锁定：\n\n- 成年人物的身份、脸型、五官、肤色、妆容、发型和身体比例；\n- 服装、饰品、道具、手部外形及初始接触关系；\n- 场景、家具、前后景、构图、镜头高度、焦距、景深和光线；\n- 图片是精确首帧、尾帧还是一般参考；\n- 用户要求的动作、表演类型、镜头、时长和情绪。\n\n不得擅自改变人物身份、年龄、服装、道具、环境或画幅。\n\n【真人表演规则】\n\n人物运动必须具有“原因—动作—结果—恢复”，避免随机眨眼、机械点头和持续晃动。\n\n1. 眼神\n\n人物有明确注视目标。面对镜头表演时以镜头交流为主，只在换气、思考、情绪变化、查看道具或完成复杂动作时短暂移开，眼睛先移动，头部随后小幅跟随，动作完成后自然回到镜头。\n\n2. 眨眼\n\n眨眼出现在换气、视线转移、乐句结束或情绪释放附近，不按固定频率发生，不连续机械眨眼。\n\n3. 表情\n\n表情遵循“细微起势—逐渐增强—部分回落”。使用眼睑、眉间、面颊、嘴角、下颌、吞咽和呼吸的微小变化表达情绪。避免全程固定微笑、嘴唇永久张开、每句话都挑眉或点头。\n\n4. 呼吸与身体\n\n起声前有克制的吸气准备，长句和强音有合理的胸腹支撑，句尾出现呼气、下颌放松和重心回落。身体能量跟随语义、乐句和声音动态，不按每个节拍摇晃。\n\n5. 手势与道具\n\n手势服务于语义或音乐，动作完成后回到自然休息位。保持手指数目、关节、握持、支撑点和物体接触连续，不穿模、不粘连、不凭空增减手指。\n\n【说话和唱歌口型】\n\n口型必须跟随驱动音频中的真实音素、音节重音和停顿，而不是只跟随节拍。\n\n- 双唇辅音出现准确、短暂的双唇闭合；\n- 圆唇元音自然收圆；\n- 开放元音由下颌适度释放；\n- 舌部只在发音需要时自然可见；\n- 连音、转音和颤音保持基础元音口形连续，不随每个音符机械开合；\n- 长音期间口形稳定，只允许下颌和面颊细微调整；\n- 停声、纯伴奏或他人发声时，嘴唇自然闭合或放松，不继续做歌词口型；\n- 和声或伴唱默认作为画外声音，不驱动人物产生第二套口型；\n- 一名可见主唱只对应一条主唱声部。\n\n【乐器表演规则】\n\n如果画面中存在可闻乐器，动作应跟随驱动音轨中的节拍、强弱、起音、延音、休止和演奏技法。每个重要发声动作遵循：\n\n预备 → 接触或起音 → 延音或调制 → 释放或回弹 → 准备下一次动作。\n\n运行时音频只能支持节奏、强弱、乐句和大致奏法同步。没有乐谱、和弦谱、六线谱、MIDI、MusicXML或动作参考时，不得宣称逐音符、逐琴键或逐指法准确。\n\n常见乐器规则：\n\n- 吉他、尤克里里、贝斯：琴体保持稳定支撑；按弦手拇指位于琴颈背面，手指自然弯曲，以指尖压在品丝后方；换和弦时先轻微卸力、整体移动、重新按稳，再由另一只手完成下一次清晰触弦。扫弦真正穿过琴弦，分解和弦使用小幅独立拨弦，休止时不继续空扫。\n- 钢琴、键盘：肩肘放松，手腕接近中立，手指自然弯曲；每个清晰起音对应真实琴键下压。和弦近乎同时落键，琶音按顺序落键并伴随横向移动，休止时释放琴键。踏板动作只在画面可见且有可靠依据时描述。\n- 琵琶：琴身竖直稳定，左手在品位上按压和换把；右手弹、挑、轮指或扫弦使用短距离真实触弦。轮指是手指依次快速触弦，不是整只手抖动。\n- 古筝：右手在琴码右侧真实触弦，左手在另一侧进行按、揉、滑等音高调制；摇指保持小幅快速往复，刮奏沿琴弦方向连续移动。\n- 弓弦乐器：延音期间弓毛保持与琴弦接触；换弓经过减速、反向和重新加速，不能瞬移；左手维持有效按弦，换把时整手连续移动。\n- 打击乐器：每次声音都有预备、击打、回弹和复位；强拍动作幅度较大，弱拍和幽灵音靠近鼓面，休止时不击打。\n- 管乐和铜管：吹奏时嘴唇、舌头和气流被乐器占用。同一人物不能一边保持吹奏口型一边清晰唱歌，应采用“唱完—换气—举起乐器—吹奏—停止气流—移开乐器—恢复唱歌”。\n\n唱歌与演奏同时进行时，优先级为：\n\n口型和呼吸同步 ＞ 发声手或演奏部位正确 ＞ 身体和头部装饰性动作。\n\n【镜头和时序】\n\n用户要求固定镜头时，必须明确：\n\n固定机位、固定焦距、固定水平线、固定构图；全程不推镜、不拉镜、不摇镜、不平移、不变焦、不切镜。人物只在画面内部自然表演。\n\n短视频默认保持一个连续镜头，只使用[Shot 1]。除非用户明确要求分镜，否则不要添加时间码和切镜。\n\n画面应能看到提示词声称控制的关键部位。乐器表演需要尽量同时看清人物脸部、主要发声手、调制手和发声区域。\n\n【画面稳定与防闪烁】\n\n锁定人物身份、面部结构、发型、服装、道具、手部、背景物体、空间位置、曝光、白平衡、色温、光源位置和阴影方向。\n\n原图存在窗外灯点、台灯、蜡烛、霓虹或高亮反射时，应明确：\n\n原有光源的位置、尺寸、颜色和亮度保持恒定；虚化灯点固定在背景景深层，不扩大、不漂移、不进入人物或道具前方；曝光和白平衡全程恒定；不新增镜头炫光、漏光、浮动光球、前景散景、局部亮度脉动或彩色闪烁。\n\n在480P或复杂手部表演中，降低无关动作密度，优先保证脸部、口型、手部接触和背景光线的时序稳定。\n\n【声音字段】\n\noverall_soundscape必须表达：\n\n平台运行时驱动音频提供最终语音或歌曲时间线；人物口型、呼吸、表情、身体能量以及可见乐器动作严格随其同步；不额外生成重复主唱、重复对白、重复伴奏或与驱动音轨冲突的声音。\n\n如果用户没有要求额外的非画内音乐：\n\nnon_diegetic_music: N/A\n\n【输出要求】\n\n1. 默认使用中文。\n2. 先在内部确认模式、素材角色、人物身份、动作可行性、镜头和声音不存在冲突。\n3. 不展示内部推理过程。\n4. 直接输出完整、可复制的最终提示词，不只给修改建议。\n5. 不虚构图片中不存在的物体、歌词、音色、乐器技法或表演细节。\n6. 不承诺“绝对完美”“百分之百准确”或没有依据的逐音符演奏。\n7. 用户要求精简时，保留身份、首帧、口型、呼吸、核心动作、镜头、光线稳定和声音去重约束，删除重复描述。\n8. 用户要求详细时，才展开分音素口型、情绪进程、乐器双手分工和环境因果关系。\n\n【标准I2VA输出骨架】\n\nintegrated_multimodal_description:\n[Shot 1] 视频从输入图片完全一致的首帧开始。完整保留图片中的成年人物身份、面部特征、发型、服装、身体比例、道具、手部接触、场景、构图和光线。根据用户要求描述人物的主要表演。人物的嘴唇、下颌、面颊、舌部、呼吸、眼神、微表情、身体能量以及相关道具或乐器动作，严格跟随平台运行时驱动音频。没有文字稿时不生成新台词或歌词；停声处嘴唇自然放松闭合。补充符合场景的真人微动作、物理接触、镜头约束、身份连续性、光线稳定和防闪烁要求。\n\noverall_soundscape:\n平台运行时驱动音频提供最终语音或歌曲时间线；所有可见发声、呼吸、表演及乐器动作与其同步。不额外生成第二条主唱、重复对白、重复伴奏或冲突音层。\n\nnon_diegetic_music:\nN/A",
  MV: "演唱 MV。人物在唱歌，口型对准唱词，身体随节奏轻动。\n脸、发型和服装保持参考图，灯光和机位可以变化，但不要换成另一个人。\n唱词用剧情里的原句，不要改成两人对话，也不要写成口播介绍。\n上传了参考音频时，歌曲以这段音频为准，不要再编一段配乐。没有参考音频时，用一两句写明曲风、速度和情绪。\n现场只保留空间环境声，不要把唱词再念一遍。\n没有用到的参考视频不要写进成稿。",
  漫剧: "漫剧。剧情栏里已经写好的话必须逐字说出来，一条都不能丢。先按顺序摘出每句原话和说话人，再写六段。每一句都要原样出现在 detailed_description 里，写成 <d>[Chinese] 原句。 </d>。不许省略，不许概括成正在说话，不许改写，不许翻译，不许扩写，也不许把同一句再说一遍。\n成稿只能有这六段，顺序不变：subject_definitions、summary、retention_analysis、detailed_description、overall_soundscape、non_diegetic_music。镜头、动作、场景和声音用英文写，对白保持剧情原文。\nsubject_definitions：剧本里出现几个 <Picture N>，就写几个 Subject，格式是 Picture N == Subject N。要说话的人写成 Subject N (S编号)，同一个人全程同一个编号。不增加人物，不用文件名推断身份，不写参考图里没有的外貌。\nsummary：有参考音频时以 [reference generation + audio reference] 开头；没有参考音频时以 [reference generation] 开头。写明视频内容、成片给出的比例、分辨率、时长、人物和场景，并写明实际参与的参考素材。没有点名的视频和音频不要写。\nretention_analysis：每个人的脸、发型、服装只跟自己的参考图，不能互换外貌和服装。场景、光线和空间关系保持连续。人物身份全程不变。\ndetailed_description：这是成稿的核心。每个镜头写成 [Shot N] At 00:00.000, 时间从 00:00.000 起，最后一镜落在总时长内。每镜写明人物动作、表情、视线和运镜。默认同一场景、平稳跟拍、中景；剧情另有景别、走位或换地点时按剧情，不要自己加换景。对白按剧情顺序排，说话句先写明是 Subject N (S编号) 亲自开口，再把完整原句放进 <d>。多人对话换人就换说话人，不能串词。按总时长把句子排开，写明最后一句说完的时间，避免被截断。口型、语音、表情和动作同步。\noverall_soundscape：只写这个地点里真实会有的声音，例如脚步和远处的环境声。不重复对白，不把对白写成环境音，不加无关音效。\nnon_diegetic_music：剧情没有要求配乐时写 N/A。剧情要求有音乐时，只按剧情写乐器、速度和情绪。",
};
const STALE_PRESET = {
  数字人: ["按数字人口播填", "数字人口播。剧情栏里已经写好的话", "数字人口播。只写一个人对着镜头说话", "数字人口播。六段里的镜头、动作、场景和声音用英文写。", "数字人口播。成稿六段的镜头、动作、场景和声音用英文写。"],
  MV: ["按 MV 演唱填"],
  漫剧: ["按漫剧填", "漫剧。有几张人物参考图"],
};

function isStalePreset(name, text) {
  return (STALE_PRESET[name] || []).some((mark) => mark && String(text || "").startsWith(mark));
}

const NODE_CLASS = "FeimaoH3Reverse";
const STYLE_ID = "feimao-h3r-style";

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .h3r { width:100%; box-sizing:border-box; display:flex; flex-direction:column; gap:8px; color:#eee; }
    .h3r-label { font-size:12px; font-weight:750; color:#ddd; }
    .h3r-prompt, .h3r-result { width:100%; box-sizing:border-box; resize:vertical; border-radius:8px;
      border:1px solid rgba(255,255,255,.16); background:rgba(0,0,0,.28); color:#eee; font:13px/1.45 inherit; padding:8px; }
    .h3r-prompt { min-height:72px; height:88px; }
    .h3r-result { min-height:140px; height:180px; }
    .h3r-actions { display:flex; gap:8px; }
    .h3r-actions button { flex:1; border:0; border-radius:8px; padding:8px 10px; font-weight:750; cursor:pointer; color:#fff; }
    .h3r-go { background:#2f6fed; }
    .h3r-copy { background:#1f6b45; }
    .h3r-go:disabled { opacity:.55; cursor:wait; }
    .h3r-status { min-height:18px; font-size:12px; color:#bbb; }
    .h3r-presets { display:flex; flex-direction:column; gap:6px; width:100%; }
    .h3r-row { display:flex; gap:6px; }
    .h3r-row select, .h3r-row input { flex:1; box-sizing:border-box; background:#111; color:#fff; color-scheme:dark;
      border:1px solid rgba(255,255,255,.28); border-radius:6px; padding:4px 6px; font-size:13px; }
    .h3r-row button { border:0; border-radius:6px; padding:4px 10px; font-weight:700; cursor:pointer; background:#333; color:#fff; }
    .h3r-presets > input { width:100%; box-sizing:border-box; background:#111; color:#fff; color-scheme:dark;
      border:1px solid rgba(255,255,255,.28); border-radius:6px; padding:4px 6px; font-size:13px; }
    .h3r-preset { width:100%; box-sizing:border-box; min-height:120px; height:150px; resize:vertical; border-radius:8px;
      border:1px solid rgba(255,255,255,.16); background:rgba(0,0,0,.28); color:#eee; font:13px/1.45 inherit; padding:8px; }
  `;
  document.head.appendChild(style);
}

function widget(node, name) {
  return (node.widgets || []).find((item) => item?.name === name);
}

function fieldText(item) {
  if (!item) return "";
  const live = String(item.value ?? "");
  if (live.trim()) return live;
  if (typeof item.__h3Text === "string" && item.__h3Text.trim()) return item.__h3Text;
  const fallback = item.options?.default;
  return typeof fallback === "string" ? fallback : "";
}

function rememberFields(node) {
  for (const name of ["反推要求", ...Object.values(MODE_FIELD)]) {
    const item = widget(node, name);
    if (!item) continue;
    const text = fieldText(item);
    if (text.trim()) item.__h3Text = text;
    if (name === "反推要求" && !String(item.value ?? "").trim() && text.trim()) item.value = text;
  }
}

function hideWidget(item) {
  if (!item) return;
  if (!item.__h3Saved) {
    item.__h3Saved = true;
    item.__h3OrigType = item.type;
    item.__h3OrigCompute = item.computeSize;
    item.__h3OrigLayout = item.computeLayoutSize;
    item.__h3OrigDraw = item.draw;
  }
  item.type = "converted-widget";
  try { item.hidden = true; } catch (_) {}
  if (item.options) {
    try { item.options.hidden = true; } catch (_) {}
  }
  item.computeSize = () => [0, -4];
  item.computeLayoutSize = () => ({ minHeight: 0, maxHeight: 0, minWidth: 0 });
  item.serialize = true;
  item.draw = function () {};
}

function showWidget(item) {
  if (!item) return;
  if (item.__h3OrigType) item.type = item.__h3OrigType;
  if (item.__h3Saved) {
    item.computeSize = item.__h3OrigCompute;
    item.computeLayoutSize = item.__h3OrigLayout;
    item.draw = item.__h3OrigDraw;
  }
  try { item.hidden = false; } catch (_) {}
  if (item.options) {
    try { item.options.hidden = false; } catch (_) {}
  }
}

function hideAll(node) {
  for (const name of ["本次执行", "画幅", "时长", "剧情", "模式", "编辑预设", "数字人写法", "MV写法", "漫剧写法", "预设", "当前预设"]) {
    hideWidget(widget(node, name));
  }
}

function ensureButton(node, name, onClick) {
  const existing = widget(node, name);
  if (existing) {
    existing.callback = onClick;
    existing.serialize = false;
    return existing;
  }
  const item = node.addWidget("button", name, null, onClick);
  item.serialize = false;
  return item;
}

function setStatus(node, text) {
  let item = widget(node, "状态");
  if (!item) {
    item = node.addWidget("text", "状态", text, () => {});
    item.serialize = false;
  } else {
    item.value = text;
  }
  if (node.__h3Status) node.__h3Status.textContent = text;
}

function graphLink(node, id) {
  const graph = node.graph || app.graph;
  return graph?.getLink?.(id) || graph?.links?.[id] || null;
}

function linkOriginId(link) {
  if (!link) return null;
  if (Array.isArray(link)) return link[1];
  return link.origin_id ?? link.originId ?? null;
}

function sourceDirector(node) {
  const input = (node.inputs || []).find((item) => item?.name === "用户提示词");
  if (input?.link == null) return null;
  const origin = linkOriginId(graphLink(node, input.link));
  const found = origin == null ? null : (node.graph || app.graph)?.getNodeById?.(origin) || null;
  return isDirector(found) ? found : found;
}

function directorPrompt(node) {
  const source = sourceDirector(node);
  if (!source) return "";
  return renderTags(directorWidget(source, "提示词")?.value || directorWidget(source, "prompt_raw")?.value || "");
}

function directorValue(node, name) {
  const source = sourceDirector(node);
  if (!source) return "";
  const value = directorWidget(source, name)?.value;
  return value == null ? "" : value;
}

function framingLine(aspect, seconds) {
  const ratio = String(aspect || "").trim();
  const secs = String(seconds ?? "").trim();
  if (!ratio && !secs) return "导演台还没读到宽高比和秒数。";
  let frame = "主体放在画面中部";
  if (ratio === "9:16" || ratio === "3:4") frame = "竖屏，人脸和上半身放在中部，不要写成横屏大全景";
  else if (ratio === "16:9" || ratio === "21:9" || ratio === "4:3") frame = "横屏，可以带上人物两侧的环境和关系";
  else if (ratio === "1:1") frame = "方画幅，主体居中";
  const secondsText = secs ? `${secs} 秒` : "未设秒数";
  return `成片宽高比 ${ratio || "未设"}，时长 ${secondsText}。${frame}。动作和对白必须在这个时长里做完。`;
}

function pullDirector(node) {
  const prompt = directorPrompt(node).trim();
  const aspect = String(directorValue(node, "宽高比") || "");
  const seconds = directorValue(node, "秒数");
  const megapixels = directorValue(node, "百万像素");
  const multiple = directorValue(node, "对齐倍数");
  const story = widget(node, "剧情");
  if (story) story.value = prompt;
  const ratio = widget(node, "画幅");
  if (ratio) ratio.value = aspect;
  const length = widget(node, "时长");
  if (length) length.value = seconds === "" ? "" : String(seconds);
  let size = "";
  if (aspect) {
    const [width, height] = canvasSize(aspect, megapixels || 1, multiple || 32);
    size = `${width}×${height}`;
  }
  return { prompt, aspect, seconds: seconds === "" ? "" : String(seconds), size };
}

function readPresets(node) {
  if (node.__h3Presets) return node.__h3Presets;
  rememberFields(node);
  let list = [];
  try {
    const data = JSON.parse(String(widget(node, "预设")?.value || "[]"));
    if (Array.isArray(data)) list = data.filter((item) => item && String(item.name || "").trim());
  } catch (_) {
    list = [];
  }
  const builtin = (name) => {
    const text = fieldText(widget(node, MODE_FIELD[name]));
    const fresh = FRESH_PRESET[name];
    if (fresh && (!text.trim() || isStalePreset(name, text))) return fresh;
    return text;
  };
  if (!list.length) {
    list = MODES.map((name) => ({ name, text: builtin(name) }));
  } else {
    list = list.map((item) => {
      const fresh = FRESH_PRESET[item.name];
      const text = String(item.text || "");
      if (fresh && (!text.trim() || isStalePreset(item.name, text))) return { ...item, text: fresh };
      if (text.trim() || !MODE_FIELD[item.name]) return item;
      const recovered = builtin(item.name);
      return recovered.trim() ? { ...item, text: recovered } : item;
    });
  }
  const changed = list.some((item) => {
    return FRESH_PRESET[item.name] && isStalePreset(item.name, widget(node, MODE_FIELD[item.name])?.value || "");
  });
  node.__h3Presets = list;
  if (changed) {
    const selected = String(widget(node, "当前预设")?.value || widget(node, "模式")?.value || list[0]?.name || "");
    writePresets(node, list, selected);
  }
  return list;
}

function refreshPresets(node) {
  rememberFields(node);
  const previous = node.__h3Presets;
  node.__h3Presets = null;
  const next = readPresets(node);
  const nextEmpty = next.every((item) => !String(item.text || "").trim());
  const previousFilled = Array.isArray(previous) && previous.some((item) => String(item.text || "").trim());
  if (nextEmpty && previousFilled) node.__h3Presets = previous;
  renderPresets(node);
}

function writePresets(node, list, selected) {
  node.__h3Presets = list;
  const store = widget(node, "预设");
  if (store) store.value = JSON.stringify(list);
  for (const preset of list) {
    const field = MODE_FIELD[preset.name];
    const target = field ? widget(node, field) : null;
    if (target) target.value = preset.text;
  }
  const current = widget(node, "当前预设");
  if (current && selected) current.value = selected;
  const mode = widget(node, "模式");
  if (mode && MODES.includes(selected)) mode.value = selected;
}

function currentMode(node) {
  const presets = readPresets(node);
  const savedList = String(widget(node, "预设")?.value || "").trim();
  const stored = String(widget(node, "当前预设")?.value || "");
  const legacy = String(widget(node, "模式")?.value || "");
  if (savedList && presets.some((item) => item.name === stored)) return stored;
  if (presets.some((item) => item.name === legacy)) return legacy;
  if (presets.some((item) => item.name === stored)) return stored;
  return presets[0]?.name || "数字人";
}

function selectedPreset(node) {
  const name = currentMode(node);
  return readPresets(node).find((item) => item.name === name) || readPresets(node)[0] || { name: "数字人", text: "" };
}

function generationMode(node) {
  const value = String(directorValue(node, "模式") || "多参");
  if (value === "图生") return "首帧";
  return ["多参", "文生", "首帧", "尾帧", "首尾帧", "数字人"].includes(value) ? value : "多参";
}

function directorInventory(node) {
  const source = sourceDirector(node);
  if (!source) return "还没接上 H3导演台 的「提示词」。";
  const mode = generationMode(node);
  const images = readList(source, "images_json");
  if (mode === "文生") return "文生：不使用参考图、参考视频、参考音频。";
  if (mode === "首帧" || mode === "尾帧") {
    const frame = images[0];
    return `${mode}：${frame ? (frame.name || frame.filename || "已上传") : "还没上传"}`;
  }
  if (mode === "首尾帧" || mode === "数字人") {
    const first = images[0];
    const last = images[1];
    return `首帧：${first ? (first.name || first.filename || "已上传") : "还没上传"}\n尾帧：${last ? (last.name || last.filename || "已上传") : "还没上传"}`;
  }
  const videos = readList(source, "videos_json");
  const audios = readList(source, "audios_json");
  const pictureLine = images.map((item, index) => `<Picture ${index + 1}> ${item.name || ""}`.trim()).join("\n") || "无";
  const videoLine = videos.map((item, index) => `<Video ${index + 1}> ${item.name || ""}`.trim()).join("\n") || "无";
  const audioLine = audios.map((item, index) => `<Audio ${index + 1}> ${item.name || ""}`.trim()).join("\n") || "无";
  return `参考图：\n${pictureLine}\n参考视频：\n${videoLine}\n参考音频：\n${audioLine}`;
}

const GEN_LEAD = {
  文生: "当前是文生。成稿写成一段 integrated_multimodal_description，写全人物外观、服装、场景、光线、动作和镜头。不要写 subject_definitions，不要写 <Picture> <Video> <Audio> <Subject>。",
  首帧: "当前是首帧。人物外观以首帧图片为准，成稿只写动作、表情、镜头和环境变化。不要写 subject_definitions，不要写 <Picture> 标签。",
  尾帧: "当前是尾帧。动作走向这张尾帧，结尾落在尾帧的样子上。不要写 subject_definitions，不要写 <Picture> 标签。",
  首尾帧: "当前是首尾帧。两张都有时写从首帧走到尾帧；只有一张时按那一张是首帧还是尾帧来写。不要写 subject_definitions，不要写 <Picture> 标签。",
  数字人: "当前是数字人。首帧和尾帧按上传的那几张锁定。声音是平台运行时驱动音频，不要写成参考音频。不要写 subject_definitions，不要写 <Picture> 标签。",
};

function copyPack(node, pulled) {
  const mode = currentMode(node);
  const gen = generationMode(node);
  const guide = String(selectedPreset(node)?.text || "").trim();
  const story = pulled?.prompt || directorPrompt(node).trim();
  const aspect = pulled?.aspect || String(directorValue(node, "宽高比") || widget(node, "画幅")?.value || "");
  const seconds = pulled?.seconds || String(directorValue(node, "秒数") ?? widget(node, "时长")?.value ?? "");
  const size = pulled?.size ? `，约 ${pulled.size}` : "";
  if (gen !== "多参") {
    return [
      GEN_LEAD[gen],
      `表演类型按「${mode}」理解动作和台词，不要套用多参的标签结构。`,
      framingLine(aspect, seconds) + size,
      "",
      "这是导演台里的剧情--",
      story || "（导演台还没写剧情）",
      "",
      "这是这次会用到的画面--",
      directorInventory(node),
      "",
      "这是参考图反推--",
      String(widget(node, "结果")?.value || "").trim() || "（还没有反推）",
    ].join("\n");
  }
  return [
    `请按「${mode}」把下面的剧情填成 MiniMax H3 提示词。成稿只能有 subject_definitions、summary、retention_analysis、detailed_description、overall_soundscape、non_diegetic_music。对白写成 <d>[Chinese] 台词。 </d>，镜头写成 [Shot 1] At 00:00.000, 。`,
    framingLine(aspect, seconds) + size,
    "",
    "这是导演台里的剧情，图片标签保持原样--",
    story || "（导演台还没写剧情）",
    "",
    "这是已经上传的素材--",
    directorInventory(node),
    "",
    "这是每张参考图的反推--",
    String(widget(node, "结果")?.value || "").trim() || "（还没有反推）",
    "",
    `这是${mode}的写法，扩写时照这个来--`,
    guide || "（这个模式的写法是空的）",
  ].join("\n");
}

function failureText(err) {
  const body = err?.response;
  const error = body?.error;
  if (typeof error === "string" && error) return error;
  if (error?.message) return String(error.message);
  const nodeErrors = body?.node_errors;
  if (nodeErrors) {
    const first = Object.values(nodeErrors)[0];
    const message = first?.errors?.[0]?.message || first?.errors?.[0]?.details;
    if (message) return String(message);
  }
  return err?.message || "反推没有排上队";
}

function enableBranch(node) {
  const saved = [];
  const seen = new Set();
  const graph = node.graph || app.graph;
  const walk = (current) => {
    if (!current || seen.has(current.id)) return;
    seen.add(current.id);
    saved.push([current, current.mode]);
    current.mode = 0;
    for (const input of current.inputs || []) {
      if (input?.link == null) continue;
      const origin = linkOriginId(graphLink(current, input.link));
      if (origin == null) continue;
      walk(graph?.getNodeById?.(origin));
    }
  };
  walk(node);
  return saved;
}

async function startReverse(node) {
  const saved = enableBranch(node);
  const runFlag = widget(node, "本次执行");
  if (runFlag) runFlag.value = true;
  const go = widget(node, "开始反推");
  if (go) go.disabled = true;
  if (node.__h3Go) node.__h3Go.disabled = true;
  setStatus(node, "正在反推剧本里用到的参考图…");
  try {
    const promptWidget = widget(node, "反推要求");
    if (node.__h3Prompt && promptWidget) promptWidget.value = node.__h3Prompt.value;
    const packed = await app.graphToPrompt();
    await api.queuePrompt(0, packed, { partialExecutionTargets: [String(node.id)] });
  } catch (err) {
    setStatus(node, failureText(err));
    if (go) go.disabled = false;
    if (node.__h3Go) node.__h3Go.disabled = false;
  } finally {
    if (runFlag) runFlag.value = false;
    for (const [current, mode] of saved) {
      if (!current) continue;
      current.mode = current.id === node.id ? 0 : mode;
    }
  }
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const box = document.createElement("textarea");
    box.value = text;
    document.body.appendChild(box);
    box.select();
    document.execCommand("copy");
    box.remove();
  }
}

function extractStory(node) {
  if (!sourceDirector(node)) {
    setStatus(node, "先把 H3导演台 的「提示词」接到这里");
    return null;
  }
  const pulled = pullDirector(node);
  const mode = currentMode(node);
  setStatus(node, pulled.prompt ? `已提取剧情，${pulled.aspect || "未设画幅"}，${pulled.seconds || "未设"} 秒，复制按${mode}` : "导演台剧情还是空的");
  return pulled;
}

async function copyForAi(node) {
  const pulled = extractStory(node);
  if (!pulled) return;
  await writeClipboard(copyPack(node, pulled));
  const mode = currentMode(node);
  const empty = !String(widget(node, "结果")?.value || "").trim();
  setStatus(node, empty ? `已按${mode}复制，反推结果还是空的` : `已按${mode}复制`);
}

function presetBoxHeight(node) {
  return node.__h3PresetEditing ? 250 : 42;
}

function fitPresetBox(node) {
  node.setDirtyCanvas?.(true, true);
  const size = node.computeSize?.();
  if (size && node.size) node.setSize?.([Math.max(node.size[0], size[0]), size[1]]);
}

function renderPresets(node) {
  const root = node.__h3PresetsRoot;
  if (!root) return;
  const list = readPresets(node);
  const name = currentMode(node);
  const preset = list.find((item) => item.name === name) || list[0];
  const editing = !!node.__h3PresetEditing;
  root.replaceChildren();
  const row = document.createElement("div");
  row.className = "h3r-row";
  const select = document.createElement("select");
  for (const item of list) {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = item.name;
    if (item.name === preset?.name) option.selected = true;
    select.appendChild(option);
  }
  select.addEventListener("pointerdown", (event) => event.stopPropagation());
  select.addEventListener("change", () => {
    writePresets(node, readPresets(node), select.value);
    renderPresets(node);
    setStatus(node, `复制将按${select.value}的写法`);
  });
  const edit = document.createElement("button");
  edit.type = "button";
  edit.textContent = editing ? "完成" : "编辑";
  edit.addEventListener("pointerdown", (event) => event.stopPropagation());
  edit.addEventListener("click", () => {
    node.__h3PresetEditing = !editing;
    renderPresets(node);
    fitPresetBox(node);
  });
  row.append(select, edit);
  root.append(row);
  if (!editing || !preset) return;
  const nameInput = document.createElement("input");
  nameInput.value = preset.name || "";
  nameInput.placeholder = "预设名";
  nameInput.addEventListener("pointerdown", (event) => event.stopPropagation());
  nameInput.addEventListener("change", () => {
    const nextName = nameInput.value.trim();
    const items = readPresets(node);
    if (!nextName || items.some((item) => item.name === nextName && item !== preset)) {
      setStatus(node, "预设名是空的，或已经有同名预设");
      nameInput.value = preset.name || "";
      return;
    }
    const updated = items.map((item) => item.name === preset.name ? { ...item, name: nextName } : item);
    writePresets(node, updated, nextName);
    renderPresets(node);
  });
  const editor = document.createElement("textarea");
  editor.className = "h3r-preset";
  editor.value = preset.text || "";
  editor.placeholder = "这个预设的写法。复制给 AI 时会带上。";
  editor.addEventListener("pointerdown", (event) => event.stopPropagation());
  editor.addEventListener("input", () => {
    const updated = readPresets(node).map((item) => item.name === preset.name ? { ...item, text: editor.value } : item);
    writePresets(node, updated, preset.name);
  });
  const actions = document.createElement("div");
  actions.className = "h3r-row";
  const add = document.createElement("button");
  add.type = "button";
  add.textContent = "新增";
  add.addEventListener("pointerdown", (event) => event.stopPropagation());
  add.addEventListener("click", () => {
    const items = readPresets(node);
    let fresh = "新预设";
    let index = 2;
    while (items.some((item) => item.name === fresh)) {
      fresh = `新预设${index}`;
      index += 1;
    }
    writePresets(node, items.concat([{ name: fresh, text: "" }]), fresh);
    renderPresets(node);
    setStatus(node, `已新增${fresh}`);
  });
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "删除";
  remove.addEventListener("pointerdown", (event) => event.stopPropagation());
  remove.addEventListener("click", () => {
    const items = readPresets(node);
    if (items.length <= 1) {
      setStatus(node, "至少留一个预设");
      return;
    }
    const updated = items.filter((item) => item.name !== preset.name);
    writePresets(node, updated, updated[0].name);
    renderPresets(node);
    setStatus(node, `已删除${preset.name}`);
  });
  actions.append(add, remove);
  root.append(nameInput, editor, actions);
}

function buildUI(node) {
  if (node.__h3Built) return;
  node.__h3Built = true;
  ensureStyle();
  rememberFields(node);
  hideAll(node);
  const root = document.createElement("div");
  root.className = "h3r-presets";
  node.__h3PresetsRoot = root;
  const dom = node.addDOMWidget("h3r_presets", "h3r", root, {
    serialize: false,
    hideOnZoom: false,
    getMinHeight: () => presetBoxHeight(node),
    getMaxHeight: () => node.__h3PresetEditing ? 420 : 42,
  });
  if (dom) {
    dom.computeSize = null;
    dom.computeLayoutSize = () => ({
      minHeight: presetBoxHeight(node),
      maxHeight: node.__h3PresetEditing ? 420 : 42,
      minWidth: 280,
    });
  }
  renderPresets(node);
  ensureButton(node, "开始反推", () => { void startReverse(node); });
  ensureButton(node, "复制给AI", () => { void copyForAi(node); });
  setStatus(node, `复制将按${currentMode(node)}的写法`);
}

function isReverse(node) {
  return !!node && (node.comfyClass === NODE_CLASS || node.type === NODE_CLASS);
}

function onExecuted(event) {
  const detail = event.detail || event;
  const node = app.graph?.getNodeById?.(detail?.node) || app.graph?.getNodeById?.(Number(detail?.node));
  if (!isReverse(node)) return;
  const text = detail?.output?.text?.[0];
  if (typeof text !== "string") return;
  const item = widget(node, "结果");
  if (item) item.value = text;
  if (node.__h3Result) node.__h3Result.value = text;
  const go = widget(node, "开始反推");
  if (go) go.disabled = false;
  if (node.__h3Go) node.__h3Go.disabled = false;
  setStatus(node, text ? `已写出 ${text.split("<Picture ").length - 1} 张` : "没有得到反推文字");
}

app.registerExtension({
  name: "feimao.h3.Reverse",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData?.name !== NODE_CLASS) return;
    const onCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const result = onCreated?.apply(this, arguments);
      try { buildUI(this); } catch (err) { console.error("[feimao-h3反推]", err); }
      return result;
    };
    const onConfigure = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function () {
      const result = onConfigure?.apply(this, arguments);
      const node = this;
      setTimeout(() => {
        rememberFields(node);
        hideAll(node);
        refreshPresets(node);
        ensureButton(node, "开始反推", () => { void startReverse(node); });
        ensureButton(node, "复制给AI", () => { void copyForAi(node); });
      }, 0);
      return result;
    };
  },
  nodeCreated(node) {
    if (!isReverse(node)) return;
    try { buildUI(node); } catch (err) { console.error("[feimao-h3反推]", err); }
  },
  setup() {
    api.addEventListener("executed", onExecuted);
    api.addEventListener("execution_error", (event) => {
      const detail = event.detail || event;
      const node = app.graph?.getNodeById?.(detail?.node) || app.graph?.getNodeById?.(Number(detail?.node));
      if (!isReverse(node)) return;
      const go = widget(node, "开始反推");
      if (go) go.disabled = false;
      setStatus(node, detail?.exception_message || "反推失败");
    });
    api.addEventListener("execution_interrupted", () => {
      for (const node of app.graph?.nodes || []) {
        if (!isReverse(node)) continue;
        const go = widget(node, "开始反推");
        if (go) go.disabled = false;
      }
    });
  },
});
