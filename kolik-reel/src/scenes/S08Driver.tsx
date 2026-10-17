import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Person } from "../doodle/Person";
import { C, STROKE } from "../theme";
import { Draw, SceneProps, Stage, Svg, ease, sec } from "./common";

// Жүргізуші рульді ұстап отыр, алдында перспективадағы жол, басының үстінде бұлт-ой ішінде бұрылыс жебесі.
export const S08Driver: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cloud = spring({
    frame: frame - sec(1.2),
    fps,
    config: { damping: 13, stiffness: 140 },
  });
  const arrow = ease(frame, sec(1.8), sec(2.8));
  const steer = Math.sin(frame / 14) * 10;
  return (
    <Stage bg={C.sky1}>
      <Svg>
        {/* perspective road */}
        <rect
          x={0}
          y={1000}
          width={1080}
          height={920}
          fill={C.grass}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        <path
          d="M 500 1000 L 580 1000 Q 700 1200 1000 1920 L 160 1920 Q 420 1300 500 1000 Z"
          fill={C.road}
          stroke={C.ink}
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
        {[0, 1, 2, 3].map((i) => {
          const t = (frame / 25 + i / 4) % 1;
          const y = 1010 + t * t * 900;
          const x = 545 + t * t * 40;
          return (
            <rect
              key={i}
              x={x - 4 - t * 12}
              y={y}
              width={8 + t * 24}
              height={20 + t * 70}
              rx={6}
              fill="#f2e3b3"
            />
          );
        })}
        <circle
          cx={250}
          cy={930}
          r={70}
          fill={C.sun}
          stroke={C.ink}
          strokeWidth={6}
        />
        {/* driver */}
        <Person
          x={540}
          y={1190}
          scale={1.0}
          mouth="smile"
          look={[0.4, -0.3]}
          pose="sit"
          handL={[-120, 300]}
          handR={[120, 300]}
        />
        <g transform={`translate(540 1500) rotate(${steer})`}>
          <circle r={170} fill="none" stroke={C.ink} strokeWidth={30} />
          <circle r={170} fill="none" stroke="#555" strokeWidth={16} />
          <circle r={36} fill="#555" stroke={C.ink} strokeWidth={STROKE} />
          <path
            d="M -165 0 H -36 M 36 0 H 165 M 0 36 V 165"
            stroke={C.ink}
            strokeWidth={18}
          />
        </g>
        <circle
          cx={540 - 150 + steer}
          cy={1470}
          r={22}
          fill={C.skin}
          stroke={C.ink}
          strokeWidth={5}
        />
        <circle
          cx={540 + 150 + steer}
          cy={1470}
          r={22}
          fill={C.skin}
          stroke={C.ink}
          strokeWidth={5}
        />
        {/* thought cloud */}
        <g transform={`translate(800 760) scale(${cloud})`}>
          <path
            d="M -170 40 C -230 30 -220 -60 -150 -60 C -150 -130 -50 -150 -10 -100 C 30 -160 140 -140 140 -70 C 220 -80 230 30 160 40 C 170 100 80 120 40 90 C 0 130 -90 120 -100 80 C -150 100 -200 80 -170 40 Z"
            fill="#fff"
            stroke={C.ink}
            strokeWidth={STROKE}
          />
          <circle
            cx={-200}
            cy={130}
            r={22}
            fill="#fff"
            stroke={C.ink}
            strokeWidth={6}
          />
          <circle
            cx={-240}
            cy={190}
            r={13}
            fill="#fff"
            stroke={C.ink}
            strokeWidth={5}
          />
          <Draw
            d="M -80 70 V -10 Q -80 -60 -30 -60 H 60"
            p={arrow}
            stroke={C.green}
            width={22}
          />
          {arrow > 0.92 ? (
            <path
              d="M 30 -95 L 80 -60 L 30 -25"
              stroke={C.green}
              strokeWidth={22}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </g>
      </Svg>
    </Stage>
  );
};
