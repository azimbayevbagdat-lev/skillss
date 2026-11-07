import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { pop, ramp } from "../lib/anim";
import { cue } from "../lib/timeline";
import { Brain, Nerve } from "../three/Props";
import { Backdrop, Stage } from "../three/Stage";
import { Label, SceneProps } from "./shared";

const NERVE: [number, number, number][] = [
  [-1.5, -1.7, 0.4],
  [-1.1, -1.0, 0.6],
  [-0.5, -0.4, 0.5],
  [-0.1, 0.2, 0.4],
  [0, 0.9, 0.2],
];

/** 7. Signal along the nerve gets smaller each pass; level meter drops; bubble "Бұл өзім ғой". */
export const S07Dampen: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const bubbleAt = cue(6, "«Бұл");
  const weakenAt = cue(6, "сезімді");
  const period = 40;
  const pass = Math.floor(f / period);
  const t = (f % period) / (period * 0.85);
  const level = interpolate(f, [0, bubbleAt, weakenAt, weakenAt + 30], [1, 0.75, 0.55, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const amp = Math.max(0.08, level * (1 - pass * 0.04));
  const bubble = pop(f, bubbleAt, 10);
  return (
    <AbsoluteFill>
      <Stage camera={[0.3, 0.2, 9]} target={[0, 0.2, 0]} backdrop={<Backdrop top="#ffeedd" bottom="#f4b896" seed={7} />}>
        <Brain position={[0, 1.9, -0.6]} scale={0.95} glow={0.25 + level * 0.5} smile={0.6} look={[-0.4, -0.6]} />
        <Nerve points={NERVE} t={t} amp={amp} />
        {/* skin patch where the signal starts */}
        <mesh position={[-1.6, -1.85, 0.2]} scale={[1.2, 0.5, 0.6]}>
          <sphereGeometry args={[0.6, 24, 16]} />
          <meshPhysicalMaterial color="#f1bf98" roughness={0.6} sheen={0.5} />
        </mesh>
      </Stage>
      {/* level indicator */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: 800, top: 520, width: 110, height: 560, display: "flex", flexDirection: "column-reverse", gap: 10, opacity: ramp(f, 0, 12) }}>
          {new Array(8).fill(0).map((_, i) => {
            const on = i < Math.round(level * 8);
            const col = i < 3 ? "#5ad17a" : i < 6 ? "#ffc23d" : "#ff5a5a";
            return <div key={i} style={{ height: 58, borderRadius: 16, background: on ? col : "rgba(255,255,255,0.35)", boxShadow: on ? `0 0 24px ${col}` : "none", border: "3px solid rgba(90,40,20,0.25)" }} />;
          })}
        </div>
        <div style={{ position: "absolute", left: 790, top: 1095, width: 130, textAlign: "center", fontFamily: "Montserrat", fontWeight: 800, fontSize: 30, color: "#6b3218" }}>сезім</div>
      </AbsoluteFill>
      <Label x={560} y={250} size={60} color="#4a2312" bg="#ffffff" scale={bubble} opacity={Math.min(1, bubble * 2)} radius={60} pad="26px 44px">
        «Бұл өзім ғой»
      </Label>
      <div style={{ display: "none" }}>{dur}</div>
    </AbsoluteFill>
  );
};
