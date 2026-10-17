import React, { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FPS, H, STROKE, W } from "../theme";

export type SceneProps = { dur: number };
export const sec = (s: number) => Math.round(s * FPS);

export const ease = (frame: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(frame, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

// Scene body: illustration "pops" in (scale) on entry.
export const Stage: React.FC<{ bg?: string; children: React.ReactNode }> = ({
  bg,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 160, mass: 0.7 },
  });
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <AbsoluteFill
        style={{
          scale: String(interpolate(s, [0, 1], [0.93, 1])),
          transformOrigin: "50% 62%",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Full-frame SVG layer with the hand-drawn wobble filter
export const Svg: React.FC<{
  children: React.ReactNode;
  boil?: boolean;
  style?: React.CSSProperties;
}> = ({ children, boil = true, style }) => (
  <svg
    width={W}
    height={H}
    viewBox={`0 0 ${W} ${H}`}
    style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}
  >
    <g filter={boil ? "url(#boil)" : undefined}>{children}</g>
  </svg>
);

export const ink = {
  stroke: C.ink,
  strokeWidth: STROKE,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Path that draws itself (0..1)
export const Draw: React.FC<{
  d: string;
  p: number;
  stroke?: string;
  width?: number;
  dash?: string;
  fill?: string;
}> = ({ d, p, stroke = C.ink, width = STROKE, dash, fill = "none" }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!dash)
    return (
      <path
        d={d}
        pathLength={1}
        stroke={stroke}
        strokeWidth={width}
        fill={fill}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 1"
        strokeDashoffset={1 - p}
      />
    );
  return (
    <>
      <defs>
        <mask
          id={`m${id}`}
          maskUnits="userSpaceOnUse"
          x={-2000}
          y={-2000}
          width={6000}
          height={6000}
        >
          <path
            d={d}
            pathLength={1}
            stroke="#fff"
            strokeWidth={width * 3}
            fill="none"
            strokeDasharray="1 1"
            strokeDashoffset={1 - p}
          />
        </mask>
      </defs>
      <path
        d={d}
        stroke={stroke}
        strokeWidth={width}
        fill={fill}
        strokeLinecap="round"
        strokeDasharray={dash}
        mask={`url(#m${id})`}
      />
    </>
  );
};

// Torn-paper rectangle path (jagged edges), deterministic
export const tornRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  seed = 1,
  amp = 9,
) => {
  const pts: string[] = [];
  const rnd = (i: number) => {
    const v = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  const step = 26;
  let i = 0;
  for (let t = 0; t <= w; t += step)
    pts.push(`${x + t},${y + (rnd(i++) - 0.5) * amp}`);
  for (let t = 0; t <= h; t += step)
    pts.push(`${x + w + (rnd(i++) - 0.5) * amp},${y + t}`);
  for (let t = w; t >= 0; t -= step)
    pts.push(`${x + t},${y + h + (rnd(i++) - 0.5) * amp}`);
  for (let t = h; t >= 0; t -= step)
    pts.push(`${x + (rnd(i++) - 0.5) * amp},${y + t}`);
  return `M ${pts.join(" L ")} Z`;
};

export const lightning = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  n = 6,
  amp = 40,
) => {
  let d = `M ${x1} ${y1}`;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const off = (i % 2 ? 1 : -1) * amp;
    const nx = -(y2 - y1),
      ny = x2 - x1;
    const len = Math.hypot(nx, ny);
    d += ` L ${x1 + (x2 - x1) * t + (nx / len) * off} ${y1 + (y2 - y1) * t + (ny / len) * off}`;
  }
  return d + ` L ${x2} ${y2}`;
};
