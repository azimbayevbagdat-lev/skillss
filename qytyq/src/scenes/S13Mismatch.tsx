import React from "react";
import { useCurrentFrame } from "remotion";
import { pop, ramp, wob } from "../lib/anim";
import { cue } from "../lib/timeline";
import { Character } from "../three/Character";
import { Brain, GlowDot, HoloPath } from "../three/Props";
import { BlobShadow, Floor, Stage } from "../three/Stage";
import { drift, HoloPanel, Label, SceneProps } from "./shared";

const PREDICT: [number, number, number][] = [
  [-0.95, -0.45, 0],
  [-0.4, 0.1, 0],
  [0.15, 0.3, 0],
  [0.6, 0.15, 0],
];

/** 13. Prediction line and the real touch point don't match: red warning, the person laughs. */
export const S13Mismatch: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const failAt = cue(12, "алмай");
  const laughAt = cue(12, "қытығын");
  const draw = ramp(f, 2, failAt - 4);
  const real = pop(f, failAt - 2, 9);
  const warn = pop(f, failAt, 7);
  const laugh = ramp(f, laughAt - 14, laughAt);
  const cam = drift(f, dur, [0, 3.0, 11], [0, 3.1, 10.2]);
  return (
    <>
      <Stage camera={cam} target={[0, 2.6, 0]}>
        <Floor />
        <BlobShadow size={2.6} />
        <Character
          lean={wob(f, 0.5, 0.15) * laugh}
          twist={wob(f, 0.35, 0.2) * laugh}
          face={{
            smile: 0.4 + laugh * 0.6,
            mouthOpen: laugh * (0.6 + 0.4 * Math.abs(Math.sin(f * 0.6))),
            eyesClosed: laugh,
            brow: 0.8,
          }}
          left={{ out: 0.3 + laugh * 0.3, fwd: laugh * 0.6, elbow: 0.4 + laugh }}
          right={{ out: 0.3 + laugh * 0.3, fwd: laugh * 0.6, elbow: 0.4 + laugh }}
          blush={0.4 + laugh * 0.6}
        />
        <Brain position={[0, 4.75, -0.3]} scale={0.78} glow={0.35} smile={warn > 0.5 ? -0.5 : 0.5} look={[0.5, -0.5]} />
        <HoloPanel position={[0, 4.65, 0.75]} w={2.6} h={1.6} opacity={ramp(f, 0, 10)}>
          <HoloPath points={PREDICT} progress={draw} width={5} />
          <GlowDot position={[0.6, 0.15, 0.02]} size={0.45} color="#7cf7ff" intensity={draw > 0.95 ? 0.9 : 0.2} />
          {/* the real contact point, somewhere else */}
          <GlowDot position={[0.85, -0.5, 0.03]} size={0.55 * real} color="#ff8a3d" intensity={real} />
          {warn > 0.01 && (
            <group position={[0.15, -0.15, 0.06]} scale={warn * 0.9}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <circleGeometry args={[0.42, 3]} />
                <meshBasicMaterial color={Math.floor(f / 5) % 2 ? "#ff3b3b" : "#ff6b6b"} />
              </mesh>
              <mesh position={[0, 0.05, 0.01]}>
                <boxGeometry args={[0.07, 0.24, 0.01]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, -0.13, 0.01]}>
                <circleGeometry args={[0.045, 16]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          )}
        </HoloPanel>
      </Stage>
      <Label x={540} y={170} size={56} color="#ffffff" bg="#ff4d4d" scale={warn} opacity={Math.min(1, warn * 2)} rotate={wob(f, 0.6, 2) * warn}>
        Болжам қате!
      </Label>
    </>
  );
};
