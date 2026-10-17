import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Header } from "../components/Header";
import { GRAD } from "../theme";
import { Heat, KzMap, SceneProps, breathe, ease } from "./common";

// «Сонда Қазақстан халқы бір жарым миллиардқа жуықтайды.»
export const S12Result: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = breathe(frame, dur, 1);
  const s = ease(frame, 0, dur * 0.7);
  return (
    <AbsoluteFill>
      <KzMap cam={cam}>
        <Heat main={0.5 + 0.5 * s} spread={0.3 + 0.7 * s} fill={0.45 * s} />
      </KzMap>
      <Header
        kicker="Нәтижесінде халық"
        title="≈1,47 МЛРД"
        grad={GRAD.warm}
        sub="адам"
      />
    </AbsoluteFill>
  );
};
