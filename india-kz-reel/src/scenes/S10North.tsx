import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame } from "remotion";
import { Header } from "../components/Header";
import { Snow } from "../components/Particles";
import { KZ_BOX } from "../geo";
import { C, GRAD } from "../theme";
import { KzMap, SceneProps, breathe, ease } from "./common";

// «Ал солтүстікте қыста аяз минус қырық градусқа дейін жетеді.»
export const S10North: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = breathe(frame, dur, -1);
  const t = ease(frame, 0, 24);
  const c1 = interpolateColors(t, [0, 1], ["#3e7f5e", "#5aa9e6"]);
  const c2 = interpolateColors(t, [0, 1], ["#6db37c", C.ice2]);
  return (
    <AbsoluteFill>
      <KzMap cam={cam} colors={[c1, c2]} glow={C.ice1}>
        <defs>
          <linearGradient id="northBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity={1} />
            <stop offset="0.55" stopColor="#bfe6ff" stopOpacity={0.6} />
            <stop offset="1" stopColor="#5aa9e6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect
          x={KZ_BOX.x0 - 10}
          y={KZ_BOX.y0 - 10}
          width={KZ_BOX.w + 20}
          height={KZ_BOX.h + 20}
          fill="url(#northBand)"
          opacity={t}
        />
      </KzMap>
      <Snow frame={frame} opacity={ease(frame, 4, 20)} />
      <Header
        kicker="Солтүстік"
        title="−40°"
        grad={GRAD.ice}
        maxSize={170}
        kickerColor="#bfe6ff"
      />
    </AbsoluteFill>
  );
};
