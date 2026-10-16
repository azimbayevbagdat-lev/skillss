import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { lerp, ramp } from "../anim";
import { applyPose, cameraAt, VALVE_X } from "../camera";
import {
  balloon,
  CEILING_Y,
  CORNERS,
  LIFTOFF,
  mainCar,
  NOZZLES,
  rampCar,
  rampVisible,
  thrustLen,
  valveOpen,
  WEIGHT_LEN,
} from "../state";
import { C } from "../theme";
import { T } from "../timeline";
import { Emitter, GroundRings, Jets, PackedAir } from "./Air";
import { Car, carDirToWorld, carToWorld, TANKS } from "./Car";
import { Arrow3D, Balloon, Ramp, VALVE, ValveRig } from "./Props";
import { FloorMarks, SoftShadow, Studio } from "./Studio";

const CameraRig: React.FC<{ frame: number }> = ({ frame }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  applyPose(camera, cameraAt(frame));
  return null;
};

const Environment: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;
  }, [gl, scene]);
  return null;
};

const carJet = (i: number): Emitter => (f) => {
  const s = mainCar(f);
  if (s.opacity < 0.3 || s.jets[i] <= 0.01) return null;
  const n = NOZZLES[i];
  return { origin: carToWorld(s, [n[0], 0.1, n[2]]), dir: carDirToWorld(s, [0, -1, 0]), intensity: Math.min(1, s.jets[i]) };
};
const CAR_JETS = NOZZLES.map((_, i) => carJet(i));
const CORNER_JETS = CORNERS.map((i) => CAR_JETS[i]);

const balloonJet: Emitter = (f) => {
  const b = balloon(f);
  if (b.jet <= 0.01) return null;
  const rot = new THREE.Euler(0, 0, -Math.PI / 2 + b.rotZ);
  const mouth = new THREE.Vector3(0, -1.26, 0).multiplyScalar(b.scale).applyEuler(rot).add(new THREE.Vector3(...b.pos));
  const dir = new THREE.Vector3(0, -1, 0).applyEuler(rot);
  return { origin: [mouth.x, mouth.y, mouth.z], dir: [dir.x, dir.y, dir.z], intensity: b.jet };
};

const valveJet: Emitter = (f) => {
  const o = valveOpen(f);
  return o > 0.02 ? { origin: [VALVE_X, VALVE.nozzleTip, 0], dir: [0, -1, 0], intensity: o } : null;
};

const fanExhaust = (z: number): Emitter => (f) => {
  const s = rampCar(f);
  const on = ramp(f, T.fans + 20, 20) * s.opacity;
  if (on < 0.05 || f >= T.s9) return null;
  return { origin: carToWorld(s, [-2.15, 0.3, z]), dir: carDirToWorld(s, [-1, 0.25, 0]), intensity: on };
};
const FAN_EXHAUST = [fanExhaust(0.45), fanExhaust(-0.45)];

export const World: React.FC<{ frame: number }> = ({ frame: f }) => {
  const car = mainCar(f);
  const rc = rampCar(f);
  const b = balloon(f);
  const rampOp = rampVisible(f);

  // Scene 2: tanks fill, then pack tight in the macro shot
  const tankFill = ramp(f, T.tanks, 150);
  const tankPack = ramp(f, T.macro, 70);

  // Scene 5 force arrows
  const forces = ramp(f, T.s5 + 10, 20) * (1 - ramp(f, T.s6, 20));
  // Scene 6 nozzle highlights, one after another
  const glow = NOZZLES.map((_, i) => ramp(f, T.ten + 30 + i * 7, 10) * (1 - ramp(f, T.pulses, 20)));
  // Scene 7
  const fans = ramp(f, T.fans, 25) * (1 - ramp(f, T.s8 + 40, 30));
  const lowP = Math.max(ramp(f, T.lowP, 25) * (1 - ramp(f, T.s8, 30)), 0.65 * ramp(f, T.s8 + 20, 30)) * (1 - ramp(f, T.s9, 30));
  const outer = ramp(f, T.outerP, 20) * (1 - ramp(f, T.s8, 25));

  const valveVis = ramp(f, T.valve - 25, 25) * (1 - ramp(f, T.carUp + 45, 30));
  const balloonArrow = ramp(f, T.balloonFly, 20) * (1 - ramp(f, T.roadsterToo, 15));
  const balloonUp = ramp(f, T.roadsterToo + 25, 20) * (1 - ramp(f, T.roadsterToo + 75, 15));

  const jetsActive = f < T.s2 + 50 || (f >= T.roadsterToo && f < T.s7) || f >= T.s8;

  return (
    <>
      <CameraRig frame={f} />
      <Environment />
      <hemisphereLight args={["#FFFFFF", "#D5DBE4", 1.5]} />
      <directionalLight position={[4, 9, 6]} intensity={2.1} />
      <directionalLight position={[-6, 4, -4]} intensity={0.7} />
      <Studio />
      <FloorMarks opacity={1 - rampOp} />

      {/* main car */}
      <SoftShadow x={car.pos[0]} z={0} height={car.pos[1]} sx={5.4} sz={2.9} opacity={car.opacity} />
      <Car state={car} frame={f} nozzleGlow={glow}>
        {car.xray > 0.01 &&
          TANKS.map((t, i) => (
            <PackedAir
              key={i}
              frame={f}
              center={t}
              axis="x"
              length={2.2}
              radius={0.19}
              spacing={0.07}
              fill={tankFill}
              pack={tankPack}
              opacity={car.xray * car.opacity}
            />
          ))}
      </Car>
      {jetsActive && (
        <>
          <Jets frame={f} emitters={CAR_JETS} />
          <GroundRings frame={f} emitters={CORNER_JETS} />
        </>
      )}

      {/* scene 3: balloon */}
      {b.opacity > 0.01 && (
        <>
          <SoftShadow x={b.pos[0]} z={0} height={b.pos[1] - 0.9} sx={2.2} sz={2.2} opacity={b.opacity * 0.8} />
          <Balloon position={b.pos} rotZ={b.rotZ} scale={b.scale} opacity={b.opacity} mouthOpen={b.mouthOpen} />
          <Jets frame={f} emitters={[balloonJet]} count={260} life={40} speed={0.07} spread={0.16} size={0.05} />
          <Arrow3D position={[b.pos[0] + 1.15 * b.scale, b.pos[1], 0.2]} rotZ={-Math.PI / 2} length={lerp(0.2, 1.3, balloonArrow)} color={C.thrust} opacity={balloonArrow} />
          <Arrow3D position={[b.pos[0], b.pos[1] + 1.25 * b.scale, 0.2]} length={lerp(0.2, 1.0, balloonUp)} color={C.thrust} opacity={balloonUp} />
        </>
      )}

      {/* scene 4: valve cut-away, off to the side */}
      {valveVis > 0.01 && (
        <>
          <ValveRig x={VALVE_X} open={valveOpen(f)} opacity={valveVis} />
          <PackedAir
            frame={f}
            center={[VALVE_X, (VALVE.tankTop + VALVE.tankBottom) / 2, 0]}
            axis="y"
            length={VALVE.tankTop - VALVE.tankBottom - 0.1}
            radius={VALVE.radius - 0.03}
            spacing={0.1}
            fill={1 - 0.3 * ramp(f, T.valve + 35, 120)}
            pack={0.7}
            opacity={valveVis}
          />
          <Jets frame={f} emitters={[valveJet]} count={320} life={42} speed={0.06} spread={0.14} size={0.05} />
          <SoftShadow x={VALVE_X} z={0} height={0} sx={1.6} sz={1.6} opacity={valveVis * 0.6} />
        </>
      )}

      {/* scene 5: thrust vs weight */}
      {forces > 0.01 && (
        <>
          <Arrow3D position={[car.pos[0] - 0.35, car.pos[1] + 1.32, 1.25]} length={thrustLen(f)} color={C.thrust} width={0.2} opacity={forces} />
          <Arrow3D position={[car.pos[0] + 0.35, car.pos[1] + 1.32 + WEIGHT_LEN, 1.25]} rotZ={Math.PI} length={WEIGHT_LEN} color={C.weight} width={0.2} opacity={forces * (f < LIFTOFF + 200 ? 1 : 1)} />
        </>
      )}

      {/* scenes 7–8: ramp, inverted car, fans, low pressure */}
      {rampOp > 0.01 && (
        <>
          <Ramp opacity={rampOp} />
          <Car state={rc} frame={f} fans={fans} />
          <Jets frame={f} emitters={FAN_EXHAUST} count={170} life={40} speed={0.06} spread={0.25} size={0.04} floor={null} />
          {lowP > 0.01 && (
            <mesh position={[rc.pos[0], CEILING_Y - 0.17, 0]}>
              <boxGeometry args={[3.9, 0.26, 1.75]} />
              <meshStandardMaterial
                color={C.fan}
                emissive={C.fan}
                emissiveIntensity={0.6 + 0.25 * Math.sin(f / 8)}
                transparent
                opacity={0.42 * lowP}
                depthWrite={false}
              />
            </mesh>
          )}
          {[-0.4, 1.0, 2.4].map((x, i) => (
            <Arrow3D
              key={i}
              position={[x, CEILING_Y - 2.85, 0.4]}
              length={lerp(0.3, 1.25, ramp(f, T.outerP + i * 4, 24))}
              color={C.thrust}
              opacity={outer * ramp(f, T.outerP + i * 4, 12)}
            />
          ))}
        </>
      )}
    </>
  );
};
