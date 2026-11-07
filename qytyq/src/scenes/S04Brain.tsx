import React from "react";
import { useCurrentFrame } from "remotion";
import { pop, ramp, wob } from "../lib/anim";
import { cue } from "../lib/timeline";
import { Character } from "../three/Character";
import { Brain, GlowDot } from "../three/Props";
import { BlobShadow, Floor, Stage } from "../three/Stage";
import { drift, SceneProps } from "./shared";

/** 4. A glowing brain with glasses rises out of the hero's head and smiles. */
export const S04Brain: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const rise = ramp(f, 4, 30);
  const s = pop(f, 4, 10);
  const smileAt = cue(3, "алдап");
  const cam = drift(f, dur, [0, 3.0, 13], [0, 3.3, 12.2]);
  return (
    <Stage camera={cam} target={[0, 3.0, 0]}>
      <Floor />
      <BlobShadow size={2.6} />
      <Character face={{ smile: 0.7, eyesClosed: 0, brow: 0.8, look: [0, 1] }} headNod={-0.2} />
      <Brain
        position={[0, 2.9 + rise * 1.7 + wob(f, 0.12, 0.05), 0.1]}
        rotation={[0.1, wob(f, 0.06, 0.25), wob(f, 0.08, 0.05)]}
        scale={0.25 + s * 0.75}
        glow={0.5 + 0.3 * Math.sin(f * 0.2)}
        smile={0.4 + ramp(f, smileAt, smileAt + 10) * 0.6}
        look={[0, -0.4]}
      />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = i * 1.05 + f * 0.04;
        return (
          <GlowDot
            key={i}
            position={[Math.cos(a) * 1.9, 4.8 + Math.sin(a * 1.3) * 1.1, 0.4]}
            size={0.35}
            color={i % 2 ? "#ffe08a" : "#ffb3d1"}
            intensity={rise * (0.5 + 0.5 * Math.sin(f * 0.3 + i))}
          />
        );
      })}
    </Stage>
  );
};
