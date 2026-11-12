import React from "react";
import { Character, HOLD_PHONE, SIT } from "../lib/Character";
import { Bubble3D, Cloud3D, QuestionMark } from "../lib/props";
import { CamRig, KeyLight, Stage } from "../lib/three";
import { kf, pop, prog, useT, wobble } from "../lib/time";

const HEAD_Y = 0.88;

const CLOUDS = Array.from({ length: 9 }).map((_, i) => ({
  at: 27.9 + i * 0.85,
  a: i * 2.1 + 0.4,
  r: 0.62 + (i % 3) * 0.12,
  y: HEAD_Y + 0.28 + ((i * 7) % 5) * 0.07,
  s: 0.55 + ((i * 5) % 4) * 0.12,
}));

const QMARKS = Array.from({ length: 14 }).map((_, i) => ({
  at: 28.4 + i * 0.55,
  a: i * 2.6 + 1.1,
  r: 0.42 + ((i * 3) % 5) * 0.08,
  y: HEAD_Y + 0.05 + ((i * 11) % 7) * 0.075,
  s: 0.22 + ((i * 7) % 4) * 0.05,
  c: i % 3 === 0 ? "#ff5d6c" : i % 3 === 1 ? "#ffd23f" : "#ffffff",
}));

const THOUGHTS = [
  { at: 30.02, text: "Олар оқыды ма?", p: [-0.32, HEAD_Y + 0.62, 0.25] as [number, number, number] },
  { at: 31.1, text: "Жауап бере ме?", p: [0.34, HEAD_Y + 0.45, 0.3] as [number, number, number] },
  { at: 32.1, text: "Әлде мені елемей ме?", p: [-0.05, HEAD_Y + 0.85, 0.2] as [number, number, number] },
];

export const DoubtScene: React.FC = () => {
  const t = useT();
  const gloom = prog(t, 27.6, 36);
  const camZ = kf(t, [24.8, 30, 36.65], [2.9, 2.6, 2.35]);
  const camX = kf(t, [24.8, 36.65], [-0.25, 0.22]);
  const worry = prog(t, 25.2, 26.4);
  const blink = (t + 0.3) % 3.1 < 0.12 ? 1 : 0;
  return (
    <>
      <CamRig pos={[camX, HEAD_Y + 0.3, camZ]} target={[0, HEAD_Y + 0.12, 0]} fov={34} />
      <Stage
        bg={gloom > 0.5 ? "#141221" : "#1d1a2e"}
        focus={[0, HEAD_Y, 0.1]}
        focusRange={0.9}
        bokeh={4}
        bloom={0.7}
        envIntensity={0.7 - gloom * 0.4}
        warm={false}
      >
        <ambientLight intensity={0.25 - gloom * 0.12} color="#b9c4ff" />
        <KeyLight position={[1.5, 3.5, 2.5]} intensity={2.2 - gloom * 1.2} color="#e6ecff" target={[0, HEAD_Y, 0]} />
        <spotLight position={[-2, 2.5, -1.5]} intensity={14} angle={0.6} penumbra={1} color="#6c5cff" />
        {/* phone glow on the face */}
        <pointLight position={[0, 0.45, 0.45]} intensity={0.5} distance={1.2} color="#b9b0ff" />
        {/* backdrop */}
        <mesh position={[0, 1, -2.2]}>
          <planeGeometry args={[12, 8]} />
          <meshStandardMaterial color="#2a2645" roughness={1} />
        </mesh>
        <Character
          position={[0, 0, 0]}
          pose={{
            ...SIT,
            ...HOLD_PHONE,
            torsoPitch: 0.1,
            headPitch: 0.15 - worry * 0.25,
            headYaw: Math.sin(t * 0.8) * 0.18 * worry,
            headRoll: wobble(t, 2) * 0.06,
          }}
          expr={{
            brow: 0.9 * worry,
            smile: -0.45 * worry,
            eyesClosed: blink,
            look: [Math.sin(t * 0.9) * 0.8, 0.5 * worry],
          }}
          shirt="#ff6f4f"
        />
        {CLOUDS.map((c, i) => {
          const s = pop(t, c.at, 0.7);
          if (s < 0.01) return null;
          const a = c.a + t * 0.18;
          return (
            <Cloud3D
              key={i}
              seed={i + 1}
              dark={0.55 + gloom * 0.45}
              position={[Math.sin(a) * c.r, c.y + wobble(t, i) * 0.03, Math.cos(a) * c.r * 0.6 - 0.15]}
              scale={c.s * s}
            />
          );
        })}
        {QMARKS.map((q, i) => {
          const s = pop(t, q.at, 0.45);
          if (s < 0.01) return null;
          const a = q.a - t * 0.3;
          return (
            <QuestionMark
              key={i}
              color={q.c}
              emissive={0.5}
              position={[Math.sin(a) * q.r, q.y + Math.sin(t * 2 + i) * 0.03, Math.cos(a) * q.r * 0.7]}
              rotation={[0, Math.sin(t * 1.4 + i) * 0.6, Math.sin(t + i) * 0.2]}
              scale={q.s * s}
            />
          );
        })}
        {THOUGHTS.map((th, i) => {
          const s = pop(t, th.at, 0.4) * (1 - prog(t, 33.3 + i * 0.15, 33.7 + i * 0.15));
          if (s < 0.01) return null;
          return (
            <Bubble3D
              key={i}
              text={th.text}
              me={false}
              width={1.0}
              position={[th.p[0], th.p[1] + wobble(t, i + 3) * 0.02, th.p[2]]}
              rotation={[0, -th.p[0] * 0.5, 0]}
              scale={0.42 * s}
              color="#ffffff"
            />
          );
        })}
      </Stage>
    </>
  );
};
