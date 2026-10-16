import { useMemo } from "react";
import * as THREE from "three";
import { rand } from "../anim";
import { C } from "../theme";

type V3 = [number, number, number];
export type EmitterSample = { origin: V3; dir: V3; intensity: number } | null;
export type Emitter = (frame: number) => EmitterSample;

const sphere = new THREE.SphereGeometry(1, 10, 8);
const airMaterial = () =>
  new THREE.MeshStandardMaterial({ color: C.air, emissive: C.air, emissiveIntensity: 0.35, roughness: 0.35 });

const basis = (d: THREE.Vector3) => {
  const a = Math.abs(d.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(d, a).normalize();
  const v = new THREE.Vector3().crossVectors(d, u).normalize();
  return [u, v] as const;
};

const dummy = new THREE.Object3D();

/**
 * Cone-shaped jets of blue air particles. Every particle is a pure function of
 * the frame (seeded phase), so renders are deterministic. Particles that reach
 * the floor splash outward along it.
 */
export const Jets: React.FC<{
  frame: number;
  emitters: Emitter[];
  count?: number;
  life?: number;
  speed?: number;
  spread?: number;
  size?: number;
  floor?: number | null;
}> = ({ frame, emitters, count = 190, life = 34, speed = 0.08, spread = 0.16, size = 0.03, floor = 0.03 }) => {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(sphere, airMaterial(), 3000);
    m.frustumCulled = false;
    return m;
  }, []);
  let n = 0;
  const dir = new THREE.Vector3();
  const p = new THREE.Vector3();
  emitters.forEach((emit, ei) => {
    const salt = ei * 13 + 1;
    for (let k = 0; k < count && n < 3000; k++) {
      const age = (frame + rand(k, salt) * life) % life;
      const em = emit(frame - age);
      if (!em || rand(k, salt + 1) > em.intensity) continue;
      dir.set(...em.dir).normalize();
      const [u, v] = basis(dir);
      const ang = rand(k, salt + 2) * Math.PI * 2;
      const r = Math.sqrt(rand(k, salt + 3)) * spread;
      dir.addScaledVector(u, Math.cos(ang) * r).addScaledVector(v, Math.sin(ang) * r).normalize();
      const sp = speed * (0.75 + 0.5 * rand(k, salt + 4));
      p.set(...em.origin).addScaledVector(dir, sp * age);
      if (floor !== null && dir.y < 0 && p.y < floor) {
        const th = (em.origin[1] - floor) / (-dir.y * sp);
        const rem = age - th;
        p.set(...em.origin).addScaledVector(dir, sp * th);
        const travel = sp * 1.15 * rem * (1 - rem / (2.2 * life));
        p.x += Math.cos(ang) * travel;
        p.z += Math.sin(ang) * travel;
        p.y = floor + 0.02 * rand(k, salt + 5);
      }
      const s = size * Math.sqrt(Math.max(0, 1 - age / life)) * (0.7 + 0.6 * rand(k, salt + 6));
      dummy.position.copy(p);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(n++, dummy.matrix);
    }
  });
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

/** Expanding rings where a downward jet meets the floor. */
export const GroundRings: React.FC<{ frame: number; emitters: Emitter[]; period?: number }> = ({
  frame,
  emitters,
  period = 42,
}) => {
  const rings: { x: number; z: number; r: number; o: number }[] = [];
  emitters.forEach((emit) => {
    const em = emit(frame);
    if (!em || em.intensity < 0.05 || em.dir[1] > -0.5) return;
    const h = em.origin[1];
    if (h > 3.2) return;
    const t = h / -em.dir[1];
    const x = em.origin[0] + em.dir[0] * t;
    const z = em.origin[2] + em.dir[2] * t;
    for (let i = 0; i < 3; i++) {
      const ph = ((frame + (i * period) / 3) % period) / period;
      rings.push({ x, z, r: 0.12 + ph * 1.25, o: (1 - ph) * 0.55 * em.intensity * Math.max(0, 1 - h / 3.2) });
    }
  });
  return (
    <group>
      {rings.map((r, i) => (
        <mesh key={i} position={[r.x, 0.012, r.z]} rotation={[-Math.PI / 2, 0, 0]} scale={r.r}>
          <ringGeometry args={[0.93, 1, 64]} />
          <meshBasicMaterial color={C.air} transparent opacity={r.o} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Air packed inside a cylinder (tank). `fill` grows the filled length,
 * `pack` 0 → 1 calms the jiggle and swells the spheres until they touch.
 */
export const PackedAir: React.FC<{
  frame: number;
  center: V3;
  axis: "x" | "y";
  length: number;
  radius: number;
  spacing: number;
  fill: number;
  pack: number;
  opacity: number;
}> = ({ frame, center, axis, length, radius, spacing, fill, pack, opacity }) => {
  const lattice = useMemo(() => {
    const pts: V3[] = [];
    const rowH = spacing * 0.866;
    for (let a = -length / 2 + spacing / 2; a <= length / 2; a += spacing)
      for (let i = -radius; i <= radius; i += rowH)
        for (let j = -radius; j <= radius; j += spacing) {
          const jj = j + ((Math.round((i + radius) / rowH) % 2) * spacing) / 2;
          if (i * i + jj * jj <= (radius - spacing * 0.45) ** 2) pts.push([a, i, jj]);
        }
    return pts;
  }, [length, radius, spacing]);
  const mesh = useMemo(() => {
    const mat = airMaterial();
    mat.transparent = true;
    const m = new THREE.InstancedMesh(sphere, mat, lattice.length);
    m.frustumCulled = false;
    return m;
  }, [lattice]);
  (mesh.material as THREE.MeshStandardMaterial).opacity = opacity;
  const jiggle = spacing * (0.32 - 0.29 * pack);
  const size = spacing * (0.3 + 0.2 * pack);
  const edge = -length / 2 + fill * length;
  let n = 0;
  lattice.forEach(([a, i, j], k) => {
    if (a > edge) return;
    const t = frame / 60;
    const dx = Math.sin(t * 7 + k * 1.7) * jiggle;
    const dy = Math.sin(t * 6.1 + k * 2.3) * jiggle;
    const dz = Math.sin(t * 6.7 + k * 0.9) * jiggle;
    const appear = Math.min(1, (edge - a) / (spacing * 3));
    if (axis === "x") dummy.position.set(center[0] + a + dx, center[1] + i + dy, center[2] + j + dz);
    else dummy.position.set(center[0] + i + dx, center[1] + a + dy, center[2] + j + dz);
    dummy.scale.setScalar(size * appear);
    dummy.updateMatrix();
    mesh.setMatrixAt(n++, dummy.matrix);
  });
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  return opacity > 0.01 ? <primitive object={mesh} /> : null;
};
