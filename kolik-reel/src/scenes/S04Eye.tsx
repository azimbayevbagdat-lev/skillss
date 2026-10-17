import React from "react";
import { random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { EyeIcon } from "../doodle/Brain";
import { Bubble } from "../doodle/Scenery";
import { C, FONT_TITLE, STROKE } from "../theme";
import { SceneProps, Stage, Svg, sec, tornRect } from "./common";

// Көз: көлік терезесі, сыртта ағаштар бұлыңғыр жүгіреді, ал алдында қозғалмайтын үлкен көз.
export const S04Eye: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bubble = spring({
    frame: frame - sec(0.6),
    fps,
    config: { damping: 12, stiffness: 170 },
  });
  const win = { x: 110, y: 640, w: 860, h: 520 };
  const frameD = tornRect(win.x, win.y, win.w, win.h, 4, 14);
  return (
    <Stage bg="#e9d7bd">
      <Svg>
        <defs>
          <clipPath id="winClip">
            <path d={frameD} />
          </clipPath>
          <filter id="mblur" x="-20%" y="0" width="140%" height="100%">
            <feGaussianBlur stdDeviation="22 2" />
          </filter>
        </defs>
        {/* interior wall */}
        <rect x={0} y={560} width={1080} height={1360} fill="#d9c3a2" />
        <g clipPath="url(#winClip)">
          <rect
            x={win.x}
            y={win.y}
            width={win.w}
            height={win.h}
            fill={C.sky2}
          />
          <rect
            x={win.x}
            y={win.y + win.h * 0.62}
            width={win.w}
            height={win.h}
            fill={C.grass}
          />
          <g filter="url(#mblur)">
            {new Array(9).fill(0).map((_, i) => {
              const x = ((((i * 230 - frame * 60) % 2070) + 2070) % 2070) - 200;
              const s = 0.8 + random(`e${i}`) * 0.6;
              return (
                <g
                  key={i}
                  transform={`translate(${x} ${win.y + win.h * 0.66}) scale(${s})`}
                >
                  <rect
                    x={-10}
                    y={-120}
                    width={20}
                    height={120}
                    fill="#5a3d2b"
                  />
                  <circle cy={-180} r={90} fill={C.tree} />
                </g>
              );
            })}
          </g>
        </g>
        <path
          d={frameD}
          fill="none"
          stroke={C.ink}
          strokeWidth={STROKE * 2.2}
          strokeLinejoin="round"
        />
        <path
          d={frameD}
          fill="none"
          stroke="#fff"
          strokeWidth={6}
          strokeLinejoin="round"
          opacity={0.7}
          transform="translate(6 6)"
        />
        {/* still interior: seat edge */}
        <path
          d="M 0 1700 Q 540 1600 1080 1700 V 1920 H 0 Z"
          fill={C.seat}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        <EyeIcon x={540} y={1420} scale={1.9} look={0} />
      </Svg>
      <Bubble
        x={760}
        y={1150}
        w={500}
        h={200}
        tail={[-120, 150]}
        text="БӘРІ ОРНЫНДА"
        font={FONT_TITLE}
        size={64}
        color={C.red}
        scale={bubble}
      />
    </Stage>
  );
};
