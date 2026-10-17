import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { Brain } from "../doodle/Brain";
import { C } from "../theme";
import { SceneProps, Stage, Svg, ease, lightning } from "./common";

// Сигнал соғысы: мидың екі жағынан екі түсті найзағай бір-біріне соғылады.
export const S02Signal: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const grow = ease(frame, 4, 26);
  const hit = 26;
  const burst = ease(frame, hit, hit + 8);
  const shake =
    frame > hit
      ? Math.sin(frame * 2.3) * 8 * Math.max(0, 1 - (frame - hit) / 20)
      : 0;
  const cx = 540,
    cy = 1160;
  const left = lightning(cx - 470, cy - 40, cx, cy, 6, 34);
  const right = lightning(cx + 470, cy + 40, cx, cy, 6, 34);
  return (
    <Stage bg={C.sky1}>
      <Svg>
        <g transform={`translate(${shake} 0)`}>
          <Brain
            x={cx}
            y={cy}
            scale={1.25}
            face={frame > hit ? "shock" : "calm"}
          />
        </g>
        <path
          d={left}
          pathLength={1}
          fill="none"
          stroke={C.blue}
          strokeWidth={26}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="1 1"
          strokeDashoffset={1 - grow}
        />
        <path
          d={left}
          pathLength={1}
          fill="none"
          stroke={C.ink}
          strokeWidth={6}
          strokeDasharray="1 1"
          strokeDashoffset={1 - grow}
        />
        <path
          d={right}
          pathLength={1}
          fill="none"
          stroke="#f08a24"
          strokeWidth={26}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="1 1"
          strokeDashoffset={1 - grow}
        />
        <path
          d={right}
          pathLength={1}
          fill="none"
          stroke={C.ink}
          strokeWidth={6}
          strokeDasharray="1 1"
          strokeDashoffset={1 - grow}
        />
        {burst > 0 ? (
          <g
            transform={`translate(${cx} ${cy}) scale(${interpolate(burst, [0, 1], [0.2, 1])})`}
          >
            <path
              d={
                new Array(12)
                  .fill(0)
                  .map((_, i) => {
                    const a = (i / 12) * Math.PI * 2;
                    const r = i % 2 ? 70 : 150 + random(`b${i}`) * 30;
                    return `${i ? "L" : "M"} ${Math.cos(a) * r} ${Math.sin(a) * r}`;
                  })
                  .join(" ") + " Z"
              }
              fill="#ffd23f"
              stroke={C.ink}
              strokeWidth={7}
              strokeLinejoin="round"
            />
          </g>
        ) : null}
      </Svg>
    </Stage>
  );
};
