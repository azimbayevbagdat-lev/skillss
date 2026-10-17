import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_BODY } from "../theme";

// Row of small pill tags that pop in one after another, separated by "·"
export const Tags: React.FC<{
  items: string[];
  top: number;
  color?: string;
  border?: string;
  from?: number;
  stagger?: number;
}> = ({
  items,
  top,
  color = "#ffffff",
  border = "#ff4f9a",
  from = 0,
  stagger = 6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 70,
        right: 70,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 16,
      }}
    >
      {items.map((t, i) => {
        const s = spring({
          frame: frame - from - i * stagger,
          fps,
          config: { damping: 13, stiffness: 160 },
        });
        return (
          <div
            key={t}
            style={{
              fontFamily: FONT_BODY,
              fontWeight: 700,
              fontSize: 40,
              color,
              padding: "12px 28px",
              borderRadius: 999,
              background: "rgba(12, 10, 36, 0.78)",
              border: `2px solid ${border}`,
              boxShadow: `0 0 22px ${border}66, inset 0 0 14px ${border}33`,
              opacity: interpolate(s, [0, 0.3], [0, 1], {
                extrapolateRight: "clamp",
              }),
              scale: interpolate(s, [0, 1], [0.6, 1]),
            }}
          >
            {t}
          </div>
        );
      })}
    </div>
  );
};
