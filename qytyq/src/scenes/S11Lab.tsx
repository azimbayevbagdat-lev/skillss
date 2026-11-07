import React from "react";
import { useCurrentFrame } from "remotion";
import { ramp, wob } from "../lib/anim";
import { Backdrop, Stage } from "../three/Stage";
import { LabSet } from "./Lab";
import { drift, SceneProps } from "./shared";

/** 11. Scientists tested it: lab, scientist in a white coat, robot tickling device. */
export const S11Lab: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const reach = ramp(f, dur * 0.45, dur * 0.9);
  const cam = drift(f, dur, [-0.8, 3.4, 15.5], [0.4, 3.0, 14]);
  return (
    <Stage camera={cam} target={[0, 2.3, 0]} backdrop={<Backdrop top="#fbe9d8" bottom="#efc3a0" seed={11} />}>
      <LabSet frame={f} a1={-0.35 - reach * 0.5 + wob(f, 0.05, 0.05)} a2={-0.6 - reach * 0.4} subjectFace={{ smile: 0.3 }} />
    </Stage>
  );
};
