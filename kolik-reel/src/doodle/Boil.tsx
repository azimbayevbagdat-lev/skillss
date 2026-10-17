import React from "react";
import { useCurrentFrame } from "remotion";
import { BOIL_FPS, FPS } from "../theme";

// Global SVG filters. "boil" makes every line wobble like hand-redrawn frames (8 fps steps),
// "paper" generates a paper-grain texture.
export const BoilDefs: React.FC = () => {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / (FPS / BOIL_FPS)) % 6;
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <defs>
        <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.022"
            numOctaves={2}
            seed={step + 1}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={6}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="boilText" x="-5%" y="-10%" width="110%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035"
            numOctaves={1}
            seed={step + 11}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={3.5}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="paper" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={3}
            seed={3}
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.12  0 0 0 0.55 -0.12"
          />
        </filter>
      </defs>
    </svg>
  );
};

export const PaperGrain: React.FC<{ opacity?: number }> = ({
  opacity = 0.35,
}) => (
  <svg
    width={1080}
    height={1920}
    style={{
      position: "absolute",
      inset: 0,
      opacity,
      mixBlendMode: "multiply",
      pointerEvents: "none",
    }}
  >
    <rect width={1080} height={1920} filter="url(#paper)" />
  </svg>
);
