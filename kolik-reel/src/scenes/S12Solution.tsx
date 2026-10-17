import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Person } from "../doodle/Person";
import { Sky } from "../doodle/Scenery";
import { C, STROKE } from "../theme";
import { Draw, SceneProps, Stage, Svg, ease, sec } from "./common";

// Шешім: адам алдыңғы орындықта, көзінен көкжиекке көк пунктир, беті қалыпқа келеді, жасыл ✓.
export const S12Solution: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tLook = sec(4.2); // «алысқа, көкжиекке қара»
  const tCheck = sec(5.7); // «Сонда сигналдар...»
  const line = ease(frame, tLook, tLook + 18);
  const sick = 1 - ease(frame, tLook - 10, tCheck + 10);
  const check = ease(frame, tCheck, tCheck + 14);
  const pop = spring({
    frame: frame - tCheck,
    fps,
    config: { damping: 10, stiffness: 180 },
  });
  const eye: [number, number] = [300 + 34 * 1.05, 1060];
  return (
    <Stage>
      <Sky sunY={1010} />
      <Svg>
        {/* horizon + landscape seen through the windshield */}
        <rect
          x={-20}
          y={1010}
          width={1120}
          height={920}
          fill={C.grass}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        <path
          d="M 820 1010 L 860 1010 L 1100 1500 L 900 1500 Z"
          fill={C.road}
          stroke={C.ink}
          strokeWidth={5}
        />
        {/* dashboard */}
        <path
          d="M -20 1500 Q 540 1420 1100 1500 V 1940 H -20 Z"
          fill="#5c463a"
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        {/* front seat back */}
        <path
          d="M 120 1240 Q 110 1080 200 1080 H 260 L 300 1700 H 100 Z"
          fill={C.seat}
          stroke={C.ink}
          strokeWidth={STROKE}
        />
        <Person
          x={300}
          y={1060}
          scale={1.05}
          sick={sick}
          mouth={sick > 0.5 ? "sick" : "smile"}
          look={[1, -0.2]}
          pose="sit"
          handL={[-80, 300]}
          handR={[120, 300]}
        />
        <Draw
          d={`M ${eye[0] + 20} ${eye[1]} L 840 1010`}
          p={line}
          stroke={C.blue}
          width={9}
          dash="22 16"
        />
        {line > 0.95 ? (
          <circle
            cx={840}
            cy={1010}
            r={16}
            fill={C.blue}
            stroke={C.ink}
            strokeWidth={4}
          />
        ) : null}
        {frame >= tCheck ? (
          <g transform={`translate(780 1300) scale(${pop})`}>
            <circle r={120} fill="#fff" stroke={C.ink} strokeWidth={STROKE} />
            <Draw
              d="M -60 0 L -15 50 L 70 -55"
              p={check}
              stroke={C.green}
              width={30}
            />
          </g>
        ) : null}
      </Svg>
    </Stage>
  );
};
