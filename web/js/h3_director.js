import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

const NODE_CLASS = "FeimaoH3Board";
const SETTINGS_CLASS = "FeimaoH3Director";
const STYLE_ID = "feimao-h3d-style";
const ASPECTS = ["9:16", "16:9", "1:1", "4:3", "3:4", "21:9"];
const LIMITS = { images_json: 9, videos_json: 3, audios_json: 3 };
const GEN_MODES = ["多参", "文生", "首帧", "尾帧", "首尾帧", "数字人"];
const HIDDEN = ["images_json", "videos_json", "audios_json", "提示词", "反推结果", "数字人写法", "MV写法", "漫剧写法", "预设", "当前预设", "模式缓存"];

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .h3d { width:100%; max-width:100%; min-width:0; height:100%; box-sizing:border-box; display:flex; flex-direction:column; gap:8px; color:#eee; overflow:auto; }
    .h3d-cols { display:grid; grid-template-columns:minmax(0, 0.92fr) minmax(0, 1.08fr); gap:12px; align-items:start; width:100%; min-width:0; }
    .h3d-cols.single { grid-template-columns:minmax(0, 1fr); }
    .h3d-side { display:flex; flex-direction:column; gap:10px; min-width:0; }
    .h3d-media { display:none; }
    .h3d-label { font-size:12px; font-weight:750; color:#ddd; }
    .h3d-editor { width:100%; box-sizing:border-box; min-height:120px; height:150px; resize:vertical; border-radius:8px;
      border:1px solid rgba(255,255,255,.16); background:rgba(0,0,0,.28); color:#eee; font:13px/1.45 inherit; padding:8px; }
    .h3d-editor:focus { border-color:rgba(255,180,60,.75); outline:none; }
    .h3d-block { display:flex; flex-direction:column; gap:8px; width:100%; min-width:0; box-sizing:border-box; padding:8px; border-radius:12px; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.07); }
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
    .h3d-drive-grid { grid-template-columns:148px; }
    .h3d-drive { display:flex; flex-direction:column; gap:8px; width:100%; }
    .h3d-drive-modes { display:flex; gap:6px; }
    .h3d-drive-mode { flex:1; border:1px solid rgba(255,255,255,.14); background:#1c1c1c; color:#ddd; border-radius:8px; padding:6px 8px; cursor:pointer; font-size:12px; font-weight:700; }
    .h3d-drive-mode.on { border-color:#e2b15a; color:#f3d7a1; }
    .h3d-wave { width:100%; height:128px; border-radius:8px; background:#101010; touch-action:none; cursor:ew-resize; }
    .h3d-drive-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .h3d-drive-play { border:0; border-radius:8px; background:#e2b15a; color:#1a1a1a; font-weight:800; padding:6px 12px; cursor:pointer; }
    .h3d-drive-zoomline { display:flex; align-items:center; gap:8px; flex:1; min-width:160px; }
    .h3d-drive-glass { width:16px; height:16px; flex:0 0 auto; color:#d0d0d0; display:block; }
    .h3d-drive-glass svg { width:16px; height:16px; display:block; }
    .h3d-drive-zoom-slider { flex:1; min-width:88px; height:18px; margin:0; accent-color:#e2b15a; cursor:ew-resize; }
    .h3d-drive-time { color:#bbb; font-size:12px; }
    .h3d-drive-hint { color:#8a8a8a; font-size:11px; line-height:1.45; }
    .h3d-x { position:absolute; top:6px; right:6px; z-index:2; width:18px; height:18px; border:0; border-radius:999px; background:rgba(0,0,0,.72); color:#fff; cursor:pointer; line-height:18px; padding:0; }
    .h3d-ord { position:absolute; top:6px; left:6px; z-index:2; min-width:18px; height:18px; padding:0 5px; border-radius:999px; background:rgba(0,0,0,.72); color:#fff; font-size:11px; line-height:18px; text-align:center; }
    .h3d-more-row, .h3d-import-row { display:flex; gap:8px; width:100%; min-width:0; }
    .h3d-more { flex:1; min-width:0; border:0; background:transparent; color:#c8c8c8; font-size:12px; padding:2px 0 0; cursor:pointer; }
    .h3d-import { flex:1 1 0; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; border:1px solid rgba(255,255,255,.14); border-radius:10px; background:#1c1c1c; color:#eee; padding:7px 8px; cursor:pointer; font-size:12px; font-weight:700; }
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
    .h3d-rev-text { width:100%; box-sizing:border-box; resize:vertical; border-radius:8px;
      border:1px solid rgba(255,255,255,.16); background:rgba(0,0,0,.28); color:#eee; font:13px/1.45 inherit; padding:8px; }
    .h3d-hint { font-size:12px; line-height:1.45; color:#9a9a9a; }
    .h3d-rev-text { min-height:120px; height:140px; }
    .h3d-rev-row { display:flex; gap:6px; }
    .h3d-rev-row select, .h3d-rev-row input, .h3d-rev > input { flex:1; box-sizing:border-box; background:#111; color:#fff; color-scheme:dark;
      border:1px solid rgba(255,255,255,.28); border-radius:6px; padding:4px 6px; font-size:13px; }
    .h3d-rev-row button, .h3d-rev-actions button { border:0; border-radius:6px; padding:6px 10px; font-weight:700; cursor:pointer; background:#333; color:#fff; }
    .h3d-rev-actions { display:flex; gap:8px; }
    .h3d-rev-actions button { flex:1; border-radius:8px; }
    .h3d-rev-go { background:#6b4a1f; }
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

const NEVER = { canvas: "never", vueNode: "never", panel: "never" };
const BOARD_MIN_WIDTH = 760;

function visibilityOf(item) {
  return item?._visibility || item?.visibility || null;
}

function legacyHidingType(type) {
  const text = String(type || "");
  const lower = text.toLowerCase();
  return text === "converted-widget" || text.startsWith("converted-widget:") || lower.includes("hidden") || lower.startsWith("tschide");
}

function hideWidget(item) {
  if (!item) return;
  const options = item.options || (item.options = {});
  try { options.hidden = true; } catch (_) {}
  try { options.surfaces = { ...NEVER }; } catch (_) {}
  const modern = !!visibilityOf(item);
  if (modern && legacyHidingType(item.type) && item.__h3OrigType) {
    try { item.type = item.__h3OrigType; } catch (_) {}
  }
  try { item.hidden = true; } catch (_) {}
  if (!modern && !legacyHidingType(item.type)) {
    if (!item.__h3OrigType) item.__h3OrigType = item.type;
    try { item.type = "converted-widget"; } catch (_) {}
    try { item.hidden = true; } catch (_) {}
  }
  const vis = visibilityOf(item);
  if (vis) {
    try {
      vis.surfaces = { ...NEVER };
      if (vis.suppression) vis.suppression.byExtension = true;
    } catch (_) {}
  }
  item.computeSize = () => [0, -4];
  item.computeLayoutSize = () => ({ minHeight: 0, maxHeight: 0, minWidth: 0 });
  item.serialize = true;
  if (typeof item.draw === "function") item.draw = function () {};
  for (const el of [item.element, item.inputEl]) {
    if (!el?.style) continue;
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("height", "0", "important");
    el.style.setProperty("max-height", "0", "important");
    el.style.setProperty("overflow", "hidden", "important");
    el.style.setProperty("margin", "0", "important");
    el.style.setProperty("padding", "0", "important");
    el.hidden = true;
  }
}

function widgetPinned(item) {
  if (!item) return true;
  const surfaces = visibilityOf(item)?.surfaces;
  const hidden = surfaces
    ? surfaces.canvas === "never" && surfaces.vueNode === "never" && surfaces.panel === "never"
    : item.hidden === true || legacyHidingType(item.type);
  const layout = item.computeLayoutSize?.();
  return hidden && item.options?.hidden === true && !!layout && layout.minHeight === 0 && layout.maxHeight === 0;
}

function scheduleArrange(node) {
  if (!node || node.__h3Arrange) return;
  node.__h3Arrange = true;
  requestAnimationFrame(() => {
    node.__h3Arrange = false;
    try { node.arrange?.(); } catch (_) {}
    try { node.setDirtyCanvas?.(true, false); } catch (_) {}
  });
}

function hideAll(node) {
  if (!node) return;
  let changed = false;
  for (const name of HIDDEN) {
    const item = widget(node, name);
    if (!item || widgetPinned(item)) continue;
    hideWidget(item);
    changed = true;
  }
  if (!node.__h3HideGuard) {
    node.__h3HideGuard = true;
    const previous = node.onDrawBackground;
    node.onDrawBackground = function () {
      let dirty = false;
      for (const name of HIDDEN) {
        const item = widget(this, name);
        if (!item || widgetPinned(item)) continue;
        hideWidget(item);
        dirty = true;
      }
      if (dirty) scheduleArrange(this);
      return previous?.apply(this, arguments);
    };
  }
  if (changed) scheduleArrange(node);
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
  rememberMode(node);
}

function readModeCache(node) {
  if (node.__h3ModeCache) return node.__h3ModeCache;
  let data = {};
  try {
    const parsed = JSON.parse(String(widget(node, "模式缓存")?.value || "{}"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed;
  } catch (_) {}
  node.__h3ModeCache = data;
  return data;
}

function writeModeCache(node) {
  const text = JSON.stringify(node.__h3ModeCache || {});
  const item = widget(node, "模式缓存");
  if (item && item.value !== text) item.value = text;
}

function storeMode(node, mode) {
  if (!mode || !GEN_MODES.includes(mode)) return;
  const cache = readModeCache(node);
  cache[mode] = {
    images: readList(node, "images_json"),
    videos: readList(node, "videos_json"),
    audios: readList(node, "audios_json"),
    prompt: String(promptWidget(node)?.value || ""),
  };
  writeModeCache(node);
}

function rememberMode(node) {
  if (!node?.__h3ActiveMode || node.__h3CacheMute) return;
  storeMode(node, node.__h3ActiveMode);
}

function restoreMode(node, mode) {
  const pack = readModeCache(node)[mode] || { images: [], videos: [], audios: [], prompt: "" };
  node.__h3CacheMute = true;
  writeList(node, "images_json", Array.isArray(pack.images) ? pack.images : []);
  writeList(node, "videos_json", Array.isArray(pack.videos) ? pack.videos : []);
  writeList(node, "audios_json", Array.isArray(pack.audios) ? pack.audios : []);
  const prompt = promptWidget(node);
  if (prompt) prompt.value = String(pack.prompt || "");
  node.__h3CacheMute = false;
  const filled = (Array.isArray(pack.images) ? pack.images : []).filter(mediaFilled).length;
  if (filled > 3) node.__h3ImageShown = filled;
  paintScript(node);
}

function mediaPackFilled(pack) {
  if (!pack || typeof pack !== "object") return false;
  for (const key of ["images", "videos", "audios"]) {
    if ((Array.isArray(pack[key]) ? pack[key] : []).some(mediaFilled)) return true;
  }
  return String(pack.prompt || "").trim().length > 0;
}

function livePackFilled(node) {
  for (const name of ["images_json", "videos_json", "audios_json"]) {
    if (readList(node, name).some(mediaFilled)) return true;
  }
  return String(promptWidget(node)?.value || "").trim().length > 0;
}

function holdMode(node) {
  if (!node?.__h3Configured) return;
  const host = settingsNode(node);
  if (!host?.__h3SettingsReady) return;
  const mode = currentMode(node);
  if (!node.__h3ModeReady) {
    node.__h3ModeCache = null;
    const cache = readModeCache(node);
    node.__h3ActiveMode = mode;
    node.__h3ModeReady = true;
    if (!cache[mode]) {
      storeMode(node, mode);
      return;
    }
    if (!livePackFilled(node) && mediaPackFilled(cache[mode])) restoreMode(node, mode);
    return;
  }
  if (node.__h3ActiveMode === mode) return;
  const editor = activeEditor(node);
  if (editor) syncScript(node, editor);
  storeMode(node, node.__h3ActiveMode);
  node.__h3ActiveMode = mode;
  restoreMode(node, mode);
}

function refreshBoards() {
  for (const node of app.graph?.nodes || []) {
    if (!isBoard(node)) continue;
    try { applyMode(node); } catch (_) {}
  }
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
  const item = setting(node, "模式");
  const value = item?.value === "图生" ? "首帧" : item?.value;
  if (item?.value === "图生" && (item.options?.values || []).includes("首帧")) item.value = "首帧";
  return GEN_MODES.includes(value) ? value : "多参";
}

function mediaFilled(item) {
  return !!(item && (item.filename || item.abs_path));
}

function isPair(node) {
  const mode = currentMode(node);
  return mode === "首尾帧" || mode === "数字人";
}

function pairList(list) {
  return [mediaFilled(list?.[0]) ? list[0] : null, mediaFilled(list?.[1]) ? list[1] : null];
}

function storedImages(node) {
  return isPair(node) ? pairList(readList(node, "images_json")) : readList(node, "images_json");
}

function writeImages(node, slots) {
  if (!isPair(node)) {
    writeList(node, "images_json", slots);
    return;
  }
  const pair = pairList(slots);
  writeList(node, "images_json", mediaFilled(pair[1]) ? pair : [pair[0]].filter(mediaFilled));
}

function slotLimit(node, key) {
  const mode = currentMode(node);
  if (mode === "文生") return 0;
  if (key !== "images_json" && mode !== "多参") return 0;
  if (key === "images_json" && (mode === "首帧" || mode === "尾帧")) return 1;
  if (key === "images_json" && (mode === "首尾帧" || mode === "数字人")) return 2;
  return LIMITS[key];
}

function mediaBadge(node, kind, index) {
  const mode = currentMode(node);
  if (kind === "image" && mode === "首帧") return "首帧";
  if (kind === "image" && mode === "尾帧") return "尾帧";
  if (kind === "image" && (mode === "首尾帧" || mode === "数字人")) return index === 0 ? "首帧" : index === 1 ? "尾帧" : String(index + 1);
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
  const images = isPair(node) ? pairList(readList(node, "images_json")).filter(mediaFilled).length : readList(node, "images_json").filter(mediaFilled).length;
  const videos = readList(node, "videos_json").length;
  const audios = readList(node, "audios_json").length;
  const pair = pairList(readList(node, "images_json"));
  let usage = `参考图 ${images}/9，视频 ${videos}/3（每段拆成画面+原声），独立音频 ${audios}/3`;
  if (mode === "文生") usage = "只用提示词。参考图、视频、音频这次不进模型";
  else if (mode === "首帧") usage = `上传的图作首帧，当前 ${images} 张。`;
  else if (mode === "尾帧") usage = `上传的图作尾帧，当前 ${images} 张。`;
  else if (mode === "首尾帧") usage = `首帧${mediaFilled(pair[0]) ? "已上传" : "空"}，尾帧${mediaFilled(pair[1]) ? "已上传" : "空"}。只上传一张时按那一张出片。`;
  else if (mode === "数字人") usage = `首帧${mediaFilled(pair[0]) ? "已上传" : "空"}，尾帧${mediaFilled(pair[1]) ? "已上传" : "空"}。${driveUsage(node)}。单独采样和保存，模型、加速 LoRA 和步数跟其它模式同一套。`;
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
  const story = 520 + (node.__h3ReverseEditing ? 168 : 0);
  if (mode === "文生") return story;
  const imageRows = Math.max(1, Math.ceil((mode === "多参" ? imageSlots(node) : slotLimit(node, "images_json")) / 3));
  let media = 48 + imageRows * 128 + 36;
  if (mode === "多参") media += 2 * 156;
  if (mode === "数字人") media += readList(node, "audios_json").some(mediaFilled) ? 470 : 156;
  return Math.max(story, media);
}

function ensureWide(node) {
  const width = node.size?.[0] || 0;
  if (width >= BOARD_MIN_WIDTH) return;
  const height = Math.max(node.size?.[1] || 0, node.__h3Tall || 640);
  if (typeof node.setSize === "function") node.setSize([BOARD_MIN_WIDTH, height]);
  else if (node.size) node.size[0] = BOARD_MIN_WIDTH;
}

function pinDomLayout(node) {
  const dom = node.__h3Dom;
  const root = node.__h3Root;
  const height = node.__h3Tall || 280;
  if (root) {
    root.style.setProperty("--comfy-widget-min-height", `${height}px`);
    root.style.setProperty("--comfy-widget-max-height", "1400px");
    root.style.width = "100%";
    root.style.height = "100%";
    root.style.minWidth = "0";
    root.style.flex = "1 1 auto";
    root.style.alignSelf = "stretch";
  }
  if (!dom) return;
  const minHeight = () => node.__h3Tall || 280;
  const options = dom.options || (dom.options = {});
  options.getMinHeight = minHeight;
  options.getMaxHeight = () => 1400;
  options.hideOnZoom = false;
  dom.computeSize = null;
  dom.computeLayoutSize = () => ({ minHeight: minHeight(), maxHeight: 1400, minWidth: BOARD_MIN_WIDTH });
}

function applyMode(node) {
  watchSize(node);
  holdMode(node);
  const mode = currentMode(node);
  const showImages = mode !== "文生";
  const showRefs = mode === "多参";
  const showDrive = mode === "数字人";
  if (node.__h3ImageLabel) node.__h3ImageLabel.textContent = mode === "首帧" ? "首帧" : mode === "尾帧" ? "尾帧" : mode === "首尾帧" || mode === "数字人" ? "首帧 / 尾帧" : "参考图片";
  if (node.__h3ImageBlock) node.__h3ImageBlock.style.display = showImages ? "" : "none";
  if (node.__h3DriveBlock) node.__h3DriveBlock.style.display = showDrive ? "" : "none";
  if (node.__h3VideoBlock) node.__h3VideoBlock.style.display = showRefs ? "" : "none";
  if (node.__h3AudioBlock) node.__h3AudioBlock.style.display = showRefs ? "" : "none";
  if (node.__h3Media) node.__h3Media.style.display = showImages ? "flex" : "none";
  if (node.__h3Cols) node.__h3Cols.classList.toggle("single", !showImages);
  node.__h3Tall = panelHeight(node);
  ensureWide(node);
  pinDomLayout(node);
  if (showImages && node.__h3Images) bindMedia(node, "images_json", node.__h3Images, "image");
  if (showRefs && node.__h3Videos) bindMedia(node, "videos_json", node.__h3Videos, "video");
  if (showRefs && node.__h3Audios) bindMedia(node, "audios_json", node.__h3Audios, "audio");
  if (showDrive) bindDrive(node);
  refreshStatus(node);
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
        else {
          refreshStatus(board);
          if (name === "秒数" && readList(board, "audios_json").some((item) => mediaFilled(item) && item.drive_follow === "video")) bindDrive(board);
        }
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

function looksModelFile(value) {
  return /\.(gguf|safetensors|bin|pt|pth)$/i.test(String(value || ""));
}

function isMmprojName(value) {
  return /mmproj/i.test(String(value || ""));
}

function pickMainModel(item) {
  const values = Array.isArray(item?.options?.values) ? item.options.values.map((entry) => String(entry)) : [];
  const list = values.filter((entry) => looksModelFile(entry) && !isMmprojName(entry) && !entry.startsWith("（"));
  return list.find((entry) => /3\.5/i.test(entry) && /q4/i.test(entry))
    || list.find((entry) => /3\.5/i.test(entry))
    || list[0]
    || "";
}

function keepModelChoice(item) {
  if (!item) return;
  const value = String(item.value || "");
  if (!looksModelFile(value) || !Array.isArray(item.options?.values)) return;
  const values = item.options.values;
  if (values.includes(value)) return;
  const folded = value.replaceAll("\\", "/").toLowerCase();
  const hit = values.find((entry) => String(entry).replaceAll("\\", "/").toLowerCase() === folded);
  if (hit) item.value = hit;
  else values.push(value);
}

function repairReverseModels(node) {
  const auto = widget(node, "自动扩写");
  const model = widget(node, "反推模型");
  const vision = widget(node, "视觉模型");
  const preset = widget(node, "当前预设");
  if (!model || !vision) return;
  const displaced = (node.widgets || []).filter((item) => item && item !== model && item !== vision && looksModelFile(item.value));
  const pool = [model, vision, ...displaced];
  const main = pool.map((item) => String(item.value || "")).find((value) => looksModelFile(value) && !isMmprojName(value));
  const mmproj = pool.map((item) => String(item.value || "")).find((value) => looksModelFile(value) && isMmprojName(value));
  const leftoverName = !looksModelFile(model.value) ? String(model.value || "").trim() : "";
  if (main) model.value = main;
  else if (!looksModelFile(model.value)) {
    const picked = pickMainModel(model);
    if (picked) model.value = picked;
  }
  if (mmproj) vision.value = mmproj;
  for (const item of displaced) {
    if (item === auto) item.value = false;
    else item.value = "";
  }
  if (preset && !String(preset.value || "").trim() && leftoverName && !looksModelFile(leftoverName)) preset.value = leftoverName;
  if (auto && auto.value !== true && auto.value !== false) {
    const text = String(auto.value ?? "").trim().toLowerCase();
    auto.value = text === "true" || text === "1" || text === "yes" || text === "on";
  }
  keepModelChoice(model);
  keepModelChoice(vision);
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
  repairReverseModels(node);
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
  rememberMode(node);
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
  if (kind === "image" && mode === "首帧") return "首帧";
  if (kind === "image" && mode === "尾帧") return "尾帧";
  if (kind === "image" && (mode === "首尾帧" || mode === "数字人")) return index === 0 ? "首帧" : "尾帧";
  if (kind === "video") return `视频${index + 1}`;
  if (kind === "audio") return `音频${index + 1}`;
  return `图片${index + 1}`;
}

function bindMedia(node, key, root, kind) {
  root.replaceChildren();
  const pair = isPair(node) && key === "images_json";
  const items = pair ? pairList(readList(node, key)) : readList(node, key);
  const limit = slotLimit(node, key);
  const shown = kind === "image" ? imageSlots(node) : limit;
  const filled = items.filter(mediaFilled).length;
  if (root.__h3Count) root.__h3Count.textContent = limit ? `已选有 ${filled}/${limit}` : "";
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
        pickFiles(node, key, kind, root, index);
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
        if (!under || under.parentElement !== root || under === card) return;
        if (!pair && under.dataset.filled !== "1") return;
        under.classList.add("drop");
        const hit = Number(under.dataset.index);
        if (pair) {
          target = hit;
          return;
        }
        const rect = under.getBoundingClientRect();
        let insertAt = ev.clientX > rect.left + rect.width / 2 ? hit + 1 : hit;
        if (insertAt > index) insertAt -= 1;
        target = Math.max(0, Math.min(items.filter(mediaFilled).length - 1, insertAt));
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        card.classList.remove("dragging");
        card.style.pointerEvents = "";
        clearDrop();
        if (dragging && target !== index) {
          if (pair) {
            const slots = pairList(readList(node, key));
            const moved = slots[index];
            slots[index] = slots[target];
            slots[target] = moved;
            writeImages(node, slots);
          } else {
            const next = readList(node, key);
            const [moved] = next.splice(index, 1);
            next.splice(target, 0, moved);
            writeList(node, key, next);
            rewritePrompt(node, kind, moveMap(items.length, index, target));
          }
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
    order.textContent = pair ? (index === 0 ? "首" : "尾") : String(index + 1);
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
      if (pair) {
        const slots = pairList(readList(node, key));
        slots[index] = null;
        writeImages(node, slots);
      } else {
        const next = readList(node, key);
        next.splice(index, 1);
        writeList(node, key, next);
        rewritePrompt(node, kind, removalMap(items.length, index));
      }
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

const DRIVE_LIMIT = 15;
const driveWaves = new Map();

function driveKey(item) {
  return `${item?.type || "input"}|${item?.subfolder || ""}|${item?.filename || ""}`;
}

function driveClip(node) {
  return readList(node, "audios_json").find(mediaFilled) || null;
}

function videoSeconds(node) {
  const value = Number(setting(node, "秒数")?.value);
  return Math.min(DRIVE_LIMIT, Math.max(1, Number.isFinite(value) ? value : 5));
}

function driveSpan(item, duration, video) {
  const total = Number.isFinite(duration) && duration > 0 ? duration : DRIVE_LIMIT;
  const follow = item?.drive_follow === "video" ? "video" : "audio";
  let start = Number(item?.drive_start);
  if (!Number.isFinite(start) || start < 0) start = 0;
  if (follow === "video") {
    const length = Math.min(video, DRIVE_LIMIT, total);
    if (start > total - length) start = Math.max(0, total - length);
    return { follow, start, end: start + length, length };
  }
  let end = Number(item?.drive_end);
  if (!Number.isFinite(end)) end = Math.min(start + DRIVE_LIMIT, total);
  if (end - start > DRIVE_LIMIT) end = start + DRIVE_LIMIT;
  if (end > total) end = total;
  if (start > end) start = end;
  if (total >= 1 && end - start < 1) {
    end = Math.min(total, start + 1);
    start = Math.max(0, end - 1);
  }
  return { follow, start, end, length: Math.max(0, end - start) };
}

function driveUsage(node) {
  const item = driveClip(node);
  if (!item) return "声音驱动未上传";
  const known = driveWaves.get(driveKey(item));
  if (!known?.duration) {
    return item.drive_follow === "video"
      ? "时长跟随视频。拖动选择线定位音频，最长 15 秒"
      : "时长跟随音频。未裁切时使用开头最多 15 秒";
  }
  const span = driveSpan(item, known.duration, videoSeconds(node));
  const clip = `${span.start.toFixed(1)}–${span.end.toFixed(1)} 秒`;
  return item.drive_follow === "video" ? `时长跟随视频，音频取 ${clip}` : `时长跟随音频，使用 ${clip}`;
}

function stopDrivePreview(node) {
  const audio = node.__h3DriveAudio;
  if (!audio) return;
  audio.pause();
  node.__h3DriveAudio = null;
}

function patchDrive(node, patch) {
  const list = readList(node, "audios_json");
  const index = list.findIndex(mediaFilled);
  if (index < 0) return;
  list[index] = { ...list[index], ...patch };
  writeList(node, "audios_json", list);
}

function formatAxis(time, step) {
  const value = Math.abs(time) < 0.001 ? 0 : time;
  const mins = Math.floor(value / 60);
  const secs = value - mins * 60;
  if (mins <= 0) return `${value.toFixed(step < 1 ? 1 : 0)}s`;
  const text = step < 1 ? secs.toFixed(1).padStart(4, "0") : String(Math.round(secs)).padStart(2, "0");
  return `${mins}:${text}`;
}

function paintWave(canvas, peaks, duration, span, playhead, view) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 280;
  const height = 128;
  const ruler = 36;
  const wave = height - ruler;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const pen = canvas.getContext("2d");
  pen.setTransform(dpr, 0, 0, dpr, 0, 0);
  pen.clearRect(0, 0, width, height);
  pen.fillStyle = "#101010";
  pen.fillRect(0, 0, width, height);
  const total = duration || 1;
  const viewStart = Math.max(0, view?.start || 0);
  const viewEnd = view?.end > viewStart ? Math.min(total, view.end) : total;
  const spanView = Math.max(0.001, viewEnd - viewStart);
  const xOf = (time) => ((time - viewStart) / spanView) * width;
  const x0 = xOf(span.start);
  const x1 = xOf(span.end);
  const left = Math.max(0, Math.min(x0, x1));
  const right = Math.min(width, Math.max(x0, x1));
  pen.fillStyle = "rgba(226,177,90,.18)";
  if (right > left) pen.fillRect(left, 0, Math.max(2, right - left), wave);
  const bars = peaks?.length || 0;
  for (let index = 0; index < bars; index += 1) {
    const time = ((index + 0.5) / bars) * total;
    if (time < viewStart || time > viewEnd) continue;
    const x = xOf(time);
    const bar = Math.max(2, (peaks[index] || 0) * (wave - 10));
    pen.fillStyle = time >= span.start && time <= span.end ? "#e2b15a" : "#5c5c5c";
    pen.fillRect(x - 1, (wave - bar) / 2, 2, bar);
  }
  pen.fillStyle = "#f3d7a1";
  if (x0 >= -2 && x0 <= width + 2) pen.fillRect(x0, 0, 2, wave);
  if (x1 >= -2 && x1 <= width + 2) pen.fillRect(x1 - 1, 0, 2, wave);
  if (playhead != null) {
    const px = xOf(playhead);
    if (px >= 0 && px <= width) {
      pen.fillStyle = "#fff";
      pen.fillRect(px, 0, 1, wave);
    }
  }
  pen.fillStyle = "#161616";
  pen.fillRect(0, wave, width, ruler);
  pen.fillStyle = "#3a3a3a";
  pen.fillRect(0, wave, width, 1);
  const labelSteps = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120];
  let labelStep = labelSteps[labelSteps.length - 1];
  for (const step of labelSteps) {
    if (width / (spanView / step) >= 72) {
      labelStep = step;
      break;
    }
  }
  const tickStep = labelStep >= 10 ? labelStep / 5 : labelStep >= 1 ? labelStep / 4 : labelStep / 2;
  pen.font = "11px sans-serif";
  pen.textBaseline = "alphabetic";
  let lastLabelRight = -Infinity;
  const firstTick = Math.ceil((viewStart - 0.0001) / tickStep) * tickStep;
  for (let time = firstTick; time <= viewEnd + 0.0001; time += tickStep) {
    const x = xOf(time);
    if (x < -1 || x > width + 1) continue;
    const major = Math.abs(time / labelStep - Math.round(time / labelStep)) < 0.01;
    pen.fillStyle = major ? "#9a9a9a" : "#4a4a4a";
    pen.fillRect(x, wave + 1, 1, major ? 10 : 6);
    if (!major) continue;
    const label = formatAxis(time, labelStep);
    const textWidth = pen.measureText(label).width;
    let textX = x - textWidth / 2;
    textX = Math.max(2, Math.min(width - textWidth - 2, textX));
    if (textX <= lastLabelRight + 6) continue;
    pen.fillStyle = "#d0d0d0";
    pen.fillText(label, textX, height - 8);
    lastLabelRight = textX + textWidth;
  }
}

async function loadDriveWave(item) {
  const key = driveKey(item);
  if (driveWaves.has(key)) return driveWaves.get(key);
  const params = new URLSearchParams({
    filename: item.filename || "",
    type: item.type || "input",
    subfolder: item.subfolder || "",
  });
  const job = (async () => {
    const resp = await fetch(api.apiURL(`/view?${params.toString()}`));
    if (!resp.ok) throw new Error("读不到音频");
    const bytes = await resp.arrayBuffer();
    const context = new AudioContext();
    try {
      const audio = await context.decodeAudioData(bytes.slice(0));
      const raw = audio.getChannelData(0);
      const bars = 160;
      const size = Math.max(1, Math.floor(raw.length / bars));
      const peaks = [];
      for (let index = 0; index < bars; index += 1) {
        let peak = 0;
        const begin = index * size;
        const step = Math.max(1, Math.floor(size / 24));
        for (let cursor = 0; cursor < size; cursor += step) peak = Math.max(peak, Math.abs(raw[begin + cursor] || 0));
        peaks.push(peak);
      }
      return { duration: audio.duration, peaks };
    } finally {
      await context.close();
    }
  })();
  driveWaves.set(key, job);
  try {
    return await job;
  } catch (err) {
    driveWaves.delete(key);
    throw err;
  }
}

function bindDrive(node) {
  const root = node.__h3Drive;
  if (!root) return;
  stopDrivePreview(node);
  root.replaceChildren();
  root.parentElement?.querySelector(":scope > .h3d-drive")?.remove();
  const item = driveClip(node);
  if (root.__h3Count) root.__h3Count.textContent = item ? "已选有 1/1" : "已选有 0/1";
  const card = document.createElement("div");
  card.className = item ? "h3d-card filled" : "h3d-card";
  card.addEventListener("pointerdown", (event) => event.stopPropagation());
  if (!item) {
    card.appendChild(audioMark());
    const name = document.createElement("div");
    name.textContent = "驱动音频";
    const hint = document.createElement("div");
    hint.className = "h3d-hint";
    hint.textContent = "点击选择/上传";
    card.append(name, hint);
    card.addEventListener("click", (event) => {
      event.stopPropagation();
      pickDrive(node);
    });
    root.appendChild(card);
    return;
  }
  card.appendChild(audioMark());
  const cap = document.createElement("div");
  cap.className = "h3d-cap";
  cap.textContent = item.name || item.filename || "驱动音频";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "h3d-x";
  remove.textContent = "×";
  remove.addEventListener("pointerdown", (event) => event.stopPropagation());
  remove.addEventListener("click", (event) => {
    event.stopPropagation();
    stopDrivePreview(node);
    writeList(node, "audios_json", []);
    applyMode(node);
  });
  card.append(cap, remove);
  root.appendChild(card);

  const editor = document.createElement("div");
  editor.className = "h3d-drive";
  const modes = document.createElement("div");
  modes.className = "h3d-drive-modes";
  const canvas = document.createElement("canvas");
  canvas.className = "h3d-wave";
  const row = document.createElement("div");
  row.className = "h3d-drive-row";
  const play = document.createElement("button");
  play.type = "button";
  play.className = "h3d-drive-play";
  play.textContent = "试听";
  const time = document.createElement("div");
  time.className = "h3d-drive-time";
  time.textContent = "正在读取音频…";
  const zoomLine = document.createElement("div");
  zoomLine.className = "h3d-drive-zoomline";
  const glass = document.createElement("span");
  glass.className = "h3d-drive-glass";
  glass.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 15.5L20 20.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const zoomSlider = document.createElement("input");
  zoomSlider.type = "range";
  zoomSlider.className = "h3d-drive-zoom-slider";
  zoomSlider.min = "0";
  zoomSlider.max = "100";
  zoomSlider.step = "1";
  zoomSlider.value = "0";
  zoomSlider.setAttribute("aria-label", "时间轴缩放");
  zoomLine.append(glass, zoomSlider);
  row.append(play, zoomLine, time);
  const hint = document.createElement("div");
  hint.className = "h3d-drive-hint";
  editor.append(modes, canvas, row, hint);
  editor.addEventListener("pointerdown", (event) => event.stopPropagation());
  root.parentElement?.appendChild(editor);

  let duration = 0;
  let peaks = [];
  let span = driveSpan(item, DRIVE_LIMIT, videoSeconds(node));
  let playhead = null;
  let viewStart = 0;
  let viewEnd = DRIVE_LIMIT;
  const viewOf = () => ({ start: viewStart, end: viewEnd > viewStart ? viewEnd : (duration || DRIVE_LIMIT) });
  const fitView = () => {
    viewStart = 0;
    viewEnd = duration || DRIVE_LIMIT;
  };
  const zoomAround = (anchor, factor) => {
    const total = duration || DRIVE_LIMIT;
    const current = Math.max(0.001, viewEnd - viewStart);
    const next = Math.min(total, Math.max(0.5, current / factor));
    const ratio = (anchor - viewStart) / current;
    viewStart = anchor - ratio * next;
    viewEnd = viewStart + next;
    if (viewStart < 0) {
      viewEnd -= viewStart;
      viewStart = 0;
    }
    if (viewEnd > total) {
      viewStart -= viewEnd - total;
      viewEnd = total;
    }
    viewStart = Math.max(0, viewStart);
    viewEnd = Math.min(total, Math.max(viewStart + 0.5, viewEnd));
  };
  const zoomWindow = (level) => {
    const total = duration || DRIVE_LIMIT;
    const tight = Math.min(0.5, total);
    const amount = Math.min(1, Math.max(0, level));
    return tight + (1 - amount) * (total - tight);
  };
  const applyZoom = (level) => {
    const total = duration || DRIVE_LIMIT;
    const visible = zoomWindow(level);
    const anchor = (viewStart + viewEnd) / 2;
    viewStart = anchor - visible / 2;
    viewEnd = viewStart + visible;
    if (viewStart < 0) {
      viewEnd -= viewStart;
      viewStart = 0;
    }
    if (viewEnd > total) {
      viewStart -= viewEnd - total;
      viewEnd = total;
    }
    viewStart = Math.max(0, viewStart);
    viewEnd = Math.min(total, viewEnd);
  };
  const currentZoom = () => {
    const total = duration || DRIVE_LIMIT;
    const tight = Math.min(0.5, total);
    const visible = Math.min(total, Math.max(tight, viewEnd - viewStart));
    if (total - tight < 0.001) return 0;
    return 1 - (visible - tight) / (total - tight);
  };
  const followVideo = () => driveClip(node)?.drive_follow === "video";
  const redraw = () => {
    span = driveSpan(driveClip(node) || item, duration || DRIVE_LIMIT, videoSeconds(node));
    paintWave(canvas, peaks, duration || DRIVE_LIMIT, span, playhead, viewOf());
    if (document.activeElement !== zoomSlider) zoomSlider.value = String(Math.round(currentZoom() * 100));
    time.textContent = duration
      ? `${span.start.toFixed(1)}–${span.end.toFixed(1)} 秒 / 全长 ${duration.toFixed(1)} 秒`
      : "正在读取音频…";
    hint.textContent = followVideo()
      ? "选择线长度等于视频时长，最长 15 秒。拖动它定位要使用的一段。拖动放大镜滑块可以看清时间轴。"
      : "拖动两端裁切，拖动中间平移。最长 15 秒。不做设置时使用音频开头最多 15 秒。拖动放大镜滑块可以看清时间轴。";
  };
  zoomSlider.addEventListener("pointerdown", (event) => event.stopPropagation());
  zoomSlider.addEventListener("input", (event) => {
    event.stopPropagation();
    applyZoom(Number(zoomSlider.value) / 100);
    redraw();
  });
  const setFollow = (follow) => {
    stopDrivePreview(node);
    const current = driveSpan(driveClip(node) || item, duration || DRIVE_LIMIT, videoSeconds(node));
    const patch = { drive_follow: follow, drive_start: Number(current.start.toFixed(3)) };
    if (follow === "audio") patch.drive_end = Number(current.end.toFixed(3));
    patchDrive(node, patch);
    applyMode(node);
  };
  for (const [follow, label] of [["audio", "时长跟随音频"], ["video", "时长跟随视频"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `h3d-drive-mode${(item.drive_follow === "video" ? "video" : "audio") === follow ? " on" : ""}`;
    button.textContent = label;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if ((item.drive_follow === "video" ? "video" : "audio") !== follow) setFollow(follow);
    });
    modes.appendChild(button);
  }
  redraw();
  play.addEventListener("click", (event) => {
    event.stopPropagation();
    if (node.__h3DriveAudio && !node.__h3DriveAudio.paused) {
      stopDrivePreview(node);
      playhead = null;
      play.textContent = "试听";
      redraw();
      return;
    }
    const audio = new Audio(viewUrl(item));
    node.__h3DriveAudio = audio;
    audio.currentTime = span.start;
    play.textContent = "停止";
    const tick = () => {
      if (node.__h3DriveAudio !== audio) return;
      if (audio.currentTime >= span.end || audio.ended) {
        stopDrivePreview(node);
        playhead = null;
        play.textContent = "试听";
        redraw();
        return;
      }
      playhead = audio.currentTime;
      paintWave(canvas, peaks, duration || DRIVE_LIMIT, span, playhead, viewOf());
    };
    audio.ontimeupdate = tick;
    audio.onended = tick;
    audio.play().catch((err) => {
      stopDrivePreview(node);
      play.textContent = "试听";
      if (node.__h3Status) node.__h3Status.textContent = `试听失败：${err?.message || err}`;
    });
  });
  let drag = null;
  const timeAt = (event) => {
    const rect = canvas.getBoundingClientRect();
    const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
    const start = viewStart;
    const end = viewEnd > viewStart ? viewEnd : (duration || DRIVE_LIMIT);
    return Math.min(duration, Math.max(0, start + Math.min(1, Math.max(0, ratio)) * (end - start)));
  };
  canvas.addEventListener("pointerdown", (event) => {
    if (!duration) return;
    event.preventDefault();
    event.stopPropagation();
    stopDrivePreview(node);
    playhead = null;
    play.textContent = "试听";
    const point = timeAt(event);
    const width = canvas.getBoundingClientRect().width || 1;
    const visible = Math.max(0.001, (viewEnd > viewStart ? viewEnd - viewStart : duration));
    const edge = Math.max(0.05, (10 / width) * visible);
    let mode = "move";
    if (!followVideo()) {
      if (Math.abs(point - span.start) <= edge) mode = "start";
      else if (Math.abs(point - span.end) <= edge) mode = "end";
      else if (point < span.start || point > span.end) mode = "range";
    } else if (point < span.start || point > span.end) mode = "place";
    drag = { mode, origin: point, start: span.start, end: span.end };
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag || !duration) return;
    const point = timeAt(event);
    let start = drag.start;
    let end = drag.end;
    if (drag.mode === "start") start = Math.min(point, end - 1);
    else if (drag.mode === "end") end = Math.max(point, start + 1);
    else if (drag.mode === "range") {
      start = Math.min(drag.origin, point);
      end = Math.max(drag.origin, point);
      if (end - start < 1) end = Math.min(duration, start + 1);
    } else if (drag.mode === "place") {
      const length = drag.end - drag.start;
      start = Math.min(Math.max(0, point), Math.max(0, duration - length));
      end = start + length;
    } else {
      const length = drag.end - drag.start;
      const delta = point - drag.origin;
      start = drag.start + delta;
      end = start + length;
    }
    if (end - start > DRIVE_LIMIT) {
      if (drag.mode === "start") start = end - DRIVE_LIMIT;
      else end = start + DRIVE_LIMIT;
    }
    if (start < 0) {
      end -= start;
      start = 0;
    }
    if (end > duration) {
      start -= end - duration;
      end = duration;
    }
    start = Math.max(0, start);
    span = { ...span, start, end, length: end - start };
    paintWave(canvas, peaks, duration, span, null, viewOf());
    time.textContent = `${start.toFixed(1)}–${end.toFixed(1)} 秒 / 全长 ${duration.toFixed(1)} 秒`;
  });
  const finishDrag = () => {
    if (!drag) return;
    drag = null;
    const patch = { drive_start: Number(span.start.toFixed(3)) };
    if (!followVideo()) patch.drive_end = Number(span.end.toFixed(3));
    patchDrive(node, patch);
    refreshStatus(node);
  };
  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", finishDrag);
  canvas.addEventListener("wheel", (event) => {
    if (!duration) return;
    event.preventDefault();
    event.stopPropagation();
    zoomAround(timeAt(event), event.deltaY < 0 ? 1.25 : 0.8);
    redraw();
  }, { passive: false });
  loadDriveWave(item).then((wave) => {
    if (!root.isConnected) return;
    duration = wave.duration || 0;
    peaks = wave.peaks || [];
    fitView();
    redraw();
    refreshStatus(node);
    node.__h3Tall = panelHeight(node);
  }).catch((err) => {
    time.textContent = `读不到波形：${err?.message || err}`;
  });
}

function pickDrive(node) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "audio/*,.mp3,.wav,.m4a,.flac,.ogg";
  input.style.display = "none";
  document.body.appendChild(input);
  input.onchange = async () => {
    const file = (input.files || [])[0];
    input.remove();
    if (!file) return;
    try {
      writeList(node, "audios_json", [await uploadFile(file, ".wav")]);
      applyMode(node);
    } catch (err) {
      if (node.__h3Status) node.__h3Status.textContent = `上传失败：${err?.message || err}`;
    }
  };
  input.addEventListener("cancel", () => input.remove());
  input.click();
}

function pickFiles(node, key, kind, root, slotIndex) {
  const pair = isPair(node) && key === "images_json";
  const room = pair
    ? pairList(readList(node, key)).filter((item) => !mediaFilled(item)).length
    : slotLimit(node, key) - readList(node, key).filter(mediaFilled).length;
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
    const next = pair ? pairList(readList(node, key)) : readList(node, key);
    let cursor = pair ? Number(slotIndex) : next.length;
    for (const file of files) {
      try {
        const uploaded = await uploadFile(file, fallback);
        if (!pair) {
          next.push(uploaded);
          continue;
        }
        if (!Number.isInteger(cursor) || cursor < 0 || cursor > 1 || mediaFilled(next[cursor])) {
          cursor = next.findIndex((item) => !mediaFilled(item));
        }
        if (cursor < 0) break;
        next[cursor] = uploaded;
        cursor = next.findIndex((item) => !mediaFilled(item));
      } catch (err) {
        if (node.__h3Status) node.__h3Status.textContent = `上传失败：${err?.message || err}`;
        break;
      }
    }
    if (pair) writeImages(node, next);
    else writeList(node, key, next);
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
  if (!mediaFilled(left) || !mediaFilled(right)) return false;
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
  const pair = isPair(node) && target.key === "images_json";
  const limit = slotLimit(node, target.key);
  const next = pair ? pairList(readList(node, target.key)) : readList(node, target.key);
  let added = 0;
  let skipped = 0;
  for (const index of target.picks || []) {
    const item = target.items[index];
    if (!item?.filename || next.some((current) => sameMedia(current, item))) continue;
    const packed = {
      filename: item.filename,
      subfolder: item.subfolder || "",
      type: item.type || "input",
      name: item.name || String(item.filename).replace(/\.[^.]+$/, ""),
    };
    if (pair) {
      const hole = next.findIndex((current) => !mediaFilled(current));
      if (hole < 0) {
        skipped += 1;
        continue;
      }
      next[hole] = packed;
    } else {
      if (next.filter(mediaFilled).length >= limit) {
        skipped += 1;
        continue;
      }
      next.push(packed);
    }
    added += 1;
  }
  target.picks = new Set();
  if (pair) writeImages(node, next);
  else writeList(node, target.key, next);
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

function repairDirectorOutputs() {
  const graph = app.graph;
  if (!graph) return;
  const director = (graph.nodes || []).find((item) => isSettings(item));
  if (!director) return;
  const outputs = director.outputs || [];
  const slotOf = (name) => outputs.findIndex((item) => item?.name === name);
  const positive = slotOf("正向");
  const latent = slotOf("潜空间");
  const digital = slotOf("走数字人");
  if (positive < 0 || latent < 0 || digital < 0) return;
  const hold = (target, inputName, originSlot) => {
    if (!target || originSlot < 0) return;
    const index = (target.inputs || []).findIndex((item) => item?.name === inputName);
    if (index < 0) return;
    const input = target.inputs[index];
    const output = outputs[originSlot];
    if (!output) return;
    if (!Array.isArray(output.links)) output.links = [];
    const linkId = input.link;
    const link = linkId == null ? null : graph.links?.[linkId];
    if (link && Number(link.origin_id) === Number(director.id)) {
      link.origin_slot = originSlot;
      for (const item of outputs) {
        if (!Array.isArray(item?.links) || item === output) continue;
        item.links = item.links.filter((id) => id !== linkId);
      }
      if (!output.links.includes(linkId)) output.links.push(linkId);
      return;
    }
    if (linkId != null) input.link = null;
    try { director.connect(originSlot, target, index); } catch (_) {}
  };
  for (const node of graph.nodes || []) {
    const kind = node?.comfyClass || node?.type;
    if (kind === "FeimaoH3ModeGate") {
      hold(node, "潜空间", latent);
      hold(node, "走数字人", digital);
    } else if (kind === "BasicGuider") {
      hold(node, "conditioning", positive);
    }
  }
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
  repairDirectorOutputs();
  syncLoaderMode();
  const button = node.__h3Run;
  if (button) button.disabled = true;
  const auto = !!setting(node, "自动扩写")?.value;
  if (node.__h3Status) {
    node.__h3Status.textContent = auto
      ? "正在自动扩写，接着按扩写结果生成视频…"
      : "正在按剧本生成视频…";
  }
  try {
    const packed = await app.graphToPrompt();
    await api.queuePrompt(0, packed);
    if (node.__h3Status) node.__h3Status.textContent = "视频已排队";
  } catch (err) {
    const body = err?.response;
    const detail = typeof body?.error?.details === "string" ? body.error.details : "";
    const nodeLines = [];
    for (const info of Object.values(body?.node_errors || {})) {
      const first = info?.errors?.[0];
      if (!first?.message) continue;
      nodeLines.push(`${info.class_type || "节点"}：${first.message}${first.details ? ` ${first.details}` : ""}`);
    }
    const message = nodeLines.join("\n") || detail || body?.error?.message || (typeof body?.error === "string" ? body.error : "") || err?.message || "视频没有排上队";
    if (node.__h3Status) node.__h3Status.textContent = String(message);
  } finally {
    if (button) button.disabled = false;
  }
}

const PRESET_FIELD = { "数字人": "数字人写法", "MV": "MV写法", "漫剧": "漫剧写法" };
const DIGITAL_FRESH = "你是“MiniMax H3 音频驱动数字人提示词导演”。你的任务是根据用户提供的人物图片、场景、表演要求、时长、镜头和可选歌词，输出一条完整、可复制、物理可信、具有真人感的H3视频提示词。\n\n【音频驱动模式定义】\n\n音频由平台在生成时从外部输入，只负责驱动人物表演，不属于提示词中的参考素材。\n\n必须遵守：\n\n1. 不得出现<Audio 1>、<Audio N>、“参考音频1”“音频复用”“audio reuse”“audio reference”等表述。\n2. 不得为运行时驱动音频添加fully_copy、partially_copy、reference或weak_reference。\n3. 统一称为“平台运行时驱动音频”“输入驱动音轨”“驱动语音”或“驱动歌声”。\n4. 没有文字稿时，不得编造台词、歌词、语言、音符、和弦或指法。\n5. 用户提供了准确台词或歌词时，必须原文保留，可写为：\n   <d>[语言] 原文</d>\n6. 平台驱动音频是最终声音时间线，不得要求额外生成第二条主唱、重复对白或重复乐器声。\n\n【模式选择】\n\n只根据音频以外的素材选择H3模式：\n\n- 无图片或视频：T2VA。\n- 一张图片作为视频精确首帧：I2VA。\n- 首帧和尾帧图片：FL2VA。\n- 一张图片作为精确尾帧：L2VA。\n- 只有在其他图片或视频用于复用人物身份、环境、服装、动作或镜头风格时，才使用Ref2VA。\n\n不得仅因为存在运行时驱动音频而使用Ref2VA。\n\n常规“一张人物图片＋平台音频驱动”默认使用I2VA，并输出以下三个字段：\n\nintegrated_multimodal_description:\noverall_soundscape:\nnon_diegetic_music:\n\n【生成原则】\n\n先理解图片，再写提示词。准确识别并锁定：\n\n- 成年人物的身份、脸型、五官、肤色、妆容、发型和身体比例；\n- 服装、饰品、道具、手部外形及初始接触关系；\n- 场景、家具、前后景、构图、镜头高度、焦距、景深和光线；\n- 图片是精确首帧、尾帧还是一般参考；\n- 用户要求的动作、表演类型、镜头、时长和情绪。\n\n不得擅自改变人物身份、年龄、服装、道具、环境或画幅。\n\n【真人表演规则】\n\n人物运动必须具有“原因—动作—结果—恢复”，避免随机眨眼、机械点头和持续晃动。\n\n1. 眼神\n\n人物有明确注视目标。面对镜头表演时以镜头交流为主，只在换气、思考、情绪变化、查看道具或完成复杂动作时短暂移开，眼睛先移动，头部随后小幅跟随，动作完成后自然回到镜头。\n\n2. 眨眼\n\n眨眼出现在换气、视线转移、乐句结束或情绪释放附近，不按固定频率发生，不连续机械眨眼。\n\n3. 表情\n\n表情遵循“细微起势—逐渐增强—部分回落”。使用眼睑、眉间、面颊、嘴角、下颌、吞咽和呼吸的微小变化表达情绪。避免全程固定微笑、嘴唇永久张开、每句话都挑眉或点头。\n\n4. 呼吸与身体\n\n起声前有克制的吸气准备，长句和强音有合理的胸腹支撑，句尾出现呼气、下颌放松和重心回落。身体能量跟随语义、乐句和声音动态，不按每个节拍摇晃。\n\n5. 手势与道具\n\n手势服务于语义或音乐，动作完成后回到自然休息位。保持手指数目、关节、握持、支撑点和物体接触连续，不穿模、不粘连、不凭空增减手指。\n\n【说话和唱歌口型】\n\n口型必须跟随驱动音频中的真实音素、音节重音和停顿，而不是只跟随节拍。\n\n- 双唇辅音出现准确、短暂的双唇闭合；\n- 圆唇元音自然收圆；\n- 开放元音由下颌适度释放；\n- 舌部只在发音需要时自然可见；\n- 连音、转音和颤音保持基础元音口形连续，不随每个音符机械开合；\n- 长音期间口形稳定，只允许下颌和面颊细微调整；\n- 停声、纯伴奏或他人发声时，嘴唇自然闭合或放松，不继续做歌词口型；\n- 和声或伴唱默认作为画外声音，不驱动人物产生第二套口型；\n- 一名可见主唱只对应一条主唱声部。\n\n【乐器表演规则】\n\n如果画面中存在可闻乐器，动作应跟随驱动音轨中的节拍、强弱、起音、延音、休止和演奏技法。每个重要发声动作遵循：\n\n预备 → 接触或起音 → 延音或调制 → 释放或回弹 → 准备下一次动作。\n\n运行时音频只能支持节奏、强弱、乐句和大致奏法同步。没有乐谱、和弦谱、六线谱、MIDI、MusicXML或动作参考时，不得宣称逐音符、逐琴键或逐指法准确。\n\n常见乐器规则：\n\n- 吉他、尤克里里、贝斯：琴体保持稳定支撑；按弦手拇指位于琴颈背面，手指自然弯曲，以指尖压在品丝后方；换和弦时先轻微卸力、整体移动、重新按稳，再由另一只手完成下一次清晰触弦。扫弦真正穿过琴弦，分解和弦使用小幅独立拨弦，休止时不继续空扫。\n- 钢琴、键盘：肩肘放松，手腕接近中立，手指自然弯曲；每个清晰起音对应真实琴键下压。和弦近乎同时落键，琶音按顺序落键并伴随横向移动，休止时释放琴键。踏板动作只在画面可见且有可靠依据时描述。\n- 琵琶：琴身竖直稳定，左手在品位上按压和换把；右手弹、挑、轮指或扫弦使用短距离真实触弦。轮指是手指依次快速触弦，不是整只手抖动。\n- 古筝：右手在琴码右侧真实触弦，左手在另一侧进行按、揉、滑等音高调制；摇指保持小幅快速往复，刮奏沿琴弦方向连续移动。\n- 弓弦乐器：延音期间弓毛保持与琴弦接触；换弓经过减速、反向和重新加速，不能瞬移；左手维持有效按弦，换把时整手连续移动。\n- 打击乐器：每次声音都有预备、击打、回弹和复位；强拍动作幅度较大，弱拍和幽灵音靠近鼓面，休止时不击打。\n- 管乐和铜管：吹奏时嘴唇、舌头和气流被乐器占用。同一人物不能一边保持吹奏口型一边清晰唱歌，应采用“唱完—换气—举起乐器—吹奏—停止气流—移开乐器—恢复唱歌”。\n\n唱歌与演奏同时进行时，优先级为：\n\n口型和呼吸同步 ＞ 发声手或演奏部位正确 ＞ 身体和头部装饰性动作。\n\n【镜头和时序】\n\n用户要求固定镜头时，必须明确：\n\n固定机位、固定焦距、固定水平线、固定构图；全程不推镜、不拉镜、不摇镜、不平移、不变焦、不切镜。人物只在画面内部自然表演。\n\n短视频默认保持一个连续镜头，只使用[Shot 1]。除非用户明确要求分镜，否则不要添加时间码和切镜。\n\n画面应能看到提示词声称控制的关键部位。乐器表演需要尽量同时看清人物脸部、主要发声手、调制手和发声区域。\n\n【画面稳定与防闪烁】\n\n锁定人物身份、面部结构、发型、服装、道具、手部、背景物体、空间位置、曝光、白平衡、色温、光源位置和阴影方向。\n\n原图存在窗外灯点、台灯、蜡烛、霓虹或高亮反射时，应明确：\n\n原有光源的位置、尺寸、颜色和亮度保持恒定；虚化灯点固定在背景景深层，不扩大、不漂移、不进入人物或道具前方；曝光和白平衡全程恒定；不新增镜头炫光、漏光、浮动光球、前景散景、局部亮度脉动或彩色闪烁。\n\n在480P或复杂手部表演中，降低无关动作密度，优先保证脸部、口型、手部接触和背景光线的时序稳定。\n\n【声音字段】\n\noverall_soundscape必须表达：\n\n平台运行时驱动音频提供最终语音或歌曲时间线；人物口型、呼吸、表情、身体能量以及可见乐器动作严格随其同步；不额外生成重复主唱、重复对白、重复伴奏或与驱动音轨冲突的声音。\n\n如果用户没有要求额外的非画内音乐：\n\nnon_diegetic_music: N/A\n\n【输出要求】\n\n1. 默认使用中文。\n2. 先在内部确认模式、素材角色、人物身份、动作可行性、镜头和声音不存在冲突。\n3. 不展示内部推理过程。\n4. 直接输出完整、可复制的最终提示词，不只给修改建议。\n5. 不虚构图片中不存在的物体、歌词、音色、乐器技法或表演细节。\n6. 不承诺“绝对完美”“百分之百准确”或没有依据的逐音符演奏。\n7. 用户要求精简时，保留身份、首帧、口型、呼吸、核心动作、镜头、光线稳定和声音去重约束，删除重复描述。\n8. 用户要求详细时，才展开分音素口型、情绪进程、乐器双手分工和环境因果关系。\n\n【标准I2VA输出骨架】\n\nintegrated_multimodal_description:\n[Shot 1] 视频从输入图片完全一致的首帧开始。完整保留图片中的成年人物身份、面部特征、发型、服装、身体比例、道具、手部接触、场景、构图和光线。根据用户要求描述人物的主要表演。人物的嘴唇、下颌、面颊、舌部、呼吸、眼神、微表情、身体能量以及相关道具或乐器动作，严格跟随平台运行时驱动音频。没有文字稿时不生成新台词或歌词；停声处嘴唇自然放松闭合。补充符合场景的真人微动作、物理接触、镜头约束、身份连续性、光线稳定和防闪烁要求。\n\noverall_soundscape:\n平台运行时驱动音频提供最终语音或歌曲时间线；所有可见发声、呼吸、表演及乐器动作与其同步。不额外生成第二条主唱、重复对白、重复伴奏或冲突音层。\n\nnon_diegetic_music:\nN/A";
const DIGITAL_SPEECH = [
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
  if (!body.trim() || body.trim().startsWith("按数字人口播填") || compact === compactGuide(DIGITAL_OLD) || compact === compactGuide(DIGITAL_MID) || compact === compactGuide(DIGITAL_LATE) || compact === compactGuide(DIGITAL_SPEECH)) return DIGITAL_FRESH;
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

const MV_FRESH = [
  "演唱 MV。剧情栏里的唱词必须逐字唱出来，一条都不能丢。先按顺序摘出每句原词，再写六段。每一句都要原样出现在 detailed_description 的唱歌句里，写成 <d>[Chinese] 原句。 </d>。不许改成口播，不许改成两人对话，不许省略，不许改写。",
  "成稿六段的镜头、动作、场景和声音用英文写。中文唱词只在唱歌句里完整出现一次。口型和对节奏的说明写在标签外面，标签里只放原词。",
  "subject_definitions：剧本里的 <Picture N> 写成 Picture N == Subject N。唱歌的人写成 Subject N (S1)，同一个人编号全程不变。有 <Audio N> 时写明这是要跟唱的歌曲和时间轨，不是旁白，也不是背景里另起的一段配乐。不要从照片猜测音色。",
  "summary：有参考音频时以 [reference generation + audio reuse] 开头；没有参考音频时以 [reference generation] 开头，并用一两句写明曲风、速度和情绪。写明成片时长、比例和分辨率。",
  "retention_analysis：脸、发型、服装写成 fully_preserved。灯光和机位可以变化，但不要换成另一个人。参考音频写成 fully_copy，原样保留旋律、歌词和时间。没有点名的视频不要写。",
  "detailed_description：人物在唱歌，口型对准唱词，身体只随节奏轻动。按总时长把唱词排开，每句都要唱完。不要切成口播介绍，不要加第二个歌手，除非剧情里本来就有。",
  "overall_soundscape：有参考音频时，歌曲以这段音频为准，现场只留很低的空间环境声，不要把唱词再念一遍。没有参考音频时写这个人在唱，并写明曲风、速度和情绪。",
  "non_diegetic_music：有参考音频时写 N/A，歌曲已经在参考音频里。没有参考音频、剧情又要求配乐时，只按剧情写曲风、速度和情绪。",
].join("\n");
const MV_OLD = [
  "演唱 MV。人物在唱歌，口型对准唱词，身体随节奏轻动。",
  "脸、发型和服装保持参考图，灯光和机位可以变化，但不要换成另一个人。",
  "唱词用剧情里的原句，不要改成两人对话，也不要写成口播介绍。",
  "上传了参考音频时，歌曲以这段音频为准，不要再编一段配乐。没有参考音频时，用一两句写明曲风、速度和情绪。",
  "现场只保留空间环境声，不要把唱词再念一遍。",
  "没有用到的参考视频不要写进成稿。",
].join("\n");

function upgradeMv(text) {
  const body = String(text || "");
  if (!body.trim() || body.trim().startsWith("按 MV") || compactGuide(body) === compactGuide(MV_OLD)) return MV_FRESH;
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
    if (item.name === "MV") return { ...item, text: upgradeMv(item.text) };
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

function writeExpanded(node, text) {
  const result = widget(node, "反推结果");
  if (result) result.value = text;
  const prompt = promptWidget(node);
  if (prompt) prompt.value = text;
  paintScript(node);
}

async function startExpand(node) {
  const editor = activeEditor(node);
  if (editor) syncScript(node, editor);
  const button = node.__h3RevGo;
  if (button) button.disabled = true;
  const mode = currentMode(node);
  const preset = selectedReversePreset(node);
  if (node.__h3Status) {
    node.__h3Status.textContent = mode === "首帧" || mode === "尾帧" || mode === "首尾帧" || mode === "数字人"
      ? "正在直接看图，并按官方要求扩写…"
      : "正在按官方要求扩写…";
  }
  try {
    const resp = await api.fetchApi("/feimao-h3/expand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: setting(node, "反推模型")?.value || "",
        vision: setting(node, "视觉模型")?.value || "",
        mode,
        prompt: renderTags(String(promptWidget(node)?.value || "")),
        images: readList(node, "images_json"),
        preset_name: preset.name,
        preset_text: preset.text,
        aspect: setting(node, "宽高比")?.value || "9:16",
        seconds: setting(node, "秒数")?.value ?? 5,
        megapixels: setting(node, "百万像素")?.value ?? 1,
        multiple: setting(node, "对齐倍数")?.value ?? 32,
        drive: mode === "数字人" && readList(node, "audios_json").some(mediaFilled),
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data?.error || "扩写失败");
    const text = String(data?.text || "").trim();
    if (!text) throw new Error("扩写没有得到成稿");
    writeExpanded(node, text);
    if (node.__h3Status) node.__h3Status.textContent = "扩写完成，已经写进剧本。";
  } catch (err) {
    if (node.__h3Status) node.__h3Status.textContent = err?.message || "扩写失败";
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
  editor.placeholder = "这个预设会在扩写时交给模型，规定表演、台词和声音怎么写。";
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
  const presetLabel = document.createElement("div");
  presetLabel.className = "h3d-rev-label";
  presetLabel.textContent = "扩写预设";
  const presets = document.createElement("div");
  node.__h3ReverseRoot = presets;
  const buttons = document.createElement("div");
  buttons.className = "h3d-rev-actions";
  const go = document.createElement("button");
  go.type = "button";
  go.className = "h3d-rev-go";
  go.textContent = "手动扩写";
  go.addEventListener("pointerdown", (event) => event.stopPropagation());
  go.addEventListener("click", (event) => {
    event.stopPropagation();
    void startExpand(node);
  });
  node.__h3RevGo = go;
  buttons.append(go);
  block.append(presetLabel, presets, buttons);
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
  node.__h3Root = root;
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
  const drive = section("声音驱动");
  drive.grid.classList.add("h3d-drive-grid");
  const videos = section("参考视频");
  const audios = section("参考音频");
  const reverse = mountReverse(node);
  const status = document.createElement("div");
  status.className = "h3d-status";
  const cols = document.createElement("div");
  cols.className = "h3d-cols";
  const media = document.createElement("div");
  media.className = "h3d-side h3d-media";
  media.append(images.block, drive.block, audios.block, videos.block);
  const main = document.createElement("div");
  main.className = "h3d-side";
  main.append(storyLabel, inline, actions, reverse, status);
  cols.append(media, main);
  root.append(cols);
  node.__h3Cols = cols;
  node.__h3Media = media;
  node.__h3Status = status;
  node.__h3ImageBlock = images.block;
  node.__h3DriveBlock = drive.block;
  node.__h3Drive = drive.grid;
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
  applyMode(node);
  pinDomLayout(node);
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
        const node = this;
        setTimeout(() => {
          if (node.__h3SettingsReady) return;
          node.__h3SettingsReady = true;
          try { refreshBoards(); } catch (err) { console.error("[feimao-h3导演台]", err); }
        }, 0);
        return result;
      };
      const onConfigure = nodeType.prototype.onConfigure;
      nodeType.prototype.onConfigure = function () {
        const result = onConfigure?.apply(this, arguments);
        this.__h3SettingsReady = true;
        try { slimSettings(this); } catch (err) { console.error("[feimao-h3导演台]", err); }
        const node = this;
        setTimeout(() => {
          try { slimSettings(node); } catch (err) { console.error("[feimao-h3导演台]", err); }
          try { refreshBoards(); } catch (err) { console.error("[feimao-h3导演台]", err); }
        }, 0);
        return result;
      };
      return;
    }
    if (nodeData?.name !== NODE_CLASS) return;
    const onCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function () {
      this.__h3Configured = false;
      this.__h3ModeReady = false;
      this.__h3ModeCache = null;
      const result = onCreated?.apply(this, arguments);
      try { buildUI(this); } catch (err) { console.error("[feimao-h3导演台]", err); }
      const node = this;
      setTimeout(() => {
        if (node.__h3Configured) return;
        node.__h3Configured = true;
        try { applyMode(node); } catch (err) { console.error("[feimao-h3导演台]", err); }
      }, 0);
      return result;
    };
    const onConfigure = nodeType.prototype.onConfigure;
    nodeType.prototype.onConfigure = function () {
      const result = onConfigure?.apply(this, arguments);
      this.__h3Configured = true;
      this.__h3ModeReady = false;
      this.__h3ModeCache = null;
      this.__h3ActiveMode = "";
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
    const serialize = nodeType.prototype.serialize;
    nodeType.prototype.serialize = function () {
      try {
        const editor = activeEditor(this);
        if (editor) syncScript(this, editor);
        if (this.__h3ModeReady) rememberMode(this);
      } catch (_) {}
      return serialize?.apply(this, arguments);
    };
    const onResize = nodeType.prototype.onResize;
    nodeType.prototype.onResize = function () {
      const result = onResize?.apply(this, arguments);
      try { pinDomLayout(this); } catch (err) { console.error("[feimao-h3导演台]", err); }
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
      try { repairDirectorOutputs(); } catch (err) { console.error("[feimao-h3导演台]", err); }
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
