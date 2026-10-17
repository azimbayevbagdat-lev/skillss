import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { Header } from "../components/Header";
import { C, GRAD } from "../theme";
import { Heat, KzMap, SceneProps, breathe, ease } from "./common";

// «Бірақ бір мәселе бар.»
export const S07Problem: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = breathe(frame, dur, -1);
  const t = ease(frame, 0, 24);
  const c1 = interpolateColors(t, [0, 1], [C.kz1, C.green1]);
  const c2 = interpolateColors(t, [0, 1], [C.kz2, C.green2]);
  return (
    <AbsoluteFill>
      <KzMap cam={cam} colors={[c1, c2]} glow={c2}>
        <Heat main={1 - t} spread={1 - t} fill={0.35 * (1 - t)} />
      </KzMap>
      <Header
        kicker="Бірақ"
        title={"БІР МӘСЕЛЕ\nБАР"}
        grad={GRAD.danger}
        kickerColor="#ff8fb5"
      />
    </AbsoluteFill>
  );
};
