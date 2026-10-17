import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Header } from "../components/Header";
import { Tags } from "../components/Tags";
import { C, GRAD } from "../theme";
import { Heat, KzMap, SceneProps, breathe, sec } from "./common";

// «Баспана, азық-түлік, су мен электр жетпейді.»
export const S05Shortage: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = breathe(frame, dur, -1);
  const flicker = 0.85 + 0.15 * Math.sin(frame * 1.7) * Math.sin(frame * 0.6);
  return (
    <AbsoluteFill>
      <KzMap cam={cam} opacity={flicker} glow={C.red}>
        <Heat main={1} spread={0.5} />
      </KzMap>
      <Header
        kicker="Ресурстар"
        title="ЖЕТІСПЕЙДІ"
        grad={GRAD.danger}
        kickerColor="#ff8fb5"
      />
      <Tags
        items={["баспана", "азық-түлік", "су", "электр"]}
        top={1330}
        from={sec(0.1)}
        stagger={sec(0.45)}
        border={C.red}
      />
    </AbsoluteFill>
  );
};
