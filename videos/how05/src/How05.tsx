import { ThreeCanvas } from "@remotion/three";
import { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import { ramp } from "./anim";
import { CALLOUTS } from "./callouts";
import { project } from "./camera";
import { fontsReady } from "./fonts";
import { Soundtrack } from "./sound";
import { C, H, W } from "./theme";
import { World } from "./three/World";
import { T } from "./timeline";
import { Callout } from "./ui/Callout";
import {
  AirBattery,
  BalloonHeadline,
  ForceFormula,
  HeaderCard,
  InvertInset,
  LitreCounter,
  NextEpisode,
  NozzleCounter,
  SplitDivider,
  WarningCard,
} from "./ui/Cards";
import { MonoTag, TopBar, Wash } from "./ui/Chrome";
import { Subtitles } from "./ui/Subtitles";

const useFonts = () => {
  const [handle] = useState(() => delayRender("Loading fonts"));
  useEffect(() => {
    fontsReady.then(() => continueRender(handle));
  }, [handle]);
};

export const How05: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const splitY = project(frame, [1.0, 2.2, 0]).y;
  const wash = Math.max(0.5 * ramp(frame, T.unverified - 10, 20), 0.85 * ramp(frame, T.next - 6, 14));
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.studioTop} 0%, ${C.studioBottom} 100%)` }}>
      <ThreeCanvas width={W} height={H} flat gl={{ antialias: true, alpha: true }} camera={{ fov: 32, near: 0.1, far: 200 }}>
        <World frame={frame} />
      </ThreeCanvas>
      <Wash opacity={wash} />
      <SplitDivider frame={frame} y={splitY} />
      {CALLOUTS.map((c, i) =>
        frame >= c.at && frame <= c.out + 2 ? (
          <Callout key={i} frame={frame} at={c.at} out={c.out} anchor={c.anchor(frame)} dx={c.dx} dy={c.dy} label={c.label} color={c.color} />
        ) : null,
      )}
      <HeaderCard frame={frame} />
      <InvertInset frame={frame} />
      <LitreCounter frame={frame} />
      <BalloonHeadline frame={frame} />
      <ForceFormula frame={frame} />
      <NozzleCounter frame={frame} />
      <AirBattery frame={frame} />
      <WarningCard frame={frame} />
      <NextEpisode frame={frame} />
      <Subtitles frame={frame} />
      <TopBar frame={frame} />
      <MonoTag frame={frame} />
      <Soundtrack />
    </AbsoluteFill>
  );
};
