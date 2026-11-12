import { RoundedBox } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";
import { Character } from "../lib/Character";
import { Phone } from "../lib/Phone";
import { Bubble3D, CanvasPanel, drawPill, Sparkles3D } from "../lib/props";
import { Robot } from "../lib/Robot";
import { CamRig, Draw, drawCheck, font, KeyLight, Label, rr, Stage } from "../lib/three";
import { kf, lerp, pop, prog, T, useT, wobble } from "../lib/time";

/* --------------------------------------------------------------- layout */
const PELVIS: [number, number, number] = [0.15, 0.68, 0.05];
// lying on the back, head towards -X, face up
const LIE_ROT: [number, number, number] = (() => {
  const m = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
  );
  const e = new THREE.Euler().setFromRotationMatrix(m);
  return [e.x, e.y, e.z];
})();
const HEAD: [number, number, number] = [PELVIS[0] - 0.78, PELVIS[1] + 0.02, PELVIS[2]];
const STAND: [number, number, number] = [-1.35, 0, -0.45];
const PHONE_POS: [number, number, number] = [STAND[0] + 0.05, 0.585, STAND[2] + 0.06];
const ROBOT: [number, number, number] = [-1.0, 1.45, 0.25];
// during the conversation the robot hovers next to the chat column, in front of the window
const ROBOT_CHAT: [number, number, number] = [-0.3, 2.12, 0.15];

const NOTES = [
  { at: 62.6, name: "Айгерім", text: "Бағасы қанша?" },
  { at: 64.2, name: "Ерлан", text: "Сәлеметсіз бе!" },
  { at: 65.6, name: "Дана", text: "Жеткізу бар ма?" },
  { at: 66.9, name: "Асқар", text: "Бар ма әлі?" },
  { at: 68.1, name: "Мадина", text: "Жауап берсеңізші..." },
];

/* ------------------------------------------------------------ textures */
const drawLock = (count: number, clock: string, botMode: number): Draw => (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#1b1440");
  g.addColorStop(1, "#06060f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = font(150, 700);
  ctx.fillText(clock, w / 2, 260);
  ctx.font = font(30, 600);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Жаңа хабарламалар", w / 2, 320);
  const shown = NOTES.slice(0, count);
  shown.forEach((n, i) => {
    const y = 380 + i * 150;
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    rr(ctx, 30, y, w - 60, 130, 30);
    ctx.fill();
    ctx.fillStyle = botMode > 0.5 ? "#22d38a" : "#e2557a";
    ctx.beginPath();
    ctx.arc(95, y + 65, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = font(34, 800);
    ctx.fillText(n.name[0], 95, y + 77);
    ctx.textAlign = "left";
    ctx.font = font(30, 800);
    ctx.fillText(n.name, 150, y + 52);
    ctx.font = font(28, 600);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(botMode > 0.5 ? "Бот: жауап берілді" : n.text, 150, y + 96);
    if (botMode > 0.5) drawCheck(ctx, w - 100, y + 45, 40, "#22d38a", 7);
    ctx.textAlign = "center";
  });
  if (count > 0 && botMode < 0.5) {
    ctx.fillStyle = "#ff3b5c";
    ctx.beginPath();
    ctx.arc(w - 70, 70, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = font(40, 900);
    ctx.fillText(String(count * 3 + 1), w - 70, 84);
  }
};

const drawSky: Draw = (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#0a1240");
  g.addColorStop(1, "#253a7a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 12543.123) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.4 + (i % 5) * 0.12})`;
    ctx.beginPath();
    ctx.arc(Math.abs(x) * w, Math.abs(y) * h * 0.8, 1.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  // moon with glow
  const mx = w * 0.66;
  const my = h * 0.3;
  const rg = ctx.createRadialGradient(mx, my, 20, mx, my, 220);
  rg.addColorStop(0, "rgba(255,247,214,0.55)");
  rg.addColorStop(1, "rgba(255,247,214,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff6d6";
  ctx.beginPath();
  ctx.arc(mx, my, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(220,210,180,0.6)";
  [
    [-20, -15, 14],
    [22, 18, 10],
    [8, -30, 7],
  ].forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
    ctx.fill();
  });
  // skyline
  ctx.fillStyle = "#070a1f";
  for (let i = 0; i < 12; i++) {
    const bw = w / 12;
    const bh = h * (0.12 + ((i * 37) % 7) * 0.035);
    ctx.fillRect(i * bw, h - bh, bw - 4, bh);
    ctx.fillStyle = "#ffd98a";
    if (i % 2) ctx.fillRect(i * bw + 10, h - bh + 20, 8, 10);
    ctx.fillStyle = "#070a1f";
  }
};

const drawClock = (txt: string): Draw => (ctx, w, h) => {
  ctx.fillStyle = "#050507";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#ff5a4a";
  ctx.shadowColor = "#ff3b2a";
  ctx.shadowBlur = 18;
  ctx.font = font(h * 0.62, 800);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(txt, w / 2, h / 2 + 4);
};

/* ------------------------------------------------------------- pieces */
const Bedroom: React.FC<{ t: number; clock: string }> = ({ t, clock }) => {
  const wood = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#8a5a3a", roughness: 0.45, clearcoat: 0.4 }), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshPhysicalMaterial color="#3a2a3e" roughness={0.5} clearcoat={0.3} />
      </mesh>
      <mesh position={[0, 2.5, -1.25]} receiveShadow>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#2c3260" roughness={0.95} />
      </mesh>
      {/* window with the moon */}
      <group position={[0.75, 1.65, -1.235]}>
        <CanvasPanel w={1.2} h={1.3} px={600} draw={drawSky} drawKey="sky" emissive={1.25} position={[0, 0, 0]} />
        {[
          [0, 0.68, 1.32, 0.07],
          [0, -0.68, 1.32, 0.07],
          [-0.63, 0, 0.07, 1.4],
          [0.63, 0, 0.07, 1.4],
          [0, 0, 0.04, 1.3],
          [0, 0, 1.2, 0.04],
        ].map(([x, y, w, h], i) => (
          <RoundedBox key={i} args={[w, h, 0.06]} radius={0.01} position={[x, y, 0.03]} castShadow>
            <meshStandardMaterial color="#e9e4f5" roughness={0.6} />
          </RoundedBox>
        ))}
      </group>
      {/* digital wall clock above the window */}
      <RoundedBox args={[0.62, 0.24, 0.06]} radius={0.03} position={[0.75, 2.62, -1.22]} castShadow>
        <meshPhysicalMaterial color="#141420" roughness={0.3} clearcoat={1} />
      </RoundedBox>
      <CanvasPanel w={0.56} h={0.19} px={560} draw={drawClock(clock)} drawKey={`w${clock}`} emissive={1.7} position={[0.75, 2.62, -1.188]} />
      {/* bed */}
      <RoundedBox args={[2.3, 0.35, 1.5]} radius={0.06} position={[0.05, 0.25, 0.05]} material={wood} castShadow receiveShadow />
      <RoundedBox args={[0.12, 1.1, 1.6]} radius={0.05} position={[-1.12, 0.6, 0.05]} material={wood} castShadow receiveShadow />
      <RoundedBox args={[2.2, 0.2, 1.42]} radius={0.08} position={[0.05, 0.52, 0.05]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#e8e6f2" roughness={0.9} sheen={1} sheenColor="#ffffff" />
      </RoundedBox>
      <RoundedBox args={[0.45, 0.15, 0.85]} radius={0.07} position={[-0.8, 0.68, 0.05]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f6f4ff" roughness={0.9} sheen={1} sheenColor="#ffffff" />
      </RoundedBox>
      {/* blanket */}
      <RoundedBox args={[1.65, 0.2, 1.5]} radius={0.09} position={[0.42, 0.72 + Math.sin(t * 1.4) * 0.006, 0.05]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#5b6fd6" roughness={0.85} sheen={1} sheenColor="#b8c4ff" />
      </RoundedBox>
      {/* nightstand */}
      <RoundedBox args={[0.55, 0.55, 0.45]} radius={0.04} position={[STAND[0], 0.275, STAND[2]]} material={wood} castShadow receiveShadow />
      <RoundedBox args={[0.24, 0.1, 0.07]} radius={0.015} position={[STAND[0] - 0.13, 0.6, STAND[2] - 0.08]} rotation={[0, 0.4, 0]} castShadow>
        <meshPhysicalMaterial color="#202027" roughness={0.3} clearcoat={1} />
      </RoundedBox>
      <group position={[STAND[0] - 0.13, 0.6, STAND[2] - 0.08]} rotation={[0, 0.4, 0]}>
        <CanvasPanel w={0.21} h={0.075} px={420} draw={drawClock(clock)} drawKey={clock} emissive={1.6} position={[0, 0, 0.036]} />
      </group>
      {/* small lamp off */}
      <mesh position={[STAND[0] + 0.15, 0.7, STAND[2] - 0.12]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.16, 24]} />
        <meshPhysicalMaterial color="#efe6d6" roughness={0.7} />
      </mesh>
    </group>
  );
};

const Customer: React.FC<{ color: string; smile: number; position: [number, number, number]; scale?: number }> = ({
  color,
  smile,
  position,
  scale = 1,
}) => (
  <group position={position} scale={scale}>
    <mesh castShadow>
      <sphereGeometry args={[0.1, 32, 24]} />
      <meshPhysicalMaterial color="#e6a87e" roughness={0.55} sheen={0.4} />
    </mesh>
    <mesh position={[0, 0.03, -0.01]} scale={[1.08, 0.85, 1.08]}>
      <sphereGeometry args={[0.1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      <meshPhysicalMaterial color={color} roughness={0.5} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.035, 0.01, 0.092]}>
        <sphereGeometry args={[0.013, 12, 10]} />
        <meshStandardMaterial color="#1b120c" />
      </mesh>
    ))}
    <mesh position={[0, -0.03, 0.093]} rotation={[0, 0, Math.PI + (Math.PI - (0.8 + smile * 1.6)) / 2]}>
      <torusGeometry args={[0.028, 0.006, 6, 16, 0.8 + smile * 1.6]} />
      <meshStandardMaterial color="#7a2a24" />
    </mesh>
  </group>
);

/* chat-bot conversation, floating in front of the window */
const ROWS = [2.5, 2.18, 1.86];
const CONVO = [
  { q: 75.55, a: 75.85, cust: "Бағасы қанша?", bot: "Бағасы: 12 000 ₸", color: "#e2557a" },
  { q: 77.1, a: 77.45, cust: "Жеткізу бар ма?", bot: "Иә, ертең жеткіземіз!", color: "#f2a33a" },
  { q: 78.95, a: 79.6, cust: "Жазылайын!", bot: "Жазылдыңыз", color: "#3aa0f2" },
];

/* ---------------------------------------------------------------- scene */
type Key = [number, [number, number, number], [number, number, number], number];
const CAM_OLD: Key[] = [
  [61.6, [-0.05, 1.35, 1.25], [HEAD[0], HEAD[1] - 0.05, HEAD[2]], 30],
  [63.9, [-0.2, 1.3, 1.05], [HEAD[0], HEAD[1] - 0.05, HEAD[2]], 30],
  [64.6, [-0.55, 1.45, 1.25], [PHONE_POS[0], 0.92, PHONE_POS[2]], 32],
  [68.6, [-0.75, 1.42, 1.05], [PHONE_POS[0], 0.92, PHONE_POS[2]], 32],
  [70.6, [0.55, 1.9, 3.0], [-0.45, 0.95, -0.3], 34],
  // chat-bot appears
  [71.3, [-0.45, 1.45, 1.5], [ROBOT[0], ROBOT[1] - 0.25, ROBOT[2]], 32],
  [73.4, [-0.35, 1.4, 1.35], [ROBOT[0], ROBOT[1] - 0.25, ROBOT[2]], 32],
  // moon + 03:00
  [74.4, [-0.2, 1.25, 1.6], [-0.35, 1.0, -0.8], 34],
  [75.3, [-0.1, 1.28, 1.7], [-0.25, 1.05, -0.8], 34],
  // conversation
  [76.2, [0.35, 1.75, 2.45], [0.25, 1.45, -0.3], 34],
  [80.6, [0.15, 1.75, 2.3], [0.2, 1.5, -0.3], 34],
  // wide: owner sleeps, bot works
  [82.2, [1.05, 2.05, 3.5], [-0.3, 1.05, -0.25], 36],
  [84.9, [1.2, 2.1, 3.85], [-0.3, 1.05, -0.25], 36],
];
void CAM_OLD;
const PH: [number, number, number] = [PHONE_POS[0], PHONE_POS[1], PHONE_POS[2]];
const CAM: Key[] = [
  // sleeping face from above
  [61.6, [HEAD[0] + 0.55, HEAD[1] + 1.05, HEAD[2] + 0.75], [HEAD[0], HEAD[1] + 0.12, HEAD[2]], 32],
  [64.2, [HEAD[0] + 0.4, HEAD[1] + 0.95, HEAD[2] + 0.62], [HEAD[0], HEAD[1] + 0.12, HEAD[2]], 32],
  // phone on the nightstand, messages piling up
  [64.9, [PH[0] + 0.45, 1.3, PH[2] + 2.0], [PH[0] + 0.05, 1.02, PH[2]], 34],
  [69.0, [PH[0] + 0.3, 1.3, PH[2] + 1.75], [PH[0] + 0.05, 1.06, PH[2]], 34],
  // wide
  [70.6, [1.7, 2.1, 3.0], [-0.55, 1.0, -0.3], 36],
  // chat-bot appears
  [71.2, [ROBOT[0] + 0.35, 1.55, ROBOT[2] + 2.1], [ROBOT[0], ROBOT[1] - 0.2, ROBOT[2]], 34],
  [73.4, [ROBOT[0] + 0.25, 1.55, ROBOT[2] + 1.9], [ROBOT[0], ROBOT[1] - 0.2, ROBOT[2]], 34],
  // moon + 03:00 above the window
  [74.2, [0.62, 1.85, 2.55], [0.75, 1.75, -1.2], 36],
  [75.2, [0.7, 1.85, 2.4], [0.75, 1.78, -1.2], 36],
  // conversation column
  [75.9, [0.35, 2.0, 3.25], [0.2, 1.85, -0.2], 36],
  [80.6, [0.15, 2.0, 3.05], [0.2, 1.88, -0.2], 36],
  // wide: owner sleeps, bot works
  [82.0, [2.5, 2.5, 4.4], [-0.3, 1.25, -0.3], 36],
  [84.9, [2.65, 2.55, 4.7], [-0.3, 1.25, -0.3], 36],
];
const camAt = (t: number) => {
  let i = 0;
  while (i < CAM.length - 2 && t >= CAM[i + 1][0]) i++;
  const a = CAM[i];
  const b = CAM[i + 1];
  const x = prog(t, a[0], b[0]);
  const mix = (p: number[], q: number[]) => [lerp(p[0], q[0], x), lerp(p[1], q[1], x), lerp(p[2], q[2], x)] as [number, number, number];
  const pos = mix(a[1], b[1]);
  pos[0] += wobble(t * 0.5, 7) * 0.012;
  pos[1] += wobble(t * 0.5, 8) * 0.012;
  return { pos, target: mix(a[2], b[2]), fov: lerp(a[3], b[3], x) };
};

export const NightScenes: React.FC = () => {
  const t = useT();
  const cam = camAt(t);
  const bot = t >= T.s10;
  const count = NOTES.filter((n) => t >= n.at).length;
  const leave = prog(t, 69.25, 70.4);
  const robotIn = pop(t, 70.95, 0.6);
  const clock = bot ? "03:00" : "02:58";
  const lastNote = [...NOTES].reverse().find((n) => t >= n.at);
  const flash = lastNote ? Math.max(0, 1 - (t - lastNote.at) * 1.5) : 0;
  const botMode = prog(t, 75.7, 76.0);
  const snore = 1;
  const fly = prog(t, 74.9, 75.6);
  const robotPos: [number, number, number] = [
    lerp(ROBOT[0], ROBOT_CHAT[0], fly),
    lerp(ROBOT[1], ROBOT_CHAT[1], fly) + Math.sin(fly * Math.PI) * 0.25,
    lerp(ROBOT[2], ROBOT_CHAT[2], fly),
  ];
  return (
    <>
      <CamRig pos={cam.pos} target={cam.target} fov={cam.fov} />
      <Stage bg="#0a0c1d" focus={t < 64.3 ? HEAD : t < 70.4 ? PHONE_POS : t < 73.9 ? ROBOT : t < 75.5 ? [0.75, 1.8, -1.2] : [0.2, 2.1, -0.2]} focusRange={t > 80.5 ? 4 : 1.6} bokeh={3.5} bloom={1.1} bloomThreshold={0.85} envIntensity={0.45} night warm={false}>
        <ambientLight intensity={0.12} color="#6b7fd6" />
        <KeyLight position={[1.4, 3.2, -2.6]} intensity={1.2} color="#9fb4ff" target={[0, 0.6, 0]} />
        <pointLight position={[PHONE_POS[0], PHONE_POS[1] + 0.25, PHONE_POS[2]]} intensity={0.6 + flash * 2.5} distance={2.2} color="#b9b0ff" />
        <Bedroom t={t} clock={clock} />
        <Character
          position={PELVIS}
          rotation={LIE_ROT}
          pose={{
            armL: { x: 0.05, z: 0.08, elbow: -0.15 },
            armR: { x: 0.05, z: 0.08, elbow: -0.15 },
            headPitch: -0.1,
            headRoll: 0.25,
          }}
          expr={{ eyesClosed: 1, smile: bot ? 0.5 : 0.15, brow: 0.1 }}
          shirt="#ff6f4f"
        />
        {/* Zzz */}
        {[0, 1, 2].map((i) => {
          const ph = (t * 0.45 + i / 3) % 1;
          return (
            <group key={i} position={[HEAD[0] + 0.1 + ph * 0.25, HEAD[1] + 0.25 + ph * 0.55, HEAD[2] + 0.1]} scale={(0.5 + ph) * snore}>
              <Label text="z" size={0.12} color="#cfd8ff" opacity={Math.sin(ph * Math.PI)} />
            </group>
          );
        })}
        {/* phone on the nightstand, screen up */}
        <Phone
          draw={drawLock(count, clock, botMode)}
          drawKey={`${count}|${clock}|${botMode > 0.5}`}
          glow={0.75 + flash * 0.5}
          position={PHONE_POS}
          rotation={[-Math.PI / 2, 0, 0.35]}
          scale={1.3}
        />
        {/* message bubbles piling up above the phone */}
        {NOTES.map((n, i) => {
          const s = pop(t, n.at, 0.4);
          if (s < 0.01 || leave >= 1) return null;
          const fly = leave * (1 + i * 0.2);
          return (
            <group key={i} position={[PHONE_POS[0] + 0.05 + fly * (0.6 + i * 0.2), 1.0 + i * 0.15 + fly * 0.4, PHONE_POS[2] + 0.1]}>
              <Bubble3D
                text={n.text}
                me={false}
                width={0.95}
                rotation={[0, 0.3, 0]}
                scale={0.3 * s * (1 - leave)}
                color={leave > 0 ? "#c9c9d6" : "#ffffff"}
              />
            </group>
          );
        })}
        {/* the chat-bot */}
        {robotIn > 0.01 ? (
          <>
            <Robot t={t} position={robotPos} scale={0.9 * robotIn} glow={1} wave={prog(t, 81.0, 81.4) * (1 - prog(t, 83.6, 84.2))} rotation={[0, 0.35, 0]} />
            <Sparkles3D t={t} count={40} radius={0.6 + (1 - Math.min(1, (t - 70.95) / 1.2)) * 0.4} position={robotPos} color="#9ff6ff" opacity={Math.max(0.25, 1 - (t - 70.95) / 2)} />
          </>
        ) : null}
        {/* conversation */}
        {CONVO.map((c, i) => {
          const q = pop(t, c.q, 0.35);
          const a = pop(t, c.a, 0.35);
          if (q < 0.01) return null;
          const y = ROWS[i];
          const happy = prog(t, c.a, c.a + 0.4);
          const isSub = i === 2;
          return (
            <group key={i}>
              <Customer color={c.color} smile={-0.2 + happy * 1.1} position={[0.05, y + 0.02, -0.25]} scale={0.8 * q} />
              <Bubble3D text={c.cust} me={false} width={0.95} position={[0.36, y + 0.04, -0.25]} scale={0.3 * q} />
              {a > 0.01 ? (
                isSub ? (
                  <group position={[0.5, y - 0.11, -0.12]} scale={a}>
                    <CanvasPanel w={0.46} h={0.11} px={600} draw={drawPill("Жазылдыңыз", "#16b06b")} drawKey="pill" emissive={1.1} />
                  </group>
                ) : (
                  <Bubble3D text={c.bot} me width={1.2} position={[0.5, y - 0.11, -0.12]} scale={0.3 * a} glow={0.25} />
                )
              ) : null}
            </group>
          );
        })}
        {botMode > 0.01 ? (
          <group position={[robotPos[0], robotPos[1] + 0.5, robotPos[2]]} scale={pop(t, 75.85, 0.35) * (1 - prog(t, 77.0, 77.3))}>
            <Label text="0.1 сек" size={0.11} bg="#7b5cff" color="#fff" />
          </group>
        ) : null}
      </Stage>
    </>
  );
};
