import { Line } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";
import { useRadialTexture } from "./Stage";

type V3 = [number, number, number];

const clay = (color: string, rough = 0.6, emissive = "#000000", ei = 0) => (
  <meshPhysicalMaterial
    color={color}
    roughness={rough}
    sheen={0.5}
    sheenColor="#ffffff"
    clearcoat={0.1}
    emissive={emissive}
    emissiveIntensity={ei}
  />
);

/** Another person's arm with wiggling fingers. Arm points along -Y from the shoulder end; hand at origin. */
export const TickleHand: React.FC<{
  position?: V3;
  rotation?: V3;
  frame: number;
  sleeve?: string;
  skin?: string;
  wiggle?: number;
  scale?: number;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], frame, sleeve = "#f2a93b", skin = "#d99b74", wiggle = 1, scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh position={[0, 1.6, 0]}>
      <capsuleGeometry args={[0.2, 2.6, 8, 20]} />
      {clay(sleeve)}
    </mesh>
    <mesh position={[0, 0.25, 0]}>
      <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} />
      {clay("#ffffff")}
    </mesh>
    <mesh position={[0, 0, 0]} scale={[1.1, 1, 0.6]}>
      <sphereGeometry args={[0.24, 24, 18]} />
      {clay(skin)}
    </mesh>
    {[-0.15, -0.05, 0.05, 0.15].map((x, i) => (
      <group key={i} position={[x, -0.15, 0.02]} rotation={[Math.sin(frame * 0.9 + i * 1.3) * 0.5 * wiggle + 0.2, 0, x * 0.6]}>
        <mesh position={[0, -0.13, 0]}>
          <capsuleGeometry args={[0.045, 0.2, 6, 10]} />
          {clay(skin)}
        </mesh>
      </group>
    ))}
    <group position={[0.24, -0.02, 0.05]} rotation={[0, 0, 0.9 + Math.sin(frame * 0.7) * 0.2 * wiggle]}>
      <mesh position={[0, -0.1, 0]}>
        <capsuleGeometry args={[0.05, 0.14, 6, 10]} />
        {clay(skin)}
      </mesh>
    </group>
  </group>
);

/** Cute clay brain made of lobes, with optional glasses and a face. */
export const Brain: React.FC<{
  position?: V3;
  rotation?: V3;
  scale?: number;
  glow?: number;
  glasses?: boolean;
  smile?: number;
  look?: [number, number];
  color?: string;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, glow = 0.3, glasses = true, smile = 0.8, look = [0, 0], color = "#ff9db8" }) => {
  const lobes = useMemo(() => {
    const out: { p: V3; r: number }[] = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const ring = i % 2 ? 0.55 : 0.85;
        out.push({
          p: [side * (0.5 + Math.cos(a) * 0.05 + (i % 3) * 0.04), Math.sin(a) * 0.55 * ring + 0.05, Math.cos(a) * 0.65 * ring],
          r: 0.34 + ((i * 7) % 5) * 0.025,
        });
      }
      out.push({ p: [side * 0.52, 0.05, 0], r: 0.62 });
    }
    return out;
  }, []);
  const halo = useRadialTexture("rgba(255,220,240,1)", "rgba(255,180,220,0)");
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0, -0.6]}>
        <planeGeometry args={[4.4 * (1 + glow * 0.4), 3.8 * (1 + glow * 0.4)]} />
        <meshBasicMaterial map={halo} transparent opacity={0.25 + glow * 0.6} depthWrite={false} />
      </mesh>
      {lobes.map((l, i) => (
        <mesh key={i} position={l.p}>
          <sphereGeometry args={[l.r, 24, 18]} />
          {clay(color, 0.55, "#ff6fa3", glow * 0.5)}
        </mesh>
      ))}
      {/* brain stem */}
      <mesh position={[0, -0.75, -0.15]}>
        <capsuleGeometry args={[0.16, 0.3, 8, 12]} />
        {clay("#f7869f", 0.6, "#ff6fa3", glow * 0.3)}
      </mesh>
      {/* face */}
      <group position={[0, -0.02, 0.84]}>
        {[-1, 1].map((s) => (
          <group key={s} position={[0.28 * s, 0.1, 0]}>
            <mesh>
              <sphereGeometry args={[0.12, 20, 14]} />
              <meshStandardMaterial color="#fff" roughness={0.3} />
            </mesh>
            <mesh position={[look[0] * 0.04, look[1] * 0.04, 0.09]}>
              <sphereGeometry args={[0.066, 16, 12]} />
              <meshStandardMaterial color="#2a1a12" roughness={0.25} />
            </mesh>
          </group>
        ))}
        {glasses &&
          [-1, 1].map((s) => (
            <mesh key={s} position={[0.28 * s, 0.1, 0.1]}>
              <torusGeometry args={[0.19, 0.035, 10, 28]} />
              <meshStandardMaterial color="#2b2b38" roughness={0.35} metalness={0.2} />
            </mesh>
          ))}
        {glasses && (
          <mesh position={[0, 0.12, 0.12]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.025, 0.12, 4, 8]} />
            <meshStandardMaterial color="#2b2b38" />
          </mesh>
        )}
        <mesh position={[0, -0.2, 0.06]} rotation={[0.2, 0, smile > 0 ? Math.PI : 0]} scale={[1, Math.abs(smile) * 0.8 + 0.25, 1]}>
          <torusGeometry args={[0.13, 0.03, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#7a2440" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
};

/** Chunky 3D question mark built from a tube. */
export const QuestionMark: React.FC<{ position?: V3; rotation?: V3; scale?: number; color?: string; emissive?: number }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color = "#ff8a3d",
  emissive = 0.15,
}) => {
  const geo = useMemo(() => {
    const pts = [
      [-0.55, 0.85],
      [-0.45, 1.3],
      [0, 1.55],
      [0.48, 1.32],
      [0.55, 0.88],
      [0.28, 0.5],
      [0.02, 0.28],
      [0, -0.05],
    ].map(([x, y]) => new THREE.Vector3(x, y - 0.6, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.17, 20, false);
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={0.8} emissive={color} emissiveIntensity={emissive} />
      </mesh>
      {[-0.55, -0.05].map((y, i) => (
        <mesh key={i} position={[i === 0 ? -0.55 : 0, i === 0 ? 0.25 : -0.65, 0]}>
          <sphereGeometry args={[0.17, 20, 14]} />
          <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={0.8} emissive={color} emissiveIntensity={emissive} />
        </mesh>
      ))}
      <mesh position={[0, -1.08, 0]}>
        <sphereGeometry args={[0.22, 24, 18]} />
        <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={0.8} emissive={color} emissiveIntensity={emissive} />
      </mesh>
    </group>
  );
};

export const Gear: React.FC<{ position?: V3; rotation?: number; radius?: number; teeth?: number; color?: string; glow?: number }> = ({
  position = [0, 0, 0],
  rotation = 0,
  radius = 0.6,
  teeth = 10,
  color = "#ffd166",
  glow = 0.3,
}) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const steps = teeth * 4;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const r = i % 4 < 2 ? radius : radius * 0.8;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const hole = new THREE.Path();
    hole.absarc(0, 0, radius * 0.3, 0, Math.PI * 2, true);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
    g.center();
    return g;
  }, [radius, teeth]);
  return (
    <mesh geometry={geo} position={position} rotation={[0, 0, rotation]}>
      <meshPhysicalMaterial color={color} roughness={0.35} metalness={0.2} clearcoat={0.6} emissive={color} emissiveIntensity={glow} />
    </mesh>
  );
};

/** Dotted glowing path, revealed from 0..progress. */
export const HoloPath: React.FC<{ points: V3[]; progress: number; color?: string; width?: number; opacity?: number }> = ({
  points,
  progress,
  color = "#4fe3ff",
  width = 6,
  opacity = 1,
}) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  const n = Math.max(2, Math.floor(60 * Math.min(1, Math.max(0.02, progress))));
  const pts = useMemo(() => curve.getPoints(60).slice(0, n), [curve, n]);
  return <Line points={pts} color={color} lineWidth={width} dashed dashSize={0.12} gapSize={0.09} transparent opacity={opacity} />;
};

export const GlowDot: React.FC<{ position: V3; size?: number; color?: string; intensity?: number }> = ({
  position,
  size = 0.5,
  color = "#4fe3ff",
  intensity = 1,
}) => {
  const tex = useRadialTexture("rgba(255,255,255,1)", "rgba(255,255,255,0)");
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size * 0.25, 20, 14]} />
        <meshBasicMaterial color={color} transparent opacity={Math.min(1, intensity)} />
      </mesh>
      <mesh>
        <planeGeometry args={[size * 2, size * 2]} />
        <meshBasicMaterial map={tex} color={color} transparent opacity={0.7 * intensity} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

/** A nerve tube with a travelling signal pulse. `t` 0..1 position of the pulse, `amp` its size. */
export const Nerve: React.FC<{ points: V3[]; t: number; amp: number; color?: string; pulseColor?: string }> = ({
  points,
  t,
  amp,
  color = "#ffb3c7",
  pulseColor = "#ffe066",
}) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 80, 0.06, 10, false), [curve]);
  const p = curve.getPoint(Math.min(1, Math.max(0, t)));
  return (
    <group>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color={color} roughness={0.4} transparent opacity={0.85} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {t >= 0 && t <= 1 && <GlowDot position={[p.x, p.y, p.z + 0.05]} size={0.25 + amp * 1.1} color={pulseColor} intensity={0.4 + amp} />}
      {t >= 0 &&
        t <= 1 &&
        [0.05, 0.1].map((d, i) => {
          const q = curve.getPoint(Math.max(0, t - d));
          return <GlowDot key={i} position={[q.x, q.y, q.z + 0.05]} size={(0.2 + amp * 0.8) * (0.7 - i * 0.25)} color={pulseColor} intensity={(0.3 + amp * 0.6) * (0.6 - i * 0.2)} />;
        })}
    </group>
  );
};

export const Ripple: React.FC<{ position?: V3; rotation?: V3; t: number; color?: string; rings?: number; maxR?: number }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  t,
  color = "#ffffff",
  rings = 3,
  maxR = 1.2,
}) => (
  <group position={position} rotation={rotation}>
    {new Array(rings).fill(0).map((_, i) => {
      const k = (t - i * 0.25) % 1;
      if (k < 0) return null;
      return (
        <mesh key={i} scale={0.1 + k * maxR}>
          <torusGeometry args={[1, 0.035 / (0.1 + k * maxR), 8, 48]} />
          <meshBasicMaterial color={color} transparent opacity={(1 - k) * 0.8} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

export const Bell: React.FC<{ position?: V3; rotation?: number; scale?: number }> = ({ position = [0, 0, 0], rotation = 0, scale = 1 }) => {
  const geo = useMemo(() => {
    const pts = [
      [0, 0.75],
      [0.12, 0.72],
      [0.3, 0.55],
      [0.38, 0.2],
      [0.45, -0.15],
      [0.62, -0.32],
      [0.64, -0.4],
      [0, -0.4],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 40);
  }, []);
  return (
    <group position={position} rotation={[0, 0, rotation]} scale={scale}>
      <mesh position={[0, 0.85, 0]}>
        <torusGeometry args={[0.1, 0.035, 8, 20]} />
        <meshPhysicalMaterial color="#ffc93c" roughness={0.25} metalness={0.4} clearcoat={1} />
      </mesh>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#ffc93c" roughness={0.25} metalness={0.35} clearcoat={1} side={THREE.DoubleSide} emissive="#ffb000" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshPhysicalMaterial color="#ffb000" roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  );
};

/** Robotic tickling device: base, two jointed segments, feather tip. */
export const RobotArm: React.FC<{ position?: V3; a1: number; a2: number; base?: number; frame: number }> = ({
  position = [0, 0, 0],
  a1,
  a2,
  base = 0,
  frame,
}) => {
  const metal = <meshPhysicalMaterial color="#cfd8e3" roughness={0.3} metalness={0.5} clearcoat={0.6} />;
  const accent = <meshPhysicalMaterial color="#5ec8f2" roughness={0.35} clearcoat={0.5} emissive="#5ec8f2" emissiveIntensity={0.25} />;
  return (
    <group position={position} rotation={[0, base, 0]}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.3, 32]} />
        {metal}
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.28, 24, 16]} />
        {accent}
      </mesh>
      <group position={[0, 0.4, 0]} rotation={[0, 0, a1]}>
        <mesh position={[0, 0.7, 0]}>
          <capsuleGeometry args={[0.14, 1.2, 8, 16]} />
          {metal}
        </mesh>
        <group position={[0, 1.45, 0]} rotation={[0, 0, a2]}>
          <mesh>
            <sphereGeometry args={[0.2, 20, 14]} />
            {accent}
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <capsuleGeometry args={[0.11, 1.0, 8, 16]} />
            {metal}
          </mesh>
          {/* feather */}
          <group position={[0, 1.25, 0]} rotation={[0, 0, Math.sin(frame * 0.8) * 0.25]}>
            <mesh position={[0, 0.3, 0]} scale={[0.35, 1, 0.08]}>
              <sphereGeometry args={[0.4, 20, 14]} />
              <meshPhysicalMaterial color="#ff8fb1" roughness={0.8} sheen={1} sheenColor="#ffffff" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

/** Rounded 3D button that can be pressed (press 0..1). */
export const PushButton: React.FC<{ position?: V3; press: number; color?: string; width?: number }> = ({
  position = [0, 0, 0],
  press,
  color = "#ff4f5e",
  width = 3.4,
}) => {
  const geo = useMemo(() => {
    const w = width,
      h = 1,
      r = 0.45;
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.1, bevelSegments: 4 });
    g.center();
    return g;
  }, [width]);
  return (
    <group position={position}>
      <mesh geometry={geo} position={[0, -0.05, -0.3]} scale={[1.08, 1.2, 0.6]}>
        <meshPhysicalMaterial color="#8a2333" roughness={0.5} />
      </mesh>
      <mesh geometry={geo} position={[0, 0, -press * 0.22]}>
        <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={0.9} emissive={color} emissiveIntensity={0.15 + press * 0.3} />
      </mesh>
    </group>
  );
};
