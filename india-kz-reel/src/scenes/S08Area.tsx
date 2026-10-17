import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ContextLand, DotCountry } from "../components/DotCountry";
import { Header } from "../components/Header";
import {
  CAM_KZ,
  INDIA_CENTROID,
  INDIA_D,
  KZ_CENTROID,
  KZ_D,
  LAND_D,
  camTransform,
  zoomCam,
} from "../geo";
import { C, GRAD, H, W } from "../theme";
import { SceneProps, ease, sec } from "./common";

// «Үндістанның аумағы — 3,3 млн км². Ал Қазақстан — 2,7 млн. Яғни Үндістан бізден де үлкен!»
// Both shapes come from the same equal-area projection, India is only translated.
export const S08Area: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pB = sec(3.6); // «Ал Қазақстан»
  const pC = sec(6.3); // «Яғни»
  const cam = zoomCam(CAM_KZ, 0.62 + 0.03 * (frame / sec(8.5)));

  const slide = spring({
    frame: frame - 6,
    fps,
    config: { damping: 18, stiffness: 70 },
  });
  const target = {
    x: KZ_CENTROID[0] - INDIA_CENTROID[0],
    y: KZ_CENTROID[1] - INDIA_CENTROID[1],
  };
  const offset = { x: target.x, y: target.y + (1 - slide) * 900 };

  const indiaOpacity =
    1 - 0.55 * ease(frame, pB, pB + 10) + 0.55 * ease(frame, pC, pC + 10);
  const kzPulse =
    1 + 0.6 * ease(frame, pB, pB + 10) * (1 - ease(frame, pC, pC + 10));
  const t = camTransform(cam);

  return (
    <AbsoluteFill>
      <ContextLand d={LAND_D} cam={cam} opacity={0.3} />
      <DotCountry
        d={KZ_D}
        cam={cam}
        colors={[C.kz1, C.kz2]}
        glow={C.kz2}
        glowSize={kzPulse}
      />
      <DotCountry
        d={INDIA_D}
        cam={cam}
        offset={offset}
        colors={[C.india1, C.india2]}
        glow={C.india1}
        opacity={indiaOpacity}
        outline={0.9}
        bodyFill={0.12}
      />
      {/* Kazakhstan border drawn on top so India visibly sticks out of it */}
      <svg
        width={W}
        height={H}
        style={{
          position: "absolute",
          inset: 0,
          filter: `drop-shadow(0 0 6px ${C.kz2})`,
        }}
      >
        <path
          d={KZ_D}
          transform={t}
          fill="none"
          stroke="#c9c2ff"
          strokeWidth={3 / cam.z}
          strokeDasharray={`${10 / cam.z} ${7 / cam.z}`}
          opacity={0.95}
        />
      </svg>
      <Header
        kicker="Үндістан аумағы"
        title="3,3 МЛН КМ²"
        grad={GRAD.warm}
        to={pB}
        kickerColor="#ffb877"
      />
      <Header
        kicker="Қазақстан"
        title="2,7 МЛН КМ²"
        from={pB}
        to={pC}
        kickerColor="#b9adff"
      />
      <Header
        kicker="Яғни"
        title={"ҮНДІСТАН\nҮЛКЕН"}
        grad={GRAD.warm}
        from={pC}
        sub="3,3 > 2,7 млн км²"
        kickerColor="#ffb877"
      />
    </AbsoluteFill>
  );
};
