import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT_BODY, NUM, sceneStartFrame } from "../theme";

export const fmtPop = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2).replace(".", ",")} млрд`;
  if (v >= 1e8) return `${Math.round(v / 1e6)} млн`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(".", ",")} млн`;
  return "0";
};

const Pill: React.FC<{
  dot: string;
  label: string;
  value: string;
  align: "left" | "right";
}> = ({ dot, label, value, align }) => (
  <div
    style={{
      position: "absolute",
      top: 70,
      [align]: 44,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "14px 24px",
      borderRadius: 999,
      background: "rgba(16, 13, 44, 0.72)",
      border: "1.5px solid rgba(160, 150, 255, 0.28)",
      fontFamily: FONT_BODY,
      fontSize: 32,
      color: "#fff",
      whiteSpace: "nowrap",
    }}
  >
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: 99,
        background: dot,
        boxShadow: `0 0 12px ${dot}`,
      }}
    />
    <span style={{ fontWeight: 600, color: "#cfcaf5" }}>{label}</span>
    <span style={{ color: "#6f6a9c" }}>·</span>
    <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
      {value}
    </span>
  </div>
);

// Global top-corner counters. Migration happens during the "oneMoment" scene.
export const CounterPills: React.FC = () => {
  const frame = useCurrentFrame();
  const a = sceneStartFrame("oneMoment") + 12;
  const b = sceneStartFrame("population") + 10;
  const p = interpolate(frame, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const kz = NUM.kzPop + p * NUM.indiaPop;
  const india = NUM.indiaPop * (1 - p);
  const fadeIn = interpolate(frame, [6, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeIn }}>
      <Pill dot={C.kz2} label="Қазақстан" value={fmtPop(kz)} align="left" />
      <Pill
        dot={C.india1}
        label="Үндістан"
        value={fmtPop(india)}
        align="right"
      />
    </div>
  );
};
