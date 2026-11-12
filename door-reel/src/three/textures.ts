import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();

const make = (
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  opts: { repeat?: [number, number]; srgb?: boolean } = {},
) => {
  const found = cache.get(key);
  if (found) return found;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  if (opts.srgb !== false) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (opts.repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(...opts.repeat);
  }
  cache.set(key, tex);
  return tex;
};

// deterministic pseudo random
const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

export const woodFloor = (repeat: [number, number] = [3, 3]) =>
  make(
    "wood" + repeat.join(),
    1024,
    1024,
    (ctx, w, h) => {
      const r = rng(7);
      const plankH = h / 8;
      for (let row = 0; row < 8; row++) {
        let x = -r() * 300;
        while (x < w) {
          const len = 280 + r() * 260;
          const base = 150 + r() * 40;
          ctx.fillStyle = `rgb(${base + 40},${base - 5},${base - 55})`;
          ctx.fillRect(x, row * plankH, len, plankH);
          // grain
          for (let g = 0; g < 14; g++) {
            ctx.strokeStyle = `rgba(90,55,25,${0.06 + r() * 0.08})`;
            ctx.lineWidth = 1 + r() * 2;
            ctx.beginPath();
            const yy = row * plankH + r() * plankH;
            ctx.moveTo(x, yy);
            ctx.bezierCurveTo(
              x + len * 0.3,
              yy + (r() - 0.5) * 10,
              x + len * 0.7,
              yy + (r() - 0.5) * 10,
              x + len,
              yy,
            );
            ctx.stroke();
          }
          ctx.fillStyle = "rgba(60,35,18,0.55)";
          ctx.fillRect(x, row * plankH, 3, plankH);
          x += len;
        }
        ctx.fillStyle = "rgba(60,35,18,0.5)";
        ctx.fillRect(0, row * plankH, w, 3);
      }
    },
    { repeat },
  );

export const fabric = () =>
  make(
    "fabric",
    256,
    256,
    (ctx, w, h) => {
      const r = rng(3);
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 4000; i++) {
        const v = 110 + r() * 40;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(r() * w, r() * h, 2, 2);
      }
    },
    { repeat: [4, 4], srgb: false },
  );

export const rugTex = () =>
  make("rug", 512, 512, (ctx, w) => {
    const cx = w / 2;
    const rings = [
      "#C96B4B",
      "#E9D3B4",
      "#3F6E73",
      "#E9D3B4",
      "#C96B4B",
      "#E9D3B4",
    ];
    rings.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(cx, cx, cx - i * 38, 0, Math.PI * 2);
      ctx.fill();
    });
  });

export const gradientBg = (top: string, bottom: string, key: string) =>
  make(key, 4, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

// ---------- card icons ----------
export type IconKind =
  | "sofa"
  | "door"
  | "kitchen"
  | "cup"
  | "phone"
  | "charger"
  | "window"
  | "plant";

const rr = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export const drawCharger = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
) => {
  // cable (dark edge + light core)
  ctx.lineCap = "round";
  ctx.strokeStyle = "#2B2D42";
  ctx.lineWidth = 15 * s;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 40 * s);
  ctx.bezierCurveTo(
    cx,
    cy + 110 * s,
    cx + 120 * s,
    cy + 40 * s,
    cx + 110 * s,
    cy + 110 * s,
  );
  ctx.stroke();
  ctx.strokeStyle = "#F7F7F2";
  ctx.lineWidth = 8 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy + 40 * s);
  ctx.bezierCurveTo(
    cx,
    cy + 110 * s,
    cx + 120 * s,
    cy + 40 * s,
    cx + 110 * s,
    cy + 110 * s,
  );
  ctx.stroke();
  // prongs
  ctx.fillStyle = "#6B7080";
  ctx.fillRect(cx - 26 * s, cy - 100 * s, 12 * s, 40 * s);
  ctx.fillRect(cx + 14 * s, cy - 100 * s, 12 * s, 40 * s);
  // body
  const g = ctx.createLinearGradient(cx - 50 * s, 0, cx + 50 * s, 0);
  g.addColorStop(0, "#FFFFFF");
  g.addColorStop(1, "#DCDDE2");
  ctx.fillStyle = g;
  rr(ctx, cx - 50 * s, cy - 65 * s, 100 * s, 110 * s, 22 * s);
  ctx.fill();
  ctx.strokeStyle = "#2B2D42";
  ctx.lineWidth = 7 * s;
  ctx.stroke();
  // bolt
  ctx.fillStyle = "#FFC21A";
  ctx.beginPath();
  ctx.moveTo(cx + 8 * s, cy - 50 * s);
  ctx.lineTo(cx - 22 * s, cy - 2 * s);
  ctx.lineTo(cx - 2 * s, cy - 2 * s);
  ctx.lineTo(cx - 10 * s, cy + 32 * s);
  ctx.lineTo(cx + 22 * s, cy - 14 * s);
  ctx.lineTo(cx + 2 * s, cy - 14 * s);
  ctx.closePath();
  ctx.fill();
};

const drawIcon = (
  ctx: CanvasRenderingContext2D,
  kind: IconKind,
  cx: number,
  cy: number,
) => {
  ctx.lineJoin = "round";
  switch (kind) {
    case "sofa":
      ctx.fillStyle = "#E07A5F";
      rr(ctx, cx - 120, cy - 40, 240, 70, 22);
      ctx.fill();
      rr(ctx, cx - 140, cy - 10, 50, 80, 18);
      ctx.fill();
      rr(ctx, cx + 90, cy - 10, 50, 80, 18);
      ctx.fill();
      ctx.fillStyle = "#C45D44";
      rr(ctx, cx - 95, cy + 20, 190, 45, 14);
      ctx.fill();
      break;
    case "door":
      ctx.fillStyle = "#8B5A3C";
      rr(ctx, cx - 60, cy - 100, 120, 200, 10);
      ctx.fill();
      ctx.strokeStyle = "#6A4129";
      ctx.lineWidth = 8;
      rr(ctx, cx - 42, cy - 80, 84, 70, 6);
      ctx.stroke();
      rr(ctx, cx - 42, cy + 0, 84, 80, 6);
      ctx.stroke();
      ctx.fillStyle = "#F2C14E";
      ctx.beginPath();
      ctx.arc(cx + 38, cy + 4, 9, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "kitchen":
      ctx.fillStyle = "#81B29A";
      rr(ctx, cx - 130, cy - 10, 260, 100, 10);
      ctx.fill();
      ctx.fillStyle = "#5E8C77";
      rr(ctx, cx - 130, cy - 110, 260, 60, 10);
      ctx.fill();
      ctx.fillStyle = "#F4F1DE";
      rr(ctx, cx - 140, cy - 20, 280, 14, 5);
      ctx.fill();
      ctx.fillStyle = "#3D405B";
      ctx.beginPath();
      ctx.arc(cx - 50, cy + 40, 14, 0, Math.PI * 2);
      ctx.arc(cx + 50, cy + 40, 14, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "cup":
      ctx.fillStyle = "#F4F1DE";
      rr(ctx, cx - 55, cy - 50, 110, 120, 22);
      ctx.fill();
      ctx.strokeStyle = "#F4F1DE";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(cx + 62, cy + 5, 28, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 7;
      for (const dx of [-22, 8]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx, cy - 70);
        ctx.bezierCurveTo(
          cx + dx - 18,
          cy - 90,
          cx + dx + 18,
          cy - 105,
          cx + dx,
          cy - 125,
        );
        ctx.stroke();
      }
      break;
    case "phone":
      ctx.fillStyle = "#2B2D42";
      rr(ctx, cx - 55, cy - 105, 110, 210, 22);
      ctx.fill();
      ctx.fillStyle = "#8ECAE6";
      rr(ctx, cx - 44, cy - 88, 88, 168, 10);
      ctx.fill();
      ctx.fillStyle = "#E63946";
      rr(ctx, cx - 30, cy - 70, 22, 50, 5);
      ctx.fill();
      break;
    case "charger":
      drawCharger(ctx, cx - 30, cy + 5, 1);
      break;
    case "window":
      ctx.fillStyle = "#FFE8A3";
      rr(ctx, cx - 90, cy - 90, 180, 180, 8);
      ctx.fill();
      ctx.strokeStyle = "#F4F1DE";
      ctx.lineWidth = 14;
      ctx.strokeRect(cx - 90, cy - 90, 180, 180);
      ctx.beginPath();
      ctx.moveTo(cx, cy - 90);
      ctx.lineTo(cx, cy + 90);
      ctx.moveTo(cx - 90, cy);
      ctx.lineTo(cx + 90, cy);
      ctx.stroke();
      break;
    case "plant":
      ctx.fillStyle = "#C96B4B";
      rr(ctx, cx - 45, cy + 20, 90, 80, 12);
      ctx.fill();
      ctx.fillStyle = "#4F8A5B";
      for (const [dx, dy, r] of [
        [0, -40, 50],
        [-45, -5, 38],
        [45, -5, 38],
        [0, -95, 32],
      ]) {
        ctx.beginPath();
        ctx.ellipse(cx + dx, cy + dy, r * 0.7, r, dx / 60, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
  }
};

const BG: Record<IconKind, [string, string]> = {
  sofa: ["#FFE7C2", "#F7C59F"],
  door: ["#FDE2C9", "#F4B183"],
  kitchen: ["#E1F2E6", "#B6DCC2"],
  cup: ["#D8C7B3", "#B08968"],
  phone: ["#E3F1FB", "#A9D3F0"],
  charger: ["#3A6FF8", "#1D3FA6"],
  window: ["#BDE0FE", "#8FC1F2"],
  plant: ["#F1F7E9", "#CFE5B9"],
};

/** A film-frame style card with an icon. */
export const cardTex = (kind: IconKind, film = true) =>
  make("card2-" + kind + film, 512, 384, (ctx, w, h) => {
    ctx.fillStyle = "#16161A";
    ctx.fillRect(0, 0, w, h);
    if (film) {
      ctx.fillStyle = "#EDEDED";
      for (let x = 14; x < w; x += 46) {
        rr(ctx, x, 9, 24, 16, 4);
        ctx.fill();
        rr(ctx, x, h - 25, 24, 16, 4);
        ctx.fill();
      }
    }
    const [a, b] = BG[kind];
    const g = ctx.createLinearGradient(0, 34, 0, h - 34);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    ctx.fillStyle = g;
    rr(ctx, 16, 36, w - 32, h - 72, 14);
    ctx.fill();
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    drawIcon(ctx, kind, w / 2, h / 2 + 4);
    ctx.restore();
  });

/** Round thought-bubble texture with charger inside (transparent background). */
export const thoughtTex = () =>
  make("thought3", 512, 512, (ctx, w) => {
    const c = w / 2;
    // soft dark halo so the bubble reads on light backgrounds
    const sh = ctx.createRadialGradient(c, c + 8, c * 0.8, c, c + 8, c);
    sh.addColorStop(0, "rgba(30,40,70,0.35)");
    sh.addColorStop(1, "rgba(30,40,70,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(0, 0, w, w);
    const g = ctx.createRadialGradient(c, c, 40, c, c, c);
    g.addColorStop(0, "#F4F8FF");
    g.addColorStop(1, "#BFD3FF");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c, c, c - 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#3A6FF8";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(c, c, c - 34, 0, Math.PI * 2);
    ctx.stroke();
    drawCharger(ctx, c - 30, c + 5, 1.25);
  });

/** Charger icon on transparent background (for glowing orb). */
export const chargerIconTex = () =>
  make("chargerIcon2", 512, 512, (ctx, w) => {
    drawCharger(ctx, w / 2 - 35, w / 2 + 10, 1.6);
  });

export const pictureTex = (seed: number) =>
  make("pic" + seed, 256, 320, (ctx, w, h) => {
    const r = rng(seed + 11);
    const sky = ["#F6BD60", "#84A59D", "#F28482", "#90BE6D"][seed % 4];
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(w * (0.3 + r() * 0.4), h * 0.3, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(40,50,60,0.55)";
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w * 0.35, h * 0.55);
    ctx.lineTo(w * 0.6, h * 0.75);
    ctx.lineTo(w * 0.8, h * 0.5);
    ctx.lineTo(w, h * 0.7);
    ctx.lineTo(w, h);
    ctx.fill();
  });
