import React from "react";
import { useCurrentFrame } from "remotion";
import { ramp, wob } from "../lib/anim";
import { Character } from "../three/Character";
import { Brain, QuestionMark, TickleHand } from "../three/Props";
import { BlobShadow, Floor, Stage } from "../three/Stage";
import { drift, HoloPanel, SceneProps } from "./shared";

/** Hands appear from different sides, one at a time. */
const SPOTS: { p: [number, number, number]; r: [number, number, number] }[] = [
  { p: [0.98, 1.3, 0.4], r: [0, 0, -1.3] },
  { p: [-0.98, 1.5, 0.4], r: [0, 0, 1.3] },
  { p: [0.9, 0.75, 0.6], r: [0, 0, -1.6] },
  { p: [-0.95, 1.95, 0.5], r: [0, 0, 1.0] },
];

/** 9. Somebody else's hand pops in from random sides; the brain hologram only shows blinking "?". */
export const S09Unknown: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const slot = 48;
  const k = Math.floor(f / slot);
  const local = f % slot;
  const spot = SPOTS[k % SPOTS.length];
  const show = ramp(local, 0, 9) * (1 - ramp(local, slot - 10, slot));
  const out = (1 - show) * 2.6;
  const dir = Math.sign(spot.p[0]);
  const panel = ramp(f, 4, 18);
  const cam = drift(f, dur, [0, 3.0, 11], [0.3, 3.2, 10.2]);
  return (
    <Stage camera={cam} target={[0, 2.6, 0]}>
      <Floor />
      <BlobShadow size={2.6} />
      <Character
        face={{ smile: -0.2, brow: -0.6, look: [dir * 0.9, 0], mouthOpen: 0 }}
        headTilt={wob(f, 0.1, 0.06)}
        rotation={[0, dir * 0.25 * show, 0]}
        left={{ out: 0.35, elbow: 0.6 }}
        right={{ out: 0.35, elbow: 0.6 }}
        shrug={0.05}
      />
      <TickleHand frame={f} position={[spot.p[0] + dir * out, spot.p[1], spot.p[2]]} rotation={spot.r} scale={0.62} sleeve={k % 2 ? "#e86f51" : "#f2a93b"} />
      <Brain position={[0, 4.75, -0.3]} scale={0.78} glow={0.3} smile={-0.3} look={[0, -0.6]} />
      <HoloPanel position={[0, 4.65, 0.75]} w={2.6} h={1.6} opacity={panel}>
        {[-0.75, 0, 0.75].map((x, i) => {
          const blink = 0.5 + 0.5 * Math.sin(f * 0.35 + i * 2.1);
          return <QuestionMark key={i} position={[x, -0.1 + wob(f, 0.2, 0.05, i), 0.05]} scale={0.32 * (0.7 + blink * 0.4)} color="#7cf7ff" emissive={0.4 + blink * 0.8} rotation={[0, wob(f, 0.15, 0.4, i), 0]} />;
        })}
      </HoloPanel>
    </Stage>
  );
};
