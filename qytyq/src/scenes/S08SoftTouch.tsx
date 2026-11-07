import React from "react";
import { useCurrentFrame } from "remotion";
import { ramp } from "../lib/anim";
import { cue } from "../lib/timeline";
import { Ripple } from "../three/Props";
import { Backdrop, Stage } from "../three/Stage";
import { drift, SceneProps } from "./shared";

const skin = <meshPhysicalMaterial color="#f1bf98" roughness={0.55} sheen={0.8} sheenColor="#ffe6d6" clearcoat={0.05} />;

/** 8. A fingertip lightly touches the skin; a soft ripple spreads. */
export const S08SoftTouch: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const touchAt = cue(7, "терің");
  const down = ramp(f, touchAt - 24, touchAt);
  const contact = f >= touchAt;
  const rip = contact ? ((f - touchAt) / 45) % 1.6 : -1;
  const cam = drift(f, dur, [0.4, 1.6, 6.2], [-0.3, 1.3, 5.4]);
  return (
    <Stage camera={cam} target={[0, 0.6, 0]} fov={34} backdrop={<Backdrop top="#ffe9d6" bottom="#f2b48c" seed={8} />}>
      {/* forearm */}
      <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.9, 5, 16, 40]} />
        {skin}
      </mesh>
      {/* index finger coming from above */}
      <group position={[0.2, 3.2 - down * 2.38, 0.35]} rotation={[0.25, 0, 0.12]}>
        <mesh position={[0, 0.9, 0]}>
          <capsuleGeometry args={[0.2, 1.5, 10, 24]} />
          {skin}
        </mesh>
        <mesh position={[0, 0.2, 0.17]} rotation={[0.25, 0, 0]} scale={[1, 1.3, 0.35]}>
          <sphereGeometry args={[0.14, 16, 12]} />
          <meshPhysicalMaterial color="#ffd9cf" roughness={0.2} clearcoat={1} />
        </mesh>
      </group>
      {rip >= 0 && <Ripple position={[0.2, 0.72, 0.3]} rotation={[-Math.PI / 2 + 0.25, 0, 0]} t={rip} color="#fff6ea" rings={3} maxR={1.6} />}
    </Stage>
  );
};
