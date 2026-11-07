import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { pop, ramp, wob } from "../lib/anim";
import { cue } from "../lib/timeline";
import { Character } from "../three/Character";
import { Brain, GlowDot, Nerve, Ripple, TickleHand } from "../three/Props";
import { BlobShadow, Floor, Stage } from "../three/Stage";
import { drift, SceneProps } from "./shared";

const NERVE: [number, number, number][] = [
  [1.15, 1.4, 0.7],
  [1.6, 2.6, 0.9],
  [1.4, 3.8, 0.6],
  [0.6, 4.6, 0.2],
];

/** 10. Unexpected touch: hero jumps, big bright signal, laughter. */
export const S10Startle: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const hitAt = cue(9, "тигенде");
  const jumpAt = cue(9, "Селт");
  const laughAt = cue(9, "күлкің");
  const handIn = ramp(f, hitAt - 18, hitAt - 2);
  const jump = Math.max(0, Math.sin(Math.min(1, Math.max(0, (f - jumpAt + 4) / 16)) * Math.PI));
  const scared = ramp(f, jumpAt - 4, jumpAt + 2);
  const laugh = ramp(f, laughAt - 16, laughAt);
  const twist = ramp(f, cue(9, "бұраласың") - 6, cue(9, "бұраласың") + 6);
  const sig = interpolate(f, [hitAt, hitAt + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = pop(f, hitAt + 14, 8) * (1 - ramp(f, hitAt + 26, hitAt + 50));
  const cam = drift(f, dur, [0, 2.8, 11.5], [0, 2.9, 10.4]);
  return (
    <AbsoluteFill>
      <Stage camera={[cam[0] + wob(f, 1.7, 0.06) * flash, cam[1] + wob(f, 1.9, 0.06) * flash, cam[2]]} target={[0, 2.5, 0]}>
        <Floor />
        <BlobShadow size={2.6 - jump * 0.8} opacity={0.35 - jump * 0.15} />
        <Character
          position={[0, jump * 1.1, 0]}
          lean={wob(f, 0.5, 0.18) * Math.max(twist, laugh)}
          twist={wob(f, 0.35, 0.3) * twist}
          face={{
            smile: 0.5 + laugh * 0.5,
            mouthOpen: Math.max(scared * (1 - laugh) * 0.7, laugh * (0.6 + 0.4 * Math.abs(Math.sin(f * 0.6)))),
            eyesClosed: laugh,
            brow: 1,
            look: [0.5, 0.3],
          }}
          left={{ out: 0.4 + scared * 1.6, elbow: 0.3 + scared * 0.8, fwd: laugh * 0.5 }}
          right={{ out: 0.4 + scared * 1.6, elbow: 0.3 + scared * 0.8, fwd: laugh * 0.5 }}
          blush={0.4 + laugh * 0.6}
        />
        <TickleHand frame={f} position={[1.6 + (1 - handIn) * 3, 1.2, 0.5]} rotation={[0, 0, 1.35]} sleeve="#e86f51" />
        <Brain position={[0, 5.1, -0.6]} scale={0.6} glow={0.3 + flash * 1.5} smile={0.9} look={[0.3, -0.5]} />
        {f >= hitAt && <Nerve points={NERVE} t={sig} amp={1} pulseColor="#ffef7a" />}
        {flash > 0.02 && <GlowDot position={[0, 5.1, 0]} size={2.6 * flash} color="#fff3a0" intensity={flash} />}
        {f > hitAt + 14 && <Ripple position={[0, 5.1, 0]} t={((f - hitAt - 14) / 30) % 1.2} color="#ffe066" maxR={2.4} />}
      </Stage>
      {/* comic burst lines around the jump */}
      <AbsoluteFill style={{ opacity: scared * (1 - ramp(f, jumpAt + 18, jumpAt + 30)), pointerEvents: "none" }}>
        {new Array(10).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 540,
              top: 640,
              width: 16,
              height: 90,
              borderRadius: 8,
              background: "#ff7a45",
              transform: `rotate(${i * 36}deg) translateY(-${330 + pop(f, jumpAt) * 40}px)`,
              transformOrigin: "8px 0",
            }}
          />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
