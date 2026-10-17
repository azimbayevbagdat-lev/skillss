import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ContextLand, DotCountry, Blob } from "../components/DotCountry";
import { Header } from "../components/Header";
import { Particles } from "../components/Particles";
import {
  CAM_BOTH,
  INDIA_D,
  KZ_D,
  LAND_D,
  indiaPoints,
  kzPoints,
  KZ_CENTROID,
  zoomCam,
} from "../geo";
import { C, GRAD } from "../theme";
import { SceneProps, ease } from "./common";

// «Бір жарым миллиардқа жуық адам бір мезетте Қазақстанға келеді.»
export const S02OneMoment: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = zoomCam(CAM_BOTH, 1 + 0.04 * (frame / dur));
  const drain = ease(frame, 10, dur - 6);
  return (
    <AbsoluteFill>
      <ContextLand d={LAND_D} cam={cam} />
      <DotCountry d={KZ_D} cam={cam} colors={[C.kz1, C.kz2]} glow={C.kz2}>
        <Blob
          at={KZ_CENTROID}
          r={60 + 380 * drain}
          opacity={0.3 + 0.7 * drain}
        />
      </DotCountry>
      <DotCountry
        d={INDIA_D}
        cam={cam}
        colors={[C.india1, C.india2]}
        glow={C.india1}
        opacity={1 - 0.75 * drain}
      />
      <Particles
        src={indiaPoints()}
        dst={kzPoints()}
        cam={cam}
        frame={frame}
        duration={42}
        spread={Math.max(10, dur - 46)}
        count={1000}
      />
      <Header kicker="Бір мезетте" title="≈1,45 МЛРД" grad={GRAD.warm} />
    </AbsoluteFill>
  );
};
