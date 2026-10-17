import React, { useId } from "react";
import { H, W } from "../theme";
import { Camera, camTransform } from "../geo";

const DOT_GAP = 11; // hex-grid spacing in screen px
const ROW_H = DOT_GAP * Math.sqrt(3);

// One full-frame SVG: a country path, rendered as a hexagonal dot matrix.
// Everything passed as `children` is drawn in world coordinates (inside the camera)
// and only shows through the dots, so gradients/heat blobs become dot heat-maps.
export const DotCountry: React.FC<{
  d: string;
  cam: Camera;
  colors: [string, string];
  glow: string;
  // extra world-space transform for the country (used to slide India over Kazakhstan)
  offset?: { x: number; y: number };
  dotR?: number;
  opacity?: number;
  outline?: number;
  bodyFill?: number;
  glowSize?: number;
  reveal?: number; // 0..1 radial reveal from the center
  children?: React.ReactNode;
}> = ({
  d,
  cam,
  colors,
  glow,
  offset,
  dotR = 2.5,
  opacity = 1,
  outline = 0.35,
  bodyFill = 0.08,
  glowSize = 1,
  reveal = 1,
  children,
}) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const t =
    camTransform(cam) + (offset ? ` translate(${offset.x} ${offset.y})` : "");
  const revealR = reveal * 1300;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        filter: `drop-shadow(0 0 ${4 * glowSize}px ${glow}) drop-shadow(0 0 ${16 * glowSize}px ${glow}88)`,
      }}
    >
      <defs>
        <pattern
          id={`dots${id}`}
          width={DOT_GAP}
          height={ROW_H}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={DOT_GAP / 2} cy={ROW_H / 4} r={dotR} fill="#fff" />
          <circle cx={0} cy={(ROW_H * 3) / 4} r={dotR} fill="#fff" />
          <circle cx={DOT_GAP} cy={(ROW_H * 3) / 4} r={dotR} fill="#fff" />
        </pattern>
        <clipPath id={`clip${id}`} clipPathUnits="userSpaceOnUse">
          <path d={d} transform={t} />
        </clipPath>
        <radialGradient
          id={`rev${id}`}
          cx={W / 2}
          cy={1010}
          r={Math.max(1, revealR)}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.82" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask
          id={`mask${id}`}
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={W}
          height={H}
        >
          <g clipPath={`url(#clip${id})`}>
            <rect width={W} height={H} fill={`url(#dots${id})`} />
          </g>
        </mask>
        <mask
          id={`revm${id}`}
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={W}
          height={H}
        >
          <rect
            width={W}
            height={H}
            fill={reveal >= 1 ? "#fff" : `url(#rev${id})`}
          />
        </mask>
        <linearGradient id={`base${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset="1" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <g mask={`url(#revm${id})`}>
        {/* faint body + outline for definition */}
        <path
          d={d}
          transform={t}
          fill={colors[1]}
          fillOpacity={bodyFill}
          stroke={colors[1]}
          strokeOpacity={outline}
          strokeWidth={1.6 / cam.z}
        />
        <g mask={`url(#mask${id})`}>
          <g transform={t}>
            <path d={d} fill={`url(#base${id})`} />
            {children}
          </g>
        </g>
      </g>
    </svg>
  );
};

// Dim dot-matrix of surrounding land for context
export const ContextLand: React.FC<{
  d: string;
  cam: Camera;
  opacity?: number;
  color?: string;
}> = ({ d, cam, opacity = 0.45, color = "#2b2668" }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const t = camTransform(cam);
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: "absolute", inset: 0, opacity }}
    >
      <defs>
        <pattern
          id={`d${id}`}
          width={DOT_GAP}
          height={ROW_H}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={DOT_GAP / 2} cy={ROW_H / 4} r={1.8} fill={color} />
          <circle cx={0} cy={(ROW_H * 3) / 4} r={1.8} fill={color} />
          <circle cx={DOT_GAP} cy={(ROW_H * 3) / 4} r={1.8} fill={color} />
        </pattern>
        <clipPath id={`c${id}`} clipPathUnits="userSpaceOnUse">
          <path d={d} transform={t} />
        </clipPath>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <rect width={W} height={H} fill={`url(#d${id})`} />
      </g>
    </svg>
  );
};

// Radial "heat" blob in world coords. Put inside <DotCountry> children.
export const Blob: React.FC<{
  at: [number, number];
  r: number;
  opacity?: number;
  inner?: string;
  outer?: string;
}> = ({ at, r, opacity = 1, inner = "#ffd25a", outer = "#ff4f9a" }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (r <= 0 || opacity <= 0) return null;
  return (
    <>
      <defs>
        <radialGradient id={`b${id}`}>
          <stop offset="0" stopColor={inner} stopOpacity={1} />
          <stop offset="0.3" stopColor={inner} stopOpacity={0.9} />
          <stop offset="0.62" stopColor={outer} stopOpacity={0.8} />
          <stop offset="1" stopColor={outer} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle
        cx={at[0]}
        cy={at[1]}
        r={r}
        fill={`url(#b${id})`}
        opacity={opacity}
      />
    </>
  );
};
