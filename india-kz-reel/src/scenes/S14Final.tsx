import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Header } from "../components/Header";
import { C, GRAD } from "../theme";
import { Heat, KzMap, SceneProps, breathe, ease } from "./common";

// «...елді ауқымды гуманитарлық дағдарыс күтер еді.»
export const S14Final: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = breathe(frame, dur, 1, undefined, 0.08);
  const pulse = 1.2 + 0.5 * Math.sin(frame / 6);
  const t = ease(frame, 0, 24);
  return (
    <AbsoluteFill>
      <KzMap
        cam={cam}
        colors={["#ff2e63", C.pink]}
        glow={C.pink}
        glowSize={pulse}
        context={0.3}
      >
        <Heat main={1} spread={1} fill={0.6 * t} />
      </KzMap>
      <Header
        kicker="Қорытынды"
        title={"ГУМАНИТАРЛЫҚ\nДАҒДАРЫС"}
        grad={GRAD.danger}
        kickerColor="#ff9ac0"
      />
    </AbsoluteFill>
  );
};
