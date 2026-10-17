import React from "react";
import { random, useCurrentFrame } from "remotion";
import { Person } from "../doodle/Person";
import { C, STROKE } from "../theme";
import { SceneProps, Stage, Svg, ease, tornRect } from "./common";

// Терезе ашылады, ішке жел кіреді, жапырақтар ұшады, кейіпкер жымияды.
export const S13Window: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const open = ease(frame, 2, 16);
  const win = { x: 90, y: 680, w: 560, h: 520 };
  const d = tornRect(win.x, win.y, win.w, win.h, 9, 12);
  return (
    <Stage bg="#d9c3a2">
      <Svg>
        <defs>
          <clipPath id="w13">
            <path d={d} />
          </clipPath>
        </defs>
        <g clipPath="url(#w13)">
          <rect
            x={win.x}
            y={win.y}
            width={win.w}
            height={win.h}
            fill={C.sky2}
          />
          <rect
            x={win.x}
            y={win.y + 340}
            width={win.w}
            height={200}
            fill={C.grass}
          />
          {/* glass sliding down */}
          <rect
            x={win.x}
            y={win.y + open * win.h}
            width={win.w}
            height={win.h}
            fill={C.glass}
            opacity={0.6}
            stroke={C.ink}
            strokeWidth={5}
          />
        </g>
        <path
          d={d}
          fill="none"
          stroke={C.ink}
          strokeWidth={STROKE * 2.2}
          strokeLinejoin="round"
        />
        <path
          d="M 0 1300 H 1080 V 1920 H 0 Z"
          fill={C.seat}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        {/* wind streams */}
        {[0, 1, 2, 3].map((i) => {
          const p = ((frame * 0.05 + i * 0.25) % 1) * open;
          const y = 820 + i * 90;
          return (
            <path
              key={i}
              d={`M ${200 + p * 300} ${y} q 120 -40 240 0 t 240 0`}
              stroke="#fff"
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              opacity={open * (1 - p * 0.5)}
              strokeDasharray="160 400"
              strokeDashoffset={-p * 500}
            />
          );
        })}
        {/* leaves */}
        {new Array(7).fill(0).map((_, i) => {
          const p = ((frame / 30 + random(`l${i}`)) % 1) * open;
          const x = 300 + p * 700;
          const y = 760 + random(`ly${i}`) * 360 + Math.sin(p * 9 + i) * 40;
          return (
            <g
              key={i}
              transform={`translate(${x} ${y}) rotate(${frame * 9 + i * 40})`}
              opacity={open}
            >
              <path
                d="M -22 0 Q 0 -18 22 0 Q 0 18 -22 0 Z"
                fill={i % 2 ? C.grass : "#c9a640"}
                stroke={C.ink}
                strokeWidth={4}
              />
            </g>
          );
        })}
        <Person
          x={820}
          y={980}
          scale={0.95}
          mouth="grin"
          look={[-1, 0]}
          pose="sit"
          handL={[-110, 260]}
          handR={[90, 300]}
        />
      </Svg>
    </Stage>
  );
};
