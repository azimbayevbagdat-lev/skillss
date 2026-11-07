import React from "react";
import { useCurrentFrame } from "remotion";
import { ramp, wob } from "../lib/anim";
import { cue } from "../lib/timeline";
import { Character } from "../three/Character";
import { TickleHand } from "../three/Props";
import { BlobShadow, Floor, Stage } from "../three/Stage";
import { drift, SceneProps } from "./shared";

/** 1. Someone tickles the hero; the hero laughs and squirms. */
export const S01Tickled: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const laughAt = cue(0, "шыдай");
  const handIn = ramp(f, 0, 16);
  const laugh = ramp(f, laughAt - 12, laughAt);
  const squirm = laugh * (0.7 + 0.3 * Math.sin(f * 0.3));
  const cam = drift(f, dur, [0.6, 2.4, 9.6], [-0.2, 2.1, 8.2]);
  return (
    <Stage camera={cam} target={[0, 1.15, 0]}>
      <Floor />
      <BlobShadow size={2.6} />
      <Character
        position={[0, 0.05 + Math.abs(wob(f, 0.55, 0.08)) * laugh, 0]}
        rotation={[0, -0.25, 0]}
        lean={wob(f, 0.5, 0.16) * squirm}
        twist={wob(f, 0.35, 0.25) * squirm}
        headTilt={wob(f, 0.45, 0.15) * squirm}
        face={{
          smile: 0.6 + laugh * 0.4,
          mouthOpen: laugh * (0.6 + 0.4 * Math.abs(Math.sin(f * 0.6))),
          eyesClosed: laugh,
          brow: 0.6,
          look: [0.6, 0],
        }}
        left={{ out: 0.2 + laugh * 0.3, fwd: 0.5 * laugh, elbow: 0.4 + laugh * 1.2 }}
        right={{ out: 0.1 + laugh * 0.5, fwd: 0.6 * laugh + wob(f, 0.6, 0.1) * laugh, elbow: 0.3 + laugh * 1.4 }}
        blush={0.4 + laugh * 0.6}
      />
      <TickleHand
        frame={f}
        position={[1.25 + (1 - handIn) * 3, 1.3 + wob(f, 0.4, 0.06), 0.45]}
        rotation={[0, 0, 1.15]}
        scale={0.62}
        wiggle={1}
      />
    </Stage>
  );
};
