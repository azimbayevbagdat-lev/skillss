import { useMemo } from "react";
import * as THREE from "three";
import { CarState, NOZZLES } from "../state";
import { C } from "../theme";

// Generic two-door sports-car silhouette, built procedurally (no brand design copied).
const WHEEL_X = 1.38;
const WHEEL_R = 0.36;
const WHEEL_Z = 0.84;
const BODY_DEPTH = 1.86;

const bodyShape = () => {
  const s = new THREE.Shape();
  const arch = 0.47;
  const archCy = 0.36;
  const floorY = 0.24;
  const a = Math.asin((floorY - archCy) / arch); // negative
  s.moveTo(2.12, floorY);
  s.lineTo(2.27, 0.34);
  s.quadraticCurveTo(2.33, 0.47, 2.22, 0.6);
  s.quadraticCurveTo(1.6, 0.74, 0.72, 0.85);
  s.lineTo(-1.3, 0.9);
  s.quadraticCurveTo(-1.95, 0.88, -2.2, 0.76);
  s.quadraticCurveTo(-2.3, 0.62, -2.26, 0.42);
  s.lineTo(-2.16, floorY);
  // rear arch
  s.lineTo(-WHEEL_X - arch * Math.cos(a), floorY);
  s.absarc(-WHEEL_X, archCy, arch, Math.PI - a, a, true);
  s.lineTo(WHEEL_X - arch * Math.cos(a), floorY);
  // front arch
  s.absarc(WHEEL_X, archCy, arch, Math.PI - a, a, true);
  s.lineTo(2.12, floorY);
  return s;
};

const cabinShape = () => {
  const s = new THREE.Shape();
  s.moveTo(0.78, 0.8);
  s.quadraticCurveTo(0.35, 1.02, -0.05, 1.17);
  s.quadraticCurveTo(-0.35, 1.23, -0.62, 1.2);
  s.quadraticCurveTo(-1.15, 1.08, -1.62, 0.86);
  s.lineTo(0.78, 0.8);
  return s;
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Pull the upper sides inward (tumblehome) and round the nose and tail in plan view. */
const sculpt = (g: THREE.BufferGeometry, tumble: number, plan: number) => {
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const k = 1 - tumble * smooth(0.5, 1.25, y) - plan * smooth(1.5, 2.35, Math.abs(x)) ** 1.5;
    p.setZ(i, z * k);
  }
  g.computeVertexNormals();
};

const makeGeometries = () => {
  const body = new THREE.ExtrudeGeometry(bodyShape(), {
    depth: BODY_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.06,
    bevelSegments: 4,
    curveSegments: 28,
  });
  body.translate(0, 0, -BODY_DEPTH / 2);
  sculpt(body, 0.2, 0.16);
  const cabin = new THREE.ExtrudeGeometry(cabinShape(), {
    depth: 1.34,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.08,
    bevelSegments: 5,
    curveSegments: 24,
  });
  cabin.translate(0, 0, -0.67);
  sculpt(cabin, 0.26, 0.1);
  const bodyEdges = new THREE.EdgesGeometry(body, 28);
  const cabinEdges = new THREE.EdgesGeometry(cabin, 28);
  const tyre = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.27, 40);
  tyre.rotateX(Math.PI / 2);
  const tyreEdges = new THREE.EdgesGeometry(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.27, 20).rotateX(Math.PI / 2), 30);
  // five-point star rim
  const spokes: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.BoxGeometry(0.075, 0.27, 0.035);
    g.translate(0, 0.135, 0);
    g.rotateZ((i / 5) * Math.PI * 2);
    spokes.push(g);
  }
  const ring = new THREE.TorusGeometry(0.27, 0.025, 8, 40);
  const hub = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 20).rotateX(Math.PI / 2);
  const tank = new THREE.CylinderGeometry(0.21, 0.21, 2.3, 32, 1).rotateZ(Math.PI / 2);
  const tankEdges = new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.21, 0.21, 2.3, 16, 1).rotateZ(Math.PI / 2), 20);
  const nozzle = new THREE.CylinderGeometry(0.035, 0.075, 0.12, 20);
  // pipes from the tanks to every nozzle
  const pipePts: number[] = [];
  for (const n of NOZZLES) {
    const tz = n[2] >= 0 ? 0.4 : -0.4;
    const tx = Math.max(-1.1, Math.min(1.1, n[0]));
    pipePts.push(tx, 0.52, tz, n[0], 0.3, n[2]);
  }
  const pipes = new THREE.BufferGeometry();
  pipes.setAttribute("position", new THREE.Float32BufferAttribute(pipePts, 3));
  const blade = new THREE.BoxGeometry(0.26, 0.012, 0.08);
  blade.translate(0.15, 0, 0);
  return { body, cabin, bodyEdges, cabinEdges, tyre, tyreEdges, spokes, ring, hub, tank, tankEdges, nozzle, pipes, blade };
};

let shared: ReturnType<typeof makeGeometries> | null = null;
const geos = () => (shared ??= makeGeometries());

export const TANKS: [number, number, number][] = [
  [-0.15, 0.52, 0.4],
  [-0.15, 0.52, -0.4],
];
export const FANS: [number, number, number][] = [
  [0.85, 0.27, 0],
  [-0.85, 0.27, 0],
];

export type CarProps = {
  state: CarState;
  frame: number;
  /** Per-nozzle highlight ring, 0..1 */
  nozzleGlow?: number[];
  /** Under-floor fans (inverted-driving scene), 0..1 visibility */
  fans?: number;
  children?: React.ReactNode;
};

export const Car: React.FC<CarProps> = ({ state, frame, nozzleGlow, fans = 0, children }) => {
  const g = geos();
  const { opacity, xray } = state;
  const solid = opacity * (1 - 0.93 * xray);
  const transparent = solid < 0.999;
  const lineOpacity = opacity * xray * 0.8;
  const internal = opacity * xray;
  const wheels = useMemo(
    () =>
      [-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => ({ x: sx * WHEEL_X, z: sz * WHEEL_Z, side: sz })),
      ),
    [],
  );
  if (opacity <= 0.001) return null;
  return (
    <group position={state.pos} rotation={state.rot} scale={state.scale}>
      <mesh geometry={g.body} renderOrder={2}>
        <meshPhysicalMaterial
          color={C.car}
          metalness={0.35}
          roughness={0.32}
          clearcoat={1}
          clearcoatRoughness={0.18}
          transparent={transparent}
          opacity={solid}
          depthWrite={!transparent}
        />
      </mesh>
      <mesh geometry={g.cabin} renderOrder={2}>
        <meshPhysicalMaterial
          color={C.glass}
          metalness={0.2}
          roughness={0.06}
          clearcoat={1}
          transparent={transparent}
          opacity={solid}
          depthWrite={!transparent}
        />
      </mesh>
      {lineOpacity > 0.01 && (
        <>
          <lineSegments geometry={g.bodyEdges}>
            <lineBasicMaterial color={C.ink} transparent opacity={lineOpacity} />
          </lineSegments>
          <lineSegments geometry={g.cabinEdges}>
            <lineBasicMaterial color={C.ink} transparent opacity={lineOpacity * 0.7} />
          </lineSegments>
        </>
      )}
      {/* light strips */}
      <mesh position={[2.235, 0.57, 0]}>
        <boxGeometry args={[0.03, 0.035, 1.25]} />
        <meshBasicMaterial color="#FFFFFF" transparent={transparent} opacity={solid} />
      </mesh>
      <mesh position={[-2.245, 0.7, 0]}>
        <boxGeometry args={[0.03, 0.035, 1.5]} />
        <meshBasicMaterial color="#E5484D" transparent={transparent} opacity={solid} />
      </mesh>
      {wheels.map((w, i) => (
        <group key={i} position={[w.x, WHEEL_R, w.z]}>
          <mesh geometry={g.tyre}>
            <meshStandardMaterial color="#1A1C20" roughness={0.85} transparent={transparent} opacity={solid} depthWrite={!transparent} />
          </mesh>
          {lineOpacity > 0.01 && (
            <lineSegments geometry={g.tyreEdges}>
              <lineBasicMaterial color={C.ink} transparent opacity={lineOpacity * 0.6} />
            </lineSegments>
          )}
          <group position={[0, 0, w.side * 0.14]}>
            {g.spokes.map((sg, k) => (
              <mesh key={k} geometry={sg}>
                <meshStandardMaterial color="#B9C1CC" metalness={0.6} roughness={0.3} transparent={transparent} opacity={solid} />
              </mesh>
            ))}
            <mesh geometry={g.ring}>
              <meshStandardMaterial color="#B9C1CC" metalness={0.6} roughness={0.3} transparent={transparent} opacity={solid} />
            </mesh>
            <mesh geometry={g.hub}>
              <meshStandardMaterial color="#8E97A3" metalness={0.6} roughness={0.3} transparent={transparent} opacity={solid} />
            </mesh>
          </group>
        </group>
      ))}
      {/* nozzles stay visible from below */}
      {NOZZLES.map((n, i) => (
        <group key={i} position={[n[0], n[1] - 0.03, n[2]]}>
          <mesh geometry={g.nozzle}>
            <meshStandardMaterial color="#2A2E35" roughness={0.5} transparent opacity={opacity} />
          </mesh>
          {nozzleGlow && nozzleGlow[i] > 0.01 && (
            <mesh position={[0, -0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.1, 0.17, 40]} />
              <meshBasicMaterial color={C.air} transparent opacity={nozzleGlow[i] * opacity} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          )}
        </group>
      ))}
      {internal > 0.01 && (
        <group>
          {TANKS.map((t, i) => (
            <group key={i} position={t}>
              <mesh geometry={g.tank}>
                <meshPhysicalMaterial color="#D6EBFB" roughness={0.1} transparent opacity={0.28 * internal} depthWrite={false} />
              </mesh>
              <lineSegments geometry={g.tankEdges}>
                <lineBasicMaterial color={C.air} transparent opacity={0.9 * internal} />
              </lineSegments>
            </group>
          ))}
          <lineSegments geometry={g.pipes}>
            <lineBasicMaterial color={C.air} transparent opacity={0.65 * internal} />
          </lineSegments>
        </group>
      )}
      {fans > 0.01 &&
        FANS.map((p, i) => (
          <group key={i} position={p} rotation={[0, frame * 0.55 * (i ? -1 : 1), 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.31, 0.34, 48]} />
              <meshBasicMaterial color={C.fan} transparent opacity={fans} side={THREE.DoubleSide} />
            </mesh>
            {Array.from({ length: 7 }, (_, k) => (
              <mesh key={k} geometry={g.blade} rotation={[0.35, (k / 7) * Math.PI * 2, 0]}>
                <meshStandardMaterial color={C.fan} transparent opacity={fans} roughness={0.4} />
              </mesh>
            ))}
          </group>
        ))}
      {children}
    </group>
  );
};

/** Car-local point → world, following the car's transform. */
export const carToWorld = (state: CarState, local: [number, number, number]): [number, number, number] => {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...state.pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...state.rot)),
    new THREE.Vector3(state.scale, state.scale, state.scale),
  );
  const v = new THREE.Vector3(...local).applyMatrix4(m);
  return [v.x, v.y, v.z];
};

/** Car-local direction → world (unit length). */
export const carDirToWorld = (state: CarState, dir: [number, number, number]): [number, number, number] => {
  const v = new THREE.Vector3(...dir).applyEuler(new THREE.Euler(...state.rot)).normalize();
  return [v.x, v.y, v.z];
};
