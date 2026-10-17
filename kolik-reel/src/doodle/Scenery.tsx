import React, { useMemo } from "react";
import { random } from "remotion";
import { C, H, STROKE, W } from "../theme";

// Warm sunset sky (beige → peach) with a soft sun.
export const Sky: React.FC<{ sunY?: number }> = ({ sunY = 1080 }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.sky1} />
        <stop offset="1" stopColor={C.sky2} />
      </linearGradient>
      <radialGradient id="sunGlow">
        <stop offset="0" stopColor="#ffd59a" stopOpacity={0.9} />
        <stop offset="1" stopColor="#ffd59a" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#sky)" />
    <circle cx={760} cy={sunY} r={260} fill="url(#sunGlow)" />
    <circle
      cx={760}
      cy={sunY}
      r={110}
      fill={C.sun}
      stroke={C.ink}
      strokeWidth={STROKE}
      filter="url(#boil)"
    />
  </svg>
);

// Ground with hills, grass strip and a road whose dashes and trees scroll by `scroll` px.
export const Road: React.FC<{
  y?: number;
  scroll?: number;
  trees?: boolean;
}> = ({ y = 1320, scroll = 0, trees = true }) => {
  const treeList = useMemo(
    () =>
      new Array(8).fill(0).map((_, i) => ({
        x: i * 330 + random(`t${i}`) * 120,
        s: 0.8 + random(`ts${i}`) * 0.5,
      })),
    [],
  );
  const span = 8 * 330;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <g filter="url(#boil)">
        {/* distant hills */}
        <path
          d={`M -20 ${y - 40} Q 200 ${y - 190} 420 ${y - 60} T 860 ${y - 80} T 1120 ${y - 50} V ${y} H -20 Z`}
          fill="#c9b27e"
          stroke={C.ink}
          strokeWidth={STROKE * 0.8}
        />
        {trees
          ? treeList.map((t, i) => {
              const tx = ((((t.x - scroll * 0.6) % span) + span) % span) - 150;
              return (
                <g
                  key={i}
                  transform={`translate(${tx} ${y - 10}) scale(${t.s})`}
                >
                  <path d="M 0 0 V -90" stroke={C.ink} strokeWidth={STROKE} />
                  <circle
                    cy={-140}
                    r={62}
                    fill={C.tree}
                    stroke={C.ink}
                    strokeWidth={STROKE}
                  />
                </g>
              );
            })
          : null}
        <rect
          x={-20}
          y={y - 10}
          width={W + 40}
          height={70}
          fill={C.grass}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        <rect
          x={-20}
          y={y + 60}
          width={W + 40}
          height={170}
          fill={C.road}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        {new Array(8).fill(0).map((_, i) => {
          const dx = ((((i * 180 - scroll) % 1440) + 1440) % 1440) - 180;
          return (
            <rect
              key={i}
              x={dx}
              y={y + 138}
              width={90}
              height={14}
              rx={7}
              fill="#f2e3b3"
            />
          );
        })}
        <rect
          x={-20}
          y={y + 230}
          width={W + 40}
          height={H - y}
          fill={C.ground}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
      </g>
    </svg>
  );
};

// Speech bubble with a hand-written caps text
export const Bubble: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  tail: [number, number];
  text: string;
  font: string;
  size?: number;
  color?: string;
  scale?: number;
}> = ({
  x,
  y,
  w,
  h,
  tail,
  text,
  font,
  size = 64,
  color = C.ink,
  scale = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      scale: String(scale),
      filter: "url(#boil)",
    }}
  >
    <svg
      width={w + 200}
      height={h + 200}
      style={{
        position: "absolute",
        left: -100,
        top: -100,
        overflow: "visible",
      }}
    >
      <path
        d={`M ${100 + w * 0.35} ${100 + h - 4} L ${100 + w / 2 + tail[0]} ${100 + h / 2 + tail[1]} L ${100 + w * 0.55} ${100 + h - 4} Z`}
        fill="#fff"
        stroke={C.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <ellipse
        cx={100 + w / 2}
        cy={100 + h / 2}
        rx={w / 2}
        ry={h / 2}
        fill="#fff"
        stroke={C.ink}
        strokeWidth={STROKE}
      />
      <path
        d={`M ${100 + w * 0.36} ${100 + h - 10} L ${100 + w * 0.54} ${100 + h - 10}`}
        stroke="#fff"
        strokeWidth={STROKE * 1.6}
      />
    </svg>
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontFamily: font,
        fontSize: size,
        lineHeight: 1.05,
        color,
        padding: "0 40px",
      }}
    >
      {text}
    </div>
  </div>
);
