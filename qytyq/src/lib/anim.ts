import { Easing, interpolate, spring } from "remotion";

export const FPS = 30;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 0→1 between two frames with a smooth ease. */
export const ramp = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

export const pop = (frame: number, at: number, damping = 11) =>
  spring({ frame: frame - at, fps: FPS, config: { damping, mass: 0.6, stiffness: 140 } });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const lerp3 = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Deterministic wobble, driven only by the frame. */
export const wob = (frame: number, speed: number, amp: number, phase = 0) =>
  Math.sin(frame * speed + phase) * amp;
