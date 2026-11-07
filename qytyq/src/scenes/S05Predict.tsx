import React from "react";
import { useCurrentFrame } from "remotion";
import { ramp, wob } from "../lib/anim";
import { cue } from "../lib/timeline";
import { Character } from "../three/Character";
import { Brain, GlowDot, HoloPath } from "../three/Props";
import { BlobShadow, Floor, Stage } from "../three/Stage";
import { drift, HoloPanel, SceneProps } from "./shared";

const PATH: [number, number, number][] = [
  [-0.9, -0.5, 0],
  [-0.4, -0.1, 0],
  [0.2, 0.25, 0],
  [0.75, 0.05, 0],
  [0.85, -0.35, 0],
];

/** 5. The arm starts to move; inside the brain a hologram already draws where it will land. */
export const S05Predict: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const startMove = cue(4, "қозғалта");
  const knows = cue(4, "біліп");
  const panel = ramp(f, 6, 20);
  const draw = ramp(f, startMove, knows + 10);
  const target = ramp(f, knows, knows + 8);
  const arm = ramp(f, startMove + 6, dur - 10);
  const cam = drift(f, dur, [0.8, 3.0, 11], [-0.4, 3.2, 10.2]);
  return (
    <Stage camera={cam} target={[0, 2.6, 0]}>
      <Floor />
      <BlobShadow size={2.6} />
      <Character
        position={[0, 0, 0]}
        face={{ smile: 0.4, brow: 0.2, look: [-0.4, -0.3] }}
        right={{ out: -0.5 * arm, fwd: 0.8 * arm, elbow: 0.2 + 1.4 * arm }}
        left={{ out: 0.3 }}
      />
      <Brain position={[0, 4.75, -0.3]} scale={0.78} glow={0.45 + 0.2 * Math.sin(f * 0.25)} smile={0.7} look={[-0.5, -0.5]} />
      <HoloPanel position={[0, 4.65, 0.75]} w={2.6} h={1.6} opacity={panel}>
        <HoloPath points={PATH} progress={draw} width={5} />
        <GlowDot position={[0.85, -0.35, 0.02]} size={0.5 + target * 0.3 + wob(f, 0.4, 0.05) * target} color="#7cf7ff" intensity={0.15 + target} />
        {/* tiny hand icon travelling on the path */}
        <GlowDot position={[-0.9 + draw * 1.75, -0.5 + Math.sin(draw * Math.PI) * 0.7 + draw * 0.15, 0.03]} size={0.25} color="#ffffff" intensity={panel * 0.8} />
      </HoloPanel>
    </Stage>
  );
};
