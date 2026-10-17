import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Bubble } from "../doodle/Scenery";
import { C, FONT_TITLE, STROKE } from "../theme";
import { SceneProps, Stage, Svg, sec } from "./common";

// Ішкі құлақ: профильдегі бас, құлаққа лупа zoom жасайды, ішінде өзекшелер мен көк сұйықтық.
export const S03Ear: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const zoom = spring({
    frame: frame - 6,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const slosh = Math.sin(frame / 5) * 14;
  const bubble = spring({
    frame: frame - sec(0.7),
    fps,
    config: { damping: 12, stiffness: 170 },
  });
  const ear = { x: 470, y: 1200 };
  const lens = { x: 700, y: 1330, r: 250 };
  return (
    <Stage bg={C.sky1}>
      <Svg>
        {/* head profile facing left */}
        <path
          d="M 600 960 C 520 860 300 860 230 980 C 180 1060 200 1120 160 1170 C 140 1200 170 1215 200 1215 C 190 1250 205 1280 230 1290 C 220 1330 240 1370 300 1370 C 340 1370 360 1420 360 1480 L 560 1480 C 580 1400 640 1330 650 1220 C 660 1110 650 1020 600 960 Z"
          fill={C.skin}
          stroke={C.ink}
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
        {/* hair */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <circle
            key={i}
            cx={300 + i * 52}
            cy={925 + Math.abs(3 - i) * 18}
            r={34}
            fill={C.hair}
            stroke={C.ink}
            strokeWidth={6}
          />
        ))}
        <circle cx={300} cy={1110} r={9} fill={C.ink} />
        <path
          d="M 250 1300 q 30 10 50 -6"
          stroke={C.ink}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
        />
        {/* ear */}
        <path
          d={`M ${ear.x - 10} ${ear.y - 60} C ${ear.x + 60} ${ear.y - 90} ${ear.x + 70} ${ear.y + 30} ${ear.x + 10} ${ear.y + 60} C ${ear.x - 20} ${ear.y + 75} ${ear.x - 30} ${ear.y + 40} ${ear.x - 10} ${ear.y + 20}`}
          fill={C.skin}
          stroke={C.ink}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* magnifier */}
        <g
          opacity={interpolate(zoom, [0, 0.2], [0, 1], {
            extrapolateRight: "clamp",
          })}
        >
          <path
            d={`M ${ear.x + 20} ${ear.y} L ${lens.x - lens.r * zoom * 0.7} ${lens.y - lens.r * zoom * 0.7}`}
            stroke={C.ink}
            strokeWidth={5}
            strokeDasharray="10 10"
          />
          <g transform={`translate(${lens.x} ${lens.y}) scale(${zoom})`}>
            <clipPath id="lensClip">
              <circle r={lens.r} />
            </clipPath>
            <circle r={lens.r} fill="#fff6ea" />
            <g clipPath="url(#lensClip)">
              {/* semicircular canals: three loops with sloshing fluid */}
              {[
                { cx: -70, cy: -60, r: 90, rot: -20 },
                { cx: 60, cy: -80, r: 80, rot: 30 },
                { cx: 10, cy: 40, r: 85, rot: 80 },
              ].map((c, i) => (
                <g
                  key={i}
                  transform={`translate(${c.cx} ${c.cy}) rotate(${c.rot})`}
                >
                  <path
                    d={`M ${-c.r} 0 A ${c.r} ${c.r} 0 1 1 ${c.r} 0`}
                    fill="none"
                    stroke={C.ink}
                    strokeWidth={46}
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${-c.r} 0 A ${c.r} ${c.r} 0 1 1 ${c.r} 0`}
                    fill="none"
                    stroke="#f3b6a0"
                    strokeWidth={32}
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${-c.r} 0 A ${c.r} ${c.r} 0 1 1 ${c.r} 0`}
                    fill="none"
                    stroke={C.water}
                    strokeWidth={22}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="0.45 1"
                    strokeDashoffset={-0.3 - (slosh + i * 4) / 100}
                  />
                </g>
              ))}
              <ellipse
                cx={-10}
                cy={150}
                rx={120}
                ry={60}
                fill="#f3b6a0"
                stroke={C.ink}
                strokeWidth={STROKE}
              />
              <path
                d={`M -120 ${150 + slosh / 3} q 60 ${-slosh} 120 0 t 120 0 V 220 H -120 Z`}
                fill={C.water}
                opacity={0.85}
              />
            </g>
            <circle
              r={lens.r}
              fill="none"
              stroke={C.ink}
              strokeWidth={STROKE * 2}
            />
            <circle
              r={lens.r - 14}
              fill="none"
              stroke="#fff"
              strokeWidth={6}
              opacity={0.6}
            />
            <path
              d={`M ${lens.r * 0.7} ${lens.r * 0.7} L ${lens.r * 1.05} ${lens.r * 1.05}`}
              stroke={C.ink}
              strokeWidth={34}
              strokeLinecap="round"
            />
          </g>
        </g>
      </Svg>
      <Bubble
        x={720}
        y={760}
        w={560}
        h={230}
        tail={[-150, 150]}
        text="БҰРЫЛЫП ЖАТЫРМЫЗ!"
        font={FONT_TITLE}
        size={62}
        color={C.red}
        scale={bubble}
      />
    </Stage>
  );
};
