// Pure frame → state functions shared by the 3D world and the 2D callout layer.
import { easeInOut, easeOut, lerp, ramp } from "./anim";
import { T } from "./timeline";

export type V3 = [number, number, number];

/** Ten cold-gas nozzles on the underside, car-local (x forward, z left). */
export const NOZZLES: V3[] = [
  [1.72, 0.2, 0.62],
  [1.72, 0.2, -0.62],
  [-1.72, 0.2, 0.62],
  [-1.72, 0.2, -0.62],
  [0.55, 0.2, 0.78],
  [0.55, 0.2, -0.78],
  [-0.55, 0.2, 0.78],
  [-0.55, 0.2, -0.78],
  [2.02, 0.2, 0],
  [-2.02, 0.2, 0],
];
export const CORNERS = [0, 1, 2, 3];

const hoverBob = (f: number, amp = 0.035) => Math.sin(f / 60 * 2.1) * amp;

// ── Scene 5: the thrust arrow grows until it beats weight ──
export const WEIGHT_LEN = 1.6;
export const thrustLen = (f: number) => lerp(0.35, 2.2, ramp(f, T.s5 + 30, Math.max(60, T.lift + 20 - T.s5 - 30), easeInOut));
const crossFrame = (() => {
  for (let f = T.s5; f < T.s6; f++) if (thrustLen(f) >= WEIGHT_LEN) return f;
  return T.lift;
})();
export const LIFTOFF = crossFrame;

// ── Balloon → car morph moment ──
export const MORPH = T.roadsterToo + 80;

// ── Scene 6 landing ──
const landDur = Math.max(90, T.s7 - T.land - 25);

export type CarState = {
  pos: V3;
  rot: V3;
  opacity: number;
  scale: number;
  xray: number;
  jets: number[];
};

export const mainCar = (f: number): CarState => {
  const jets = new Array(10).fill(0);
  let y = 0;
  let x = 0;
  let roll = 0;
  let opacity = 1;
  let scale = 1;
  let xray = 0;

  if (f < T.s2) {
    // 1. lifts off and hovers on four jets
    y = 1.05 * ramp(f, 4, 80, easeOut) + hoverBob(f) * ramp(f, 60, 30);
    CORNERS.forEach((i) => (jets[i] = ramp(f, 0, 12)));
  } else if (f < T.s3) {
    // 2. settles, turns into x-ray
    y = 1.05 * (1 - ramp(f, T.s2, 55, easeInOut));
    CORNERS.forEach((i) => (jets[i] = 1 - ramp(f, T.s2, 45)));
    xray = ramp(f, T.s2 + 18, 32, easeInOut);
    opacity = 1 - ramp(f, T.s3 - 4, 18, easeInOut);
  } else if (f < T.s4) {
    // 3. hidden behind the balloon until the morph
    const k = ramp(f, MORPH, 30, easeOut);
    opacity = k;
    scale = lerp(0.82, 1, k);
    y = 1.15 + hoverBob(f);
    x = 0.3 * (1 - k);
    CORNERS.forEach((i) => (jets[i] = k));
  } else if (f < T.s5) {
    // 4. hovering high so the camera can look underneath, then pushed up
    const up = ramp(f, T.carUp + 6, 50, easeOut);
    y = lerp(1.15, 1.35, ramp(f, T.s4, 50, easeInOut)) + up * 0.55 + hoverBob(f);
    CORNERS.forEach((i) => (jets[i] = 0.75 + 0.5 * up));
  } else if (f < T.s6) {
    // 5. sits on the floor until thrust > weight
    const settle = ramp(f, T.s5, 40, easeInOut);
    const lift = ramp(f, LIFTOFF, 70, easeOut);
    y = lerp(1.9, 0, settle) * (1 - lift) + lift * (1.2 + hoverBob(f));
    const thrust = (thrustLen(f) - 0.35) / (2.2 - 0.35);
    CORNERS.forEach((i) => (jets[i] = Math.max(1 - settle, thrust)));
  } else if (f < T.s7) {
    // 6. wobble, ten nozzles, short pulses level it, then a soft landing
    const hover = 1.35 + hoverBob(f);
    const tilt = ramp(f, T.s6 + 15, 40, easeOut) * (1 - ramp(f, T.pulses + 10, 55, easeInOut));
    roll = 0.2 * tilt + Math.sin(f / 9) * 0.02 * tilt;
    const land = ramp(f, T.land, landDur, easeOut);
    y = lerp(hover, 0, land);
    xray = ramp(f, T.ten, 30) * (1 - ramp(f, T.pulses, 25));
    CORNERS.forEach((i) => (jets[i] = 0.7 * (1 - ramp(f, T.land + landDur - 20, 20))));
    // short bursts on the low side while correcting
    const pulse = f >= T.pulses && f < T.pulses + 75 ? (Math.floor((f - T.pulses) / 9) % 2 === 0 ? 1 : 0.15) : 0;
    [0, 2, 4, 6].forEach((i) => (jets[i] = Math.max(jets[i], pulse)));
    // landing burst grows as it brakes
    if (f >= T.land) CORNERS.forEach((i) => (jets[i] = Math.max(jets[i], 1.1 * (1 - land) + 0.2 * (1 - ramp(f, T.land + landDur - 15, 15)))));
    opacity = 1 - ramp(f, T.s7 - 2, 18, easeInOut);
  } else if (f < T.s8) {
    opacity = 0;
  } else {
    // 8–10. hovering under the ceiling car, then centre stage
    const back = ramp(f, T.s8, 40, easeOut);
    const center = ramp(f, T.s9, 60, easeInOut);
    opacity = back;
    x = lerp(1.0, 0, center);
    y = lerp(0.85, 1.25, center) + hoverBob(f) + ramp(f, T.next, T.end - T.next, easeInOut) * 0.6;
    CORNERS.forEach((i) => (jets[i] = 0.9));
  }

  return { pos: [x, y, 0], rot: [roll, 0, 0], opacity, scale, xray, jets };
};

/** The inverted car on the ramp ceiling (scenes 7–8). */
export const CEILING_Y = 4.3;
export const rampCar = (f: number): CarState => {
  const vis = ramp(f, T.s7 + 25, 30, easeOut) * (1 - ramp(f, T.s9, 30, easeInOut));
  return {
    pos: [1.0, CEILING_Y - 0.09, 0],
    rot: [Math.PI, 0, 0],
    opacity: vis,
    scale: 1,
    xray: ramp(f, T.fans, 30, easeInOut) * (1 - ramp(f, T.s8 + 30, 30)),
    jets: new Array(10).fill(0),
  };
};

export const rampVisible = (f: number) => ramp(f, T.s7, 45, easeOut) * (1 - ramp(f, T.s9, 40, easeInOut));

// ── Balloon (scene 3) ──
export const balloon = (f: number) => {
  const appear = ramp(f, T.s3 + 6, 28, easeOut);
  const fly = ramp(f, T.balloonFly, 80, easeOut);
  const turn = ramp(f, T.roadsterToo, 40, easeInOut);
  const rise = ramp(f, T.roadsterToo + 20, 60, easeOut);
  const morph = ramp(f, MORPH - 10, 30, easeInOut);
  const x = lerp(lerp(-0.45, 0.75, fly), 0.2, turn);
  const y = 1.55 + rise * 0.45 + Math.sin(f / 23) * 0.03;
  const deflate = 1 - 0.1 * fly - 0.08 * rise;
  return {
    pos: [x, y, 0] as V3,
    // mouth points to −x; turning by +90° about z makes it point down
    rotZ: turn * (Math.PI / 2),
    scale: lerp(0.85, 1, appear) * deflate * (1 - 0.75 * morph),
    opacity: appear * (1 - morph),
    jet: Math.max(ramp(f, T.airOut, 10) * (1 - turn * 0.2), 0) * (1 - morph),
    mouthOpen: ramp(f, T.untied, 18),
  };
};

/** Valve opening in the cut-away schematic (scene 4). */
export const valveOpen = (f: number) => ramp(f, T.valve + 30, 22, easeOut) * (1 - ramp(f, T.carUp + 30, 20));

/** Compressed-air reserve shown as a battery (scene 8). */
export const airReserve = (f: number) => lerp(1, 0.18, ramp(f, T.limited + 30, 150, easeInOut));
