import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Blob } from "../components/DotCountry";
import { Header } from "../components/Header";
import { CAM_KZ, DESERTS, P, degToPx, lerpCam, zoomCam } from "../geo";
import { C, GRAD } from "../theme";
import { KzMap, SceneProps, breathe, ease } from "./common";

// «Оның үстіне, жеріміздің жартысынан көбі — шөл мен шөлейт.»
export const S09Desert: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = lerpCam(
    zoomCam(CAM_KZ, 0.65),
    breathe(frame, dur, 1),
    ease(frame, 0, 26),
  );
  return (
    <AbsoluteFill>
      <KzMap cam={cam} colors={["#2f7a63", "#4fae7e"]} glow="#79c27e">
        {DESERTS.map((d, i) => {
          const g = ease(frame, 8 + i * 4, 30 + i * 4);
          return (
            <Blob
              key={i}
              at={P(d.ll)}
              r={degToPx(d.ll, d.r) * 1.2 * g}
              inner={C.sand2}
              outer={C.sand1}
              opacity={g}
            />
          );
        })}
      </KzMap>
      <Header
        kicker="Жердің 58%"
        title={"ШӨЛ МЕН\nШӨЛЕЙТ"}
        grad={GRAD.sand}
        kickerColor="#ffd37a"
      />
    </AbsoluteFill>
  );
};
