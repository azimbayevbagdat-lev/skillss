import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Header } from "../components/Header";
import { GRAD } from "../theme";
import { Heat, KzMap, SceneProps, breathe, ease } from "./common";

// «Миллиондаған адамды бүкіл елге қоныстандыруға тура келеді.»
export const S06Resettle: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = breathe(frame, dur, 1);
  const s = ease(frame, 6, dur - 10);
  return (
    <AbsoluteFill>
      <KzMap cam={cam}>
        <Heat main={1} spread={0.5 + 0.5 * s} fill={0.35 * s} />
      </KzMap>
      <Header kicker="Қоныстандыру" title="БҮКІЛ ЕЛГЕ" grad={GRAD.warm} />
    </AbsoluteFill>
  );
};
