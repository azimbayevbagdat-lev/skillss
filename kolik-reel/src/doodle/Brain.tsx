import React from "react";
import { C, STROKE } from "../theme";

// Lumpy pink brain with folds; optional cartoon face. Origin = center, ~r 230.
export const Brain: React.FC<{
  x: number;
  y: number;
  scale?: number;
  face?: "calm" | "confused" | "shock" | null;
  t?: number; // time (frames) for eye spin
  color?: string;
}> = ({ x, y, scale = 1, face = null, t = 0, color = C.brain }) => {
  const outline =
    "M -230 30 C -270 -60 -210 -150 -130 -160 C -110 -220 -20 -230 20 -190 C 70 -235 170 -210 180 -140 C 260 -120 280 -20 240 40 C 270 110 200 180 120 160 C 80 210 -20 210 -50 170 C -130 200 -230 150 -210 80 C -240 70 -245 50 -230 30 Z";
  const folds = [
    "M -160 -60 q 40 -40 80 0 t 70 -10",
    "M -170 50 q 50 30 90 -10 t 90 20",
    "M 30 -120 q 40 30 10 70 t 40 60",
    "M 90 90 q 40 -40 100 -20",
    "M -60 110 q 20 -40 70 -30",
  ];
  const spin = (t * 25) % 360;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d={outline}
        fill={color}
        stroke={C.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      {folds.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#c45b7d"
          strokeWidth={6}
          strokeLinecap="round"
        />
      ))}
      {face ? (
        <g>
          {[-70, 70].map((ex) => (
            <g key={ex} transform={`translate(${ex} 0)`}>
              <circle
                r={42}
                fill="#fff"
                stroke={C.ink}
                strokeWidth={STROKE * 0.8}
              />
              {face === "confused" ? (
                <g transform={`rotate(${ex > 0 ? spin : -spin})`}>
                  <path
                    d="M 0 0 m -4 0 a 4 4 0 1 1 8 0 a 10 10 0 1 1 -18 0 a 16 16 0 1 1 30 0"
                    fill="none"
                    stroke={C.ink}
                    strokeWidth={5}
                  />
                </g>
              ) : (
                <circle r={face === "shock" ? 9 : 14} fill={C.ink} />
              )}
            </g>
          ))}
          {face === "calm" ? (
            <path
              d="M -40 80 q 40 30 80 0"
              stroke={C.ink}
              strokeWidth={STROKE * 0.8}
              fill="none"
              strokeLinecap="round"
            />
          ) : null}
          {face === "confused" ? (
            <path
              d="M -50 90 q 25 -20 50 0 t 50 0"
              stroke={C.ink}
              strokeWidth={STROKE * 0.8}
              fill="none"
              strokeLinecap="round"
            />
          ) : null}
          {face === "shock" ? (
            <ellipse
              cx={0}
              cy={95}
              rx={26}
              ry={32}
              fill="#7a2b2b"
              stroke={C.ink}
              strokeWidth={STROKE * 0.8}
            />
          ) : null}
        </g>
      ) : null}
    </g>
  );
};

export const EarIcon: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path
      d="M -40 60 C -70 20 -70 -80 0 -90 C 70 -95 80 -20 40 10 C 20 25 20 50 10 70 C 0 95 -30 90 -40 60 Z"
      fill={C.skin}
      stroke={C.ink}
      strokeWidth={STROKE}
      strokeLinejoin="round"
    />
    <path
      d="M -15 30 C -40 -10 -30 -60 5 -60 C 40 -60 45 -20 20 -5"
      fill="none"
      stroke={C.ink}
      strokeWidth={6}
      strokeLinecap="round"
    />
  </g>
);

export const EyeIcon: React.FC<{
  x: number;
  y: number;
  scale?: number;
  look?: number;
  lid?: number;
}> = ({ x, y, scale = 1, look = 0, lid = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path
      d="M -110 0 Q 0 -95 110 0 Q 0 95 -110 0 Z"
      fill="#fff"
      stroke={C.ink}
      strokeWidth={STROKE}
      strokeLinejoin="round"
    />
    <circle
      cx={look * 30}
      r={42}
      fill="#5b8fd6"
      stroke={C.ink}
      strokeWidth={STROKE * 0.8}
    />
    <circle cx={look * 30} r={19} fill={C.ink} />
    <circle cx={look * 30 + 12} cy={-12} r={8} fill="#fff" />
    {lid > 0 ? (
      <path
        d={`M -110 0 Q 0 ${-95 + lid * 95} 110 0 Q 0 -95 -110 0 Z`}
        fill={C.skin}
        stroke={C.ink}
        strokeWidth={STROKE * 0.8}
      />
    ) : null}
    <path
      d="M -95 -40 l -18 -18 M -50 -66 l -8 -24 M 0 -74 v -26 M 50 -66 l 8 -24 M 95 -40 l 18 -18"
      stroke={C.ink}
      strokeWidth={6}
      strokeLinecap="round"
    />
  </g>
);
