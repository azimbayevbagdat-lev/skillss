import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Video } from "@remotion/media";
import timeline from "../../timeline.json";
import plan from "./plan.json";
import { Captions } from "./Captions";
import { Overlays } from "./Overlays";

// Cut points in the output timeline (seconds) -> alternate 100% / 110% punch-in
const cutTimes: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  for (const [s, e] of timeline.segments as number[][]) {
    out.push(acc);
    acc += e - s;
  }
  return out;
})();

const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      document.fonts.load('900 80px Montserrat', "ӘҒҚҢӨҰҮҺІәғқңөұүһі"),
      document.fonts.load('800 80px Montserrat', "ӘҒҚҢӨҰҮҺІәғқңөұүһі Abc"),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

export const Reel: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  let seg = 0;
  for (let i = 0; i < cutTimes.length; i++) if (t >= cutTimes[i]) seg = i;
  const zoom = seg % 2 === 0 ? 1 : 1.1;

  // light screen shake on "қозғалтты"
  const kz = plan.overlays.find((o) => o.id === "kz")!;
  const st = (t - (kz.shakeAt as number)) * fps;
  const amp = st >= 0 && st < 14 ? interpolate(st, [0, 14], [18, 0]) : 0;
  const sx = amp * Math.sin(st * 2.3);
  const sy = amp * Math.cos(st * 3.1);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${sx}px, ${sy}px) scale(${zoom * (amp > 0 ? 1.04 : 1)})`,
          transformOrigin: plan.faceOrigin,
        }}
      >
        <Video src={staticFile("base.mov")} muted objectFit="cover" style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
      <Overlays />
      <Captions />
    </AbsoluteFill>
  );
};
