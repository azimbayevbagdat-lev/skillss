import { createContext, useContext } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const FPS = 30;
// Voiceover length is 91.245714 s -> 2738 frames
export const DURATION_FRAMES = 2738;
export const END_S = DURATION_FRAMES / FPS;
// Last 3 seconds stay motionless
export const FREEZE_S = END_S - 3;

// Scene boundaries (seconds), derived from the word timings of voiceover.mp3
export const T = {
  s1: 0, // "Есіңде ме ... деп жаздың"
  s2: 4.15, // "Бес минут өтті ... Ал сен не істедің?"
  s3: 10.55, // "Басқа дүкенді ... Неге біз күтуге шыдамаймыз?"
  s4: 13.85, // brain + fire
  s5: 24.8, // uncertainty
  s6: 36.65, // hourglasses
  s7: 42.15, // scale
  s8: 46.65, // Harvard chart
  s9: 61.85, // sleeping entrepreneur
  s10: 70.8, // chat-bot
  s11: 84.85, // CTA
  end: END_S,
};

export const SceneStart = createContext(0);

/** Absolute time in seconds (relative to the voiceover), frozen during the last 3 s */
export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = useContext(SceneStart);
  return Math.min(start + frame / fps, FREEZE_S);
};

const ease = Easing.bezier(0.45, 0, 0.25, 1);

/** Keyframed value with smooth easing between keys, clamped at both ends */
export const kf = (
  t: number,
  times: number[],
  values: number[],
  easing: (x: number) => number = ease,
) =>
  interpolate(t, times, values, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** 0 -> 1 between t0 and t1 */
export const prog = (t: number, t0: number, t1: number, easing = ease) =>
  kf(t, [t0, t1], [0, 1], easing);

/** Damped overshoot "pop" 0->1 starting at t0 */
export const pop = (t: number, t0: number, dur = 0.45) => {
  if (t <= t0) return 0;
  const x = (t - t0) / dur;
  if (x >= 2.2) return 1;
  return 1 - Math.exp(-5 * x) * Math.cos(6.5 * x);
};

export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);

/** Deterministic smooth pseudo-noise from time */
export const wobble = (t: number, seed = 0) =>
  Math.sin(t * 1.7 + seed * 12.9898) * 0.5 +
  Math.sin(t * 2.9 + seed * 78.233) * 0.3 +
  Math.sin(t * 5.3 + seed * 37.719) * 0.2;

export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
