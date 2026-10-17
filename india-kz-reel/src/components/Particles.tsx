import React, { useMemo } from "react";
import { W, H } from "../theme";
import { random } from "remotion";
import { Camera, Pt, toScreen } from "../geo";

// Particles flying from `src` world points to `dst` world points along curved paths.
export const Particles: React.FC<{
  src: Pt[];
  dst: Pt[];
  cam: Camera;
  frame: number;
  count?: number;
  duration: number; // frames each particle flies
  spread: number; // frames over which particles launch
  color?: string;
}> = ({
  src,
  dst,
  cam,
  frame,
  count = 900,
  duration,
  spread,
  color = "#ffd25a",
}) => {
  const parts = useMemo(
    () =>
      new Array(count).fill(0).map((_, i) => ({
        s: src[Math.floor(random(`s${i}`) * src.length)],
        d: dst[Math.floor(random(`d${i}`) * dst.length)],
        delay: random(`t${i}`) * spread,
        bend: (random(`b${i}`) - 0.5) * 260,
        r: 1.6 + random(`r${i}`) * 2.2,
      })),
    [src, dst, count, spread],
  );

  return (
    <svg
      width={W}
      height={H}
      style={{
        position: "absolute",
        inset: 0,
        filter: `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 12px ${color}99)`,
      }}
    >
      {parts.map((p, i) => {
        const raw = (frame - p.delay) / duration;
        if (raw <= 0 || raw >= 1.05) return null;
        const t = Math.min(1, raw);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const [sx, sy] = toScreen(cam, p.s);
        const [dx, dy] = toScreen(cam, p.d);
        const mx = (sx + dx) / 2 + p.bend;
        const my = (sy + dy) / 2;
        const bez = (u: number): Pt => [
          (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * mx + u * u * dx,
          (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * my + u * u * dy,
        ];
        const [x, y] = bez(e);
        const [tx, ty] = bez(Math.max(0, e - 0.06));
        const o =
          raw >= 1 ? Math.max(0, 1 - (raw - 1) * 20) : Math.min(1, t * 6);
        return (
          <g key={i} opacity={o}>
            <line
              x1={tx}
              y1={ty}
              x2={x}
              y2={y}
              stroke={color}
              strokeWidth={p.r * 0.9}
              strokeLinecap="round"
              opacity={0.45}
            />
            <circle cx={x} cy={y} r={p.r} fill="#fff6d6" />
          </g>
        );
      })}
    </svg>
  );
};

// Falling snow over the whole frame
export const Snow: React.FC<{
  frame: number;
  count?: number;
  opacity?: number;
}> = ({ frame, count = 160, opacity = 1 }) => (
  <svg
    width={W}
    height={H}
    style={{
      position: "absolute",
      inset: 0,
      opacity,
      filter: "drop-shadow(0 0 4px #cfeaff)",
    }}
  >
    {new Array(count).fill(0).map((_, i) => {
      const speed = 2 + random(`v${i}`) * 4;
      const y = ((random(`y${i}`) * H + frame * speed) % (H + 40)) - 20;
      const x = random(`x${i}`) * W + Math.sin(frame / 18 + i) * 14;
      const r = 1.5 + random(`r${i}`) * 3.5;
      return (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill="#ffffff"
          opacity={0.5 + random(`o${i}`) * 0.5}
        />
      );
    })}
  </svg>
);
