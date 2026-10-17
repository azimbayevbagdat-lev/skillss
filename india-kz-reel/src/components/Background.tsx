import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, sceneStartFrame } from "../theme";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const redStart = sceneStartFrame("final");
  const red = interpolate(frame, [redStart - 4, redStart + 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 55% at 50% 52%, ${C.bgGlow} 0%, #0d0b2c 45%, ${C.bg} 80%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: red,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 52%, #5c0a2c 0%, #2a0516 50%, #12020a 85%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 55%, rgba(3,2,12,0.75) 100%)",
    }}
  />
);

export const Watermark: React.FC = () => (
  <div
    style={{
      position: "absolute",
      bottom: 64,
      width: "100%",
      textAlign: "center",
      fontFamily: "inherit",
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: "0.08em",
      color: "rgba(190, 186, 220, 0.55)",
    }}
  >
    @by.bagdat
  </div>
);
