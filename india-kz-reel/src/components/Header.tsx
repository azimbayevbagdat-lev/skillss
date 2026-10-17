import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT_BODY, FONT_TITLE, GRAD } from "../theme";

const MAX_W = 930;
const CHAR_EM = 0.84; // average Montserrat Black caps advance (Cyrillic), with margin

export const titleSize = (title: string, max = 128) => {
  const longest = Math.max(...title.split("\n").map((l) => l.length));
  return Math.floor(Math.min(max, MAX_W / (longest * CHAR_EM)));
};

// Small caps kicker + big gradient title. `from`/`to` are local frames for in/out.
export const Header: React.FC<{
  kicker: string;
  title: string;
  grad?: readonly [string, string];
  kickerColor?: string;
  from?: number;
  to?: number;
  maxSize?: number;
  sub?: string;
}> = ({
  kicker,
  title,
  grad = GRAD.default,
  kickerColor = C.grey,
  from = 0,
  to = Infinity,
  maxSize,
  sub,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - from;
  if (f < 0) return null;

  const enter = spring({
    frame: f,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.8 },
  });
  const exit = Number.isFinite(to)
    ? interpolate(frame, [to - 8, to], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.quad),
      })
    : 1;
  const size = titleSize(title, maxSize);

  return (
    <div
      style={{
        position: "absolute",
        top: 200,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: exit,
      }}
    >
      <div
        style={{
          fontFamily: FONT_BODY,
          fontWeight: 700,
          fontSize: 38,
          letterSpacing: "0.32em",
          color: kickerColor,
          textTransform: "uppercase",
          opacity: interpolate(f, [0, 10], [0, 1], {
            extrapolateRight: "clamp",
          }),
          translate: `0 ${interpolate(f, [0, 14], [18, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })}px`,
          marginBottom: 18,
          paddingLeft: "0.32em",
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: FONT_TITLE,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.06,
          letterSpacing: "-0.015em",
          textAlign: "center",
          whiteSpace: "pre",
          backgroundImage: `linear-gradient(180deg, ${grad[0]} 10%, ${grad[1]} 95%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          opacity: interpolate(enter, [0, 0.4], [0, 1], {
            extrapolateRight: "clamp",
          }),
          scale: interpolate(enter, [0, 1], [0.82, 1]),
          filter: `blur(${interpolate(enter, [0, 1], [14, 0])}px) drop-shadow(0 0 22px ${grad[1]}55)`,
        }}
      >
        {title}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 14,
            fontFamily: FONT_BODY,
            fontWeight: 700,
            fontSize: 46,
            color: "#e9e6ff",
            opacity: interpolate(f, [8, 18], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
