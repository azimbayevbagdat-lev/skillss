import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Header } from "../components/Header";
import { CAM_BOTH, CAM_KZ, lerpCam, zoomCam } from "../geo";
import { GRAD } from "../theme";
import { Heat, KzMap, SceneProps, ease } from "./common";

// «Халық саны жетпіс еседен астам өседі!»
export const S03Population: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = lerpCam(zoomCam(CAM_BOTH, 1.04), CAM_KZ, ease(frame, 0, 30));
  const grow = ease(frame, 4, dur);
  const x = Math.round(interpolate(grow, [0, 1], [1, 70]));
  return (
    <AbsoluteFill>
      <KzMap cam={cam}>
        <Heat main={0.4 + 0.5 * grow} spread={0.15 + 0.3 * grow} />
      </KzMap>
      <Header
        kicker="Халық саны"
        title={`×${x}${x >= 70 ? "+" : ""}`}
        grad={GRAD.warm}
        maxSize={150}
      />
    </AbsoluteFill>
  );
};
