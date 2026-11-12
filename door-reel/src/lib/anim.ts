import { Easing, interpolate } from "remotion";

export type V3 = [number, number, number];

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** 0→1 progress between two times (seconds), eased. */
export const prog = (
  t: number,
  start: number,
  end: number,
  ease: (x: number) => number = Easing.inOut(Easing.cubic),
) =>
  interpolate(t, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: V3, b: V3, k: number): V3 => [
  lerp(a[0], b[0], k),
  lerp(a[1], b[1], k),
  lerp(a[2], b[2], k),
];

/** Smooth pop-in (overshoot) scale, 0 before start. */
export const pop = (t: number, start: number, dur = 0.45) => {
  if (t < start) return 0;
  return interpolate(t, [start, start + dur], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2.2)),
  });
};

export type CamKey = {
  t: number;
  pos: V3;
  target: V3;
  fov?: number;
  focus?: number;
  /** if true, cut (no blend) from the previous key to this one */
  cut?: boolean;
};

/** Interpolate a camera track. Between keys we ease in/out so motion never stops abruptly. */
export const sampleCam = (t: number, keys: CamKey[]) => {
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  if (a === b || b.cut || t <= a.t) {
    if (b.cut && t >= b.t) return b;
    if (t <= a.t || a === b) return { ...a };
  }
  const k = b.cut ? 0 : prog(t, a.t, b.t, Easing.inOut(Easing.sin));
  return {
    t,
    pos: lerp3(a.pos, b.pos, k),
    target: lerp3(a.target, b.target, k),
    fov: lerp(a.fov ?? 45, b.fov ?? 45, k),
    focus: lerp(a.focus ?? 5, b.focus ?? 5, k),
  };
};

export type PathKey = { t: number; x: number; z: number };

/**
 * Walk along a polyline. Returns position, heading (rotation Y so that +Z
 * faces the walking direction), distance travelled and speed (0..1).
 */
export const walkPath = (t: number, keys: PathKey[]) => {
  let dist = 0;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (t >= b.t) {
      dist += len;
      continue;
    }
    if (t <= a.t) {
      return { x: a.x, z: a.z, heading: null as number | null, dist, speed: 0 };
    }
    const k = prog(t, a.t, b.t, Easing.inOut(Easing.quad));
    const raw = (t - a.t) / (b.t - a.t);
    // speed profile of an in-out quad
    const speed = len > 0.01 ? Math.min(1, 1 - Math.abs(raw * 2 - 1) ** 3) : 0;
    return {
      x: lerp(a.x, b.x, k),
      z: lerp(a.z, b.z, k),
      heading: len > 0.01 ? Math.atan2(b.x - a.x, b.z - a.z) : null,
      dist: dist + len * k,
      speed,
    };
  }
  const last = keys[keys.length - 1];
  return { x: last.x, z: last.z, heading: null, dist, speed: 0 };
};

/**
 * Walk along a polyline between t0 and t1 at (nearly) constant speed,
 * accelerating/decelerating only at the ends. Corners are smoothed.
 */
export const walkAlong = (
  t: number,
  t0: number,
  t1: number,
  pts: [number, number][],
) => {
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    lens.push(l);
    total += l;
  }
  const dur = t1 - t0;
  const acc = Math.min(0.45, dur / 3);
  // trapezoidal velocity profile
  const vmax = total / (dur - acc);
  const distAt = (tt: number) => {
    const u = Math.max(0, Math.min(dur, tt - t0));
    if (u < acc) return (vmax * u * u) / (2 * acc);
    if (u > dur - acc) {
      const r = dur - u;
      return total - (vmax * r * r) / (2 * acc);
    }
    return (vmax * acc) / 2 + vmax * (u - acc);
  };
  const posAt = (d: number): [number, number] => {
    let rem = Math.max(0, Math.min(total, d));
    for (let i = 0; i < lens.length; i++) {
      if (rem <= lens[i] || i === lens.length - 1) {
        const k = lens[i] > 0 ? rem / lens[i] : 0;
        return [
          lerp(pts[i][0], pts[i + 1][0], Math.min(1, k)),
          lerp(pts[i][1], pts[i + 1][1], Math.min(1, k)),
        ];
      }
      rem -= lens[i];
    }
    return pts[pts.length - 1];
  };
  const d = distAt(t);
  // smooth corners by averaging a small window
  const w = 0.35;
  const a = posAt(d - w);
  const b = posAt(d + w);
  const p0 = posAt(d);
  const pm: [number, number] = [
    (a[0] + b[0] + p0[0] * 2) / 4,
    (a[1] + b[1] + p0[1] * 2) / 4,
  ];
  const ahead = posAt(Math.min(total, d + 0.3));
  const behind = posAt(Math.max(0, d - 0.3));
  const heading = Math.atan2(ahead[0] - behind[0], ahead[1] - behind[1]);
  const u = t - t0;
  const speed =
    u <= 0 || u >= dur ? 0 : Math.min(1, Math.min(u, dur - u) / acc);
  return {
    x: d <= 0 ? pts[0][0] : d >= total ? pts[pts.length - 1][0] : pm[0],
    z: d <= 0 ? pts[0][1] : d >= total ? pts[pts.length - 1][1] : pm[1],
    heading,
    dist: d,
    speed,
    moving: u > 0 && u < dur,
  };
};

/** Shortest-angle lerp. */
export const lerpAngle = (a: number, b: number, k: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
};
