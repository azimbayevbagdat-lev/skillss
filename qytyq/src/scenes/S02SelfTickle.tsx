import React from "react";
import { useCurrentFrame } from "remotion";
import { ramp, wob } from "../lib/anim";
import { cue } from "../lib/timeline";
import { Character } from "../three/Character";
import { BlobShadow, Floor, Stage } from "../three/Stage";
import { drift, SceneProps } from "./shared";

/** 2. Hero tickles themself: neutral face, then a shrug. */
export const S02SelfTickle: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const shrugAt = cue(1, "Ештеңе");
  const reach = ramp(f, 4, 22);
  const shrug = ramp(f, shrugAt, shrugAt + 8) - ramp(f, shrugAt + 18, shrugAt + 28);
  const tickle = reach * (1 - ramp(f, shrugAt - 4, shrugAt + 4));
  const cam = drift(f, dur, [-1.4, 2.2, 8.8], [-0.4, 2.0, 8.0]);
  return (
    <Stage camera={cam} target={[0, 1.2, 0]}>
      <Floor />
      <BlobShadow size={2.6} />
      <Character
        rotation={[0, 0.2, 0]}
        shrug={shrug * 0.16}
        headTilt={shrug * 0.18}
        face={{ smile: 0, mouthOpen: 0, eyesClosed: 0.35, brow: -0.1 + shrug * 0.5, look: [-0.3, -0.4] }}
        // right hand crosses over to tickle the left side
        right={{ out: -0.55 * tickle + shrug * 0.6, fwd: 0.75 * tickle, elbow: 1.5 * tickle + 0.2 + shrug * 1.2, twist: wob(f, 1.1, 0.25) * tickle }}
        left={{ out: 0.25 + shrug * 0.6, fwd: 0.05, elbow: 0.2 + shrug * 1.2 }}
        blush={0.3}
      />
    </Stage>
  );
};
