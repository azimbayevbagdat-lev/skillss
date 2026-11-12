import { lerp, lerp3, prog, V3 } from "../lib/anim";
import { FREEZE_AT, SCENES, T } from "../timeline";
import { characterAt } from "./HouseScene";
import { BOX_POS } from "./House";

export type Cam = { pos: V3; target: V3; fov: number; focus: number };

type Seg = { start: number; blendIn: number; fn: (t: number) => Cam };

const dist = (a: V3, b: V3) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const cam = (pos: V3, target: V3, fov = 48, focusOn?: V3): Cam => ({
  pos,
  target,
  fov,
  focus: dist(pos, focusOn ?? target),
});

// follow the character from the front, with a slow drift
const follow = (t: number, off: V3, look: V3, fov = 48): Cam => {
  const c = characterAt(t);
  const tgt: V3 = [c.x + look[0], look[1], c.z + look[2]];
  return cam([c.x + off[0], off[1], c.z + off[2]], tgt, fov, [c.x, 1.4, c.z]);
};

const SEGS: Seg[] = [
  // 1: sofa → walk to door (tracking)
  {
    start: 0,
    blendIn: 0,
    fn: (t) => {
      const k = prog(t, 0, 3.3);
      return follow(
        t,
        [lerp(0.6, 0.7, k), lerp(1.5, 1.4, k), lerp(3.7, 4.2, k)],
        [0.35, 1.0, 0],
        50,
      );
    },
  },
  // 2: through the door, stops; slow push-in to show the question mark
  {
    start: T.stop - 0.4,
    blendIn: 1.4,
    fn: (t) => {
      const k = prog(t, T.stop, 9.8);
      const c = characterAt(t);
      return cam(
        [lerp(2.05, 1.85, k), lerp(1.65, 1.75, k), lerp(3.2, 2.35, k)],
        [c.x - 0.05, 1.62, c.z],
        48,
        [c.x, 1.6, c.z],
      );
    },
  },
  // 3: over the shoulder, push toward the glowing door
  {
    start: SCENES.s3Door + 0.3,
    blendIn: 1.3,
    fn: (t) => {
      const k = prog(t, SCENES.s3Door, SCENES.s4Brain);
      return cam(
        [lerp(3.3, 2.75, k), lerp(1.5, 1.3, k), lerp(2.6, 1.75, k)],
        [0, lerp(1.2, 1.1, k), 0],
        lerp(50, 46, k),
      );
    },
  },
  // 4-5: brain
  {
    start: SCENES.s4Brain,
    blendIn: 0,
    fn: (t) => {
      const k = prog(t, SCENES.s4Brain, SCENES.s5Box);
      const k2 = prog(t, SCENES.s5Box, SCENES.s6NewRoom);
      const orbit = lerp(-0.25, 0.18, k) + k2 * 0.12;
      const r = lerp(4.6, 3.7, k) + k2 * 0.5;
      const pos: V3 = [
        Math.sin(orbit) * r,
        lerp(0.55, 0.35, k) - k2 * 0.15,
        Math.cos(orbit) * r,
      ];
      const target: V3 = [
        lerp(0, 0.05, k) + k2 * 0.15,
        lerp(0.2, 0.25, k) - k2 * 0.3,
        0,
      ];
      return cam(pos, target, 46, [0, 0.25, 0.1]);
    },
  },
  // 6: «…деген ойың сол алдыңғы сахнада қалып қойды» – the thought stays in room A, by the closed door
  {
    start: SCENES.s6NewRoom,
    blendIn: 0,
    fn: (t) => {
      const k = prog(t, SCENES.s6NewRoom, T.newRoomWord);
      return cam(
        [lerp(-2.35, -2.05, k), lerp(1.7, 1.6, k), lerp(4.3, 3.7, k)],
        [lerp(-0.75, -0.6, k), 1.25, lerp(0.7, 0.5, k)],
        48,
        [-0.95, 1.5, 1.5],
      );
    },
  },
  // 6a: «Жаңа бөлмеге кірдің, жаңа сахна басталды» – he is in the kitchen
  {
    start: T.newRoomWord - 0.3,
    blendIn: 1.6,
    fn: (t) => {
      const k = prog(t, T.newRoomWord, T.lookAround);
      return cam(
        [lerp(2.0, 1.8, k), lerp(1.7, 1.65, k), lerp(4.9, 4.3, k)],
        [lerp(1.35, 1.45, k), 1.2, -0.6],
        50,
        [1.85, 1.3, -0.95],
      );
    },
  },
  // 6b: look around the kitchen
  {
    start: T.lookAround,
    blendIn: 1.3,
    fn: (t) => {
      const k = prog(t, T.lookAround, T.oldThought);
      return cam(
        [lerp(2.3, 2.15, k), lerp(1.65, 1.6, k), lerp(2.6, 2.2, k)],
        [1.75, 1.3, -1.1],
        50,
        [1.85, 1.4, -0.95],
      );
    },
  },
  // 6c: pan to the old thought in room A
  {
    start: T.oldThought - 0.1,
    blendIn: 0.75,
    fn: (t) => {
      const k = prog(t, T.oldThought, SCENES.s7Experiment);
      return cam(
        [lerp(-1.75, -1.55, k), lerp(1.65, 1.5, k), lerp(4.4, 3.8, k)],
        [BOX_POS[0] + 0.15, 0.95, BOX_POS[2] - 0.2],
        46,
      );
    },
  },
  // 7: experiment
  {
    start: SCENES.s7Experiment,
    blendIn: 0,
    fn: (t) => {
      const k = prog(t, SCENES.s7Experiment, T.expDoor);
      const p: V3 = [
        lerp(-1.3, -0.95, k),
        lerp(0.75, 0.6, k),
        lerp(8.1, 7.6, k),
      ];
      const g: V3 = [0.0, 0.45, 0];
      const k2 = prog(t, T.expDoor - 0.2, SCENES.s8Return);
      return cam(
        lerp3(p, [-1.1, 2.45, 5.4], k2),
        lerp3(g, [0.25, 2.05, 0], k2),
        46,
        lerp3([0, 0.3, 0], [0, 2.0, 0], k2),
      );
    },
  },
  // 8: in the kitchen, «Ал ең қызығы…»
  {
    start: SCENES.s8Return,
    blendIn: 0,
    fn: (t) => {
      const k = prog(t, SCENES.s8Return, T.walkBack);
      return cam(
        [lerp(3.0, 2.8, k), lerp(1.65, 1.6, k), lerp(3.2, 2.7, k)],
        [1.75, 1.3, -0.95],
        46,
      );
    },
  },
  // 8b: follow him back through the door
  {
    start: T.walkBack,
    blendIn: 1.0,
    fn: (t) => follow(t, [0.35, 1.5, 3.3], [0, 1.1, -0.2], 50),
  },
  // 8c: at the box, the memory returns
  {
    start: 66.6,
    blendIn: 1.2,
    fn: (t) => {
      const k = prog(t, 66.8, SCENES.s9Carry);
      return cam(
        [lerp(-0.15, -0.4, k), lerp(1.9, 1.8, k), lerp(4.5, 3.9, k)],
        [-1.05, 1.42, 1.1],
        46,
        [-0.95, 1.45, 0.9],
      );
    },
  },
  // 9: holding the thought
  {
    start: SCENES.s9Carry,
    blendIn: 1.5,
    fn: (t) => {
      const k = prog(t, SCENES.s9Carry, T.carryWalk);
      return cam(
        [lerp(-0.45, -0.3, k), lerp(1.55, 1.5, k), lerp(3.1, 2.8, k)],
        [-0.85, 1.25, 0.8],
        44,
        [-0.95, 1.35, 0.8],
      );
    },
  },
  // 9b: through the door together
  {
    start: T.carryWalk,
    blendIn: 1.0,
    fn: (t) => {
      // from room B, looking back at the doorway: he walks toward us with the thought
      const k = prog(t, T.carryWalk, 82.6);
      const c = characterAt(t);
      return cam(
        [lerp(2.25, 2.45, k), lerp(1.55, 1.5, k), lerp(2.9, 2.6, k)],
        [lerp(-0.2, 1.0, k), 1.2, lerp(0.15, 0.2, k)],
        48,
        [c.x, 1.35, c.z],
      );
    },
  },
  // 10: CTA pull-back (frozen for the last 3 s)
  {
    start: SCENES.s10Cta,
    blendIn: 1.5,
    fn: (t) => {
      const tt = Math.min(t, FREEZE_AT);
      const k = prog(tt, SCENES.s10Cta, FREEZE_AT);
      return cam(
        [lerp(2.1, 2.6, k), lerp(1.55, 1.7, k), lerp(3.2, 4.4, k)],
        [1.5, lerp(1.25, 1.45, k), 0.2],
        48,
        [1.55, 1.3, 0.35],
      );
    },
  },
];

export const cameraAt = (t: number): Cam => {
  let i = 0;
  for (let j = 0; j < SEGS.length; j++) if (t >= SEGS[j].start) i = j;
  const s = SEGS[i];
  const cur = s.fn(t);
  if (i > 0 && s.blendIn > 0 && t < s.start + s.blendIn) {
    const prev = SEGS[i - 1].fn(t);
    const k = prog(t, s.start, s.start + s.blendIn);
    return {
      pos: lerp3(prev.pos, cur.pos, k),
      target: lerp3(prev.target, cur.target, k),
      fov: lerp(prev.fov, cur.fov, k),
      focus: lerp(prev.focus, cur.focus, k),
    };
  }
  return cur;
};
