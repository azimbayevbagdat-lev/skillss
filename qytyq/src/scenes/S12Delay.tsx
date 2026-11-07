import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { pop, ramp } from "../lib/anim";
import { cue } from "../lib/timeline";
import { Backdrop, Stage } from "../three/Stage";
import { LabSet } from "./Lab";
import { drift, SceneProps } from "./shared";

/** 12. The device touches a bit late: "+0.2 сек" timer, slow-motion close-up. */
export const S12Delay: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const lateAt = cue(11, "кешігіп");
  const slow = ramp(f, lateAt - 6, lateAt + 6);
  // in slow-motion the device creeps forward at ~1/4 speed
  const reach = interpolate(f, [0, lateAt, dur], [0.4, 0.6, 1], { extrapolateRight: "clamp" });
  const timerVal = interpolate(f, [lateAt, lateAt + 40], [0, 0.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tag = pop(f, lateAt - 4, 9);
  const cam = drift(f, dur, [0.6, 2.8, 9.5], [1.0, 2.6, 8]);
  return (
    <AbsoluteFill>
      <Stage camera={cam} target={[0.9, 2.2, 0]} backdrop={<Backdrop top="#fbe9d8" bottom="#efc3a0" seed={12} />}>
        <LabSet frame={f * (1 - slow * 0.75)} a1={-0.85 - reach * 0.25} a2={-1.0 - reach * 0.2} subjectFace={{ smile: 0.2, look: [-0.8, -0.4] }} />
      </Stage>
      {/* slow-motion look: cool tint + letterbox vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 60% 45%, rgba(0,0,0,0) 45%, rgba(40,20,60,0.35) 100%)", opacity: slow }} />
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 300,
            transform: `translate(-50%,-50%) scale(${tag})`,
            fontFamily: "Montserrat",
            fontWeight: 900,
            fontSize: 150,
            color: "#ffffff",
            background: "linear-gradient(180deg,#ff8a3d,#ff5e62)",
            borderRadius: 50,
            padding: "14px 54px",
            boxShadow: "0 18px 40px rgba(120,30,10,0.35)",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          +{timerVal.toFixed(1)} сек
        </div>
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 450,
            transform: "translateX(-50%)",
            fontFamily: "Montserrat",
            fontWeight: 800,
            fontSize: 40,
            letterSpacing: 6,
            color: "#5a2a14",
            opacity: slow,
          }}
        >
          БАЯУ КӨРІНІС
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
