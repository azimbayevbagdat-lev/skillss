import React from "react";
import { interpolateColors } from "remotion";
import { C, STROKE } from "../theme";

type Pt = [number, number];
export type Mouth = "smile" | "flat" | "sick" | "open" | "grin";

// Stick figure: big round head, round glasses, curly hair, black 7px lines.
// Origin = head center. `sick` 0..1 turns the face green and darkens under the eyes.
export const Head: React.FC<{
  sick?: number;
  mouth?: Mouth;
  look?: Pt;
  r?: number;
  child?: boolean;
}> = ({ sick = 0, mouth = "smile", look = [0, 0], r = 90, child = false }) => {
  const face = interpolateColors(sick, [0, 1], [C.skin, C.sick]);
  const k = r / 90;
  const curls = child ? 7 : 11;
  return (
    <g>
      <circle r={r} fill={face} stroke={C.ink} strokeWidth={STROKE} />
      {/* curly hair */}
      {new Array(curls).fill(0).map((_, i) => {
        const a = Math.PI * (1.08 + (0.84 * i) / (curls - 1));
        return (
          <circle
            key={i}
            cx={Math.cos(a) * r * 0.86}
            cy={Math.sin(a) * r * 0.86 - 4 * k}
            r={(child ? 18 : 23) * k}
            fill={C.hair}
            stroke={C.ink}
            strokeWidth={STROKE * 0.8}
          />
        );
      })}
      {/* dark circles */}
      {sick > 0.05 ? (
        <g
          opacity={sick}
          stroke="#5d4a6e"
          strokeWidth={5 * k}
          fill="none"
          strokeLinecap="round"
        >
          <path
            d={`M ${-56 * k} ${30 * k} q ${22 * k} ${14 * k} ${44 * k} 0`}
          />
          <path d={`M ${12 * k} ${30 * k} q ${22 * k} ${14 * k} ${44 * k} 0`} />
        </g>
      ) : null}
      {/* glasses */}
      <g stroke={C.ink} strokeWidth={STROKE * 0.8} fill="#ffffff55">
        <circle cx={-34 * k} cy={4 * k} r={26 * k} />
        <circle cx={34 * k} cy={4 * k} r={26 * k} />
        <path
          d={`M ${-8 * k} ${2 * k} q ${8 * k} ${-8 * k} ${16 * k} 0`}
          fill="none"
        />
      </g>
      <circle
        cx={-34 * k + look[0] * 10 * k}
        cy={4 * k + look[1] * 10 * k}
        r={6.5 * k}
        fill={C.ink}
      />
      <circle
        cx={34 * k + look[0] * 10 * k}
        cy={4 * k + look[1] * 10 * k}
        r={6.5 * k}
        fill={C.ink}
      />
      {/* mouth */}
      <g
        stroke={C.ink}
        strokeWidth={STROKE * 0.75}
        fill="none"
        strokeLinecap="round"
      >
        {mouth === "smile" ? (
          <path
            d={`M ${-24 * k} ${48 * k} q ${24 * k} ${20 * k} ${48 * k} 0`}
          />
        ) : null}
        {mouth === "grin" ? (
          <path
            d={`M ${-30 * k} ${44 * k} q ${30 * k} ${34 * k} ${60 * k} 0 z`}
            fill="#fff"
          />
        ) : null}
        {mouth === "flat" ? (
          <path d={`M ${-20 * k} ${56 * k} h ${40 * k}`} />
        ) : null}
        {mouth === "open" ? (
          <ellipse cx={0} cy={56 * k} rx={14 * k} ry={18 * k} fill="#7a2b2b" />
        ) : null}
        {mouth === "sick" ? (
          <path
            d={`M ${-30 * k} ${58 * k} q ${10 * k} ${-12 * k} ${20 * k} 0 t ${20 * k} 0 t ${20 * k} 0`}
          />
        ) : null}
      </g>
    </g>
  );
};

const limb = (a: Pt, b: Pt, bend = 0.18): string => {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend;
  const my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  return `M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`;
};

// Full figure. Coordinates are relative to the head center; body below it.
export const Person: React.FC<{
  x: number;
  y: number;
  scale?: number;
  sick?: number;
  mouth?: Mouth;
  look?: Pt;
  pose?: "stand" | "sit";
  handL?: Pt; // hand targets relative to head center
  handR?: Pt;
  child?: boolean;
  bodyColor?: string;
}> = ({
  x,
  y,
  scale = 1,
  sick = 0,
  mouth,
  look,
  pose = "stand",
  handL,
  handR,
  child,
  bodyColor = C.ink,
}) => {
  const shoulder: Pt = [0, 150];
  const hip: Pt = [0, 330];
  const hl = handL ?? [-90, 300];
  const hr = handR ?? [90, 300];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g
        stroke={bodyColor}
        strokeWidth={STROKE * 1.1}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={`M 0 88 L ${hip[0]} ${hip[1]}`} />
        {pose === "stand" ? (
          <>
            <path d={limb(hip, [-60, 540], -0.08)} />
            <path d={limb(hip, [60, 540], 0.08)} />
            <path d="M -60 540 h -30 M 60 540 h 30" />
          </>
        ) : (
          <>
            <path d={`M 0 330 L 120 340 L 120 500 h 30`} />
          </>
        )}
        <path d={limb(shoulder, hl, 0.25)} />
        <path d={limb(shoulder, hr, -0.25)} />
      </g>
      <circle
        cx={hl[0]}
        cy={hl[1]}
        r={13}
        fill={C.skin}
        stroke={C.ink}
        strokeWidth={5}
      />
      <circle
        cx={hr[0]}
        cy={hr[1]}
        r={13}
        fill={C.skin}
        stroke={C.ink}
        strokeWidth={5}
      />
      <Head sick={sick} mouth={mouth} look={look} child={child} />
    </g>
  );
};
