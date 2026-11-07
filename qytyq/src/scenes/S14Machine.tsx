import React from "react";
import { useCurrentFrame } from "remotion";
import { pop, ramp, wob } from "../lib/anim";
import { Brain, GlowDot, HoloPath, QuestionMark } from "../three/Props";
import { Backdrop, Stage } from "../three/Stage";
import { HoloPanel, SceneProps } from "./shared";

/** Small hologram cards: a ball's arc, a clock, a hand path, a question. */
const Card: React.FC<{ kind: number; f: number }> = ({ kind, f }) => {
  if (kind === 0)
    return (
      <>
        <HoloPath points={[[-0.45, -0.25, 0], [-0.1, 0.3, 0], [0.2, 0.25, 0], [0.45, -0.25, 0]]} progress={((f % 50) / 50) * 1.2} width={4} />
        <GlowDot position={[0.45, -0.25, 0.02]} size={0.25} color="#ffd166" />
      </>
    );
  if (kind === 1)
    return (
      <>
        <mesh>
          <torusGeometry args={[0.32, 0.03, 8, 32]} />
          <meshBasicMaterial color="#7cf7ff" />
        </mesh>
        <mesh rotation={[0, 0, -f * 0.1]} position={[0, 0, 0.01]}>
          <boxGeometry args={[0.03, 0.26, 0.01]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </>
    );
  if (kind === 2)
    return <HoloPath points={[[-0.4, -0.3, 0], [0, 0.2, 0], [0.4, 0, 0]]} progress={1} color="#ff9fd0" width={4} />;
  return <QuestionMark scale={0.2} color="#7cf7ff" emissive={0.8} />;
};

/** 14. The brain as a big "prediction machine", surrounded by holograms of future events. */
export const S14Machine: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const s = pop(f, 0, 12);
  return (
    <Stage
      camera={[wob(f, 0.015, 1.2), 0.8, 10 - ramp(f, 0, dur) * 1.2]}
      target={[0, 0.6, 0]}
      backdrop={<Backdrop top="#ffeedd" bottom="#f0a987" bokeh={["#c8f4ff", "#ffe2a8", "#ffd0e0"]} seed={14} />}
    >
      <Brain position={[0, 0.9, 0]} scale={1.25 * s} glow={0.7 + 0.2 * Math.sin(f * 0.2)} smile={0.9} look={[wob(f, 0.05, 0.8), 0]} />
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, 0.9, 0]} rotation={[1.2 + i * 0.5, f * 0.01 * (i ? -1 : 1), 0.3 * i]}>
          <torusGeometry args={[2.3 + i * 0.35, 0.025, 8, 96]} />
          <meshBasicMaterial color="#7cf7ff" transparent opacity={0.6} />
        </mesh>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + f * 0.012;
        return (
          <HoloPanel key={i} position={[Math.cos(a) * 2.6, 0.9 + Math.sin(a * 2) * 1.6, Math.sin(a) * 1.4]} w={1.2} h={0.9} opacity={pop(f, 6 + i * 4)}>
            <Card kind={i % 4} f={f} />
          </HoloPanel>
        );
      })}
    </Stage>
  );
};
