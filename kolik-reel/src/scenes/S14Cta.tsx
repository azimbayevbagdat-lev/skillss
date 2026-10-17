import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Person } from "../doodle/Person";
import { C, FONT_TITLE, STROKE } from "../theme";
import { SceneProps, Stage, Svg, sec } from "./common";

// Финал: ақ-сұр фон, адам қызыл «+» батырманы басады, «ПАРАҚШАҒА ТІРКЕЛІҢІЗ».
export const S14Cta: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tPress = sec(2.95); // «тіркеліңіз»
  const reach = spring({
    frame: frame - (tPress - 10),
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const press =
    frame >= tPress
      ? interpolate(frame - tPress, [0, 3, 9], [1, 0.86, 1], {
          extrapolateRight: "clamp",
        })
      : 1;
  const title = spring({
    frame: frame - 4,
    fps,
    config: { damping: 13, stiffness: 150 },
  });
  const hand: [number, number] = [
    interpolate(reach, [0, 1], [90, 330]),
    interpolate(reach, [0, 1], [300, 170]),
  ];
  return (
    <Stage bg={C.cta}>
      <div
        style={{
          position: "absolute",
          top: 650,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT_TITLE,
          fontWeight: 700,
          fontSize: 118,
          lineHeight: 1.02,
          color: C.red,
          scale: String(interpolate(title, [0, 1], [0.7, 1])),
          opacity: interpolate(title, [0, 0.3], [0, 1], {
            extrapolateRight: "clamp",
          }),
          filter: "url(#boilText)",
        }}
      >
        ПАРАҚШАҒА
        <br />
        ТІРКЕЛІҢІЗ
      </div>
      <Svg>
        <Person
          x={330}
          y={1180}
          scale={0.95}
          mouth="grin"
          look={[1, 0]}
          handL={[-90, 300]}
          handR={hand}
        />
        <g transform={`translate(760 1360) scale(${press})`}>
          <circle r={150} fill={C.red} stroke={C.ink} strokeWidth={STROKE} />
          <path
            d="M -70 0 H 70 M 0 -70 V 70"
            stroke="#fff"
            strokeWidth={34}
            strokeLinecap="round"
          />
        </g>
        {frame >= tPress
          ? [0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M ${760 + Math.cos(-1 + i * 0.6) * 180} ${1360 + Math.sin(-1 + i * 0.6) * 180} l ${Math.cos(-1 + i * 0.6) * 40} ${Math.sin(-1 + i * 0.6) * 40}`}
                stroke={C.ink}
                strokeWidth={8}
                strokeLinecap="round"
                opacity={interpolate(frame - tPress, [0, 4, 14], [0, 1, 0], {
                  extrapolateRight: "clamp",
                })}
              />
            ))
          : null}
      </Svg>
      <div
        style={{
          position: "absolute",
          bottom: 90,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT_TITLE,
          fontWeight: 500,
          fontSize: 34,
          color: C.grey,
          letterSpacing: "0.04em",
        }}
      >
        @by.bagdat
      </div>
    </Stage>
  );
};
