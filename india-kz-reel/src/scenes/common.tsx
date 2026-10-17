import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";
import { Blob, ContextLand, DotCountry } from "../components/DotCountry";
import { C, FPS } from "../theme";
import {
  CAM_KZ,
  CITIES,
  Camera,
  KZ_D,
  LAND_D,
  OTHER_CITIES,
  P,
  degToPx,
  zoomCam,
} from "../geo";

export type SceneProps = { dur: number };

export const sec = (s: number) => Math.round(s * FPS);

// Slow camera breathing. Alternating direction per scene keeps cuts seamless.
export const breathe = (
  frame: number,
  dur: number,
  dir: 1 | -1,
  base: Camera = CAM_KZ,
  amt = 0.05,
) => {
  const t = interpolate(frame, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return zoomCam(base, dir === 1 ? 1 + amt * t : 1 + amt * (1 - t));
};

export const ease = (frame: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(frame, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

const MAIN = Object.values(CITIES).map((c) => P(c.ll));
const OTHERS = OTHER_CITIES.map((ll) => P(ll));
const DEG = degToPx([68, 48], 1);

// Population heat on top of Kazakhstan.
// main: 0..1 intensity of Astana/Almaty/Shymkent, spread: 0..1 coverage of the rest of the country.
export const Heat: React.FC<{
  main: number;
  spread: number;
  fill?: number;
}> = ({ main, spread, fill = 0 }) => (
  <>
    {fill > 0 ? (
      <rect
        x={-5000}
        y={-5000}
        width={10000}
        height={10000}
        fill={C.heatPink}
        opacity={fill * 0.85}
      />
    ) : null}
    {OTHERS.map((p, i) => (
      <Blob
        key={`o${i}`}
        at={p}
        r={DEG * (1.0 + 3.4 * spread)}
        opacity={0.4 + 0.6 * spread}
      />
    ))}
    {MAIN.map((p, i) => (
      <Blob
        key={`m${i}`}
        at={p}
        r={DEG * (1.8 + 3.6 * main)}
        opacity={0.8 + 0.2 * main}
      />
    ))}
  </>
);

export const KzMap: React.FC<{
  cam: Camera;
  colors?: [string, string];
  glow?: string;
  context?: number;
  opacity?: number;
  glowSize?: number;
  children?: React.ReactNode;
}> = ({
  cam,
  colors = [C.kz1, C.kz2],
  glow = C.kz2,
  context = 0.45,
  opacity = 1,
  glowSize,
  children,
}) => (
  <AbsoluteFill>
    <ContextLand d={LAND_D} cam={cam} opacity={context} />
    <DotCountry
      d={KZ_D}
      cam={cam}
      colors={colors}
      glow={glow}
      opacity={opacity}
      glowSize={glowSize}
    >
      {children}
    </DotCountry>
  </AbsoluteFill>
);

export { CAM_KZ };
