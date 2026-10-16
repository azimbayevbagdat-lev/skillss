import * as THREE from "three";
import { easeInOut, lerp, lerp3, ramp } from "./anim";
import { T } from "./timeline";
import { H, W } from "./theme";

export type Pose = {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
  up?: [number, number, number];
};

type Shot = Pose & {
  at: number;
  /** Frames spent flying in from the previous shot. */
  fly: number;
  /** Slow orbit around the target, degrees per second. */
  orbit?: number;
  /** Slow push toward the target, fraction of distance per second. */
  dolly?: number;
};

export const VALVE_X = 12;

const S = (n: number) => Math.round(n * 60);

/** Pose from orbit angles around a target (azimuth from +z toward +x). */
const orb = (target: [number, number, number], az: number, el: number, dist: number): [number, number, number] => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return [target[0] + Math.sin(a) * Math.cos(e) * dist, target[1] + Math.sin(e) * dist, target[2] + Math.cos(a) * Math.cos(e) * dist];
};
const shot = (
  at: number,
  fly: number,
  target: [number, number, number],
  az: number,
  el: number,
  dist: number,
  extra: Partial<Shot> = {},
): Shot => ({ at, fly, target, pos: orb(target, az, el, dist), fov: 30, ...extra });

// One continuous camera: every scene change is a flight, never a cut.
const SHOTS: Shot[] = [
  shot(T.s1, 0, [0, 1.15, 0], 34, 13, 17.5, { orbit: 2.2, dolly: 0.01 }),
  shot(T.s2, 50, [0, 0.55, 0], 28, 30, 14.5, { orbit: 1.6, dolly: 0.012 }),
  shot(T.macro, 40, [0.1, 0.55, 0.42], 22, 16, 2.6, { dolly: 0.02 }),
  shot(T.s3, 55, [0.15, 1.75, 0], 0, 3, 17.5, { dolly: 0.005 }),
  shot(T.s4, 55, [0.3, 1.25, 0], 36, -3, 13.5, { orbit: 1.5 }),
  shot(T.valve, 40, [VALVE_X, 2.95, 0], 8, 4, 12.5, { dolly: 0.008 }),
  shot(T.carUp, 40, [0, 1.6, 0], 36, 10, 16.5, { orbit: 1.5 }),
  shot(T.s5, 45, [0, 1.75, 0], 0, 3, 17, { dolly: 0.005 }),
  shot(T.s6, 45, [0, 1.55, 0], 40, 14, 16, { orbit: -1.5 }),
  { at: T.ten, fly: 50, pos: [0.01, 15.5, 0.01], target: [0, 0.8, 0], fov: 30, up: [1, 0, 0] },
  shot(T.pulses, 45, [0, 1.4, 0], -38, 10, 16, { orbit: 1.2 }),
  shot(T.land, 40, [0, 0.9, 0], 30, 8, 15.5, { dolly: 0.008 }),
  shot(T.s7, 55, [0.4, 2.2, 0], 14, 4, 20, { orbit: -0.8 }),
  shot(T.fans, 45, [1.0, 3.3, 0], 24, -14, 13, { orbit: 1.0 }),
  shot(T.outerP, 40, [1.0, 3.0, 0], 6, 0, 13.5),
  shot(T.s8, 50, [1.0, 2.3, 0], 22, 2, 19.5, { orbit: -0.6 }),
  shot(T.s9, 55, [0, 1.3, 0], 34, 12, 17, { orbit: 2 }),
];

const withDrift = (shot: Shot, frame: number): Pose => {
  const t = Math.max(0, frame - shot.at) / 60;
  const d = new THREE.Vector3(...shot.pos).sub(new THREE.Vector3(...shot.target));
  if (shot.orbit) d.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(shot.orbit * t));
  if (shot.dolly) d.multiplyScalar(Math.max(0.6, 1 - shot.dolly * t));
  const p = new THREE.Vector3(...shot.target).add(d);
  return { pos: [p.x, p.y, p.z], target: shot.target, fov: shot.fov, up: shot.up ?? [0, 1, 0] };
};

export const cameraAt = (frame: number): Pose => {
  let i = 0;
  while (i + 1 < SHOTS.length && SHOTS[i + 1].at <= frame) i++;
  const cur = withDrift(SHOTS[i], frame);
  if (i === 0) return cur;
  const k = ramp(frame, SHOTS[i].at, SHOTS[i].fly, easeInOut);
  if (k >= 1) return cur;
  const prev = withDrift(SHOTS[i - 1], frame);
  // Fly on a gentle arc: lift the midpoint a little so passes read as camera moves.
  const lift = Math.sin(k * Math.PI) * 0.6;
  const pos = lerp3(prev.pos, cur.pos, k);
  pos[1] += lift;
  const up = lerp3(prev.up ?? [0, 1, 0], cur.up ?? [0, 1, 0], k);
  return { pos, target: lerp3(prev.target, cur.target, k), fov: lerp(prev.fov, cur.fov, k), up };
};

/** Camera speed in world units per frame, used to gate motion blur. */
export const cameraSpeed = (frame: number) => {
  const a = cameraAt(frame).pos;
  const b = cameraAt(frame + 1).pos;
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
};

const cam = new THREE.PerspectiveCamera(32, W / H, 0.1, 200);
export const applyPose = (c: THREE.PerspectiveCamera, p: Pose) => {
  c.position.set(...p.pos);
  c.up.set(...(p.up ?? [0, 1, 0])).normalize();
  c.fov = p.fov;
  c.aspect = W / H;
  c.lookAt(...p.target);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
};

/** World point → composition pixels for the 2D overlay layer. */
export const project = (frame: number, point: [number, number, number]) => {
  applyPose(cam, cameraAt(frame));
  const v = new THREE.Vector3(...point).project(cam);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 };
};

export const SHOT_COUNT = SHOTS.length;
export const shotStarts = SHOTS.map((s) => s.at);
export { S as sec };
