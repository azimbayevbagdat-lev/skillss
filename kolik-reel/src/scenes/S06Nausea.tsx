import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Person } from "../doodle/Person";
import { Sky } from "../doodle/Scenery";
import { C, STROKE } from "../theme";
import { Draw, SceneProps, Stage, Svg, ease, sec } from "./common";

// Жүрек айнуы: беті жасыл адам, қолы кеудесінде; жанында бас сүйекті у құтысы, одан жоғары қызыл жебе.
export const S06Nausea: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bottle = spring({
    frame: frame - 6,
    fps,
    config: { damping: 13, stiffness: 150 },
  });
  const arrow = ease(frame, sec(1.0), sec(1.8));
  const sway = Math.sin(frame / 7) * 3;
  return (
    <Stage>
      <Sky sunY={1500} />
      <Svg>
        <rect
          x={-20}
          y={1560}
          width={1120}
          height={400}
          fill={C.ground}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        <g transform={`rotate(${sway} 330 1560)`}>
          <Person
            x={330}
            y={820}
            scale={1.35}
            sick={1}
            mouth="sick"
            look={[0, 0.4]}
            handR={[10, 210]}
            handL={[-30, 230]}
          />
          {/* nausea swirls */}
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M ${230 + i * 90} ${640 - ((frame * 2 + i * 20) % 60)} q 15 -20 0 -40 q -15 -20 0 -40`}
              stroke={C.sick}
              strokeWidth={8}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </g>
        {/* poison bottle */}
        <g transform={`translate(800 1340) scale(${bottle})`}>
          <rect
            x={-40}
            y={-300}
            width={80}
            height={70}
            rx={10}
            fill="#8a6a50"
            stroke={C.ink}
            strokeWidth={STROKE}
          />
          <path
            d="M -40 -230 C -40 -190 -130 -180 -130 -100 V 180 Q -130 220 -90 220 H 90 Q 130 220 130 180 V -100 C 130 -180 40 -190 40 -230 Z"
            fill="#7ccf5a"
            stroke={C.ink}
            strokeWidth={STROKE}
            strokeLinejoin="round"
          />
          <path
            d="M -128 -40 Q 0 -70 128 -40"
            stroke={C.ink}
            strokeWidth={5}
            fill="none"
          />
          <rect
            x={-95}
            y={10}
            width={190}
            height={150}
            rx={14}
            fill="#fff"
            stroke={C.ink}
            strokeWidth={STROKE * 0.8}
          />
          {/* skull */}
          <circle
            cx={0}
            cy={70}
            r={40}
            fill="#fff"
            stroke={C.ink}
            strokeWidth={6}
          />
          <circle cx={-15} cy={65} r={10} fill={C.ink} />
          <circle cx={15} cy={65} r={10} fill={C.ink} />
          <path
            d="M -12 100 v 12 M 0 100 v 12 M 12 100 v 12"
            stroke={C.ink}
            strokeWidth={5}
          />
          <path
            d="M -60 140 L 60 30 M 60 140 L -60 30"
            stroke={C.ink}
            strokeWidth={8}
            strokeLinecap="round"
            opacity={0.85}
          />
        </g>
        {/* red arrow up */}
        <Draw
          d="M 800 1010 C 790 920 830 840 800 740"
          p={arrow}
          stroke={C.red}
          width={20}
        />
        {arrow > 0.9 ? (
          <path
            d="M 750 790 L 800 720 L 845 795"
            stroke={C.red}
            strokeWidth={20}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
    </Stage>
  );
};
