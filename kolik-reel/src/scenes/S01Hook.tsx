import React from "react";
import { useCurrentFrame } from "remotion";
import { Car } from "../doodle/Car";
import { Head } from "../doodle/Person";
import { Road, Sky } from "../doodle/Scenery";
import { C } from "../theme";
import { SceneProps, Stage, Svg, ease } from "./common";

// Хук: көгілдір көлік күн батқан жолмен келе жатыр, артқы жолаушының беті жасылданады.
export const S01Hook: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const sick = ease(frame, 10, dur - 6);
  const bob = Math.sin(frame * 0.55) * 4;
  return (
    <Stage>
      <Sky sunY={1150} />
      <Road y={1320} scroll={frame * 16} />
      <Svg>
        {/* speed lines */}
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M ${40 + ((frame * 9 + i * 40) % 60)} ${1180 + i * 50} h 90`}
            stroke={C.ink}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.7}
          />
        ))}
        <Car
          x={580}
          y={1340 + bob}
          scale={1.08}
          wheelAngle={frame * 14}
          tilt={Math.sin(frame * 0.3) * 0.8}
          inside={
            <>
              <g transform="translate(-130 -128) scale(0.62)">
                <Head
                  sick={sick}
                  mouth={sick > 0.5 ? "sick" : "flat"}
                  look={[-0.2, 0.3]}
                />
              </g>
              <g transform="translate(70 -128) scale(0.6)">
                <Head mouth="smile" look={[1, 0]} />
              </g>
            </>
          }
        />
      </Svg>
    </Stage>
  );
};
