import { useMemo } from "react";
import * as THREE from "three";
import { CEILING_Y } from "../state";
import { C } from "../theme";

type V3 = [number, number, number];

const headGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.24, 0);
  s.lineTo(0.24, 0);
  s.lineTo(0, 0.34);
  s.lineTo(-0.24, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 });
  g.translate(0, 0, -0.04);
  return g;
})();

/** Flat 3D force arrow; `length` includes the head. Points along +y before `rotZ`. */
export const Arrow3D: React.FC<{
  position: V3;
  length: number;
  color: string;
  rotZ?: number;
  rotY?: number;
  width?: number;
  opacity?: number;
}> = ({ position, length, color, rotZ = 0, rotY = 0, width = 0.16, opacity = 1 }) => {
  if (opacity <= 0.01 || length <= 0.01) return null;
  const head = Math.min(0.34, length * 0.6);
  const shaft = Math.max(0.001, length - head);
  const hs = head / 0.34;
  return (
    <group position={position} rotation={[0, rotY, rotZ]}>
      <mesh position={[0, shaft / 2, 0]}>
        <boxGeometry args={[width, shaft, 0.08]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.45} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <mesh geometry={headGeo} position={[0, shaft, 0]} scale={[hs * (width / 0.16) ** 0.5, hs, 1]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} roughness={0.45} transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
};

// Balloon profile, neck at −y; rotated so the neck points −x by default.
const balloonGeo = (() => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = -Math.PI / 2 + t * Math.PI;
    const r = Math.cos(a) * (1 - 0.18 * Math.max(0, -Math.sin(a)) ** 2);
    const y = Math.sin(a) * 1.12;
    pts.push(new THREE.Vector2(Math.max(0.06, r * 0.92), y));
  }
  pts[0] = new THREE.Vector2(0.06, -1.12);
  const g = new THREE.LatheGeometry(pts, 64);
  return g;
})();

export const BALLOON_NECK = -1.22;

export const Balloon: React.FC<{
  position: V3;
  rotZ: number;
  scale: number;
  opacity: number;
  mouthOpen: number;
}> = ({ position, rotZ, scale, opacity, mouthOpen }) => {
  if (opacity <= 0.01) return null;
  return (
    <group position={position} rotation={[0, 0, -Math.PI / 2 + rotZ]} scale={scale}>
      <mesh geometry={balloonGeo}>
        <meshPhysicalMaterial color="#F8F9FB" roughness={0.22} clearcoat={1} clearcoatRoughness={0.1} sheen={0.5} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {/* neck */}
      <mesh position={[0, -1.17, 0]}>
        <cylinderGeometry args={[0.07, 0.06, 0.12, 24]} />
        <meshPhysicalMaterial color="#EEF0F4" roughness={0.3} transparent opacity={opacity} />
      </mesh>
      {/* knot: disappears when the mouth is let go */}
      <mesh position={[0, -1.24, 0]} rotation={[Math.PI / 2, 0, 0]} scale={1 - mouthOpen}>
        <torusGeometry args={[0.06, 0.035, 12, 24]} />
        <meshPhysicalMaterial color="#E4E7EC" roughness={0.3} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, -1.235, 0]} rotation={[Math.PI / 2, 0, 0]} scale={mouthOpen}>
        <ringGeometry args={[0.035, 0.07, 24]} />
        <meshBasicMaterial color={C.air} transparent opacity={opacity * mouthOpen} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/** Curved ramp: rises from the floor in a half-pipe and continues as a ceiling. */
export const RAMP_R = CEILING_Y / 2;
export const RAMP_CX = -1.6;
export const Ramp: React.FC<{ opacity: number }> = ({ opacity }) => {
  const { geo, edges, lane } = useMemo(() => {
    const t = 0.18;
    const end = 4.4;
    const shape = new THREE.Shape();
    const steps = 48;
    // inner (driving) surface
    shape.moveTo(RAMP_CX + 1.2, 0);
    shape.lineTo(RAMP_CX, 0);
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 2 - (i / steps) * Math.PI;
      shape.lineTo(RAMP_CX + Math.cos(a) * RAMP_R, RAMP_R + Math.sin(a) * RAMP_R);
    }
    shape.lineTo(end, CEILING_Y);
    shape.lineTo(end, CEILING_Y + t);
    for (let i = steps; i >= 0; i--) {
      const a = -Math.PI / 2 - (i / steps) * Math.PI;
      shape.lineTo(RAMP_CX + Math.cos(a) * (RAMP_R + t), RAMP_R + Math.sin(a) * (RAMP_R + t));
    }
    shape.lineTo(RAMP_CX + 1.2, -t * 0.0);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 3.0, bevelEnabled: false, curveSegments: 4 });
    g.translate(0, 0, -1.5);
    const e = new THREE.EdgesGeometry(g, 20);
    // dashed lane line on the ceiling
    const pts: number[] = [];
    for (let x = RAMP_CX + 0.2; x < end - 0.2; x += 0.55) pts.push(x, CEILING_Y - 0.004, 0, x + 0.28, CEILING_Y - 0.004, 0);
    const l = new THREE.BufferGeometry();
    l.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return { geo: g, edges: e, lane: l };
  }, []);
  if (opacity <= 0.01) return null;
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#E1E6ED" roughness={0.85} side={THREE.DoubleSide} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#AEB7C3" transparent opacity={opacity * 0.9} />
      </lineSegments>
      <lineSegments geometry={lane}>
        <lineBasicMaterial color={C.weight} transparent opacity={opacity * 0.7} />
      </lineSegments>
    </group>
  );
};

/** Cut-away schematic: tank, sliding valve gate, converging nozzle. */
export const VALVE = {
  tankBottom: 2.75,
  tankTop: 4.75,
  valveY: 2.5,
  nozzleTip: 1.35,
  radius: 0.45,
};

export const ValveRig: React.FC<{ x: number; open: number; opacity: number }> = ({ x, open, opacity }) => {
  const { tube, tubeEdges, cone, coneEdges } = useMemo(() => {
    const h = VALVE.tankTop - VALVE.tankBottom;
    const t = new THREE.CylinderGeometry(VALVE.radius, VALVE.radius, h, 40, 1, true, 0, Math.PI * 2);
    const c = new THREE.CylinderGeometry(VALVE.radius, 0.08, VALVE.valveY - 0.25 - VALVE.nozzleTip, 40, 1, true);
    return {
      tube: t,
      tubeEdges: new THREE.EdgesGeometry(new THREE.CylinderGeometry(VALVE.radius, VALVE.radius, h, 24, 1, true), 10),
      cone: c,
      coneEdges: new THREE.EdgesGeometry(new THREE.CylinderGeometry(VALVE.radius, 0.08, VALVE.valveY - 0.25 - VALVE.nozzleTip, 24, 1, true), 10),
    };
  }, []);
  if (opacity <= 0.01) return null;
  const tankMid = (VALVE.tankTop + VALVE.tankBottom) / 2;
  const coneMid = (VALVE.valveY - 0.25 + VALVE.nozzleTip) / 2;
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, tankMid, 0]} geometry={tube}>
        <meshPhysicalMaterial color="#DCEEFC" roughness={0.1} transparent opacity={0.3 * opacity} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments position={[0, tankMid, 0]} geometry={tubeEdges}>
        <lineBasicMaterial color={C.ink} transparent opacity={0.75 * opacity} />
      </lineSegments>
      {/* caps */}
      <mesh position={[0, VALVE.tankTop + 0.05, 0]}>
        <cylinderGeometry args={[VALVE.radius + 0.04, VALVE.radius + 0.04, 0.1, 40]} />
        <meshStandardMaterial color={C.car} roughness={0.4} transparent opacity={opacity} />
      </mesh>
      {/* valve housing with sliding gate */}
      <mesh position={[0, VALVE.valveY, 0]}>
        <cylinderGeometry args={[VALVE.radius + 0.06, VALVE.radius + 0.06, 0.5, 40, 1, true]} />
        <meshStandardMaterial color="#C9D0DA" roughness={0.5} transparent opacity={0.55 * opacity} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[open * (VALVE.radius * 2 + 0.15), VALVE.valveY, 0]}>
        <boxGeometry args={[VALVE.radius * 2 + 0.1, 0.14, VALVE.radius * 2 + 0.1]} />
        <meshStandardMaterial color={C.thrust} emissive={C.thrust} emissiveIntensity={0.15} roughness={0.4} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, coneMid, 0]} geometry={cone}>
        <meshPhysicalMaterial color="#DCEEFC" roughness={0.1} transparent opacity={0.3 * opacity} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments position={[0, coneMid, 0]} geometry={coneEdges}>
        <lineBasicMaterial color={C.ink} transparent opacity={0.75 * opacity} />
      </lineSegments>
      {/* stand */}
      <mesh position={[0.95, 2.4, 0]}>
        <boxGeometry args={[0.06, 4.8, 0.06]} />
        <meshStandardMaterial color="#B4BCC7" transparent opacity={opacity} />
      </mesh>
    </group>
  );
};
