import React from "react";
import { C, STROKE } from "../theme";

const Wheel: React.FC<{ x: number; y: number; angle: number }> = ({
  x,
  y,
  angle,
}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={70} fill="#2b2b2b" stroke={C.ink} strokeWidth={STROKE} />
    <circle r={36} fill="#d9d9d9" stroke={C.ink} strokeWidth={STROKE * 0.8} />
    <g
      transform={`rotate(${angle})`}
      stroke={C.ink}
      strokeWidth={6}
      strokeLinecap="round"
    >
      <path d="M -30 0 H 30 M 0 -30 V 30" />
    </g>
  </g>
);

// Side view of the light-blue car, facing right. Origin = middle of the body.
// `inside` is drawn behind the body so passengers show through the window holes.
export const Car: React.FC<{
  x: number;
  y: number;
  scale?: number;
  wheelAngle?: number;
  tilt?: number;
  inside?: React.ReactNode;
}> = ({ x, y, scale = 1, wheelAngle = 0, tilt = 0, inside }) => {
  const rearWin = "M -250 -70 L -215 -205 L -30 -205 L -30 -70 Z";
  const frontWin = "M 0 -70 L 0 -205 L 120 -205 L 205 -70 Z";
  const cabin =
    "M -300 -60 Q -280 -230 -200 -240 L 140 -240 Q 190 -230 260 -70 Z";
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${scale})`}>
      {inside}
      {/* cabin with window holes */}
      <path
        d={`${cabin} ${rearWin} ${frontWin}`}
        fillRule="evenodd"
        fill={C.car}
        stroke={C.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d={rearWin}
        fill={C.glass}
        fillOpacity={0.35}
        stroke={C.ink}
        strokeWidth={STROKE * 0.8}
        strokeLinejoin="round"
      />
      <path
        d={frontWin}
        fill={C.glass}
        fillOpacity={0.35}
        stroke={C.ink}
        strokeWidth={STROKE * 0.8}
        strokeLinejoin="round"
      />
      {/* lower body */}
      <path
        d="M -400 -40 Q -400 -75 -360 -75 L 330 -75 Q 400 -70 405 -10 L 405 50 Q 405 85 370 85 L -370 85 Q -400 85 -400 50 Z"
        fill={C.car}
        stroke={C.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M -380 10 H 380"
        stroke={C.carDark}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path d="M -10 -60 V 70" stroke={C.ink} strokeWidth={5} />
      <rect x={-90} y={-40} width={44} height={12} rx={6} fill={C.ink} />
      <rect x={70} y={-40} width={44} height={12} rx={6} fill={C.ink} />
      <ellipse
        cx={392}
        cy={-30}
        rx={14}
        ry={20}
        fill="#ffe27a"
        stroke={C.ink}
        strokeWidth={5}
      />
      <rect
        x={-405}
        y={-50}
        width={16}
        height={34}
        rx={6}
        fill={C.red}
        stroke={C.ink}
        strokeWidth={5}
      />
      <Wheel x={-240} y={85} angle={wheelAngle} />
      <Wheel x={250} y={85} angle={wheelAngle} />
    </g>
  );
};
