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
  CAM_BOTH,
  CAM_INDIA,
  INDIA_D,
  KZ_D,
  LAND_D,
  lerpCam,
  zoomCam,
} from "../geo";
import { C } from "../theme";
import { SceneProps, ease, sec } from "./common";

// «Егер бүкіл Үндістан халқы Қазақстанға көшсе, не болар еді?»
export const S01Hook: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phase2 = sec(1.6); // «Қазақстанға»
  const pan = spring({
    frame: frame - phase2,
    fps,
    config: { damping: 200 },
    durationInFrames: 30,
  });
  const cam = lerpCam(zoomCam(CAM_INDIA, 1 + frame * 0.0015), CAM_BOTH, pan);
  const reveal = ease(frame, 0, 34);

  return (
    <AbsoluteFill>
      <ContextLand d={LAND_D} cam={cam} opacity={0.45 * reveal} />
      <DotCountry
        d={KZ_D}
        cam={cam}
        colors={[C.kz1, C.kz2]}
        glow={C.kz2}
        opacity={ease(frame, phase2, phase2 + 20)}
      />
      <DotCountry
        d={INDIA_D}
        cam={cam}
        colors={[C.india1, C.india2]}
        glow={C.india1}
        reveal={reveal}
      />
      <Header
        kicker="Егер"
        title="БҮКІЛ ҮНДІСТАН"
        grad={["#fff3e0", "#ff9a3c"]}
        to={phase2}
      />
      <Header kicker="Егер" title={"ҚАЗАҚСТАНҒА\nКӨШСЕ?"} from={phase2} />
    </AbsoluteFill>
  );
};
