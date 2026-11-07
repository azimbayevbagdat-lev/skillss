import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { pop, ramp, wob } from "../lib/anim";
import { Brain, Gear } from "../three/Props";
import { Backdrop, Stage } from "../three/Stage";
import { HoloPanel, SceneProps } from "./shared";

const NUMS = ["0.42", "x+y", "12°", "→ 3 см", "0.18 с", "Δt", "98%", "∑", "v=1.2"];

/** 6. Calculation inside the brain: gears, numbers, charts. */
export const S06Compute: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const inn = ramp(f, 0, 14);
  return (
    <AbsoluteFill>
      <Stage
        camera={[wob(f, 0.02, 0.5), 0.6, 8.5 - f * 0.01]}
        target={[0, 0.2, 0]}
        backdrop={<Backdrop top="#fff0dc" bottom="#f3b08a" seed={6} />}
      >
        <Brain position={[0, 0.9, -1.2]} scale={1.15} glow={0.7 + 0.2 * Math.sin(f * 0.4)} smile={0.6} look={[0.3, 0.5]} />
        <Gear position={[-1.25, 1.85, 0.3]} rotation={f * 0.06} radius={0.7} teeth={12} color="#ffd166" glow={0.35} />
        <Gear position={[1.2, 1.95, 0.2]} rotation={-f * 0.085 + 0.2} radius={0.5} teeth={9} color="#ff9f68" glow={0.35} />
        <Gear position={[1.35, -0.35, 0.5]} rotation={f * 0.1} radius={0.42} teeth={8} color="#7bdff2" glow={0.4} />
        <HoloPanel position={[-0.55, -1.0, 0.9]} w={2.4} h={1.2} opacity={inn}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const h = 0.2 + (0.5 + 0.5 * Math.sin(f * 0.15 + i * 1.3)) * 0.9 * pop(f, 6 + i * 3);
            return (
              <mesh key={i} position={[-0.95 + i * 0.38, -0.5 + h * 0.7 / 2, 0.05]}>
                <boxGeometry args={[0.25, h * 0.7, 0.1]} />
                <meshPhysicalMaterial color={i % 2 ? "#7cf7ff" : "#ffd166"} emissive={i % 2 ? "#7cf7ff" : "#ffd166"} emissiveIntensity={0.5} roughness={0.3} />
              </mesh>
            );
          })}
        </HoloPanel>
      </Stage>
      {NUMS.map((n, i) => {
        const t = (f + i * 11) % 60;
        const x = 140 + ((i * 197) % 800);
        const y = 760 - t * 7 - (i % 3) * 120;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontFamily: "Montserrat",
              fontWeight: 800,
              fontSize: 46,
              color: i % 2 ? "#1d7f99" : "#b2501f",
              opacity: inn * Math.sin((t / 60) * Math.PI) * 0.9,
              transform: `scale(${0.8 + (t / 60) * 0.4})`,
            }}
          >
            {n}
          </div>
        );
      })}
      <div style={{ display: "none" }}>{dur}</div>
    </AbsoluteFill>
  );
};
