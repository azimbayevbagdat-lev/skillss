import { AbsoluteFill } from "remotion";
import { easeOut, ramp } from "../anim";
import { C, FONT } from "../theme";
import { T, TOTAL_FRAMES } from "../timeline";

/** Series header: same layout as earlier episodes, tuned for a white set. */
export const TopBar: React.FC<{ frame: number }> = ({ frame }) => {
  const progress = Math.min(1, frame / (TOTAL_FRAMES - 1));
  const enter = ramp(frame, 0, 18, easeOut);
  return (
    <div style={{ position: "absolute", top: 56, left: 48, right: 48, opacity: enter }}>
      <div
        style={{
          fontFamily: FONT.ui,
          fontWeight: 700,
          fontSize: 27,
          color: C.navy,
          letterSpacing: -0.2,
          whiteSpace: "nowrap",
        }}
      >
        @by.bagdat · Бұл қалай жұмыс істейді? · 05
      </div>
      <div style={{ marginTop: 16, height: 3, borderRadius: 2, background: "rgba(22,33,58,0.12)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: "100%", background: C.navy, transform: `scaleX(${progress})`, transformOrigin: "left" }} />
      </div>
    </div>
  );
};

type Tag = { from: number; text: string };
const TAGS: Tag[] = [
  { from: 0, text: "ИЛЛЮСТРАЦИЯ · АУА АҒЫНЫ" },
  { from: T.s2, text: "ИЛЛЮСТРАЦИЯ · СХЕМА" },
  { from: T.s3, text: "ИЛЛЮСТРАЦИЯ · АУА АҒЫНЫ" },
  { from: T.valve, text: "ИЛЛЮСТРАЦИЯ · КЛАПАН" },
  { from: T.carUp, text: "ИЛЛЮСТРАЦИЯ · СХЕМА" },
];

/** Small mono label: what is on screen is an explanation, not the real design. */
export const MonoTag: React.FC<{ frame: number }> = ({ frame }) => {
  const hide = ramp(frame, T.s9, 15);
  return (
    <div style={{ position: "absolute", top: 128, left: 48, height: 30, opacity: 1 - hide }}>
      {TAGS.map((t, i) => {
        const next = TAGS[i + 1]?.from ?? 1e9;
        const o = Math.min(ramp(frame, t.from, 10), 1 - ramp(frame, next, 8));
        if (o <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              whiteSpace: "nowrap",
              fontFamily: FONT.mono,
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: 1.2,
              color: C.mono,
              opacity: o,
              transform: `translateY(${(1 - o) * 6}px)`,
            }}
          >
            <span style={{ color: C.air }}>●</span> {t.text}
          </div>
        );
      })}
    </div>
  );
};

/** Soft white wash over the 3D layer (used behind cards). */
export const Wash: React.FC<{ opacity: number }> = ({ opacity }) =>
  opacity > 0 ? <AbsoluteFill style={{ background: C.studioTop, opacity }} /> : null;
