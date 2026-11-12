import React, { useMemo } from "react";
import * as THREE from "three";
import { CamRig, KeyLight, Label, Stage } from "../lib/three";
import { kf, pop, prog, useT, wobble } from "../lib/time";

const Hourglass: React.FC<{
  sand: number; // 0 = all on top, 1 = all at bottom
  t: number;
  tint?: string;
  glow?: number;
}> = ({ sand, t, tint = "#ffd9a0", glow = 0 }) => {
  const glassGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 40; i++) {
      const y = -0.55 + (i / 40) * 1.1;
      const u = Math.abs(y) / 0.55;
      const r = 0.035 + 0.27 * Math.sin(Math.min(1, u * 1.08) * Math.PI * 0.62) * (u < 0.96 ? 1 : 0.92);
      pts.push(new THREE.Vector2(Math.max(0.035, r), y));
    }
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  const top = 1 - sand;
  return (
    <group>
      {/* wooden caps & pillars */}
      {[-0.6, 0.6].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.08, 48]} />
          <meshPhysicalMaterial color="#6e4426" roughness={0.45} clearcoat={0.6} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.33, 0, Math.sin(a) * 0.33]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.15, 12]} />
            <meshPhysicalMaterial color="#6e4426" roughness={0.45} />
          </mesh>
        );
      })}
      {/* sand */}
      {top > 0.02 ? (
        <mesh position={[0, 0.05 + 0.2 * (1 - top), 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.24 * Math.sqrt(top), 0.38 * top, 40]} />
          <meshStandardMaterial color={tint} roughness={0.9} emissive={tint} emissiveIntensity={glow} />
        </mesh>
      ) : null}
      <mesh position={[0, -0.53 + 0.17 * sand, 0]}>
        <coneGeometry args={[0.25 * Math.sqrt(Math.max(0.05, sand)), 0.34 * Math.max(0.05, sand), 40]} />
        <meshStandardMaterial color={tint} roughness={0.9} emissive={tint} emissiveIntensity={glow} />
      </mesh>
      {top > 0.02 ? (
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.5, 8]} />
          <meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={glow + 0.2 + 0.1 * Math.sin(t * 30)} />
        </mesh>
      ) : null}
      <mesh geometry={glassGeo}>
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.04}
          transmission={1}
          thickness={0.08}
          ior={1.45}
          clearcoat={1}
          transparent
          opacity={0.9}
          envMapIntensity={1.4}
        />
      </mesh>
    </group>
  );
};

export const HourglassScene: React.FC = () => {
  const t = useT();
  const appear = pop(t, 36.75, 0.55);
  // "белгісіз бес минут" stretches, "жиырма минут" shrinks
  const stretch = kf(t, [38.4, 41.6], [0, 1]);
  const shrink = kf(t, [39.4, 41.6], [0, 1]);
  const ang = kf(t, [36.65, 42.15], [-0.15, 0.12]);
  const d = kf(t, [36.65, 42.15], [6.4, 5.9]);
  const sx5 = 1 + stretch * 0.32;
  const sy5 = 1 + stretch * 0.8;
  const s20 = 1 - shrink * 0.45;
  const jitter = stretch * Math.sin(t * 9) * 0.02;
  return (
    <>
      <CamRig pos={[Math.sin(ang) * d, 1.6, Math.cos(ang) * d]} target={[0, 0.85, 0]} fov={36} />
      <Stage bg="#191530" focus={[0, 1.2, 0]} focusRange={2.5} bokeh={3.5} bloom={0.8} envIntensity={0.9}>
        <ambientLight intensity={0.2} />
        <KeyLight position={[2.5, 5, 3]} intensity={2.4} target={[0, 0.8, 0]} />
        <spotLight position={[-3, 4, -2]} intensity={20} angle={0.6} penumbra={1} color="#8f7bff" />
        {/* floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <circleGeometry args={[6, 64]} />
          <meshPhysicalMaterial color="#231d40" roughness={0.35} clearcoat={0.8} />
        </mesh>
        {/* 5-minute (uncertain) hourglass */}
        <group position={[-0.5, 0, 0]} scale={appear * 0.75}>
          <group position={[0, 0.64 * sy5, 0]} scale={[sx5, sy5, sx5]} rotation={[0, 0, jitter]}>
            <Hourglass sand={kf(t, [37, 42.15], [0.15, 0.4])} t={t} tint="#ff7a6b" glow={0.15 + stretch * 0.5} />
          </group>
          <group position={[0, 1.42 * sy5 + 0.18, 0.1]}>
            <Label text="5 мин" size={0.3} bg="#e2557a" color="#fff" />
          </group>
          <group position={[0, 1.42 * sy5 + 0.47, 0.1]} scale={prog(t, 37.9, 38.3)}>
            <Label text="белгісіз" size={0.2} color="#ffd1d1" />
          </group>
        </group>
        {/* 20-minute (known) hourglass */}
        <group position={[0.52, 0, 0]} scale={appear * 0.75}>
          <group position={[0, 0.64 * s20, 0]} scale={s20}>
            <Hourglass sand={kf(t, [37, 42.15], [0.1, 0.55])} t={t} tint="#ffd9a0" glow={0.1} />
          </group>
          <group position={[0, 1.42 * s20 + 0.18, 0.1]}>
            <Label text="20 мин" size={0.3 * (0.6 + 0.4 * s20)} bg="#5b6b8f" color="#fff" />
          </group>
          <group position={[0, 1.42 * s20 + 0.45, 0.1]} scale={prog(t, 39.3, 39.7) * s20}>
            <Label text="нақты" size={0.2} color="#d6e2ff" />
          </group>
        </group>
        {/* floating dust */}
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * 2.1) * 2.2, 0.3 + ((i * 0.37 + t * 0.05) % 1) * 2.6, Math.cos(i * 1.3) * 1.6 - 0.8]} scale={0.012}>
            <sphereGeometry args={[1, 6, 4]} />
            <meshBasicMaterial color="#ffe3b0" toneMapped={false} transparent opacity={0.6 + 0.4 * wobble(t, i)} />
          </mesh>
        ))}
      </Stage>
    </>
  );
};
