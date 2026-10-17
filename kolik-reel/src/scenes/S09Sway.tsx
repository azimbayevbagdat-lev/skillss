import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Car } from "../doodle/Car";
import { Head } from "../doodle/Person";
import { C, FONT_TITLE, STROKE } from "../theme";
import { SceneProps, Stage, Svg, ease } from "./common";

// Баяу тербеліс: көлік толқын үстінде тербеледі (период 5 с), бұрышта секундомер 0→5.
export const S09Sway: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const phase = (2 * Math.PI * t) / 5;
  const tilt = Math.sin(phase) * 7;
  const lift = Math.sin(phase + Math.PI / 2) * 40;
  const fill = ease(frame, 6, Math.min(dur - 4, 6 + 5 * fps));
  const secs = Math.min(5, Math.floor(fill * 5 + 0.0001));
  const wave = (yy: number, amp: number, shift: number) => {
    let d = `M -40 ${yy}`;
    for (let x = -40; x <= 1120; x += 20)
      d += ` L ${x} ${yy + Math.sin((x / 1080) * Math.PI * 2 * 1.2 - phase + shift) * amp}`;
    return d + ` L 1120 1920 L -40 1920 Z`;
  };
  const a = fill * Math.PI * 2;
  return (
    <Stage bg={C.sky1}>
      <Svg>
        <path
          d={wave(1420, 40, 0)}
          fill="#9fd0f0"
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        <Car
          x={540}
          y={1300 - lift}
          scale={0.95}
          tilt={tilt}
          wheelAngle={0}
          inside={
            <g transform="translate(-130 -128) scale(0.62)">
              <Head sick={0.4 + 0.5 * fill} mouth="sick" look={[0, 0.3]} />
            </g>
          }
        />
        <path
          d={wave(1500, 34, 1.4)}
          fill={C.water}
          stroke={C.ink}
          strokeWidth={STROKE}
          opacity={0.95}
        />
        {/* stopwatch */}
        <g transform="translate(860 760)">
          <rect
            x={-22}
            y={-150}
            width={44}
            height={36}
            rx={8}
            fill={C.red}
            stroke={C.ink}
            strokeWidth={6}
          />
          <circle r={115} fill="#fff" stroke={C.ink} strokeWidth={STROKE} />
          <path
            d={`M 0 0 L 0 -100 A 100 100 0 ${a > Math.PI ? 1 : 0} 1 ${Math.sin(a) * 100} ${-Math.cos(a) * 100} Z`}
            fill={C.red}
            opacity={0.85}
          />
          <circle r={115} fill="none" stroke={C.red} strokeWidth={10} />
          <text
            y={30}
            textAnchor="middle"
            fontFamily={FONT_TITLE}
            fontWeight={700}
            fontSize={96}
            fill={C.ink}
            stroke="#fff"
            strokeWidth={6}
            paintOrder="stroke"
          >
            {secs}
          </text>
        </g>
      </Svg>
    </Stage>
  );
};
