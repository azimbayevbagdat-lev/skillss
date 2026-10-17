import React from "react";
import { useCurrentFrame } from "remotion";
import { Head } from "../doodle/Person";
import { C, FONT_HAND, STROKE } from "../theme";
import { Draw, SceneProps, Stage, Svg, ease, sec } from "./common";

// Балалар 2–12 жас: балалар креслосында кішкентай бала, беті сәл жасыл; үстінде «2–12».
export const S10Kids: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const label = ease(frame, sec(2.3), sec(3.0)); // «екі мен он екі жас»
  const bob = Math.sin(frame / 8) * 4;
  return (
    <Stage bg="#d9c3a2">
      <Svg>
        {/* back seat */}
        <path
          d="M 60 980 Q 60 900 140 900 H 940 Q 1020 900 1020 980 V 1500 H 60 Z"
          fill={C.seat}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        <path
          d="M 0 1500 H 1080 V 1700 H 0 Z"
          fill={C.seatDark}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        {/* window above */}
        <path
          d="M 160 640 H 920 Q 960 640 960 690 V 860 H 120 V 690 Q 120 640 160 640 Z"
          fill={C.sky2}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        {/* child seat */}
        <g transform={`translate(540 ${1180 + bob})`}>
          <path
            d="M -210 -260 Q -230 -330 -150 -330 H 150 Q 230 -330 210 -260 L 230 260 Q 230 320 170 320 H -170 Q -230 320 -230 260 Z"
            fill="#e05a4f"
            stroke={C.ink}
            strokeWidth={STROKE}
          />
          <path
            d="M -150 -200 H 150 V 240 H -150 Z"
            fill="#2f5fa8"
            stroke={C.ink}
            strokeWidth={STROKE}
          />
          <g transform="translate(0 -110)">
            <Head r={95} child sick={0.45} mouth="flat" look={[0, 0.2]} />
          </g>
          {/* body + straps */}
          <path
            d="M -80 120 V 240 M 80 120 V 240"
            stroke="#222"
            strokeWidth={16}
          />
          <path d="M 0 -20 V 200" stroke={C.ink} strokeWidth={STROKE} />
          <path
            d="M 0 20 Q -80 60 -110 130 M 0 20 Q 80 60 110 130"
            stroke={C.ink}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
          />
          <rect
            x={-30}
            y={150}
            width={60}
            height={40}
            rx={8}
            fill="#d9d9d9"
            stroke={C.ink}
            strokeWidth={5}
          />
        </g>
        {/* hand-written 2–12 */}
        <g
          opacity={label > 0 ? 1 : 0}
          transform={`translate(540 760) rotate(-6) scale(${0.8 + 0.2 * label})`}
        >
          <text
            textAnchor="middle"
            fontFamily={FONT_HAND}
            fontSize={170}
            fill={C.red}
            stroke={C.ink}
            strokeWidth={3}
            paintOrder="stroke"
            opacity={label}
          >
            2–12
          </text>
          <Draw
            d="M -200 40 Q 0 70 210 30"
            p={label}
            stroke={C.red}
            width={10}
          />
        </g>
      </Svg>
    </Stage>
  );
};
