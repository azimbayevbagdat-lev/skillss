import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { pop, ramp, wob } from "../lib/anim";
import { cue } from "../lib/timeline";
import { Bell, PushButton, Ripple, TickleHand } from "../three/Props";
import { Backdrop, Stage } from "../three/Stage";
import { SceneProps } from "./shared";

/** 16. A 3D "Жазылу" button gets pressed; the bell rings. */
export const S16Subscribe: React.FC<SceneProps> = () => {
  const f = useCurrentFrame();
  const pressAt = cue(15, "парақшаға");
  const btn = pop(f, 0, 12);
  const handIn = ramp(f, pressAt - 18, pressAt - 3);
  const press = ramp(f, pressAt - 3, pressAt + 1) * (1 - ramp(f, pressAt + 6, pressAt + 12));
  const pressed = f >= pressAt;
  const ringAt = pressAt + 6;
  const bell = pop(f, ringAt - 4, 9);
  const shake = f > ringAt ? Math.sin((f - ringAt) * 1.4) * 0.45 * Math.exp(-(f - ringAt) / 25) : 0;
  return (
    <AbsoluteFill>
      <Stage camera={[0, 0.6, 12]} target={[0, 0.6, 0]} backdrop={<Backdrop top="#ffe8d4" bottom="#f4a07a" seed={16} />}>
        <group scale={btn} position={[0, 0, 0]}>
          <PushButton width={2.7} press={press} color={pressed ? "#ff3d55" : "#ff5a6a"} />
        </group>
        <TickleHand
          frame={0}
          wiggle={0}
          position={[1.15 + (1 - handIn) * 2.5, -0.25 + (1 - handIn) * 3, 0.9 - press * 0.25]}
          rotation={[0.5, 0, 0.55]}
          sleeve="#3fa9a0"
          skin="#f1bf98"
          scale={0.95}
        />
        <Bell position={[0, 2.6 + wob(f, 0.1, 0.05), 0.2]} rotation={shake} scale={bell * 1.05} />
        {f > ringAt && <Ripple position={[0, 2.6, -0.2]} t={((f - ringAt) / 28) % 1.3} color="#ffd34d" maxR={2.2} rings={3} />}
      </Stage>
      {/* button label sits exactly on the button (button is at the camera target = screen centre) */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 300, pointerEvents: "none" }}>
        <div
          style={{
            fontFamily: "Montserrat",
            fontWeight: 900,
            fontSize: pressed ? 62 : 80,
            color: "#ffffff",
            transform: `scale(${btn * (1 - press * 0.05)}) translateY(${press * 6}px)`,
            textShadow: "0 5px 0 rgba(120,20,30,0.45)",
            letterSpacing: 2,
          }}
        >
          {pressed ? "Жазылдыңыз!" : "Жазылу"}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
