import React from "react";
import { useCurrentFrame } from "remotion";
import { C, STROKE } from "../theme";
import { Draw, SceneProps, Stage, Svg, ease, sec } from "./common";

// Артта жол көрінбейді: артқы орындықтан көрініс, алдыңғы екі орындық, ортада жол әрең көрінеді.
const SeatBack: React.FC<{ x: number }> = ({ x }) => (
  <g transform={`translate(${x} 0)`}>
    <rect
      x={-95}
      y={830}
      width={190}
      height={150}
      rx={50}
      fill={C.seat}
      stroke={C.ink}
      strokeWidth={STROKE}
    />
    <path
      d="M -40 980 V 1020 M 40 980 V 1020"
      stroke={C.ink}
      strokeWidth={STROKE}
    />
    <path
      d="M -230 1080 Q -240 1010 -170 1010 H 170 Q 240 1010 230 1080 L 250 1800 H -250 Z"
      fill={C.seat}
      stroke={C.ink}
      strokeWidth={STROKE}
      strokeLinejoin="round"
    />
    <path
      d="M -150 1120 V 1720 M 0 1120 V 1720 M 150 1120 V 1720"
      stroke={C.seatDark}
      strokeWidth={8}
      strokeLinecap="round"
    />
  </g>
);

export const S07Backseat: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const circle = ease(frame, sec(1.0), sec(1.7));
  const pulse = 1 + Math.sin(frame / 5) * 0.03;
  return (
    <Stage bg="#d9c3a2">
      <Svg>
        {/* windshield */}
        <path
          d="M 120 640 Q 540 580 960 640 L 1000 1000 H 80 Z"
          fill={C.sky2}
          stroke={C.ink}
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
        <path d="M 90 900 H 990 V 1000 H 80 Z" fill={C.grass} />
        <path
          d="M 520 880 L 560 880 L 640 1000 L 440 1000 Z"
          fill={C.road}
          stroke={C.ink}
          strokeWidth={5}
        />
        <circle
          cx={760}
          cy={820}
          r={40}
          fill={C.sun}
          stroke={C.ink}
          strokeWidth={5}
        />
        <path
          d="M 80 1000 H 1000 L 1080 1100 H 0 Z"
          fill="#5c463a"
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        <SeatBack x={290} />
        <SeatBack x={790} />
        <g transform={`translate(540 950) scale(${pulse})`}>
          <Draw
            d="M 0 -150 A 150 150 0 1 1 -0.1 -150"
            p={circle}
            stroke={C.red}
            width={10}
            dash="26 18"
          />
        </g>
        <path d="M 0 1820 H 1080" stroke={C.ink} strokeWidth={STROKE} />
      </Svg>
    </Stage>
  );
};
