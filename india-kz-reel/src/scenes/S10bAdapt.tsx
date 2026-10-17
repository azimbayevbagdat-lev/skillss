import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Header } from "../components/Header";
import { Snow } from "../components/Particles";
import { KZ_BOX } from "../geo";
import { C } from "../theme";
import { KzMap, SceneProps, breathe, ease } from "./common";

// «Адамдарға ыстық шөл мен қатаң қысқа үйренуге тура келер еді.»
export const S10bAdapt: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = breathe(frame, dur, 1);
  const t = ease(frame, 0, 26);
  return (
    <AbsoluteFill>
      <KzMap cam={cam} colors={["#5aa9e6", C.ice2]} glow="#ffd9a0">
        <defs>
          <linearGradient id="hotCold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.ice2} />
            <stop offset="0.42" stopColor="#9fd8ff" />
            <stop offset="0.6" stopColor={C.sand2} />
            <stop offset="1" stopColor="#ff7a2a" />
          </linearGradient>
        </defs>
        <rect
          x={KZ_BOX.x0 - 10}
          y={KZ_BOX.y0 - 10}
          width={KZ_BOX.w + 20}
          height={KZ_BOX.h + 20}
          fill="url(#hotCold)"
          opacity={t}
        />
      </KzMap>
      <Snow frame={frame + 120} count={70} opacity={1 - t * 0.6} />
      <Header
        kicker="Үйренуге тура келеді"
        title={"ЫСТЫҚ ШӨЛ\nҚАТАҢ ҚЫС"}
        grad={["#e6f6ff", "#ffb35c"]}
        kickerColor="#cfe9ff"
      />
    </AbsoluteFill>
  );
};
