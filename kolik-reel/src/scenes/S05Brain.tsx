import React from "react";
import {
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Brain, EarIcon, EyeIcon } from "../doodle/Brain";
import { C, FONT_HAND, STROKE } from "../theme";
import { SceneProps, Stage, Svg, ease, sec } from "./common";

// Ми: құлақ пен көзден екі түрлі сигнал келеді, ми абдырайды, сосын «уланып қалған!» ⚠️
export const S05Brain: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tWarn = sec(1.85);
  const toPink = ease(frame, tWarn - 4, tWarn + 4);
  const bg = interpolateColors(toPink, [0, 1], [C.purple, C.pink]);
  const warn = spring({
    frame: frame - tWarn,
    fps,
    config: { damping: 10, stiffness: 200 },
  });
  const shake = frame > tWarn ? Math.sin(frame * 2.1) * 6 : 0;
  const by = 1240;
  const dots = (from: [number, number], color: string, phase: number) =>
    new Array(5).fill(0).map((_, i) => {
      const t = ((frame + i * 6 + phase) % 30) / 30;
      const x = from[0] + (540 - from[0]) * t;
      const y = from[1] + Math.sin(t * Math.PI * 3) * 30;
      return (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={14}
          fill={color}
          stroke={C.ink}
          strokeWidth={4}
          opacity={1 - t * 0.3}
        />
      );
    });
  return (
    <Stage bg={bg}>
      <Svg>
        <path
          d={`M 170 ${by} q 90 -40 180 0 t 180 0`}
          stroke={C.blue}
          strokeWidth={8}
          fill="none"
          strokeDasharray="16 14"
        />
        <path
          d={`M 910 ${by} q -90 40 -180 0 t -180 0`}
          stroke="#f08a24"
          strokeWidth={8}
          fill="none"
          strokeDasharray="16 14"
        />
        {dots([170, by], C.blue, 0)}
        {dots([910, by], "#f08a24", 15)}
        <g transform={`translate(${shake} 0)`}>
          <Brain
            x={540}
            y={by}
            scale={0.95}
            face={frame > tWarn ? "shock" : "confused"}
            t={frame}
          />
        </g>
        <EarIcon x={130} y={by} scale={1.1} />
        <EyeIcon x={950} y={by} scale={0.7} look={-0.5} />
        {frame < tWarn
          ? ["?", "?"].map((q, i) => (
              <text
                key={i}
                x={420 + i * 260}
                y={by - 260 - Math.sin(frame / 6 + i) * 12}
                fontFamily={FONT_HAND}
                fontSize={110}
                fill={C.ink}
              >
                {q}
              </text>
            ))
          : null}
        {frame >= tWarn ? (
          <g transform={`translate(540 ${by - 360}) scale(${warn})`}>
            <path
              d="M 0 -120 L 125 95 L -125 95 Z"
              fill="#ffd23f"
              stroke={C.ink}
              strokeWidth={STROKE * 1.3}
              strokeLinejoin="round"
            />
            <path
              d="M 0 -50 V 30"
              stroke={C.ink}
              strokeWidth={20}
              strokeLinecap="round"
            />
            <circle cy={65} r={12} fill={C.ink} />
          </g>
        ) : null}
      </Svg>
    </Stage>
  );
};
