import { React, run } from "uebersicht";
// --- Inlined design system (self-contained; formerly theme.js) ---
// Shared design system for the widget set: color tokens, fonts, layout, the
// common card shell, drag/resize handles, a last-known-good cache, and the
// standard data-resolution helper. Imported by every widget so they stay
// visually and behaviorally consistent.
const T = {
  // Accent tints
  tintBlue: "#296BE0",
  tintPink: "#E86E87",
  tintGreen: "#59A875",
  tintOrange: "#D9946B",
  tintPurple: "#A861DE",

  // Cards
  cardLight: "rgba(255,255,255,0.74)",
  cardDark: "rgba(33,36,43,0.88)",

  // Ink (text on light)
  ink: "#1F2129",
  inkDim: "#616670",
  inkMute: "#8C919C",

  // Text on dark
  onDark: "#F7F7FA",
  onDarkDim: "#BDBFC7",
  onDarkMute: "#8F949E",

  // Walls (desktop stand-in backgrounds)
  wall1: "#F0F2F7",
  wall2: "#DBE3ED",
  wall3: "#BFC7DB",

  // GitHub ramp
  ghEmpty: "rgba(255,255,255,0.10)",
  ghGreen1: "#9CE8A8",
  ghGreen2: "#40C463",
  ghGreen3: "#30A14F",
  ghGreen4: "#216E38",

  // Scene colors
  nightSky: "#14141A",
  cosmicBase: "#0A051A",
  cosmicViolet: "#8C338C",
  cosmicMagenta: "#D9598C",
  cosmicIndigo: "#331A66",
  shaderPurple: "#402673",
  shaderTeal: "#268C8C",
  duskBase: "#4D408C",
  duskAmber: "#D9A666",
  duskPurple: "#8C4DA6",
  duskGlow: "#F28073",
  cardCream: "#F2F0E6",
  paperGrain: "#9E8052",

  archivePalette: [
    "#D98C4D", "#A64D33", "#733326", "#E0B359",
    "#8C6640", "#B88CCC", "#594D80", "#8C73BF",
    "#8CBF8C", "#4D8059", "#598CD9", "#334D8C",
  ],

  // Layout
  radius: "24px",
  captionTracking: "1.5px",
};

// Fonts. Install Instrument Serif, Geist, and Geist Mono for the intended look;
// each stack falls back to a system font if the family is missing.
const serif = "'Instrument Serif', Georgia, serif";
const sans = "'Geist', -apple-system, BlinkMacSystemFont, sans-serif";
const mono = "'Geist Mono', 'SF Mono', ui-monospace, monospace";

// Default desktop placement [x, y] per widget. Each widget calls
// card(variant, w, h, ...LAYOUT.<key>) so widgets lay out at distinct positions
// rather than stacking at the origin. These are overridden by any saved
// position from the drag handle.
const LAYOUT = {
  nowSpinning:  [380, 40],
  musicArchive: [40, 40],
  spatial:      [380, 200],
  mosaic:       [1120, 40],
  stack:        [1120, 486],
  drop:         [1120, 708],
  swap:         [380, 672],
  aiDailyPull:  [40, 368],
  apod:         [40, 576],
  atlas:        [1280, 224],
  tarot:        [1120, 224],
};

// Shared card shell. variant is "dark" or "light"; x/y set the on-desktop
// position. The common loading/empty/stale state styles are appended so every
// widget can render those states without repeating CSS.
const card = (variant, w, h, x = 0, y = 0) => `
  position: absolute;
  left: ${x}px; top: ${y}px;
  width: ${w}px;
  height: ${h}px;
  border-radius: ${T.radius};
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,0.35);
  background: ${variant === "dark" ? T.cardDark : T.cardLight};
  backdrop-filter: blur(20px);
  color: ${variant === "dark" ? T.onDark : T.ink};
  font-family: ${sans};
  box-sizing: border-box;
  transform-origin: top left;

  /* Promote each card to its own GPU layer so a sibling widget's frequent
     refresh cannot trigger a backdrop-filter recomposite, which otherwise made
     the blur flicker on and off. */
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;

  .ws-stale { position:absolute; top:8px; right:10px; z-index:5;
              font-family:${mono}; font-size:8px; letter-spacing:1px;
              text-transform:uppercase; opacity:0.72;
              color:${variant === "dark" ? T.onDarkMute : T.inkMute}; }
  .ws-empty { position:absolute; inset:0; display:flex; align-items:center;
              justify-content:center; padding:24px; text-align:center;
              font-family:${serif}; font-style:italic; font-size:18px;
              opacity:0.6; color:${variant === "dark" ? T.onDarkDim : T.inkDim}; }
  .ws-skel  { position:absolute; inset:14px; border-radius:14px; opacity:0.18;
              animation: ws-pulse 1.6s ease-in-out infinite; }
  @keyframes ws-pulse { 0%,100% { opacity:0.10; } 50% { opacity:0.24; } }
  @media (prefers-reduced-motion: reduce) {
    .ws-skel { animation:none; opacity:0.16; }
  }

  .ws-drag  { position:absolute; top:6px; left:6px; z-index:30;
              width:18px; height:18px; border-radius:6px;
              display:flex; align-items:center; justify-content:center;
              font-size:11px; line-height:1; cursor:grab; opacity:0.22;
              transition:opacity .15s ease; user-select:none;
              -webkit-user-select:none;
              color:${variant === "dark" ? T.onDarkMute : T.inkMute};
              background:${variant === "dark"
                ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}; }
  .ws-drag:hover  { opacity:0.95; }
  .ws-drag:active { cursor:grabbing; }

  .ws-resize { position:absolute; bottom:5px; right:5px; z-index:30;
               width:16px; height:16px; border-radius:5px;
               display:flex; align-items:center; justify-content:center;
               font-size:11px; line-height:1; cursor:nwse-resize; opacity:0.22;
               transition:opacity .15s ease; user-select:none;
               -webkit-user-select:none;
               color:${variant === "dark" ? T.onDarkMute : T.inkMute};
               background:${variant === "dark"
                 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}; }
  .ws-resize:hover { opacity:0.95; }
`;

// Small uppercase monospace caption used for metadata labels.
const caption = (color) => `
  font-family: ${mono};
  text-transform: uppercase;
  letter-spacing: ${T.captionTracking};
  color: ${color};
`;

// State helpers, returned as React elements (this is plain JS, not JSX).
const h = React.createElement;

// Loading: an accent-tinted skeleton block.
const Skel = ({ tint = T.tintBlue }) =>
  h("div", { className: "ws-skel", style: { background: tint } });

// Empty: a single quiet line of text.
const Empty = ({ text }) => h("div", { className: "ws-empty" }, text);

// Stale: a small marker showing the time of the last successful refresh.
const Stale = ({ ts }) =>
  h("div", { className: "ws-stale" }, `stale · ${clockStamp(ts)}`);

// Drag and resize support.
//
// Übersicht renders each widget into its own absolutely-positioned `.widget`
// node, all inside a shared `#uebersicht` container. The wrapper to move is the
// nearest `.widget` ancestor of a handle — not the topmost absolute element,
// which is the shared container.
//
// DragHandle updates the wrapper's left/top. ResizeHandle scales it uniformly
// via a top-left-anchored CSS transform, keeping these fixed-layout cards crisp
// instead of clipping. Both persist to localStorage, so position and size
// survive refreshes and reboots.
const posKey = (k) => `ws:pos:${k}`;
const scaleKey = (k) => `ws:scale:${k}`;
const MIN_SCALE = 0.4, MAX_SCALE = 3;

const findWrapper = (node) => node && node.closest(".widget");

// Apply any saved position and scale. Runs on every mount, since the wrapper
// may have been recreated on refresh.
const applySaved = (wrapper, key) => {
  try {
    const pos = JSON.parse(localStorage.getItem(posKey(key)) || "null");
    if (pos && typeof pos.x === "number") {
      wrapper.style.left = pos.x + "px";
      wrapper.style.top = pos.y + "px";
    }
  } catch (e) { /* storage unavailable */ }
  try {
    const scale = parseFloat(localStorage.getItem(scaleKey(key)));
    if (scale > 0) wrapper.style.transform = `scale(${scale})`;
  } catch (e) { /* storage unavailable */ }
};

const initDrag = (node, key) => {
  if (!node) return;
  const wrapper = findWrapper(node);
  if (!wrapper) return;
  applySaved(wrapper, key);

  if (node.__wsDragWired) return; // attach listeners once per node
  node.__wsDragWired = true;

  // Keep grip clicks from reaching the card's own onClick handler.
  node.addEventListener("click", (e) => e.stopPropagation());

  node.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const cs = getComputedStyle(wrapper);
    const origX = parseFloat(wrapper.style.left || cs.left) || 0;
    const origY = parseFloat(wrapper.style.top || cs.top) || 0;
    const onMove = (ev) => {
      wrapper.style.left = origX + (ev.clientX - startX) + "px";
      wrapper.style.top = origY + (ev.clientY - startY) + "px";
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      try {
        localStorage.setItem(posKey(key), JSON.stringify({
          x: parseFloat(wrapper.style.left) || 0,
          y: parseFloat(wrapper.style.top) || 0,
        }));
      } catch (e) { /* storage unavailable */ }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  // Double-click the grip to snap back to the card's default LAYOUT slot.
  node.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    try { localStorage.removeItem(posKey(key)); } catch (e) { /* ignore */ }
    wrapper.style.left = "";
    wrapper.style.top = "";
  });
};

const initResize = (node, key) => {
  if (!node) return;
  const wrapper = findWrapper(node);
  if (!wrapper) return;
  applySaved(wrapper, key);

  if (node.__wsResizeWired) return;
  node.__wsResizeWired = true;

  node.addEventListener("click", (e) => e.stopPropagation());

  node.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const cs = getComputedStyle(wrapper);
    // Layout width/height are unaffected by transform, so they stay constant.
    const baseW = parseFloat(cs.width) || 1;
    const baseH = parseFloat(cs.height) || 1;
    const m = /scale\(([^)]+)\)/.exec(wrapper.style.transform || "");
    const origScale = m ? parseFloat(m[1]) || 1 : 1;
    const onMove = (ev) => {
      const delta = (ev.clientX - startX + (ev.clientY - startY)) / (baseW + baseH);
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, origScale + delta));
      wrapper.style.transform = `scale(${next})`;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      const m2 = /scale\(([^)]+)\)/.exec(wrapper.style.transform || "");
      try { localStorage.setItem(scaleKey(key), String(m2 ? m2[1] : 1)); }
      catch (e) { /* storage unavailable */ }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  // Double-click the corner to restore the card's default size.
  node.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    try { localStorage.removeItem(scaleKey(key)); } catch (e) { /* ignore */ }
    wrapper.style.transform = "";
  });
};

// Each handle takes the widget's LAYOUT key so position and scale are stored
// per widget. DragHandle renders top-left, ResizeHandle bottom-right.
const DragHandle = ({ k }) =>
  h("div", { className: "ws-drag", title: "Drag to move · double-click to reset",
             ref: (n) => initDrag(n, k) }, "☰");

const ResizeHandle = ({ k }) =>
  h("div", { className: "ws-resize", title: "Drag to resize · double-click to reset",
             ref: (n) => initResize(n, k) }, "⤡");

// Last-known-good cache, persisted in localStorage with a timestamp.
const remember = (key, data) => {
  try { localStorage.setItem(`ws:${key}`, JSON.stringify({ data, ts: Date.now() })); }
  catch (e) { /* storage unavailable; skip */ }
};

const recall = (key) => {
  try { return JSON.parse(localStorage.getItem(`ws:${key}`)); }
  catch (e) { return null; }
};

const clockStamp = (ms) =>
  new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// True before the command has produced any output (the initial load tick).
const isLoading = ({ output, error }) =>
  output === undefined && !error;

// Standard data flow for command-backed widgets. parse(output) must return a
// falsy value when there is nothing usable.
//   loading -> { loading: true }            render <Skel/>
//   success -> { data }                     cached as last-known-good
//   failure -> { data, staleTs }            last-known-good + time, render <Stale/>
//   cold    -> { data, mock: true }         mock data, nothing cached yet
const resolve = (key, props, parse, mock) => {
  if (isLoading(props)) return { loading: true };
  let data = null;
  try { data = parse(props.output); } catch (e) { data = null; }
  if (data) { remember(key, data); return { data }; }
  const cached = recall(key);
  if (cached && cached.data) return { data: cached.data, staleTs: cached.ts };
  return { data: mock, mock: true };
};
// --- End inlined design system ---

// A slowly spinning dot-matrix globe with a glowing pin on each visited city.
//
// Continents are sampled from Natural Earth land data, baked into the bit grid
// below, and projected onto a rotating sphere on a canvas. Faint arcs connect
// consecutive cities; clicking a pin opens it in Maps.
//
// To edit: add or remove entries in CITIES below as [latitude, longitude]
// pairs. Order matters only for the connecting arcs.
export const command = false;
export const refreshFrequency = false;

const W = 360, H = 200, R = 74, CX = 102, CY = 124, TILT = 20;

export const className = card("dark", W, H, ...LAYOUT.atlas) + `
  background: transparent; box-shadow: none; backdrop-filter: none; padding: 0; cursor: pointer;
  canvas { width: 100%; height: 100%; display: block; }
`;

// Land/water bitmask: 120x60 cells at 3-degree resolution, baked from
// Natural Earth ne_110m_land. One bit per cell, row-major, base64-packed.
const GRID_COLS = 120, GRID_ROWS = 60, GRID_S = 3;
const GRID_B64 =
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgH/wHwAAAAAAAAAAAAAA8Mf/PwALAAAYAAAAAACY9OP/HwAAAATAAQAAAAAYfQP+HwAAQID/LwgAwAPA0x/8BwAwAOz///8B4f///3X8AQD+8+//////wP///z04YAD3//////9/4P//HwwwAMD7//////86AMH/H1wAAETz/////wcCAAD/f/wAAAT5/////wEDAAD+//0BAPr//////w8BAAD4/z8AAPj//////w8AAAD4/z8AAPi/3v///wsAAAD4/x8AALof7v///wkAAAD4/wcAAA7O3///bwAAAAD4/wcAAA7p3///XwQAAADw/wMAAHwA////DwMAAADg/wEAAP4Z////nwAAAACADwEAAP9/7///HwAAAAAADwAAgP//H///DwAAAAAABgIAgP///vj7AwAAAAAAThAAgP//fPB4AQAAAAAAeAAAwP//PXD4EAAAAAAAwAAAwP//D2DgAAAAAAAAgLgAgP//H2CAAAAAAAAAAPwAAP//HwAAIAAAAAAAAPwHAML/DwAQDAAAAAAAAPwHAID/BwBgBwAAAAAAAP4fAID/AwBAFgEAAAAAAP5/AAD/AQBAAA4AAAAAAP7/AAD/AQAAAxwAAAAAAPz/AAD/AQAAAAAAAAAAAPh/AAD/EwAAgAkAAAAAAPB/AAD/GQAA4BsAAAAAAOB/AAD/CAAA8B8AAAAAAOA/AAD+DAAA/D8AAAAAAPAPAAB+AAAA/H8AAAAAAPAPAAB+AAAA/H8AAAAAAPAHAAA8AAAA+H8AAAAAAPADAAAEAAAACDwAAAAAAPgBAAAAAAAAADhAAAAAAHgAAAAAAAAAAABAAAAAADAAAAAAAAAAAAAgAAAAADgAAAAAAAAAAAAQAAAAABgAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAACAAAAAA8ID//x8AAAAAAHAAAED3//f///8DAAAI9PIAgP////////8PAPj//x8A+P////////8HQPz//wM4/P////////8DAP7////8//////////8H//v/////////////////////////////////////";

const GRID = (() => {
  const bin = atob(GRID_B64);
  const land = [], water = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const lat = 90 - (r + 0.5) * GRID_S;
    for (let c = 0; c < GRID_COLS; c++) {
      const lng = -180 + (c + 0.5) * GRID_S;
      const idx = r * GRID_COLS + c;
      const bit = (bin.charCodeAt(idx >> 3) >> (idx & 7)) & 1;
      (bit ? land : water).push({ lat, lng });
    }
  }
  return { land, water };
})();

// Visited cities as [latitude, longitude]. Edit this list to your own places.
const CITIES = [
  [33.7490,-84.3880],[38.9072,-77.0369],[40.7128,-74.0060],[34.0522,-118.2437],
  [37.7749,-122.4194],[29.7604,-95.3698],[33.5186,-86.8104],[30.3322,-81.6557],
  [27.9506,-82.4572],[39.0997,-94.5786],[18.4655,-66.1057],[18.4861,-69.9312],
  [17.9712,-76.7936],[48.1351,11.5820],[52.5200,13.4050],[48.8566,2.3522],
  [48.5734,7.7521],[48.2082,16.3738],[41.9028,12.4964],
  [33.4942,-111.9261],[40.4850,-106.8317],
].map(([lat, lng]) => ({ lat, lng }));

const RAD = Math.PI / 180;
const proj3 = (lat, lng, rot, tiltDeg) => {
  const f = lat * RAD, l = (lng - rot) * RAD, t = tiltDeg * RAD;
  const cf = Math.cos(f), sf = Math.sin(f), cl = Math.cos(l), sl = Math.sin(l);
  const ct = Math.cos(t), st = Math.sin(t);
  return { x: cf * sl, y: ct * sf - st * cf * cl, z: st * sf + ct * cf * cl };
};

const landColor = (lat, z) =>
  Math.abs(lat) > 72 ? `rgba(228,236,240,${0.3 + 0.6 * z})`
                     : `rgba(108,222,148,${0.3 + 0.62 * z})`;
const waterColor = (lat, z) =>
  Math.abs(lat) > 75 ? `rgba(205,222,236,${0.2 + 0.5 * z})`
                     : `rgba(64,132,210,${0.16 + 0.5 * z})`;

// Animation state.
//
// The render loop is driven by setInterval rather than requestAnimationFrame:
// Übersicht's desktop WebView is always backgrounded, where rAF (and CSS
// animations) are throttled and may stop ticking entirely. A generation token
// and the timer handle are stored on `window` (shared across the module reloads
// Übersicht performs) so each new instance cancels the previous timer instead
// of stacking loops that fight over the canvas. The rotation angle is also kept
// on `window` so it resumes from the same position after a reload.
const GEN = (window.__wsGlobeGen = (window.__wsGlobeGen || 0) + 1);
const REDUCED = typeof window !== "undefined" && window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const dot = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); };

const drawGlobe = () => {
  if (window.__wsGlobeGen !== GEN) { clearInterval(window.__wsGlobeTimer); return; }
  const cv = document.getElementById("ws-globe");
  if (!cv) return;
  const dpr = window.devicePixelRatio || 1;
  if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  if (window.__wsGlobeRot == null) window.__wsGlobeRot = 0;
  const rot = window.__wsGlobeRot;

  // Ocean sphere base.
  const g = ctx.createRadialGradient(CX - 24, CY - 24, 8, CX, CY, R);
  g.addColorStop(0, "rgba(28,58,96,0.5)");
  g.addColorStop(1, "rgba(8,20,40,0.22)");
  ctx.fillStyle = g;
  dot(ctx, CX, CY, R);

  // Water dots, drawn first so land sits on top.
  for (let i = 0; i < GRID.water.length; i++) {
    const w = GRID.water[i];
    const p = proj3(w.lat, w.lng, rot, TILT);
    if (p.z <= 0.02) continue;
    ctx.fillStyle = waterColor(w.lat, p.z);
    dot(ctx, CX + p.x * R, CY - p.y * R, 0.85);
  }
  // Land dots.
  for (let i = 0; i < GRID.land.length; i++) {
    const ld = GRID.land[i];
    const p = proj3(ld.lat, ld.lng, rot, TILT);
    if (p.z <= 0.02) continue;
    ctx.fillStyle = landColor(ld.lat, p.z);
    dot(ctx, CX + p.x * R, CY - p.y * R, 1.15);
  }
  // Arcs connecting consecutive cities, drawn only when both ends face forward.
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,140,160,0.35)";
  for (let i = 0; i + 1 < CITIES.length; i++) {
    const a = proj3(CITIES[i].lat, CITIES[i].lng, rot, TILT);
    const b = proj3(CITIES[i + 1].lat, CITIES[i + 1].lng, rot, TILT);
    if (a.z <= 0.05 || b.z <= 0.05) continue;
    const ax = CX + a.x * R, ay = CY - a.y * R;
    const bx = CX + b.x * R, by = CY - b.y * R;
    // Bow the line outward from the globe center for a flight-path feel.
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const ox = mx - CX, oy = my - CY;
    const len = Math.hypot(ox, oy) || 1;
    const lift = 14;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(mx + (ox / len) * lift, my + (oy / len) * lift, bx, by);
    ctx.stroke();
  }
  // City pins with halo.
  for (let i = 0; i < CITIES.length; i++) {
    const p = proj3(CITIES[i].lat, CITIES[i].lng, rot, TILT);
    if (p.z <= 0) continue;
    const x = CX + p.x * R, y = CY - p.y * R;
    ctx.fillStyle = "rgba(255,90,110,0.4)"; dot(ctx, x, y, 5);
    ctx.fillStyle = "#FF6B81"; dot(ctx, x, y, 2.1);
  }

  if (!REDUCED) window.__wsGlobeRot = (rot + 0.4) % 360;
};

// Claim ownership and (re)start the single shared timer at ~30fps.
const ensureSpin = () => {
  window.__wsGlobeGen = GEN;
  if (window.__wsGlobeTimer) clearInterval(window.__wsGlobeTimer);
  window.__wsGlobeTimer = setInterval(drawGlobe, 33);
};

// Translate a click into the nearest forward-facing pin and open it in Maps.
const onPick = (e) => {
  const cv = document.getElementById("ws-globe");
  if (!cv) return run(`open -a "Maps"`);
  const rect = cv.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (W / rect.width);
  const my = (e.clientY - rect.top) * (H / rect.height);
  const rot = window.__wsGlobeRot || 0;
  let best = null, bestD = 14 * 14;
  for (const c of CITIES) {
    const p = proj3(c.lat, c.lng, rot, TILT);
    if (p.z <= 0) continue;
    const x = CX + p.x * R, y = CY - p.y * R;
    const d = (x - mx) * (x - mx) + (y - my) * (y - my);
    if (d < bestD) { bestD = d; best = c; }
  }
  if (best) run(`open "https://maps.apple.com/?ll=${best.lat},${best.lng}"`);
  else run(`open -a "Maps"`);
};

export const render = () => {
  ensureSpin();
  return (
    <div aria-label={`Spinning globe, ${CITIES.length} cities visited`} onClick={onPick}>
      <DragHandle k="atlas" />
      <ResizeHandle k="atlas" />
      <canvas id="ws-globe" />
    </div>
  );
};
