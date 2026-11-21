import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

const NODE_CLASS = "FeimaoH3Board";
const SETTINGS_CLASS = "FeimaoH3Director";
const STYLE_ID = "feimao-h3d-style";
const ASPECTS = ["9:16", "16:9", "1:1", "4:3", "3:4", "21:9"];
const LIMITS = { images_json: 9, videos_json: 3, audios_json: 3 };
const GEN_MODES = ["多参", "文生", "图生", "首尾帧"];
const HIDDEN = ["images_json", "videos_json", "audios_json", "提示词", "反推结果", "数字人写法", "MV写法", "漫剧写法", "预设", "当前预设"];

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .h3d { width:100%; max-width:100%; box-sizing:border-box; display:flex; flex-direction:column; gap:8px; color:#eee; overflow:hidden; }
    .h3d-cols { display:grid; grid-template-columns:minmax(320px, 0.92fr) minmax(0, 1.08fr); gap:12px; align-items:start; width:100%; }
    .h3d-cols.single { grid-template-columns:1fr; }
    .h3d-side { display:flex; flex-direction:column; gap:10px; min-width:0; }
    .h3d-media { display:none; }
    .h3d-label { font-size:12px; font-weight:750; color:#ddd; }
    .h3d-editor { width:100%; box-sizing:border-box; min-height:120px; height:150px; resize:vertical; border-radius:8px;
      border:1px solid rgba(255,255,255,.16); background:rgba(0,0,0,.28); color:#eee; font:13px/1.45 inherit; padding:8px; }
    .h3d-editor:focus { border-color:rgba(255,180,60,.75); outline:none; }
    .h3d-block { display:flex; flex-direction:column; gap:8px; width:100%; box-sizing:border-box; padding:8px; border-radius:12px; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.07); }
    .h3d-head { display:flex; align-items:center; justify-content:space-between; font-size:13px; font-weight:750; color:#eee; }
    .h3d-count { color:#9a9a9a; font-size:12px; font-weight:500; }
    .h3d-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; width:100%; }
    .h3d-card { position:relative; aspect-ratio:1; border:1px dashed rgba(255,255,255,.18); border-radius:12px; background:#141414;
      display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; color:#8a8a8a; font-size:12px; cursor:pointer; overflow:hidden; }
    .h3d-card.filled { border-style:solid; border-color:rgba(255,255,255,.14); cursor:grab; }
    .h3d-card.dragging { opacity:.4; }
    .h3d-card.drop { outline:2px solid #e2b15a; outline-offset:-2px; }
    .h3d-card img, .h3d-card video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
    .h3d-card .h3d-cap { position:absolute; left:0; right:0; bottom:0; padding:8px 6px 6px; background:linear-gradient(transparent, rgba(0,0,0,.78)); color:#fff; font-size:11px; text-align:center; }
    .h3d-card .h3d-ico { width:36px; height:36px; display:block; }
    .h3d-card .h3d-hint { font-size:11px; color:#7d7d7d; }
    .h3d-x { position:absolute; top:6px; right:6px; z-index:2; width:18px; height:18px; border:0; border-radius:999px; background:rgba(0,0,0,.72); color:#fff; cursor:pointer; line-height:18px; padding:0; }
    .h3d-ord { position:absolute; top:6px; left:6px; z-index:2; min-width:18px; height:18px; padding:0 5px; border-radius:999px; background:rgba(0,0,0,.72); color:#fff; font-size:11px; line-height:18px; text-align:center; }
    .h3d-more-row, .h3d-import-row { display:flex; gap:8px; width:100%; }
    .h3d-more { flex:1; border:0; background:transparent; color:#c8c8c8; font-size:12px; padding:2px 0 0; cursor:pointer; }
    .h3d-import { flex:1; border:1px solid rgba(255,255,255,.14); border-radius:10px; background:#1c1c1c; color:#eee; padding:7px 8px; cursor:pointer; font-size:12px; font-weight:700; }
    .h3d-import:hover { border-color:rgba(255,255,255,.32); }
    .h3d-lib { position:fixed; z-index:10060; left:50%; top:48px; transform:translateX(-50%); width:min(760px, 94vw); height:min(680px, calc(100vh - 72px));
      display:flex; flex-direction:column; background:#161616; color:#eee; border:1px solid rgba(255,255,255,.22); border-radius:12px; box-shadow:0 16px 40px rgba(0,0,0,.55); overflow:hidden; }
    .h3d-lib.hidden { display:none; }
    .h3d-lib-bar { display:flex; align-items:center; gap:8px; flex:0 0 auto; padding:10px 12px; }
    .h3d-lib-bar b { font-size:14px; }
    .h3d-lib-bar button { margin-left:auto; border:0; border-radius:8px; padding:6px 12px; background:#333; color:#fff; cursor:pointer; font-weight:700; }
    .h3d-lib-search { flex:0 0 auto; margin:0 12px 8px; box-sizing:border-box; width:calc(100% - 24px); background:#111; color:#fff; color-scheme:dark;
      border:1px solid rgba(255,255,255,.28); border-radius:8px; padding:6px 8px; font-size:13px; }
    .h3d-lib-note { flex:0 0 auto; padding:0 12px 8px; color:#999; font-size:12px; }
    .h3d-lib-grid { flex:1 1 auto; min-height:0; display:grid; align-content:start; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); grid-auto-rows:148px; gap:8px; overflow:auto; padding:0 12px 12px; }
    .h3d-lib-item { height:148px; min-height:148px; border:1px solid rgba(255,255,255,.12); background:#111; border-radius:8px; padding:0; cursor:pointer; overflow:hidden; color:#ddd; text-align:left; }
    .h3d-lib-item.on { border-color:#2f6fed; opacity:.62; }
    .h3d-lib-item.pick { border-color:#e2b15a; box-shadow:inset 0 0 0 1px #e2b15a; }
    .h3d-lib-item img { width:100%; height:112px; object-fit:cover; display:block; background:#0c0c0c; }
    .h3d-lib-item span { display:block; height:36px; line-height:36px; padding:0 6px; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .h3d-lib-more { flex:0 0 auto; margin:0 12px 8px; border:0; border-radius:8px; padding:8px 10px; background:#2a2a2a; color:#eee; cursor:pointer; font-weight:700; }
    .h3d-lib-foot { flex:0 0 auto; display:flex; align-items:center; gap:8px; padding:0 12px 12px; }
    .h3d-lib-modes { display:flex; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,.16); }
    .h3d-lib-modes button { border:0; background:#222; color:#ddd; padding:7px 12px; cursor:pointer; font-weight:700; }
    .h3d-lib-modes button.on { background:#2f6fed; color:#fff; }
    .h3d-lib-ok { margin-left:auto; border:0; border-radius:8px; padding:8px 14px; background:#1f6b45; color:#fff; font-weight:750; cursor:pointer; }
    .h3d-lib-ok:disabled { opacity:.45; cursor:default; }
    .h3d-note { width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#161616; }
    .h3d-item .h3d-note { width:42px; height:42px; flex:0 0 auto; border-radius:6px; }
    .h3d-light audio { width:min(480px, 92vw); }
    .h3d-note svg { width:28px; height:28px; display:block; }
    .h3d-size { display:grid; grid-template-columns:1fr 90px; gap:8px; }
    .h3d-field { display:flex; flex-direction:column; gap:2px; font-size:12px; }
    .h3d-field select, .h3d-field input { width:100%; box-sizing:border-box; background:#111; color:#fff; color-scheme:dark;
      border:1px solid rgba(255,255,255,.28); border-radius:6px; padding:4px 6px; font-size:13px; font-weight:650; }
    .h3d-actions { display:flex; gap:8px; }
    .h3d-actions button { flex:1; border:0; border-radius:8px; padding:8px 10px; font-weight:750; cursor:pointer; background:#1f6b45; color:#fff; }
    .h3d-status { min-height:32px; font-size:12px; line-height:1.35; color:#bbb; white-space:pre-wrap; }
    .h3d-menu { position:fixed; z-index:10050; min-width:260px; max-width:380px; max-height:320px; overflow:auto; background:#141414;
      border:1px solid #444; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,.45); padding:4px 0; }
    .h3d-menu.hidden { display:none; }
    .h3d-item, .h3d-empty { display:flex; align-items:center; gap:8px; width:100%; box-sizing:border-box; padding:6px 10px; background:transparent; border:0; color:#ddd; text-align:left; cursor:pointer; }
    .h3d-item:hover, .h3d-item.on { background:#2f4f86; color:#fff; }
    .h3d-item b { color:#8dffb8; flex:0 0 auto; }
    .h3d-item span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .h3d-item img, .h3d-item video { width:42px; height:42px; object-fit:cover; border-radius:6px; background:#111; flex:0 0 auto; }
    .h3d-empty { cursor:default; color:#888; }
    .h3d-light { position:fixed; inset:0; z-index:10070; background:rgba(0,0,0,.82); display:flex; align-items:center; justify-content:center; }
    .h3d-light.hidden { display:none; }
    .h3d-light img, .h3d-light video { max-width:92vw; max-height:92vh; object-fit:contain; background:#000; }
    .h3d-light-x { position:absolute; z-index:2; border:0; border-radius:8px; padding:8px 14px; background:#fff; color:#111; font-weight:750; cursor:pointer; }
    .h3d-open { width:100%; border:0; border-radius:8px; padding:8px 10px; font-weight:750; cursor:pointer; background:#2a2a2a; color:#eee; }
    .h3d-inline { flex:0 0 auto; }
    .h3d-actions { display:flex; gap:8px; }
    .h3d-actions button { flex:1; border:0; border-radius:10px; padding:9px 10px; font-weight:750; cursor:pointer; color:#fff; }
    .h3d-pop { background:#2a2a2a; }
    .h3d-run { background:#2a6a4a; }
    .h3d-run:disabled { opacity:.55; cursor:wait; }
    .h3d-rev { display:flex; flex-direction:column; gap:6px; width:100%; box-sizing:border-box; padding:8px; border-radius:12px; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.07); }
    .h3d-rev-label { font-size:12px; font-weight:750; color:#ddd; }
    .h3d-result, .h3d-rev-text { width:100%; box-sizing:border-box; resize:vertical; border-radius:8px;
      border:1px solid rgba(255,255,255,.16); background:rgba(0,0,0,.28); color:#eee; font:13px/1.45 inherit; padding:8px; }
    .h3d-result { min-height:88px; height:110px; }
    .h3d-rev-text { min-height:120px; height:140px; }
    .h3d-rev-row { display:flex; gap:6px; }
    .h3d-rev-row select, .h3d-rev-row input, .h3d-rev > input { flex:1; box-sizing:border-box; background:#111; color:#fff; color-scheme:dark;
      border:1px solid rgba(255,255,255,.28); border-radius:6px; padding:4px 6px; font-size:13px; }
    .h3d-rev-row button, .h3d-rev-actions button { border:0; border-radius:6px; padding:6px 10px; font-weight:700; cursor:pointer; background:#333; color:#fff; }
    .h3d-rev-actions { display:flex; gap:8px; }
    .h3d-rev-actions button { flex:1; border-radius:8px; }
    .h3d-rev-go { background:#6b4a1f; }
    .h3d-rev-copy { background:#1f6b45; }
    .h3d-rev-go:disabled { opacity:.55; cursor:wait; }
    .h3d-float { position:fixed; z-index:10020; display:flex; flex-direction:column; min-width:320px; min-height:180px;
      width:520px; height:360px; resize:both; overflow:hidden; background:#161616; color:#eee;
      border:1px solid rgba(255,255,255,.22); border-radius:10px; box-shadow:0 16px 40px rgba(0,0,0,.5); }
    .h3d-float.hidden { display:none; }
    .h3d-float-bar { display:flex; align-items:center; gap:8px; flex:0 0 auto; padding:8px 10px; background:#242424; cursor:grab; user-select:none; }
    .h3d-float-bar span { font-size:13px; font-weight:750; }
    .h3d-float-actions { margin-left:auto; display:flex; gap:6px; }
    .h3d-float-bar button { border:0; border-radius:6px; padding:4px 10px; background:#333; color:#fff; cursor:pointer; }
    .h3d-float-grip { position:absolute; right:3px; bottom:3px; width:12px; height:12px; pointer-events:none;
      background:linear-gradient(135deg, transparent 50%, rgba(255,255,255,.55) 50%); }
    .h3d-script { flex:1; min-height:0; width:100%; box-sizing:border-box; overflow:auto; border:0; border-radius:0;
      background:#111; color:#eee; font:14px/1.55 inherit; padding:10px; white-space:pre-wrap; }
    .h3d-script:focus { outline:none; }
    .h3d-inline { flex:0 0 auto; height:168px; min-height:168px; border:1px solid rgba(255,255,255,.14); border-radius:12px; background:#101010; }
    .h3d-chip { display:inline-flex; align-items:center; gap:4px; vertical-align:middle; margin:0 2px; padding:2px 6px 2px 2px;
      border-radius:8px; background:#1c1c1c; border:1px solid rgba(255,255,255,.2); user-select:all; }
    .h3d-chip img, .h3d-chip video, .h3d-chip .h3d-note { width:28px; height:28px; border-radius:6px; object-fit:cover; flex:0 0 auto; }
    .h3d-chip .h3d-note svg { width:16px; height:16px; }
    .h3d-chip b { font-size:12px; font-weight:650; color:#eee; }
    .h3d-card .h3d-note { width:42px; height:42px; border-radius:8px; background:transparent; }
  `;
  document.head.appendChild(style);
}

function widget(node, name) {
  return (node?.widgets || []).find((item) => item?.name === name);
}

function promptWidget(node) {
  return widget(node, "提示词") || widget(node, "prompt_raw");
}

function hideWidget(item) {
  if (!item) return;
  try { item.hidden = true; } catch (_) {}
  if (item.type !== "converted-widget") {
    if (!item.__h3OrigType) item.__h3OrigType = item.type;
    item.type = "converted-widget";
  }
  try { item.hidden = true; } catch (_) {}
  if (item.options) {
    try { item.options.hidden = true; } catch (_) {}
  }
  item.computeSize = () => [0, -4];
  item.computeLayoutSize = () => ({ minHeight: 0, maxHeight: 0, minWidth: 0 });
  item.serialize = true;
  if (typeof item.draw === "function") item.draw = function () {};
  for (const el of [item.element, item.inputEl]) {
    if (!el?.style) continue;
    el.style.setProperty("display", "none", "important");
    el.hidden = true;
  }
}

function hideAll(node) {
  for (const name of HIDDEN) hideWidget(widget(node, name));
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

function dropTopButtons(node) {
  for (const name of ["上传参考图", "上传参考视频", "上传参考音频", "复制当前提示词"]) {
    const item = widget(node, name);
    if (item) node.removeWidget?.(item);
  }
}

function setSilent(node, name, value) {
  const item = widget(node, name);
  if (!item || item.value === value) return;
  item.value = value;
}

function readList(node, name) {
  try {
    const data = JSON.parse(String(widget(node, name)?.value || "[]"));
    return Array.isArray(data) ? data : [];
  } catch (_) {
    return [];
  }
}

function writeList(node, name, items) {
  setSilent(node, name, JSON.stringify(items));
}

function pyRound(value) {
  const floor = Math.floor(value);
  const diff = value - floor;
  if (Math.abs(diff - 0.5) > 1e-9) return Math.round(value);
  return floor % 2 === 0 ? floor : floor + 1;
}

function canvasSize(aspect, megapixels, multiple) {
  const table = { "16:9": [16, 9], "9:16": [9, 16], "1:1": [1, 1], "4:3": [4, 3], "3:4": [3, 4], "21:9": [21, 9] };
  const pair = table[aspect] || [9, 16];
  const mp = Math.min(16, Math.max(0.1, Number(megapixels) || 1));
  const step = Math.min(128, Math.max(1, Math.round(Number(multiple) || 32)));
  const scale = Math.sqrt((mp * 1024 * 1024) / (pair[0] * pair[1]));
  const snap = (value) => Math.max(step, pyRound(value / step) * step);
  return [snap(pair[0] * scale), snap(pair[1] * scale)];
}

function frameCount(seconds) {
  const value = Math.min(30, Math.max(1, Number(seconds) || 5));
  let count = Math.max(5, pyRound(value * 24));
  const extra = (((5 - (count % 17)) % 17) + 17) % 17;
  return count + extra;
}

function renderTags(text) {
  return String(text || "")
    .replace(/[＜〈]/g, "<")
    .replace(/[＞〉]/g, ">")
    .replace(/\{\{img:(\d+)\}\}/gi, (_, n) => `<Picture ${Number(n)}>`)
    .replace(/\{\{vid:(\d+)\}\}/gi, (_, n) => `<Video ${Number(n)}>`)
    .replace(/\{\{aud:(\d+)\}\}/gi, (_, n) => `<Audio ${Number(n)}>`)
    .replace(/@图片\s*(\d+)/g, (_, n) => `<Picture ${Number(n)}>`)
    .replace(/@图\s*(\d+)/g, (_, n) => `<Picture ${Number(n)}>`)
    .replace(/@视频\s*(\d+)/g, (_, n) => `<Video ${Number(n)}>`)
    .replace(/@音频\s*(\d+)/g, (_, n) => `<Audio ${Number(n)}>`);
}

function viewUrl(item) {
  const params = new URLSearchParams({
    filename: item.filename || "",
    type: item.type || "input",
    subfolder: item.subfolder || "",
    rand: String(Math.random()),
  });
  return api.apiURL(`/view?${params.toString()}`);
}

function uploadName(file, fallback) {
  const match = String(file?.name || "").match(/(\.[A-Za-z0-9]{1,8})$/);
  const ext = match ? match[1].toLowerCase() : fallback;
  return `h3d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}${ext}`;
}

async function uploadFile(file, fallbackExt) {
  const body = new FormData();
  body.append("image", file, uploadName(file, fallbackExt));
  body.append("overwrite", "true");
  body.append("type", "input");
  body.append("subfolder", "feimao_h3");
  const resp = await api.fetchApi("/upload/image", { method: "POST", body });
  if (!resp.ok) throw new Error((await resp.text()) || `上传失败 ${resp.status}`);
  const data = await resp.json();
  if (!data?.name) throw new Error("上传没有返回文件名");
  return {
    filename: String(data.name),
    subfolder: data.subfolder || "feimao_h3",
    type: data.type || "input",
    name: String(file.name || data.name).replace(/\.[^.]+$/, ""),
  };
}

function isSettings(node) {
  return !!node && (node.comfyClass === SETTINGS_CLASS || node.type === SETTINGS_CLASS);
}

function settingsNode(node) {
  const graph = app.graph;
  if (!graph || !node) return null;
  for (const output of node.outputs || []) {
    for (const linkId of output.links || []) {
      const link = graph.links?.[linkId];
      const target = graph.getNodeById?.(link?.target_id);
      if (isSettings(target)) return target;
    }
  }
  return (graph.nodes || []).find((item) => isSettings(item)) || null;
}

function setting(node, name) {
  return widget(settingsNode(node) || node, name);
}

function currentMode(node) {
  const value = setting(node, "模式")?.value;
  return GEN_MODES.includes(value) ? value : "多参";
}

function slotLimit(node, key) {
  const mode = currentMode(node);
  if (mode === "文生") return 0;
  if (key !== "images_json" && mode !== "多参") return 0;
  if (key === "images_json" && mode === "图生") return 1;
  if (key === "images_json" && mode === "首尾帧") return 2;
  return LIMITS[key];
}

function mediaBadge(node, kind, index) {
  const mode = currentMode(node);
  if (kind === "image" && mode === "图生") return "首帧";
  if (kind === "image" && mode === "首尾帧") return index === 0 ? "首帧" : index === 1 ? "尾帧" : String(index + 1);
  if (kind === "video") return `视频${index + 1}`;
  if (kind === "audio") return `音频${index + 1}`;
  return String(index + 1);
}

function refreshStatus(node) {
  if (!node.__h3Status) return;
  const mode = currentMode(node);
  const host = settingsNode(node);
  const aspect = widget(host, "宽高比")?.value || "9:16";
  const megapixels = widget(host, "百万像素")?.value ?? 1;
  const multiple = widget(host, "对齐倍数")?.value ?? 32;
  const seconds = widget(host, "秒数")?.value ?? 5;
  const [width, height] = canvasSize(aspect, megapixels, multiple);
  const images = readList(node, "images_json").length;
  const videos = readList(node, "videos_json").length;
  const audios = readList(node, "audios_json").length;
  let usage = `参考图 ${images}/9，视频 ${videos}/3（每段拆成画面+原声），独立音频 ${audios}/3`;
  if (mode === "文生") usage = "只用提示词。参考图、视频、音频这次不进模型";
  else if (mode === "图生") usage = `第 1 张作首帧，当前 ${images} 张。视频和音频不进模型`;
  else if (mode === "首尾帧") usage = `第 1 张首帧，第 2 张尾帧，当前 ${images} 张。视频和音频不进模型`;
  const lead = host ? "" : "把「素材」接到 H3导演设置后，这里的参数才会跟着那边走。\n";
  node.__h3Status.textContent = `${lead}${mode} · ${aspect}，${megapixels} 百万像素，对齐 ${multiple} → ${width}×${height}，${seconds} 秒 → ${frameCount(seconds)} 帧\n${usage}`;
}

function imageSlots(node) {
  const limit = slotLimit(node, "images_json");
  if (limit <= 3) return limit;
  const asked = node.__h3ImageShown || 3;
  return Math.min(limit, Math.max(3, asked));
}

function revealImages(node) {
  const count = readList(node, "images_json").length;
  if (count > (node.__h3ImageShown || 3)) node.__h3ImageShown = count;
}

function panelHeight(node) {
  const mode = currentMode(node);
  const story = 572 + (node.__h3ReverseEditing ? 168 : 0);
  if (mode === "文生") return story;
  const imageRows = Math.max(1, Math.ceil((mode === "多参" ? imageSlots(node) : slotLimit(node, "images_json")) / 3));
  let media = 48 + imageRows * 128 + 36;
  if (mode === "多参") media += 2 * 156;
  return Math.max(story, media);
}

function ensureWide(node) {
  if (node.properties?.h3_columns) return;
  if (!node.properties) node.properties = {};
  node.properties.h3_columns = true;
  const width = Math.max(760, node.size?.[0] || 0);
  if (node.size?.[0] >= 760) return;
  if (typeof node.setSize === "function") node.setSize([width, node.size?.[1] || node.__h3Tall || 640]);
  else if (node.size) node.size[0] = width;
}

function applyMode(node) {
  watchSize(node);
  const mode = currentMode(node);
  const showImages = mode !== "文生";
  const showRefs = mode === "多参";
  if (node.__h3ImageLabel) node.__h3ImageLabel.textContent = mode === "图生" ? "首帧" : mode === "首尾帧" ? "首帧 / 尾帧" : "参考图片";
  if (node.__h3ImageBlock) node.__h3ImageBlock.style.display = showImages ? "" : "none";
  if (node.__h3VideoBlock) node.__h3VideoBlock.style.display = showRefs ? "" : "none";
  if (node.__h3AudioBlock) node.__h3AudioBlock.style.display = showRefs ? "" : "none";
  if (node.__h3Media) node.__h3Media.style.display = showImages ? "flex" : "none";
  if (node.__h3Cols) node.__h3Cols.classList.toggle("single", !showImages);
  node.__h3Tall = panelHeight(node);
  ensureWide(node);
  if (showImages && node.__h3Images) bindMedia(node, "images_json", node.__h3Images, "image");
  if (showRefs && node.__h3Videos) bindMedia(node, "videos_json", node.__h3Videos, "video");
  if (showRefs && node.__h3Audios) bindMedia(node, "audios_json", node.__h3Audios, "audio");
  refreshStatus(node);
  const panel = node.__h3Status?.parentElement;
  if (panel) panel.style.setProperty("--comfy-widget-min-height", `${node.__h3Tall || 280}px`);
  node.setDirtyCanvas?.(true, true);
}

function watchSize(node) {
  const host = settingsNode(node);
  if (!host) return;
  for (const name of ["宽高比", "百万像素", "对齐倍数", "秒数", "模式"]) {
    const item = widget(host, name);
    if (!item) continue;
    item.__h3Boards = item.__h3Boards || new Set();
    item.__h3Boards.add(node);
    if (item.__h3BoardHook) continue;
    item.__h3BoardHook = true;
    const previous = item.callback;
    item.callback = function () {
      const result = previous?.apply(this, arguments);
      for (const board of item.__h3Boards) {
        if (name === "模式") applyMode(board);
        else refreshStatus(board);
      }
      if (name === "模式") syncLoaderMode();
      return result;
    };
  }
}

function matchVision(modelName, options) {
  const low = String(modelName || "").toLowerCase();
  const list = (options || []).map((item) => String(item));
  for (const key of ["3.8", "3.6", "3.5", "qwen3"]) {
    if (!low.includes(key)) continue;
    const hit = list.find((item) => item.toLowerCase().includes(key) && !item.startsWith("（"));
    if (hit) return hit;
  }
  return list.find((item) => item && !item.startsWith("（")) || "";
}

function watchReverseModels(node) {
  const model = widget(node, "反推模型");
  const vision = widget(node, "视觉模型");
  if (!model || !vision) return;
  const options = vision.options?.values || [];
  if (!vision.value || !options.includes(vision.value)) {
    const next = matchVision(model.value, options);
    if (next) vision.value = next;
  }
  if (model.__h3VisionHook) return;
  model.__h3VisionHook = true;
  const previous = model.callback;
  model.callback = function () {
    const result = previous?.apply(this, arguments);
    const values = vision.options?.values || [];
    const next = matchVision(model.value, values);
    if (next) vision.value = next;
    return result;
  };
}

function slimSettings(node) {
  if (!isSettings(node)) return;
  for (const name of HIDDEN) hideWidget(widget(node, name));
  watchReverseModels(node);
  ensureDisplay(node);
  syncLoaderMode();
  if (node.properties?.h3_slim_size) return;
  if ((node.size?.[1] || 0) <= 520 || typeof node.setSize !== "function") return;
  node.properties = node.properties || {};
  node.properties.h3_slim_size = true;
  node.setSize([Math.min(Math.max(node.size?.[0] || 420, 360), 460), 420]);
}

function audioMark() {
  const mark = document.createElement("div");
  mark.className = "h3d-note";
  mark.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#8dffb8" d="M9 18a3 3 0 1 1-2-2.83V6.2l10-2v9.97a3 3 0 1 1-2-2.83V7.1l-6 1.2V18z"/></svg>`;
  return mark;
}

function closePreview() {
  const box = document.getElementById("h3d-lightbox");
  if (!box) return;
  for (const media of box.querySelectorAll("audio, video")) {
    media.pause();
    try { media.currentTime = 0; } catch (_) {}
  }
  box.classList.add("hidden");
}

function placePreviewClose(box) {
  const close = box.querySelector(".h3d-light-x");
  const media = box.querySelector("img, video, audio");
  if (!close || !media) return;
  const mediaRect = media.getBoundingClientRect();
  const boxRect = box.getBoundingClientRect();
  if (mediaRect.width < 8 || mediaRect.height < 8) return;
  const gap = 8;
  const width = close.offsetWidth || 64;
  const height = close.offsetHeight || 32;
  let top = mediaRect.top - boxRect.top - height - gap;
  let left = mediaRect.right - boxRect.left - width;
  if (top < gap) top = mediaRect.top - boxRect.top + gap;
  if (left < gap) left = gap;
  const maxLeft = boxRect.width - width - gap;
  if (left > maxLeft) left = maxLeft;
  close.style.top = `${Math.round(top)}px`;
  close.style.left = `${Math.round(left)}px`;
}

function openPreview(item, kind) {
  let box = document.getElementById("h3d-lightbox");
  if (!box) {
    box = document.createElement("div");
    box.id = "h3d-lightbox";
    box.className = "h3d-light hidden";
    box.addEventListener("click", () => closePreview());
    document.body.appendChild(box);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePreview();
    });
    window.addEventListener("resize", () => {
      if (!box.classList.contains("hidden")) placePreviewClose(box);
    });
  }
  box.replaceChildren();
  const close = document.createElement("button");
  close.type = "button";
  close.className = "h3d-light-x";
  close.textContent = "关闭";
  close.addEventListener("click", (event) => {
    event.stopPropagation();
    closePreview();
  });
  box.appendChild(close);
  const media = document.createElement(kind === "audio" ? "audio" : kind === "video" ? "video" : "img");
  if (kind === "video" || kind === "audio") {
    media.controls = true;
    media.autoplay = true;
    media.addEventListener("click", (event) => event.stopPropagation());
  } else {
    media.alt = item.name || "";
  }
  media.src = viewUrl(item);
  const place = () => placePreviewClose(box);
  media.addEventListener("load", place);
  media.addEventListener("loadedmetadata", place);
  box.appendChild(media);
  box.classList.remove("hidden");
  requestAnimationFrame(place);
  setTimeout(place, 60);
}

function tagWord(kind) {
  if (kind === "video") return "Video";
  if (kind === "audio") return "Audio";
  return "Picture";
}

function listKey(kind) {
  if (kind === "video" || kind === "Video") return "videos_json";
  if (kind === "audio" || kind === "Audio") return "audios_json";
  return "images_json";
}

function mediaKind(word) {
  if (word === "Video") return "video";
  if (word === "Audio") return "audio";
  return "image";
}

function setPromptText(node, text) {
  const item = promptWidget(node);
  if (!item || item.value === text) return;
  item.value = text;
}

function rewritePrompt(node, kind, map) {
  const word = tagWord(kind);
  const text = String(promptWidget(node)?.value || "");
  const next = text.replace(new RegExp(`<${word}\\s+(\\d+)\\s*>`, "gi"), (all, number) => {
    const mapped = map[Number(number)];
    return mapped == null ? "" : `<${word} ${mapped}>`;
  });
  setPromptText(node, next);
  paintScript(node);
}

function moveMap(length, from, to) {
  const order = Array.from({ length }, (_, index) => index);
  const [moved] = order.splice(from, 1);
  order.splice(to, 0, moved);
  const map = {};
  order.forEach((oldIndex, newIndex) => { map[oldIndex + 1] = newIndex + 1; });
  return map;
}

function removalMap(length, index) {
  const map = {};
  for (let number = 1; number <= length; number += 1) {
    if (number === index + 1) map[number] = null;
    else if (number > index + 1) map[number] = number - 1;
    else map[number] = number;
  }
  return map;
}

function serializeScript(editor) {
  const parts = [];
  const push = (node, block) => {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.data.replace(/\u00a0/g, " "));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.dataset?.tag) {
      parts.push(node.dataset.tag);
      return;
    }
    if (node.tagName === "BR") {
      parts.push("\n");
      return;
    }
    const blocked = node.tagName === "DIV" || node.tagName === "P";
    if (blocked && block && parts.length && !String(parts[parts.length - 1] || "").endsWith("\n")) parts.push("\n");
    for (const child of node.childNodes) push(child, false);
  };
  for (const child of editor.childNodes) push(child, true);
  return parts.join("").replace(/^\n/, "").replace(/\n$/, "");
}

function caretBox(editor) {
  const fallback = editor.getBoundingClientRect();
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor.contains(selection.anchorNode)) return fallback;
  const range = selection.getRangeAt(0).cloneRange();
  range.collapse(false);
  const rects = range.getClientRects();
  const live = rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
  if (live && live.height) return live;
  const probe = document.createElement("span");
  probe.textContent = "\u200b";
  editor.__h3Mute = true;
  range.insertNode(probe);
  const box = probe.getBoundingClientRect();
  probe.remove();
  editor.normalize();
  selection.removeAllRanges();
  selection.addRange(range);
  editor.__h3Mute = false;
  return box.height ? box : fallback;
}

function selectionInside(editor, selection) {
  const node = selection?.anchorNode;
  return !!node && (node === editor || editor.contains(node));
}

function offsetIndex(editor, container, offset) {
  const probe = document.createRange();
  probe.selectNodeContents(editor);
  probe.setEnd(container, offset);
  const box = document.createElement("div");
  box.appendChild(probe.cloneContents());
  return serializeScript(box).length;
}

function caretIndex(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selectionInside(editor, selection)) return serializeScript(editor).length;
  const range = selection.getRangeAt(0);
  return offsetIndex(editor, range.endContainer, range.endOffset);
}

function selectionSpan(editor) {
  const full = serializeScript(editor).length;
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selectionInside(editor, selection)) return { start: full, end: full };
  const range = selection.getRangeAt(0);
  const end = offsetIndex(editor, range.endContainer, range.endOffset);
  if (range.collapsed) return { start: end, end };
  const start = offsetIndex(editor, range.startContainer, range.startOffset);
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

function placeCaret(editor, index) {
  let left = Math.max(0, index);
  const range = document.createRange();
  let placed = false;
  const walk = (node) => {
    if (placed) return;
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.data.length >= left) {
        range.setStart(node, left);
        range.collapse(true);
        placed = true;
        return;
      }
      left -= node.data.length;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.dataset?.tag) {
      if (node.dataset.tag.length >= left) {
        range.setStartAfter(node);
        range.collapse(true);
        placed = true;
        return;
      }
      left -= node.dataset.tag.length;
      return;
    }
    if (node.tagName === "BR") {
      left -= 1;
      if (left <= 0) {
        range.setStartAfter(node);
        range.collapse(true);
        placed = true;
      }
      return;
    }
    for (const child of node.childNodes) walk(child);
  };
  for (const child of editor.childNodes) walk(child);
  if (!placed) {
    range.selectNodeContents(editor);
    range.collapse(false);
  }
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function labelHost(node) {
  if (isSettings(node)) return node;
  return settingsNode(node) || node;
}

function chipLabelMode(node) {
  const host = labelHost(node);
  if (host !== node && host.properties?.h3_chip_label == null && node.properties?.h3_chip_label) {
    host.properties = host.properties || {};
    host.properties.h3_chip_label = node.properties.h3_chip_label;
  }
  return host.properties?.h3_chip_label === "tag" ? "tag" : "name";
}

function canonicalWord(word) {
  const lower = String(word || "").toLowerCase();
  if (lower === "video") return "Video";
  if (lower === "audio") return "Audio";
  return "Picture";
}

function resourceTag(word, number) {
  return `<${canonicalWord(word)} ${number}>`;
}

function originalName(kind, number, item) {
  return item?.name || item?.filename || (kind === "image" ? `图${number}` : kind === "video" ? `视频${number}` : `音频${number}`);
}

function chipCaption(node, word, number, item, kind) {
  const tag = resourceTag(word, number);
  return chipLabelMode(node) === "tag" ? tag : originalName(kind, number, item);
}

function setChipLabelMode(node, mode) {
  const host = labelHost(node);
  host.properties = host.properties || {};
  host.properties.h3_chip_label = mode === "tag" ? "tag" : "name";
  const shown = host.properties.h3_chip_label === "tag" ? "标签" : "原名";
  const item = host.__h3Display;
  if (item && item.value !== shown) item.value = shown;
  const boards = (app.graph?.nodes || []).filter((item) => isBoard(item));
  for (const board of (boards.length ? boards : [node])) {
    const editor = activeEditor(board);
    const caret = editor ? caretIndex(editor) : null;
    paintScript(board, caret);
  }
}

function ensureDisplay(node) {
  const host = labelHost(node);
  if (!isSettings(host)) return;
  if (node !== host) {
    const stray = widget(node, "显示");
    if (stray) node.removeWidget?.(stray);
  }
  const shown = chipLabelMode(host) === "tag" ? "标签" : "原名";
  let item = widget(host, "显示");
  if (!item) {
    item = host.addWidget("combo", "显示", shown, (value) => {
      setChipLabelMode(host, value === "标签" ? "tag" : "name");
    }, { values: ["原名", "标签"] });
  }
  item.serialize = false;
  item.value = shown;
  item.options = item.options || {};
  item.options.values = ["原名", "标签"];
  host.__h3Display = item;
  host.__h3PaintChipSwitch = () => {
    const next = chipLabelMode(host) === "tag" ? "标签" : "原名";
    if (item.value !== next) item.value = next;
  };
}

function syncLoaderMode() {
  const settings = (app.graph?.nodes || []).find((item) => isSettings(item));
  const multi = String(widget(settings, "模式")?.value || "多参") === "多参";
  const graph = app.graph;
  if (!graph) return;
  for (const current of graph.nodes || []) {
    if (current?.comfyClass !== "FeimaoH3Loader" && current?.type !== "FeimaoH3Loader") continue;
    const input = (current.inputs || []).find((item) => item?.name === "走多参");
    if (input?.link != null && typeof graph.removeLink === "function") {
      try { graph.removeLink(input.link); } catch (_) {}
      input.link = null;
    }
    const flag = widget(current, "走多参");
    if (!flag) continue;
    flag.value = multi;
    hideWidget(flag);
  }
}

function chipFor(node, word, number) {
  const kind = mediaKind(word);
  const item = readList(node, listKey(kind))[number - 1];
  const tag = resourceTag(word, number);
  const chip = document.createElement("span");
  chip.className = "h3d-chip";
  chip.contentEditable = "false";
  chip.dataset.tag = tag;
  chip.title = chipLabelMode(node) === "tag" ? originalName(kind, number, item) : tag;
  if (item && kind === "video") {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = viewUrl(item);
    chip.appendChild(video);
  } else if (item && kind === "image") {
    const img = document.createElement("img");
    img.alt = "";
    img.src = viewUrl(item);
    chip.appendChild(img);
  } else if (kind === "audio") {
    chip.appendChild(audioMark());
  }
  const name = document.createElement("b");
  name.textContent = chipCaption(node, word, number, item, kind);
  chip.appendChild(name);
  return chip;
}

function scriptEditors(node) {
  return [node.__h3Inline, node.__h3Script].filter(Boolean);
}

function activeEditor(node) {
  const editors = scriptEditors(node);
  if (editors.includes(document.activeElement)) return document.activeElement;
  if (editors.includes(node.__h3Active)) return node.__h3Active;
  return node.__h3Inline || node.__h3Script || null;
}

function paintInto(node, editor, caret) {
  if (!editor) return;
  editor.__h3Mute = true;
  const text = String(promptWidget(node)?.value || "");
  editor.replaceChildren();
  const bits = text.split(/(<Picture\s+\d+\s*>|<Video\s+\d+\s*>|<Audio\s+\d+\s*>)/gi);
  for (const bit of bits) {
    if (!bit) continue;
    const match = bit.match(/^<(Picture|Video|Audio)\s+(\d+)\s*>$/i);
    if (match) editor.appendChild(chipFor(node, match[1], Number(match[2])));
    else editor.appendChild(document.createTextNode(bit));
  }
  if (caret != null) placeCaret(editor, caret);
  editor.__h3Mute = false;
}

function paintScript(node, caret) {
  const editors = scriptEditors(node);
  const focus = editors.includes(document.activeElement) ? document.activeElement : (editors.includes(node.__h3Active) ? node.__h3Active : null);
  for (const editor of editors) paintInto(node, editor, editor === focus ? caret : null);
}

function syncScript(node, editor) {
  const source = editor || activeEditor(node);
  if (!source) return String(promptWidget(node)?.value || "");
  const text = serializeScript(source);
  setPromptText(node, text);
  for (const other of scriptEditors(node)) {
    if (other === source) continue;
    paintInto(node, other, null);
  }
  return text;
}

function playMark() {
  const mark = document.createElement("div");
  mark.className = "h3d-ico";
  mark.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="15" fill="none" stroke="#9a9a9a" stroke-width="1.6"/><path fill="#d0d0d0" d="M20 16.5v15l13-7.5z"/></svg>`;
  return mark;
}

function slotTitle(node, kind, index) {
  const mode = currentMode(node);
  if (kind === "image" && mode === "图生") return "首帧";
  if (kind === "image" && mode === "首尾帧") return index === 0 ? "首帧" : "尾帧";
  if (kind === "video") return `视频${index + 1}`;
  if (kind === "audio") return `音频${index + 1}`;
  return `图片${index + 1}`;
}

function bindMedia(node, key, root, kind) {
  root.replaceChildren();
  const items = readList(node, key);
  const limit = slotLimit(node, key);
  const shown = kind === "image" ? imageSlots(node) : limit;
  if (root.__h3Count) root.__h3Count.textContent = limit ? `已选有 ${items.length}/${limit}` : "";
  for (let index = 0; index < shown; index += 1) {
    const item = items[index];
    const card = document.createElement("div");
    card.className = item ? "h3d-card filled" : "h3d-card";
    card.dataset.index = String(index);
    card.dataset.filled = item ? "1" : "0";
    const title = slotTitle(node, kind, index);
    card.addEventListener("pointerdown", (event) => event.stopPropagation());
    if (!item) {
      if (kind === "video") card.appendChild(playMark());
      else if (kind === "audio") card.appendChild(audioMark());
      const name = document.createElement("div");
      name.textContent = title;
      card.appendChild(name);
      if (kind !== "image") {
        const hint = document.createElement("div");
        hint.className = "h3d-hint";
        hint.textContent = "点击选择/上传";
        card.appendChild(hint);
      }
      card.addEventListener("click", (event) => {
        event.stopPropagation();
        pickFiles(node, key, kind, root);
      });
      root.appendChild(card);
      continue;
    }
    card.title = "双击查看，拖动可调整顺序";
    card.addEventListener("dblclick", (event) => {
      if (card.dataset.dragged === "1") return;
      event.preventDefault();
      event.stopPropagation();
      openPreview(item, kind);
    });
    card.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest(".h3d-x")) return;
      event.preventDefault();
      event.stopPropagation();
      const originX = event.clientX;
      const originY = event.clientY;
      let dragging = false;
      let target = index;
      const clearDrop = () => root.querySelectorAll(".h3d-card.drop").forEach((el) => el.classList.remove("drop"));
      const move = (ev) => {
        if (!dragging && Math.hypot(ev.clientX - originX, ev.clientY - originY) < 5) return;
        dragging = true;
        card.dataset.dragged = "1";
        card.classList.add("dragging");
        card.style.pointerEvents = "none";
        const under = document.elementFromPoint(ev.clientX, ev.clientY)?.closest(".h3d-card");
        card.style.pointerEvents = "";
        clearDrop();
        if (!under || under.parentElement !== root || under === card || under.dataset.filled !== "1") return;
        under.classList.add("drop");
        const hit = Number(under.dataset.index);
        const rect = under.getBoundingClientRect();
        let insertAt = ev.clientX > rect.left + rect.width / 2 ? hit + 1 : hit;
        if (insertAt > index) insertAt -= 1;
        target = Math.max(0, Math.min(items.length - 1, insertAt));
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        card.classList.remove("dragging");
        card.style.pointerEvents = "";
        clearDrop();
        if (dragging && target !== index) {
          const next = readList(node, key);
          const [moved] = next.splice(index, 1);
          next.splice(target, 0, moved);
          writeList(node, key, next);
          rewritePrompt(node, kind, moveMap(items.length, index, target));
          bindMedia(node, key, root, kind);
          refreshStatus(node);
        }
        setTimeout(() => { card.dataset.dragged = "0"; }, 300);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
    if (kind === "audio") card.appendChild(audioMark());
    else if (kind === "video") {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.src = viewUrl(item);
      card.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.alt = "";
      img.src = viewUrl(item);
      card.appendChild(img);
    }
    const order = document.createElement("div");
    order.className = "h3d-ord";
    order.textContent = String(index + 1);
    const cap = document.createElement("div");
    cap.className = "h3d-cap";
    cap.textContent = item.name || item.filename || title;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "h3d-x";
    remove.textContent = "×";
    remove.addEventListener("pointerdown", (event) => event.stopPropagation());
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      const next = readList(node, key);
      next.splice(index, 1);
      writeList(node, key, next);
      rewritePrompt(node, kind, removalMap(items.length, index));
      bindMedia(node, key, root, kind);
      refreshStatus(node);
    });
    card.append(order, cap, remove);
    root.appendChild(card);
  }
  const host = root.parentElement;
  host?.querySelector(":scope > .h3d-more-row")?.remove();
  if (kind === "image" && limit > 0) ensureImportRow(node, key, root, kind);
  if (kind !== "image" || limit <= 3) return;
  const row = document.createElement("div");
  row.className = "h3d-more-row";
  const addButton = (label, nextShown) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "h3d-more";
    button.textContent = label;
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      node.__h3ImageShown = nextShown;
      applyMode(node);
    });
    row.appendChild(button);
  };
  if (shown > 3) addButton("收起", 3);
  if (shown < limit) addButton(`展开更多 (+${Math.min(3, limit - shown)})`, Math.min(limit, shown + 3));
  if (row.childElementCount) host?.appendChild(row);
}

function pickFiles(node, key, kind, root) {
  const room = slotLimit(node, key) - readList(node, key).length;
  if (room <= 0) return;
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = kind === "video" ? "video/*" : kind === "audio" ? "audio/*,.mp3,.wav,.m4a,.flac,.ogg" : "image/*";
  input.style.display = "none";
  document.body.appendChild(input);
  input.onchange = async () => {
    const files = Array.from(input.files || []).slice(0, room);
    input.remove();
    const fallback = kind === "video" ? ".mp4" : kind === "audio" ? ".wav" : ".png";
    const next = readList(node, key);
    for (const file of files) {
      try {
        next.push(await uploadFile(file, fallback));
      } catch (err) {
        if (node.__h3Status) node.__h3Status.textContent = `上传失败：${err?.message || err}`;
        break;
      }
    }
    writeList(node, key, next);
    if (kind === "image") revealImages(node);
    applyMode(node);
  };
  input.addEventListener("cancel", () => input.remove());
  input.click();
}

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i;
const library = document.createElement("div");
library.className = "h3d-lib hidden";
document.body.appendChild(library);
let libraryTarget = null;

function sameMedia(left, right) {
  return String(left?.filename || "") === String(right?.filename || "")
    && String(left?.subfolder || "") === String(right?.subfolder || "")
    && String(left?.type || "input") === String(right?.type || "input");
}

function libraryLabel(item) {
  const folder = item.subfolder ? `${item.subfolder}/` : "";
  return `${folder}${item.name || item.filename || ""}`;
}

function parseListedFile(raw, folder) {
  const text = String(raw || "");
  const marked = text.match(/^(.*) \[(input|output|temp)\]$/);
  const filename = (marked ? marked[1] : text).replace(/\\/g, "/");
  const slash = filename.lastIndexOf("/");
  const base = slash >= 0 ? filename.slice(slash + 1) : filename;
  return {
    filename: base,
    subfolder: slash >= 0 ? filename.slice(0, slash) : "",
    type: marked ? marked[2] : folder,
    name: base.replace(/\.[^.]+$/, ""),
  };
}

async function loadLibrary(folder) {
  const own = await api.fetchApi(`/feimao-h3/library?folder=${encodeURIComponent(folder)}`);
  if (own.ok) {
    const data = await own.json();
    return Array.isArray(data) ? data : [];
  }
  const resp = await api.fetchApi(`/internal/files/${folder}`);
  if (!resp.ok) throw new Error("读不到这个文件夹");
  const names = await resp.json();
  return (Array.isArray(names) ? names : [])
    .map((item) => parseListedFile(item, folder))
    .filter((item) => IMAGE_EXT.test(item.filename));
}

function closeLibrary() {
  library.classList.add("hidden");
  libraryTarget = null;
}

function libraryTaken(target, item) {
  return readList(target.node, target.key).some((current) => sameMedia(current, item));
}

function toggleLibraryPick(index) {
  const target = libraryTarget;
  const item = target?.items?.[index];
  if (!target || !item || libraryTaken(target, item)) return;
  if (!target.picks) target.picks = new Set();
  if (!target.multi) {
    target.picks = new Set(target.picks.has(index) ? [] : [index]);
  } else if (target.picks.has(index)) {
    target.picks.delete(index);
  } else {
    target.picks.add(index);
  }
  paintLibrary();
}

function confirmLibrary() {
  const target = libraryTarget;
  if (!target) return;
  const { node, kind } = target;
  const limit = slotLimit(node, target.key);
  const next = readList(node, target.key);
  let added = 0;
  let skipped = 0;
  for (const index of target.picks || []) {
    const item = target.items[index];
    if (!item?.filename || next.some((current) => sameMedia(current, item))) continue;
    if (next.length >= limit) {
      skipped += 1;
      continue;
    }
    next.push({
      filename: item.filename,
      subfolder: item.subfolder || "",
      type: item.type || "input",
      name: item.name || String(item.filename).replace(/\.[^.]+$/, ""),
    });
    added += 1;
  }
  target.picks = new Set();
  writeList(node, target.key, next);
  if (kind === "image") revealImages(node);
  applyMode(node);
  if (node.__h3Status) {
    node.__h3Status.textContent = skipped
      ? `已导入 ${added} 张，还有 ${skipped} 张超出上限`
      : (added ? `已导入 ${added} 张` : "没有新的图片要导入");
  }
  closeLibrary();
}

const LIBRARY_PAGE = 48;

function filteredLibrary(target) {
  const query = String(target?.query || "").trim().toLowerCase();
  const items = target?.items || [];
  const pairs = items.map((item, index) => ({ item, index }));
  if (!query) return pairs;
  return pairs.filter(({ item }) => libraryLabel(item).toLowerCase().includes(query));
}

function renderLibraryGrid() {
  const target = libraryTarget;
  const grid = library.querySelector(".h3d-lib-grid");
  const note = library.querySelector(".h3d-lib-note");
  const more = library.querySelector(".h3d-lib-more");
  if (!target || !grid) return;
  const matched = filteredLibrary(target);
  const count = Math.min(matched.length, target.shown || LIBRARY_PAGE);
  const shown = matched.slice(0, count);
  const chosen = readList(target.node, target.key);
  grid.replaceChildren();
  for (const { item, index } of shown) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "h3d-lib-item";
    button.dataset.index = String(index);
    if (chosen.some((current) => sameMedia(current, item))) button.classList.add("on");
    if (target.picks?.has(index)) button.classList.add("pick");
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.src = viewUrl(item);
    const caption = document.createElement("span");
    caption.textContent = libraryLabel(item);
    button.title = libraryLabel(item);
    button.append(img, caption);
    button.addEventListener("click", () => toggleLibraryPick(index));
    grid.appendChild(button);
  }
  if (note) {
    const modeText = target.multi ? "多选" : "单选";
    note.textContent = target.items.length
      ? (matched.length ? `共 ${matched.length} 张，当前显示 ${shown.length} 张。当前是${modeText}，选好后点确认导入。` : "没有匹配的图片。")
      : "这个文件夹里还没有图片。";
  }
  const ok = library.querySelector(".h3d-lib-ok");
  if (ok) {
    const count = [...(target.picks || [])].filter((index) => {
      const item = target.items[index];
      return item && !libraryTaken(target, item);
    }).length;
    ok.disabled = count === 0;
    ok.textContent = count ? `确认导入（${count}）` : "确认导入";
  }
  if (more) {
    const rest = matched.length - shown.length;
    more.hidden = rest <= 0;
    more.textContent = `再显示 ${Math.min(LIBRARY_PAGE, rest)} 张`;
  }
}

function paintLibrary() {
  const target = libraryTarget;
  const grid = library.querySelector(".h3d-lib-grid");
  if (!target || !grid) return;
  const chosen = readList(target.node, target.key);
  for (const button of grid.querySelectorAll(".h3d-lib-item")) {
    const item = target.items[Number(button.dataset.index)];
    const index = Number(button.dataset.index);
    button.classList.toggle("on", item && chosen.some((current) => sameMedia(current, item)));
    button.classList.toggle("pick", !!target.picks?.has(index) && !(item && chosen.some((current) => sameMedia(current, item))));
  }
  const ok = library.querySelector(".h3d-lib-ok");
  if (ok) {
    const count = [...(target.picks || [])].filter((index) => {
      const item = target.items[index];
      return item && !libraryTaken(target, item);
    }).length;
    ok.disabled = count === 0;
    ok.textContent = count ? `确认导入（${count}）` : "确认导入";
  }
}

function ensureImportRow(node, key, root, kind) {
  const host = root.parentElement;
  host?.querySelector(":scope > .h3d-import-row")?.remove();
  const row = document.createElement("div");
  row.className = "h3d-import-row";
  const add = (label, title, folder) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "h3d-import";
    button.textContent = label;
    button.title = title;
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      void openLibrary(node, key, root, kind, folder);
    });
    row.appendChild(button);
  };
  add("从 input 导入", "导入之前加载过的图片", "input");
  add("从 output 导入", "导入自己生成的图片", "output");
  const more = host?.querySelector(":scope > .h3d-more-row");
  if (more) host.insertBefore(row, more);
  else host?.appendChild(row);
}

async function openLibrary(node, key, root, kind, folder) {
  libraryTarget = { node, key, root, kind, folder, items: [], query: "", shown: LIBRARY_PAGE, multi: false, picks: new Set() };
  const title = folder === "output" ? "output 里生成的图片" : "input 里加载过的图片";
  library.replaceChildren();
  const bar = document.createElement("div");
  bar.className = "h3d-lib-bar";
  const heading = document.createElement("b");
  heading.textContent = title;
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "关闭";
  close.addEventListener("click", closeLibrary);
  bar.append(heading, close);
  const search = document.createElement("input");
  search.className = "h3d-lib-search";
  search.type = "search";
  search.placeholder = "按文件名搜索";
  search.addEventListener("pointerdown", (event) => event.stopPropagation());
  search.addEventListener("input", () => {
    if (!libraryTarget) return;
    libraryTarget.query = search.value;
    libraryTarget.shown = LIBRARY_PAGE;
    renderLibraryGrid();
  });
  const note = document.createElement("div");
  note.className = "h3d-lib-note";
  note.textContent = "正在读取…";
  const grid = document.createElement("div");
  grid.className = "h3d-lib-grid";
  const more = document.createElement("button");
  more.type = "button";
  more.className = "h3d-lib-more";
  more.hidden = true;
  more.textContent = "再显示";
  more.addEventListener("click", () => {
    if (!libraryTarget) return;
    libraryTarget.shown = (libraryTarget.shown || LIBRARY_PAGE) + LIBRARY_PAGE;
    renderLibraryGrid();
  });
  const foot = document.createElement("div");
  foot.className = "h3d-lib-foot";
  const modes = document.createElement("div");
  modes.className = "h3d-lib-modes";
  for (const [value, label] of [["one", "单选"], ["many", "多选"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.mode = value;
    button.textContent = label;
    if (value === "one") button.classList.add("on");
    button.addEventListener("click", () => {
      if (!libraryTarget) return;
      libraryTarget.multi = value === "many";
      if (!libraryTarget.multi && libraryTarget.picks.size > 1) {
        libraryTarget.picks = new Set([[...libraryTarget.picks][0]]);
      }
      for (const item of modes.querySelectorAll("button")) item.classList.toggle("on", item.dataset.mode === value);
      paintLibrary();
    });
    modes.appendChild(button);
  }
  const ok = document.createElement("button");
  ok.type = "button";
  ok.className = "h3d-lib-ok";
  ok.disabled = true;
  ok.textContent = "确认导入";
  ok.addEventListener("click", confirmLibrary);
  foot.append(modes, ok);
  library.append(bar, search, note, grid, more, foot);
  library.classList.remove("hidden");
  try {
    const items = await loadLibrary(folder);
    if (libraryTarget?.folder !== folder || libraryTarget?.node !== node) return;
    libraryTarget.items = items;
    libraryTarget.shown = LIBRARY_PAGE;
    renderLibraryGrid();
  } catch (err) {
    note.textContent = err?.message || "读不到这个文件夹";
  }
}

const menu = document.createElement("div");
menu.className = "h3d-menu hidden";
document.body.appendChild(menu);
let menuNode = null;
let menuEditor = null;
let menuAt = -1;
let menuIndex = 0;

function hideMenu() {
  menu.classList.add("hidden");
  menuNode = null;
  menuEditor = null;
  menuAt = -1;
  menuIndex = 0;
}

function menuButtons() {
  return [...menu.querySelectorAll(".h3d-item")];
}

function paintMenuIndex() {
  const buttons = menuButtons();
  if (!buttons.length) {
    menuIndex = 0;
    return;
  }
  menuIndex = Math.max(0, Math.min(menuIndex, buttons.length - 1));
  buttons.forEach((button, index) => button.classList.toggle("on", index === menuIndex));
  buttons[menuIndex]?.scrollIntoView({ block: "nearest" });
}

function moveMenu(step) {
  const buttons = menuButtons();
  if (!buttons.length) return;
  menuIndex = (menuIndex + step + buttons.length) % buttons.length;
  paintMenuIndex();
}

function confirmMenu() {
  const button = menuButtons()[menuIndex];
  const tag = button?.dataset.tag;
  if (menuNode && tag) insertTag(menuNode, tag);
}

function showMenu(node, info, editor) {
  const query = String(info.query || "").toLowerCase();
  const entries = [];
  readList(node, "images_json").forEach((item, index) => entries.push({ tag: `<Picture ${index + 1}>`, label: chipCaption(node, "Picture", index + 1, item, "image"), kind: "image", item }));
  readList(node, "videos_json").forEach((item, index) => entries.push({ tag: `<Video ${index + 1}>`, label: chipCaption(node, "Video", index + 1, item, "video"), kind: "video", item }));
  readList(node, "audios_json").forEach((item, index) => entries.push({ tag: `<Audio ${index + 1}>`, label: chipCaption(node, "Audio", index + 1, item, "audio"), kind: "audio", item }));
  const matched = entries.filter((entry) => !query || `${entry.tag} ${entry.label}`.toLowerCase().includes(query));
  menu.replaceChildren();
  menuNode = node;
  menuEditor = editor || activeEditor(node);
  menuAt = info.at;
  if (!matched.length) {
    const empty = document.createElement("div");
    empty.className = "h3d-empty";
    empty.textContent = entries.length ? "没有匹配的素材" : "还没上传。先加参考图、视频或音频。";
    menu.appendChild(empty);
  }
  matched.forEach((entry, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "h3d-item";
    button.dataset.tag = entry.tag;
    if (entry.kind === "video") {
      const thumb = document.createElement("video");
      thumb.muted = true;
      thumb.playsInline = true;
      thumb.src = viewUrl(entry.item);
      button.appendChild(thumb);
    } else if (entry.kind === "image") {
      const thumb = document.createElement("img");
      thumb.alt = "";
      thumb.src = viewUrl(entry.item);
      button.appendChild(thumb);
    } else if (entry.kind === "audio") {
      button.appendChild(audioMark());
    }
    const label = document.createElement("span");
    label.textContent = entry.label || entry.tag;
    button.title = entry.tag;
    button.append(label);
    button.addEventListener("pointerenter", () => {
      menuIndex = index;
      paintMenuIndex();
    });
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      insertTag(node, entry.tag);
    });
    menu.appendChild(button);
  });
  menuIndex = 0;
  paintMenuIndex();
  menu.classList.remove("hidden");
  const box = caretBox(menuEditor || node.__h3Inline || node.__h3Script);
  const width = Math.min(380, menu.offsetWidth || 280);
  const height = Math.min(320, menu.offsetHeight || 160);
  let left = box.left;
  let top = box.bottom + 4;
  if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
  if (top + height > window.innerHeight - 8) top = Math.max(8, box.top - height - 4);
  menu.style.left = `${Math.max(8, left)}px`;
  menu.style.top = `${Math.max(8, top)}px`;
}

function insertTag(node, tag) {
  const editor = menuEditor || activeEditor(node);
  if (!editor || menuAt < 0) return;
  const text = String(promptWidget(node)?.value || "");
  const rest = text.slice(menuAt + 1);
  const query = (rest.match(/^\S*/) || [""])[0];
  const next = `${text.slice(0, menuAt)}${tag} ${text.slice(menuAt + 1 + query.length)}`;
  node.__h3Active = editor;
  setPromptText(node, next);
  paintScript(node, menuAt + tag.length + 1);
  editor.focus();
  hideMenu();
}

function atQuery(editor) {
  const pos = editor.selectionStart;
  const text = editor.value.slice(0, pos);
  const at = text.lastIndexOf("@");
  if (at < 0) return null;
  const query = text.slice(at + 1);
  if (/\s/.test(query)) return null;
  return { at, query };
}

function selectedScriptText(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (range.collapsed) return null;
  const host = range.commonAncestorContainer;
  if (host !== editor && !editor.contains(host)) return null;
  const box = document.createElement("div");
  box.appendChild(range.cloneContents());
  return renderTags(serializeScript(box));
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

async function copyPrompt(node) {
  const editor = activeEditor(node);
  const text = renderTags(editor ? syncScript(node, editor) : (promptWidget(node)?.value || ""));
  if (!text.trim()) {
    if (node.__h3Status) node.__h3Status.textContent = "剧本还是空的";
    return;
  }
  await writeClipboard(text);
  if (node.__h3Status) node.__h3Status.textContent = "已复制剧本，资源标签已带上";
  const button = node.__h3Copy;
  if (button) {
    button.textContent = "已复制";
    setTimeout(() => { if (button.isConnected) button.textContent = "复制"; }, 1200);
  }
}

function bindEditor(node, editor) {
  if (!editor || editor.__h3Bound) return;
  editor.__h3Bound = true;
  editor.addEventListener("focus", () => { node.__h3Active = editor; });
  editor.addEventListener("pointerdown", (event) => event.stopPropagation());
  editor.addEventListener("input", () => {
    if (editor.__h3Mute) return;
    node.__h3Active = editor;
    const text = syncScript(node, editor);
    const tagsInText = (text.match(/<(?:Picture|Video|Audio)\s+\d+\s*>/gi) || []).join("|");
    const tagsInView = [...editor.querySelectorAll("[data-tag]")].map((chip) => chip.dataset.tag).join("|");
    const caret = caretIndex(editor);
    if (tagsInText !== tagsInView) paintScript(node, caret);
    const info = atQuery({ value: text, selectionStart: caret });
    if (info) showMenu(node, info, editor);
    else hideMenu();
  });
  editor.addEventListener("paste", (event) => {
    event.preventDefault();
    node.__h3Active = editor;
    const pasted = event.clipboardData?.getData("text/plain") || "";
    const text = serializeScript(editor);
    const { start, end } = selectionSpan(editor);
    const next = `${text.slice(0, start)}${pasted}${text.slice(end)}`;
    setPromptText(node, next);
    paintScript(node, start + pasted.length);
    editor.focus();
  });
  editor.addEventListener("copy", (event) => {
    const text = selectedScriptText(editor);
    if (text == null) return;
    event.preventDefault();
    event.clipboardData.setData("text/plain", text);
  });
  editor.addEventListener("cut", (event) => {
    const text = selectedScriptText(editor);
    if (text == null) return;
    event.preventDefault();
    event.clipboardData.setData("text/plain", text);
    const selection = window.getSelection();
    if (selection?.rangeCount) selection.getRangeAt(0).deleteContents();
    node.__h3Active = editor;
    syncScript(node, editor);
  });
  editor.addEventListener("keydown", (event) => {
    if (menu.classList.contains("hidden") || menuNode !== node || menuEditor !== editor) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      moveMenu(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      moveMenu(-1);
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      if (!menuButtons().length) return;
      event.preventDefault();
      event.stopPropagation();
      confirmMenu();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      hideMenu();
    }
  });
  editor.addEventListener("blur", () => setTimeout(() => {
    if (menuEditor === editor) hideMenu();
  }, 150));
}

function bindPromptMenu(node) {
  for (const editor of scriptEditors(node)) bindEditor(node, editor);
  paintScript(node);
}

let floatZ = 10020;

function raiseFloat(float) {
  floatZ = Math.min(10045, floatZ + 1);
  float.style.zIndex = String(floatZ);
}

function defaultScriptBox(node) {
  const canvas = app.canvas;
  const rect = canvas?.canvas?.getBoundingClientRect?.();
  const scale = canvas?.ds?.scale || 1;
  const offset = canvas?.ds?.offset || [0, 0];
  if (!rect || !node?.pos) return { left: 80, top: 72, width: 520, height: 360, open: false };
  const left = rect.left + (node.pos[0] + (node.size?.[0] || 420) + offset[0]) * scale + 16;
  const top = rect.top + (node.pos[1] + offset[1]) * scale;
  return {
    left: Math.max(8, Math.min(left, window.innerWidth - 360)),
    top: Math.max(8, Math.min(top, window.innerHeight - 200)),
    width: 520,
    height: 360,
    open: false,
  };
}

function scriptBox(node) {
  const saved = node.properties?.h3_script_box;
  if (saved && Number.isFinite(Number(saved.left)) && Number.isFinite(Number(saved.top))) return saved;
  return defaultScriptBox(node);
}

function applyScriptBox(node) {
  const float = node.__h3Float;
  if (!float) return;
  const box = scriptBox(node);
  float.style.left = `${Number(box.left)}px`;
  float.style.top = `${Number(box.top)}px`;
  float.style.width = `${Math.max(320, Number(box.width) || 520)}px`;
  float.style.height = `${Math.max(180, Number(box.height) || 360)}px`;
  float.classList.toggle("hidden", box.open === false);
}

function rememberScriptBox(node) {
  const float = node.__h3Float;
  if (!float) return;
  const previous = node.properties?.h3_script_box || {};
  const hidden = float.classList.contains("hidden");
  const rect = float.getBoundingClientRect();
  node.properties = node.properties || {};
  node.properties.h3_script_box = {
    left: hidden ? Number(previous.left) || 80 : rect.left,
    top: hidden ? Number(previous.top) || 72 : rect.top,
    width: hidden ? Math.max(320, Number(previous.width) || 520) : Math.max(320, rect.width),
    height: hidden ? Math.max(180, Number(previous.height) || 360) : Math.max(180, rect.height),
    open: !hidden,
  };
}

function ensureScriptWindow(node) {
  if (node.__h3Float?.isConnected) return node.__h3Float;
  const float = document.createElement("div");
  float.className = "h3d-float";
  const bar = document.createElement("div");
  bar.className = "h3d-float-bar";
  const title = document.createElement("span");
  title.textContent = "剧本";
  const actions = document.createElement("div");
  actions.className = "h3d-float-actions";
  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "复制";
  copy.addEventListener("pointerdown", (event) => event.stopPropagation());
  copy.addEventListener("click", () => { void copyPrompt(node); });
  node.__h3Copy = copy;
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "收起";
  close.addEventListener("pointerdown", (event) => event.stopPropagation());
  close.addEventListener("click", () => {
    float.classList.add("hidden");
    rememberScriptBox(node);
  });
  actions.append(copy, close);
  bar.append(title, actions);
  const script = document.createElement("div");
  script.className = "h3d-script";
  script.contentEditable = "true";
  script.spellcheck = false;
  const grip = document.createElement("div");
  grip.className = "h3d-float-grip";
  float.append(bar, script, grip);
  float.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    raiseFloat(float);
  });
  bar.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = float.getBoundingClientRect();
    const move = (ev) => {
      const left = Math.max(0, Math.min(window.innerWidth - 80, origin.left + ev.clientX - startX));
      const top = Math.max(0, Math.min(window.innerHeight - 36, origin.top + ev.clientY - startY));
      float.style.left = `${left}px`;
      float.style.top = `${top}px`;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      rememberScriptBox(node);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });
  document.body.appendChild(float);
  node.__h3Float = float;
  node.__h3Script = script;
  applyScriptBox(node);
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => rememberScriptBox(node));
    observer.observe(float);
    node.__h3FloatObserver = observer;
  }
  return float;
}

function openScriptWindow(node) {
  const source = activeEditor(node);
  if (source) syncScript(node, source);
  const float = ensureScriptWindow(node);
  float.classList.remove("hidden");
  raiseFloat(float);
  rememberScriptBox(node);
  bindEditor(node, node.__h3Script);
  paintInto(node, node.__h3Script, null);
  node.__h3Active = node.__h3Script;
  node.__h3Script?.focus();
}

function isReverseNode(node) {
  return node?.comfyClass === "FeimaoH3Reverse" || node?.type === "FeimaoH3Reverse";
}

function dropRetiredReverse() {
  const graph = app.graph;
  if (!graph?.nodes?.length) return;
  const reverse = graph.nodes.filter(isReverseNode);
  const reverseIds = new Set(reverse.map((node) => node.id));
  const loaders = graph.nodes.filter((node) => {
    const kind = node?.comfyClass || node?.type;
    if (kind !== "QwenTE_ModelLoader") return false;
    if (String(node.title || "").includes("只给反推")) return true;
    const targets = [];
    for (const output of node.outputs || []) {
      for (const linkId of output.links || []) {
        const link = graph.links?.[linkId];
        if (link) targets.push(link.target_id);
      }
    }
    return targets.length > 0 && targets.every((id) => reverseIds.has(id));
  });
  const gone = [...loaders, ...reverse];
  if (!gone.length) return;
  for (const node of gone) graph.remove(node);
  graph.setDirtyCanvas?.(true, true);
}

function silenceReverse() {
  for (const current of app.graph?.nodes || []) {
    if (!isReverseNode(current)) continue;
    const flag = (current.widgets || []).find((item) => item?.name === "本次执行");
    if (flag) flag.value = false;
  }
}

async function generateVideo(node) {
  const editor = activeEditor(node);
  if (editor) syncScript(node, editor);
  if (node.mode === 2 || node.mode === 4) node.mode = 0;
  silenceReverse();
  syncLoaderMode();
  const button = node.__h3Run;
  if (button) button.disabled = true;
  if (node.__h3Status) node.__h3Status.textContent = "正在按当前剧本和参数生成视频…";
  try {
    const packed = await app.graphToPrompt();
    await api.queuePrompt(0, packed);
    if (node.__h3Status) node.__h3Status.textContent = "视频已排队";
  } catch (err) {
    const body = err?.response;
    const detail = typeof body?.error?.details === "string" ? body.error.details : "";
    const message = detail || body?.error?.message || (typeof body?.error === "string" ? body.error : "") || err?.message || "视频没有排上队";
    if (node.__h3Status) node.__h3Status.textContent = String(message);
  } finally {
    if (button) button.disabled = false;
  }
}

const PRESET_FIELD = { "数字人": "数字人写法", "MV": "MV写法", "漫剧": "漫剧写法" };
const DIGITAL_FRESH = [
  "数字人口播。剧情栏里已经写好的话是必须说出口的台词，扩写时一条都不能丢。先逐句摘出这些原话，再写六段。每一句都要原样出现在 detailed_description 的说话句里，写成 <d>[Chinese] 原句。 </d>。不许省略，不许概括成说话、介绍或口播，不许改写，不许翻译，不许只留第一句或最后一句。",
  "成稿六段的镜头、动作、场景和声音用英文写。中文对白只在说话句里完整出现一次。口型、停顿、换气和表情写在标签外面，标签里只放剧情原句。剧情里的镜头说明不是台词。不要在别的段再抄一遍对白，但 detailed_description 里必须有全部原句。",
  "subject_definitions：剧本里的 <Picture N> 写成 Picture N == Subject N。开口的人写成 Subject N (S1)，同一个人编号全程不变。有 <Audio N> 时写明这是 Subject N (S1) 的人声和时间轨，不是背景音乐，也不是画外音。不要从照片猜测音色。不要多写剧本里没有的人，不要把参考图背景里的人当成表演者，也不要用文件名编人物。",
  "summary：有参考音频时以 [reference generation + audio reuse] 开头；没有参考音频时以 [reference generation] 开头，不要编音频。写明成片给出的时长、比例和分辨率，并写明一条连续的固定镜头、中近景、单人正面口播。剧情里另有机位或景别时，按剧情来。",
  "retention_analysis：人物图写成 fully_preserved，只保留脸、发型、服装、配饰、场景、背景、光线和景别。参考音频写成 fully_copy，原样保留声音、用词、节奏和停顿。没有点名的视频和音频不要写。人物、服装和场景在多镜头里保持连续。",
  "detailed_description：写成一条连续固定镜头，景别、背景、光线和人物比例保持不变。脸和上半身在画面中央，一直面对镜头。口型的开合和下颌跟着音节与停顿走，没说话时嘴巴自然闭上。只保留轻微表情、偶尔眨眼、轻微呼吸和很小的头部动作。不要变焦、摇镜、切镜头、走路、转身、换景或夸张手势，也不要加第二个表演者。说话句写明 Subject N (S1)，并把剧情里的每一句原话逐字放进 <d>。有几句就写几句，按音频或总时长排开，每句都要说完。同一句不要在别的镜头再出现一次。",
  "overall_soundscape：这段声音就是画面里这个人的声音。有参考音频时保持原音色、语速和停顿，情绪只改变停顿、呼吸、重音和音量，不改基础音色，也不要改成播音腔。没有参考音频时，按剧情写性别、语言、音色、语气和语速，中文用自然普通话。默认只有人声、呼吸和很低的环境底噪。这里不要重写台词。",
  "non_diegetic_music：写 N/A。不要加背景音乐、旋律或节奏音效。",
].join("\n");
const DIGITAL_LATE = [
  "数字人口播。成稿六段的镜头、动作、场景和声音用英文写。人物说出口的话保持剧情原文，中文不要翻译，也不要自己编台词。",
  "中文对白只出现一次，嵌在开口的句子里，写成 <d>[Chinese] 原文。 </d>。口型、停顿、换气和表情写在标签外面，标签里只放真正说出口的字。剧情说明不是台词。不要在别的段再写整段对白。",
  "subject_definitions：剧本里的 <Picture N> 写成 Picture N == Subject N。开口的人写成 Subject N (S1)，同一个人编号全程不变。有 <Audio N> 时写明这是 Subject N (S1) 的人声和时间轨，不是背景音乐，也不是画外音。不要从照片猜测音色。不要多写剧本里没有的人，不要把参考图背景里的人当成表演者，也不要用文件名编人物。",
  "summary：有参考音频时以 [reference generation + audio reuse] 开头；没有参考音频时以 [reference generation] 开头，不要编音频。写明成片给出的时长、比例和分辨率，并写明一条连续的固定镜头、中近景、单人正面口播。剧情里另有机位或景别时，按剧情来。",
  "retention_analysis：人物图写成 fully_preserved，只保留脸、发型、服装、配饰、场景、背景、光线和景别。参考音频写成 fully_copy，原样保留声音、用词、节奏和停顿。没有点名的视频和音频不要写。人物、服装和场景在多镜头里保持连续。",
  "detailed_description：写成一条连续固定镜头，景别、背景、光线和人物比例保持不变。脸和上半身在画面中央，一直面对镜头。口型的开合和下颌跟着音节与停顿走，没说话时嘴巴自然闭上。只保留轻微表情、偶尔眨眼、轻微呼吸和很小的头部动作。不要变焦、摇镜、切镜头、走路、转身、换景或夸张手势，也不要加第二个表演者。说话句写明 Subject N (S1)，台词逐字完整，并按音频或总时长把句子放进够用的时间里。同一句完整台词不要在别的镜头再出现一次。",
  "overall_soundscape：这段声音就是画面里这个人的声音。有参考音频时保持原音色、语速和停顿，情绪只改变停顿、呼吸、重音和音量，不改基础音色，也不要改成播音腔。没有参考音频时，按剧情写性别、语言、音色、语气和语速，中文用自然普通话。默认只有人声、呼吸和很低的环境底噪。这里不要重写台词。",
  "non_diegetic_music：写 N/A。不要加背景音乐、旋律或节奏音效。",
].join("\n");
const DIGITAL_MID = [
  "数字人口播。六段里的镜头、动作、场景和声音用英文写。人物说出口的话保持剧情原文，中文不要翻译。",
  "中文对白只出现一次，嵌在这个人开口的句子里，写成 <d>[Chinese] 原文。 </d>。剧情里的说明不是台词，不要念出来。不要在别的段再写整段对白。",
  "subject_definitions：剧本里的 <Picture N> 写成 Picture N == Subject N。开口说话的人写成 Subject N (S1)，同一个人全程用同一个编号。没有台词的人不要加说话人编号。不要多写剧本里没有的人，不要把参考图背景里的人当成表演者，也不要用文件名编人物。",
  "summary：以 [reference generation + audio reference] 开头。只写剧本里点过名、而且素材清单里真有的图片、视频和音频，没有的不要编。写明成片给出的时长、比例和分辨率，并写明固定机位、中近景、单人正面口播。剧情里另有机位或景别时，按剧情来。",
  "retention_analysis：脸、发型、服装、配饰、场景、背景和光线只采用对应图片反推，不要改外观，不要重做场景，不要补参考图里看不见的细节。多镜头时人物、服装、道具和场景保持连续。人物一直面对镜头，不要加走路、转身或换景。",
  "detailed_description：只有指定的人对着镜头说话。固定机位，中近景，脸和上半身在画面中央。只保留自然口型、轻微表情和必要的细微头部动作。不走路，不切去别的地方，不加第二个表演者。说话句写明 Subject N (S1)，台词逐字完整，口型跟着台词走。按总时长把台词匀开，不要挤在极短的时间里说完，也不要为了把时长填满而加无关动作。同一句完整台词不要在别的镜头再出现一次。",
  "overall_soundscape：写这个人声的性别、语言、音色、语气、语速和情绪，并写明对应 Subject N (S1)。中文用自然普通话，不要换语言。剧本里有参考音频时，按那段声音的特征来写；没有就不要写成有音频参考。默认只有这个人的人声和很低的环境底噪。这里不要重写台词。",
  "non_diegetic_music：写 No background music。不要加背景音乐、旋律或节奏音效。",
].join("\n");
const DIGITAL_OLD = [
  "数字人口播。只写一个人对着镜头说话，机位固定，景别保持中近景。",
  "人物的脸、发型、服装、背景和光线都以对应参考图为准，不要换人，不要换衣服，不要另写一套场景。",
  "动作只保留说话时的口型和轻微表情，不要走路，不要转场，不要加第二个表演者。",
  "对白用剧情里的原话，嵌进这个人说话的句子里，整段必须在给定秒数里说完。",
  "声音只有人声和很低的房间底噪，不要配乐。",
  "没有用到的参考视频和参考音频不要写进成稿。",
].join("\n");

function compactGuide(text) {
  return String(text || "").replace(/\s+/g, "");
}

function upgradeDigital(text) {
  const body = String(text || "");
  const compact = compactGuide(body);
  if (!body.trim() || body.trim().startsWith("按数字人口播填") || compact === compactGuide(DIGITAL_OLD) || compact === compactGuide(DIGITAL_MID) || compact === compactGuide(DIGITAL_LATE)) return DIGITAL_FRESH;
  return body;
}

const COMIC_FRESH = [
  "漫剧。剧情栏里已经写好的话必须逐字说出来，一条都不能丢。先按顺序摘出每句原话和说话人，再写六段。每一句都要原样出现在 detailed_description 里，写成 <d>[Chinese] 原句。 </d>。不许省略，不许概括成正在说话，不许改写，不许翻译，不许扩写，也不许把同一句再说一遍。",
  "成稿只能有这六段，顺序不变：subject_definitions、summary、retention_analysis、detailed_description、overall_soundscape、non_diegetic_music。镜头、动作、场景和声音用英文写，对白保持剧情原文。",
  "subject_definitions：剧本里出现几个 <Picture N>，就写几个 Subject，格式是 Picture N == Subject N。要说话的人写成 Subject N (S编号)，同一个人全程同一个编号。不增加人物，不用文件名推断身份，不写参考图里没有的外貌。",
  "summary：有参考音频时以 [reference generation + audio reference] 开头；没有参考音频时以 [reference generation] 开头。写明视频内容、成片给出的比例、分辨率、时长、人物和场景，并写明实际参与的参考素材。没有点名的视频和音频不要写。",
  "retention_analysis：每个人的脸、发型、服装只跟自己的参考图，不能互换外貌和服装。场景、光线和空间关系保持连续。人物身份全程不变。",
  "detailed_description：这是成稿的核心。每个镜头写成 [Shot N] At 00:00.000, 时间从 00:00.000 起，最后一镜落在总时长内。每镜写明人物动作、表情、视线和运镜。默认同一场景、平稳跟拍、中景；剧情另有景别、走位或换地点时按剧情，不要自己加换景。对白按剧情顺序排，说话句先写明是 Subject N (S编号) 亲自开口，再把完整原句放进 <d>。多人对话换人就换说话人，不能串词。按总时长把句子排开，写明最后一句说完的时间，避免被截断。口型、语音、表情和动作同步。",
  "overall_soundscape：只写这个地点里真实会有的声音，例如脚步和远处的环境声。不重复对白，不把对白写成环境音，不加无关音效。",
  "non_diegetic_music：剧情没有要求配乐时写 N/A。剧情要求有音乐时，只按剧情写乐器、速度和情绪。",
].join("\n");
const COMIC_OLD = [
  "漫剧。有几张人物参考图就写几个人，在同一个场景里边走边对话。",
  "每个人的脸和服装只跟自己的参考图，不要多写没有参考图的人，也不要互换外貌。",
  "对白按剧情顺序轮流说，一句接一句，全部收在给定的秒数里。",
  "镜头用平稳跟拍，保持中景，中途不切到另一个地点。背景、光线和走位保持连续。",
  "环境声写这个地点里真实会有的声音，例如脚步和远处的杂音。不要配乐，也不要把对白再写进环境声。",
  "没有用到的参考视频和参考音频不要写进成稿。",
].join("\n");

function upgradeComic(text) {
  const body = String(text || "");
  if (!body.trim() || body.trim().startsWith("按漫剧填") || compactGuide(body) === compactGuide(COMIC_OLD)) return COMIC_FRESH;
  return body;
}

function presetFieldText(node, name) {
  const item = widget(node, PRESET_FIELD[name]);
  const live = String(item?.value ?? "");
  if (live.trim()) return live;
  const fallback = item?.options?.default;
  return typeof fallback === "string" ? fallback : "";
}

function readReversePresets(node) {
  if (node.__h3ReversePresets) return node.__h3ReversePresets;
  let list = [];
  try {
    const data = JSON.parse(String(widget(node, "预设")?.value || "[]"));
    if (Array.isArray(data)) list = data.filter((item) => item && String(item.name || "").trim());
  } catch (_) {
    list = [];
  }
  if (!list.length) {
    list = Object.keys(PRESET_FIELD).map((name) => ({ name, text: presetFieldText(node, name) }));
  }
  const upgraded = list.map((item) => {
    if (item.name === "数字人") return { ...item, text: upgradeDigital(item.text) };
    if (item.name === "漫剧") return { ...item, text: upgradeComic(item.text) };
    return item;
  });
  const changed = upgraded.some((item, index) => item.text !== list[index].text);
  node.__h3ReversePresets = upgraded;
  if (changed) writeReversePresets(node, upgraded, currentReversePreset(node));
  return node.__h3ReversePresets;
}

function currentReversePreset(node) {
  const list = readReversePresets(node);
  const stored = String(widget(node, "当前预设")?.value || "");
  return list.find((item) => item.name === stored)?.name || list[0]?.name || "数字人";
}

function writeReversePresets(node, list, selected) {
  node.__h3ReversePresets = list;
  const store = widget(node, "预设");
  if (store) store.value = JSON.stringify(list);
  for (const preset of list) {
    const target = widget(node, PRESET_FIELD[preset.name]);
    if (target) target.value = preset.text;
  }
  const current = widget(node, "当前预设");
  if (current && selected) current.value = selected;
}

function selectedReversePreset(node) {
  const name = currentReversePreset(node);
  return readReversePresets(node).find((item) => item.name === name) || readReversePresets(node)[0] || { name: "数字人", text: "" };
}

function readableMediaName(item) {
  const name = String(item?.name || "").trim();
  if (!name) return "";
  if (/^(h3d_|comfyui_)/i.test(name)) return "";
  if (!/[\u4e00-\u9fff]/.test(name) && /^[a-z0-9_-]{12,}$/i.test(name)) return "";
  return name;
}

function storyMediaLines(node, story) {
  const groups = [
    ["Picture", readList(node, "images_json")],
    ["Video", readList(node, "videos_json")],
    ["Audio", readList(node, "audios_json")],
  ];
  const lines = [];
  for (const [word, list] of groups) {
    const numbers = [];
    const pattern = new RegExp(`<${word}\\s+(\\d+)\\s*>`, "gi");
    let match;
    while ((match = pattern.exec(story))) {
      const number = Number(match[1]);
      if (!numbers.includes(number)) numbers.push(number);
    }
    for (const number of numbers) {
      const name = readableMediaName(list[number - 1]);
      lines.push(name ? `<${word} ${number}> ${name}` : `<${word} ${number}>`);
    }
  }
  return lines.join("\n");
}

function framingLine(node) {
  const aspect = String(setting(node, "宽高比")?.value || "").trim();
  const seconds = setting(node, "秒数")?.value ?? "";
  const megapixels = setting(node, "百万像素")?.value ?? 1;
  const multiple = setting(node, "对齐倍数")?.value ?? 32;
  const [width, height] = canvasSize(aspect || "9:16", megapixels, multiple);
  let frame = "主体放在画面中部";
  if (aspect === "9:16" || aspect === "3:4") frame = "竖屏，人脸和上半身放在中部，不要写成横屏大全景";
  else if (aspect === "16:9" || aspect === "21:9" || aspect === "4:3") frame = "横屏，可以带上人物两侧的环境和关系";
  else if (aspect === "1:1") frame = "方画幅，主体居中";
  const secondsText = seconds === "" || seconds == null ? "未设秒数" : `${seconds} 秒`;
  return `成片宽高比 ${aspect || "未设"}，约 ${width}×${height}，时长 ${secondsText}。${frame}。动作和对白必须在这个时长里做完。`;
}

function reversePack(node) {
  const editor = activeEditor(node);
  if (editor) syncScript(node, editor);
  const mode = currentMode(node);
  const preset = selectedReversePreset(node);
  const story = renderTags(String(promptWidget(node)?.value || "")).trim();
  const result = String(widget(node, "反推结果")?.value || node.__h3Result?.value || "").trim();
  const used = storyMediaLines(node, story);
  const guide = String(preset.text || "").trim() || "（这个预设是空的）";
  const format = mode === "多参"
    ? [
      `请按「${preset.name}」写成 MiniMax H3 多参提示词。`,
      "成稿只能有这六段，并且按这个顺序：subject_definitions、summary、retention_analysis、detailed_description、overall_soundscape、non_diegetic_music。",
      "subject_definitions 里，剧本里出现的 <Picture N> 写成 Picture N == Subject N。不要增加剧本里没有的人物，也不要用文件名编人物。",
      "剧情栏里已经写明的每句台词都必须逐字放进 detailed_description，写成 <d>[Chinese] 原句。 </d>。不许省略，不许改成“她在说话”。",
      "镜头写成 [Shot 1] At 00:00.000, 然后写这一镜的动作。时间从 00:00.000 起，最后一镜落在总时长内。",
      "summary 以 [reference generation + audio reference] 开头。",
      "人物的外观、服装、背景和光线只采用图片反推。剧本里的图片、视频、音频标签原样保留。",
    ].join("\n")
    : mode === "文生"
      ? `当前是文生。请按「${preset.name}」写成一段 integrated_multimodal_description，写全人物外观、服装、场景、光线、动作和镜头。不要写 subject_definitions，不要写 <Picture> <Video> <Audio> <Subject>。`
      : mode === "图生"
        ? `当前是图生。请按「${preset.name}」来写。人物外观以首帧图片为准，成稿只写动作、表情、镜头和环境变化。不要写 subject_definitions，不要写 <Picture> 标签。`
        : `当前是首尾帧。请按「${preset.name}」来写。首帧是开始的样子，尾帧是结束的样子，成稿只写从首帧走到尾帧的动作和镜头。不要写 subject_definitions，不要写 <Picture> 标签。`;
  return [
    format,
    framingLine(node),
    "",
    "剧情--",
    story || "（还没写剧情）",
    "",
    "剧本里用到的素材--",
    used || "剧本里没有点名素材。没有写进剧本的图片不要写进成稿。",
    "",
    "图片反推--",
    result || "（还没有反推）",
    "",
    `${preset.name}的写法--`,
    guide,
  ].join("\n");
}

async function copyReversePack(node) {
  await writeClipboard(reversePack(node));
  if (node.__h3Status) node.__h3Status.textContent = `已按${selectedReversePreset(node).name}复制`;
}

async function startDirectorReverse(node) {
  const editor = activeEditor(node);
  if (editor) syncScript(node, editor);
  const button = node.__h3RevGo;
  if (button) button.disabled = true;
  if (node.__h3Status) node.__h3Status.textContent = "正在反推剧本里的参考图…";
  try {
    const resp = await api.fetchApi("/feimao-h3/reverse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: setting(node, "反推模型")?.value || "",
        vision: setting(node, "视觉模型")?.value || "",
        prompt: renderTags(String(promptWidget(node)?.value || "")),
        images: readList(node, "images_json"),
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data?.error || "反推失败");
    const text = String(data?.text || "");
    const result = widget(node, "反推结果");
    if (result) result.value = text;
    if (node.__h3Result) node.__h3Result.value = text;
    if (node.__h3Status) node.__h3Status.textContent = text ? "反推完成" : "没有得到反推文字";
  } catch (err) {
    if (node.__h3Status) node.__h3Status.textContent = err?.message || "反推失败";
  } finally {
    if (button) button.disabled = false;
  }
}

function commitPresetName(node, preset, raw) {
  const nextName = String(raw || "").trim();
  if (nextName === preset.name) return true;
  const items = readReversePresets(node);
  if (!nextName || items.some((item) => item.name === nextName)) {
    if (node.__h3Status) node.__h3Status.textContent = "预设名是空的，或已经有同名预设";
    return false;
  }
  writeReversePresets(node, items.map((item) => item.name === preset.name ? { ...item, name: nextName } : item), nextName);
  preset.name = nextName;
  return true;
}

function renderReversePresets(node) {
  const root = node.__h3ReverseRoot;
  if (!root) return;
  const list = readReversePresets(node);
  const name = currentReversePreset(node);
  const preset = list.find((item) => item.name === name) || list[0];
  const editing = !!node.__h3ReverseEditing;
  root.replaceChildren();
  const row = document.createElement("div");
  row.className = "h3d-rev-row";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.textContent = editing ? "完成" : "编辑";
  edit.addEventListener("pointerdown", (event) => event.stopPropagation());
  if (editing && preset) {
    const nameInput = document.createElement("input");
    nameInput.value = preset.name || "";
    nameInput.placeholder = "预设名";
    nameInput.addEventListener("pointerdown", (event) => event.stopPropagation());
    nameInput.addEventListener("change", () => {
      if (!commitPresetName(node, preset, nameInput.value)) nameInput.value = preset.name || "";
    });
    edit.addEventListener("click", () => {
      if (!commitPresetName(node, preset, nameInput.value)) {
        nameInput.value = preset.name || "";
        return;
      }
      node.__h3ReverseEditing = false;
      renderReversePresets(node);
      applyMode(node);
    });
    row.append(nameInput, edit);
  } else {
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
      writeReversePresets(node, readReversePresets(node), select.value);
      renderReversePresets(node);
    });
    edit.addEventListener("click", () => {
      node.__h3ReverseEditing = true;
      renderReversePresets(node);
      applyMode(node);
      node.__h3ReverseRoot?.querySelector("input")?.focus();
    });
    row.append(select, edit);
  }
  root.append(row);
  if (!editing || !preset) return;
  const editor = document.createElement("textarea");
  editor.className = "h3d-rev-text";
  editor.value = preset.text || "";
  editor.placeholder = "这个预设的专项写法。复制给 AI 时会带上。";
  editor.addEventListener("pointerdown", (event) => event.stopPropagation());
  editor.addEventListener("input", () => {
    writeReversePresets(node, readReversePresets(node).map((item) => item.name === preset.name ? { ...item, text: editor.value } : item), preset.name);
  });
  const actions = document.createElement("div");
  actions.className = "h3d-rev-row";
  const add = document.createElement("button");
  add.type = "button";
  add.textContent = "新增";
  add.addEventListener("pointerdown", (event) => event.stopPropagation());
  add.addEventListener("click", () => {
    const items = readReversePresets(node);
    let fresh = "新预设";
    let index = 2;
    while (items.some((item) => item.name === fresh)) {
      fresh = `新预设${index}`;
      index += 1;
    }
    writeReversePresets(node, items.concat([{ name: fresh, text: "" }]), fresh);
    renderReversePresets(node);
  });
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "删除";
  remove.addEventListener("pointerdown", (event) => event.stopPropagation());
  remove.addEventListener("click", () => {
    const items = readReversePresets(node);
    if (items.length <= 1) {
      if (node.__h3Status) node.__h3Status.textContent = "至少留一个预设";
      return;
    }
    const updated = items.filter((item) => item.name !== preset.name);
    writeReversePresets(node, updated, updated[0].name);
    renderReversePresets(node);
  });
  actions.append(add, remove);
  root.append(editor, actions);
}

function mountReverse(node) {
  const block = document.createElement("div");
  block.className = "h3d-rev";
  const resultLabel = document.createElement("div");
  resultLabel.className = "h3d-rev-label";
  resultLabel.textContent = "反推结果";
  const result = document.createElement("textarea");
  result.className = "h3d-result";
  result.placeholder = "点开始反推后，剧本里每张参考图的描述会出现在这里。";
  result.value = String(widget(node, "反推结果")?.value || "");
  result.addEventListener("pointerdown", (event) => event.stopPropagation());
  result.addEventListener("input", () => {
    const item = widget(node, "反推结果");
    if (item) item.value = result.value;
  });
  node.__h3Result = result;
  const presetLabel = document.createElement("div");
  presetLabel.className = "h3d-rev-label";
  presetLabel.textContent = "反推预设";
  const presets = document.createElement("div");
  node.__h3ReverseRoot = presets;
  const buttons = document.createElement("div");
  buttons.className = "h3d-rev-actions";
  const go = document.createElement("button");
  go.type = "button";
  go.className = "h3d-rev-go";
  go.textContent = "开始反推";
  go.addEventListener("pointerdown", (event) => event.stopPropagation());
  go.addEventListener("click", (event) => {
    event.stopPropagation();
    void startDirectorReverse(node);
  });
  node.__h3RevGo = go;
  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "h3d-rev-copy";
  copy.textContent = "复制给AI";
  copy.addEventListener("pointerdown", (event) => event.stopPropagation());
  copy.addEventListener("click", (event) => {
    event.stopPropagation();
    void copyReversePack(node);
  });
  buttons.append(go, copy);
  block.append(resultLabel, result, presetLabel, presets, buttons);
  renderReversePresets(node);
  return block;
}

function buildUI(node) {
  if (node.__h3Built) return;
  node.__h3Built = true;
  ensureStyle();
  dropTopButtons(node);
  watchSize(node);
  hideAll(node);
  ensureDisplay(node);
  const root = document.createElement("div");
  root.className = "h3d";
  const storyLabel = document.createElement("div");
  storyLabel.className = "h3d-label";
  storyLabel.textContent = "剧本";
  const inline = document.createElement("div");
  inline.className = "h3d-script h3d-inline";
  inline.contentEditable = "true";
  inline.spellcheck = false;
  node.__h3Inline = inline;
  node.__h3Active = inline;
  const actions = document.createElement("div");
  actions.className = "h3d-actions";
  const open = document.createElement("button");
  open.type = "button";
  open.className = "h3d-pop";
  open.textContent = "独立编辑";
  open.addEventListener("pointerdown", (event) => event.stopPropagation());
  open.addEventListener("click", (event) => {
    event.stopPropagation();
    openScriptWindow(node);
  });
  const run = document.createElement("button");
  run.type = "button";
  run.className = "h3d-run";
  run.textContent = "生成视频";
  run.addEventListener("pointerdown", (event) => event.stopPropagation());
  run.addEventListener("click", (event) => {
    event.stopPropagation();
    void generateVideo(node);
  });
  node.__h3Run = run;
  actions.append(open, run);
  ensureScriptWindow(node);
  const section = (title) => {
    const block = document.createElement("div");
    block.className = "h3d-block";
    const head = document.createElement("div");
    head.className = "h3d-head";
    const label = document.createElement("span");
    label.textContent = title;
    const count = document.createElement("span");
    count.className = "h3d-count";
    head.append(label, count);
    const grid = document.createElement("div");
    grid.className = "h3d-grid";
    grid.__h3Count = count;
    block.append(head, grid);
    return { block, label, grid };
  };
  const images = section("参考图片");
  const videos = section("参考视频");
  const audios = section("参考音频");
  const reverse = mountReverse(node);
  const status = document.createElement("div");
  status.className = "h3d-status";
  const cols = document.createElement("div");
  cols.className = "h3d-cols";
  const media = document.createElement("div");
  media.className = "h3d-side h3d-media";
  media.append(images.block, audios.block, videos.block);
  const main = document.createElement("div");
  main.className = "h3d-side";
  main.append(storyLabel, inline, actions, reverse, status);
  cols.append(media, main);
  root.append(cols);
  node.__h3Cols = cols;
  node.__h3Media = media;
  node.__h3Status = status;
  node.__h3ImageBlock = images.block;
  node.__h3VideoBlock = videos.block;
  node.__h3AudioBlock = audios.block;
  node.__h3ImageLabel = images.label;
  node.__h3VideoLabel = videos.label;
  node.__h3AudioLabel = audios.label;
  node.__h3Images = images.grid;
  node.__h3Videos = videos.grid;
  node.__h3Audios = audios.grid;
  const dom = node.addDOMWidget("h3d_ui", "h3d", root, {
    serialize: false,
    hideOnZoom: false,
    getMinHeight: () => node.__h3Tall || 280,
    getMaxHeight: () => 1400,
  });
  node.__h3Dom = dom;
  if (dom) {
    dom.computeLayoutSize = () => {
      const height = node.__h3Tall || 280;
      return { minHeight: height, maxHeight: 1400, minWidth: 760 };
    };
  }
  applyMode(node);
  root.style.width = "100%";
  bindPromptMenu(node);
  setTimeout(() => bindPromptMenu(node), 300);
}

function isBoard(node) {
  return !!node && (node.comfyClass === NODE_CLASS || node.type === NODE_CLASS);
}

app.registerExtension({
  name: "feimao.h3.Director",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData?.name === SETTINGS_CLASS) {
      const onCreated = nodeType.prototype.onNodeCreated;
      nodeType.prototype.onNodeCreated = function () {
        const result = onCreated?.apply(this, arguments);
        try { slimSettings(this); } catch (err) { console.error("[feimao-h3导演台]", err); }
        return result;
      };
      const onConfigure = nodeType.prototype.onConfigure;
      nodeType.prototype.onConfigure = function () {
        const result = onConfigure?.apply(this, arguments);
        const node = this;
        setTimeout(() => { try { slimSettings(node); } catch (err) { console.error("[feimao-h3导演台]", err); } }, 0);
        return result;
      };
      return;
    }
    if (nodeData?.name !== NODE_CLASS) return;
    const onCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      const result = onCreated?.apply(this, arguments);
      try { buildUI(this); } catch (err) { console.error("[feimao-h3导演台]", err); }
      return result;
    };
    const onConfigure = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function () {
      const result = onConfigure?.apply(this, arguments);
      const node = this;
      setTimeout(() => {
        hideAll(node);
        dropTopButtons(node);
        watchSize(node);
        ensureScriptWindow(node);
        applyScriptBox(node);
        ensureDisplay(node);
        settingsNode(node)?.__h3PaintChipSwitch?.();
        bindPromptMenu(node);
        paintScript(node);
        applyMode(node);
      }, 0);
      return result;
    };
    const onRemoved = nodeType.prototype.onRemoved;
    nodeType.prototype.onRemoved = function () {
      this.__h3FloatObserver?.disconnect();
      this.__h3Float?.remove();
      this.__h3Float = null;
      this.__h3Script = null;
      this.__h3Inline = null;
      return onRemoved?.apply(this, arguments);
    };
  },
  nodeCreated(node) {
    if (isSettings(node)) {
      try { slimSettings(node); } catch (err) { console.error("[feimao-h3导演台]", err); }
      return;
    }
    if (!isBoard(node)) return;
    try { buildUI(node); } catch (err) { console.error("[feimao-h3导演台]", err); }
  },
  setup() {
    const attach = () => {
      dropRetiredReverse();
      for (const node of app.graph?.nodes || []) {
        if (isSettings(node)) {
          try { slimSettings(node); } catch (err) { console.error("[feimao-h3导演台]", err); }
        }
        if (!isBoard(node)) continue;
        try { buildUI(node); } catch (err) { console.error("[feimao-h3导演台]", err); }
      }
    };
    if (!app.__h3DropReverse && typeof app.loadGraphData === "function") {
      app.__h3DropReverse = true;
      const loadGraphData = app.loadGraphData.bind(app);
      app.loadGraphData = async function () {
        const result = await loadGraphData.apply(this, arguments);
        attach();
        return result;
      };
    }
    attach();
    setTimeout(attach, 500);
  },
});

document.addEventListener("pointerdown", (event) => {
  if (!menu.contains(event.target)) hideMenu();
  if (!library.classList.contains("hidden") && !library.contains(event.target)) closeLibrary();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !library.classList.contains("hidden")) closeLibrary();
});

export { canvasSize, isBoard, renderTags, readList, widget };
