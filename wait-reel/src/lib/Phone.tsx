import { RoundedBox } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";
import { Draw, drawCheck, font, rr, useCanvasTexture } from "./three";

export const PHONE_W = 0.076;
export const PHONE_H = 0.158;
export const PHONE_D = 0.0085;

export type ChatMsg = {
  me: boolean;
  text: string;
  time?: string;
  /** 0..1 read-receipt (double check turns blue) */
  read?: number;
  /** 0..1 appear animation */
  appear?: number;
};

export type ChatState = {
  shop: string;
  avatar: string;
  status?: string;
  msgs: ChatMsg[];
  input?: string;
  caret?: boolean;
  clock?: string;
};

const W = 600;
const H = 1250;

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxW: number) => {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
};

export const drawChat = (ctx: CanvasRenderingContext2D, s: ChatState, ox = 0) => {
  ctx.save();
  ctx.translate(ox, 0);
  // wallpaper
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#f3efe9");
  g.addColorStop(1, "#e9e2f5");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // subtle pattern
  ctx.fillStyle = "rgba(120,100,160,0.06)";
  for (let y = 210; y < H - 150; y += 70)
    for (let x = (y / 70) % 2 ? 20 : 55; x < W; x += 70) {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  // status bar
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, 200);
  ctx.fillStyle = "#111";
  ctx.font = font(30, 700);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(s.clock ?? "21:14", 44, 42);
  // signal bars + battery, drawn (no glyph dependency)
  for (let i = 0; i < 4; i++) ctx.fillRect(W - 170 + i * 14, 52 - i * 7, 9, 10 + i * 7);
  rr(ctx, W - 102, 30, 52, 26, 7);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#111";
  ctx.stroke();
  ctx.fillRect(W - 97, 35, 36, 16);
  // header
  ctx.fillStyle = s.avatar;
  ctx.beginPath();
  ctx.arc(110, 135, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = font(40, 900);
  ctx.textAlign = "center";
  ctx.fillText(s.shop[0], 110, 138);
  ctx.textAlign = "left";
  ctx.fillStyle = "#111";
  ctx.font = font(34, 800);
  ctx.fillText(s.shop, 172, 118);
  ctx.font = font(24, 600);
  ctx.fillStyle = s.status === "онлайн" ? "#1fa855" : "#8a8a96";
  ctx.fillText(s.status ?? "", 172, 158);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(52, 118);
  ctx.lineTo(36, 135);
  ctx.lineTo(52, 152);
  ctx.stroke();
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, 198, W, 2);

  // messages, stacked from the bottom
  let y = H - 165;
  ctx.font = font(36, 700);
  for (let i = s.msgs.length - 1; i >= 0; i--) {
    const m = s.msgs[i];
    const a = m.appear ?? 1;
    if (a <= 0) continue;
    const lines = wrap(ctx, m.text, 360);
    const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const bw = Math.max(tw + 60, m.me ? 230 : 160);
    const bh = lines.length * 46 + 70;
    const x = m.me ? W - 30 - bw : 30;
    const by = y - bh;
    ctx.save();
    ctx.globalAlpha = Math.min(1, a * 1.5);
    const sc = 0.6 + 0.4 * Math.min(1, a);
    ctx.translate(m.me ? x + bw : x, by + bh);
    ctx.scale(sc, sc);
    ctx.translate(-(m.me ? x + bw : x), -(by + bh));
    ctx.shadowColor = "rgba(40,20,80,0.18)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = m.me ? "#7b5cff" : "#ffffff";
    rr(ctx, x, by, bw, bh, 30);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.fillStyle = m.me ? "#ffffff" : "#16161d";
    ctx.font = font(36, 700);
    ctx.textAlign = "left";
    lines.forEach((l, li) => ctx.fillText(l, x + 30, by + 44 + li * 46));
    ctx.font = font(22, 600);
    ctx.fillStyle = m.me ? "rgba(255,255,255,0.75)" : "#8a8a96";
    ctx.textAlign = "right";
    const tx = m.me ? x + bw - 78 : x + bw - 24;
    ctx.fillText(m.time ?? "21:14", tx, by + bh - 24);
    if (m.me) {
      const r = m.read ?? 0;
      const col = r > 0.5 ? "#7ff3ff" : "rgba(255,255,255,0.8)";
      drawCheck(ctx, x + bw - 66, by + bh - 38, 24, col, 4.5);
      if (r > 0) {
        ctx.globalAlpha = Math.min(1, a * 1.5) * Math.min(1, r * 2);
        drawCheck(ctx, x + bw - 52, by + bh - 38, 24, col, 4.5);
      }
    }
    ctx.restore();
    y = by - 22;
  }

  // input bar
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, H - 130, W, 130);
  ctx.fillStyle = "#f0eef5";
  rr(ctx, 30, H - 108, W - 150, 80, 40);
  ctx.fill();
  ctx.font = font(32, 700);
  ctx.textAlign = "left";
  const inp = s.input ?? "";
  ctx.fillStyle = inp ? "#16161d" : "#a2a0ad";
  ctx.fillText(inp || "Хабарлама...", 62, H - 66);
  if (s.caret) {
    const cw = ctx.measureText(inp).width;
    ctx.fillStyle = "#7b5cff";
    ctx.fillRect(66 + cw, H - 88, 4, 42);
  }
  ctx.fillStyle = "#7b5cff";
  ctx.beginPath();
  ctx.arc(W - 72, H - 68, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(W - 90, H - 88);
  ctx.lineTo(W - 50, H - 68);
  ctx.lineTo(W - 90, H - 48);
  ctx.lineTo(W - 82, H - 68);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

/** Glass+aluminium phone. `draw` paints the screen. Screen faces +Z. */
export const Phone: React.FC<{
  draw: Draw;
  drawKey: string;
  glow?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  body?: string;
}> = ({ draw, drawKey, glow = 1.0, position, rotation, scale = 1, body = "#23232b" }) => {
  const tex = useCanvasTexture(W, H, draw, drawKey);
  const mats = useMemo(
    () => ({
      frame: new THREE.MeshPhysicalMaterial({
        color: body,
        metalness: 0.85,
        roughness: 0.28,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      }),
      back: new THREE.MeshPhysicalMaterial({
        color: "#c9b8ff",
        metalness: 0.2,
        roughness: 0.35,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      }),
      lens: new THREE.MeshPhysicalMaterial({ color: "#0b0b10", roughness: 0.05, clearcoat: 1 }),
    }),
    [body],
  );
  const screenMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#000000",
        roughness: 0.12,
        metalness: 0,
        toneMapped: false,
      }),
    [],
  );
  screenMat.emissiveMap = tex;
  screenMat.emissive.setScalar(glow);
  screenMat.needsUpdate = screenMat.userData.tex !== tex;
  screenMat.userData.tex = tex;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[PHONE_W, PHONE_H, PHONE_D]} radius={0.0075} smoothness={6} castShadow material={mats.frame} />
      <mesh position={[0, 0, -PHONE_D / 2 - 0.0002]} rotation={[0, Math.PI, 0]} material={mats.back}>
        <planeGeometry args={[PHONE_W - 0.006, PHONE_H - 0.006]} />
      </mesh>
      {/* camera bump */}
      <RoundedBox
        args={[0.026, 0.026, 0.003]}
        radius={0.006}
        position={[0.018, 0.058, -PHONE_D / 2 - 0.0015]}
        material={mats.frame}
      />
      <mesh position={[0.018, 0.058, PHONE_D / 2 + 0.0001]} rotation={[0, 0, 0]} visible={false} />
      <mesh position={[0, 0, PHONE_D / 2 + 0.0002]} material={screenMat}>
        <planeGeometry args={[PHONE_W - 0.005, PHONE_H - 0.005]} />
      </mesh>
      {/* dynamic island */}
      <mesh position={[0, PHONE_H / 2 - 0.009, PHONE_D / 2 + 0.0004]} material={mats.lens}>
        <planeGeometry args={[0.018, 0.0045]} />
      </mesh>
    </group>
  );
};

export const CHAT_W = W;
export const CHAT_H = H;
