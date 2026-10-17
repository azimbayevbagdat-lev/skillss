import React from "react";
import { useCurrentFrame } from "remotion";
import { Person } from "../doodle/Person";
import { C, STROKE } from "../theme";
import { SceneProps, Stage, Svg, ease } from "./common";

// Телефон: адам телефонға үңіліп отыр, басының үстінде спираль айналады, беті жасылданады.
export const S11Phone: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const sick = ease(frame, 4, dur - 10, 0.15, 0.95);
  let spiral = "M 0 0";
  for (let a = 0; a < Math.PI * 6; a += 0.2)
    spiral += ` L ${Math.cos(a) * a * 9} ${Math.sin(a) * a * 9}`;
  return (
    <Stage bg={C.sky1}>
      <Svg>
        <path
          d="M 120 1300 Q 120 1240 180 1240 H 700 Q 760 1240 760 1300 V 1640 H 120 Z"
          fill={C.seat}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        <Person
          x={420}
          y={1000}
          scale={1.05}
          sick={sick}
          mouth="sick"
          look={[0.6, 1]}
          pose="sit"
          handL={[110, 250]}
          handR={[170, 240]}
        />
        {/* phone */}
        <g transform="translate(600 1240) rotate(-18)">
          <rect
            x={-55}
            y={-95}
            width={110}
            height={190}
            rx={18}
            fill="#333"
            stroke={C.ink}
            strokeWidth={STROKE}
          />
          <rect x={-42} y={-78} width={84} height={150} rx={8} fill="#9fd8ff" />
          <path
            d="M -30 -50 h 60 M -30 -25 h 45 M -30 0 h 55"
            stroke="#fff"
            strokeWidth={8}
            strokeLinecap="round"
          />
        </g>
        <path
          d="M 505 1110 L 580 1180"
          stroke="#9fd8ff"
          strokeWidth={4}
          strokeDasharray="8 8"
        />
        {/* spiral */}
        <g transform={`translate(420 760) rotate(${frame * 12})`}>
          <path
            d={spiral}
            fill="none"
            stroke={C.sick}
            strokeWidth={11}
            strokeLinecap="round"
          />
          <path
            d={spiral}
            fill="none"
            stroke={C.ink}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>
      </Svg>
    </Stage>
  );
};
