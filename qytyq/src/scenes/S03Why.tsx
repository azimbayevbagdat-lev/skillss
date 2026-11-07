import React from "react";
import { useCurrentFrame } from "remotion";
import { pop, wob } from "../lib/anim";
import { QuestionMark } from "../three/Props";
import { Backdrop, Stage } from "../three/Stage";
import { SceneProps } from "./shared";

/** 3. A big spinning 3D question mark. */
export const S03Why: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const s = pop(f, 0, 9);
  return (
    <Stage
      camera={[0, 0.6, 10.5]}
      target={[0, -0.6, 0]}
      backdrop={<Backdrop top="#ffe0c2" bottom="#f59a7a" bokeh={["#fff4c8", "#ffb48a", "#ffd0e0"]} seed={3} />}
    >
      <QuestionMark position={[0, 0.25 + wob(f, 0.15, 0.08), 0]} rotation={[0.1, f * 0.12, wob(f, 0.2, 0.08)]} scale={1.2 * s} />
      {[0, 1, 2, 3].map((i) => (
        <QuestionMark
          key={i}
          color={["#ffd166", "#ff6f91", "#7bdff2", "#ffd166"][i]}
          position={[Math.cos(i * 1.6 + f * 0.05) * 2.2, 0.4 + Math.sin(i * 2 + f * 0.07) * 1.4, -1.5]}
          rotation={[0, f * 0.1 + i, 0.3]}
          scale={0.35 * pop(f, 3 + i * 2)}
        />
      ))}
    </Stage>
  );
};
