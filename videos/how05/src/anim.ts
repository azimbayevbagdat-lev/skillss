import { Easing, interpolate } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeOutCubic = Easing.out(Easing.cubic);

/** 0 → 1 over [start, start + dur], eased. */
export const ramp = (frame: number, start: number, dur: number, easing = easeOut) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing });

/** Fade in at `start`, fade out ending at `end`. */
export const window01 = (frame: number, start: number, end: number, fadeIn = 12, fadeOut = 12) =>
  Math.min(ramp(frame, start, fadeIn), 1 - ramp(frame, end - fadeOut, fadeOut, easeInOut));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: number[], b: number[], t: number): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Deterministic hash → [0, 1). */
export const rand = (i: number, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
