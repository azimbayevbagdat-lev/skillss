import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import subs from "./subs.json";

type W = { t: string; s: number; e: number; k: boolean };
type G = { start: number; end: number; words: W[] };

// Safe zone: top 220, bottom 380, right 120 -> caption box x 80..960, centred at 70% height
const LEFT = 80;
const WIDTH = 880;
const CENTER_Y = 1344;

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const groups = subs as G[];

  let g: G | null = null;
  for (let i = 0; i < groups.length; i++) {
    const nextStart = i + 1 < groups.length ? groups[i + 1].start : Infinity;
    if (t >= groups[i].start && t < Math.min(nextStart, groups[i].end + 0.6)) g = groups[i];
  }
  if (!g) return null;

  const since = (t - g.start) * 1000;
  const scale = interpolate(since, [0, 120], [0.9, 1], { extrapolateRight: "clamp" });
  const opacity = interpolate(since, [0, 60], [0.4, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: LEFT,
        width: WIDTH,
        top: CENTER_Y,
        transform: `translateY(-50%) scale(${scale})`,
        opacity,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "baseline",
        columnGap: 34,
        rowGap: 0,
        textAlign: "center",
        fontFamily: "Montserrat",
        fontWeight: 900,
        lineHeight: 1.12,
      }}
    >
      {g.words.map((w, i) => {
        const active = t >= w.s && t < (g!.words[i + 1]?.s ?? g!.end + 0.6);
        const color = w.k ? "#22C55E" : active ? "#FFD400" : "#FFFFFF";
        const size = w.k ? 96 : 78;
        const bump = active ? 1.05 : 1;
        return (
          <span
            key={i}
            style={{
              fontSize: size,
              color,
              WebkitTextStroke: "14px #000",
              paintOrder: "stroke fill",
              textShadow: "0 6px 18px rgba(0,0,0,0.55)",
              display: "inline-block",
              transform: `scale(${bump})`,
            }}
          >
            {w.t}
          </span>
        );
      })}
    </div>
  );
};
