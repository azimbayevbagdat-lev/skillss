import { project, VALVE_X } from "./camera";
import { balloon, CEILING_Y, mainCar, NOZZLES, rampCar } from "./state";
import { C } from "./theme";
import { carToWorld, FANS } from "./three/Car";
import { VALVE } from "./three/Props";
import { cue, T } from "./timeline";
import * as THREE from "three";

export type CalloutDef = {
  at: number;
  out: number;
  label: string;
  color: string;
  anchor: (f: number) => { x: number; y: number };
  dx: number;
  dy: number;
};

const world = (fn: (f: number) => [number, number, number]) => (f: number) => project(f, fn(f));

const balloonMouth = (f: number): [number, number, number] => {
  const b = balloon(f);
  const v = new THREE.Vector3(0, -1.24, 0)
    .multiplyScalar(b.scale)
    .applyEuler(new THREE.Euler(0, 0, -Math.PI / 2 + b.rotZ))
    .add(new THREE.Vector3(...b.pos));
  return [v.x, v.y, v.z];
};

export const BATTERY = { x: 540, y: 300 };

// Colour code: air = blue, force = coral, fan system = violet.
export const CALLOUTS: CalloutDef[] = [
  {
    at: T.tanks + 20,
    out: T.macro,
    label: "Сығылған ауа",
    color: C.air,
    anchor: world((f) => carToWorld(mainCar(f), [0.75, 0.62, 0.4])),
    dx: -120,
    dy: -300,
  },
  {
    at: T.macro + 16,
    out: T.s3,
    label: "Тығыз сығылған",
    color: C.air,
    anchor: world(() => [0.05, 0.6, 0.55]),
    dx: 60,
    dy: -360,
  },
  {
    at: T.untied,
    out: T.roadsterToo,
    label: "Аузы байланбаған",
    color: C.air,
    anchor: world(balloonMouth),
    dx: 30,
    dy: -330,
  },
  {
    at: T.thrusterTag,
    out: T.valve,
    label: "Суық газды итергіш",
    color: C.air,
    anchor: world((f) => carToWorld(mainCar(f), [NOZZLES[0][0], 0.15, NOZZLES[0][2]])),
    dx: -60,
    dy: 300,
  },
  {
    at: T.valve + 34,
    out: T.carUp,
    label: "Клапан ашылды",
    color: C.air,
    anchor: world(() => [VALVE_X + 0.55, VALVE.valveY, 0.3]),
    dx: -160,
    dy: -470,
  },
  {
    at: T.s6 + 30,
    out: T.ten,
    label: "Қисаю",
    color: C.thrust,
    anchor: world((f) => carToWorld(mainCar(f), [1.6, 0.85, 0.9])),
    dx: -60,
    dy: -320,
  },
  {
    at: T.pulses + 18,
    out: T.land,
    label: "Қысқа атылыс = тепе-теңдік",
    color: C.air,
    anchor: world((f) => carToWorld(mainCar(f), [NOZZLES[4][0], 0.12, NOZZLES[4][2]])),
    dx: -40,
    dy: 300,
  },
  {
    at: T.land + 20,
    out: T.s7,
    label: "Құлауды бәсеңдетеді",
    color: C.air,
    anchor: world((f) => carToWorld(mainCar(f), [NOZZLES[0][0], 0.12, NOZZLES[0][2]])),
    dx: -80,
    dy: 300,
  },
  {
    at: T.s7 + 55,
    out: T.fans,
    label: "Төңкерілген",
    color: C.fan,
    anchor: world((f) => carToWorld(rampCar(f), [0.2, 1.15, 0.6])),
    dx: -120,
    dy: 330,
  },
  {
    at: T.fans + 25,
    out: T.lowP,
    label: "Желдеткіш ауаны сорады",
    color: C.fan,
    anchor: world((f) => carToWorld(rampCar(f), FANS[1])),
    dx: 40,
    dy: 420,
  },
  {
    at: T.lowP + 12,
    out: T.outerP,
    label: "Төмен қысым",
    color: C.fan,
    anchor: world((f) => [rampCar(f).pos[0] - 1.2, CEILING_Y - 0.17, 0.85]),
    dx: 40,
    dy: 360,
  },
  {
    at: T.outerP + 22,
    out: T.s8,
    label: "Жолға қысады",
    color: C.thrust,
    anchor: world(() => [-0.4, CEILING_Y - 1.65, 0.4]),
    dx: 40,
    dy: 300,
  },
  {
    at: T.s8 + 30,
    out: T.s9,
    label: "Желдеткіш: жабысу",
    color: C.fan,
    anchor: world((f) => carToWorld(rampCar(f), [-0.9, 1.0, 0.9])),
    dx: -40,
    dy: -260,
  },
  {
    at: cue("ауа итергіш"),
    out: T.s9,
    label: "Итергіш: ұшу",
    color: C.air,
    anchor: world((f) => carToWorld(mainCar(f), [NOZZLES[2][0], 0.1, NOZZLES[2][2]])),
    dx: 90,
    dy: 120,
  },
];
