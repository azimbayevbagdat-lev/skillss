import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { cardTex, chargerIconTex, IconKind, thoughtTex } from "./textures";

export const RBox: React.FC<{
  size: [number, number, number];
  radius?: number;
  color?: string;
  roughness?: number;
  metalness?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  material?: THREE.Material;
  castShadow?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
}> = ({
  size,
  radius = 0.04,
  color = "#ccc",
  roughness = 0.7,
  metalness = 0,
  position,
  rotation,
  material,
  castShadow = true,
  emissive,
  emissiveIntensity = 0,
}) => {
  const geo = useMemo(
    () =>
      new RoundedBoxGeometry(
        size[0],
        size[1],
        size[2],
        3,
        Math.min(radius, Math.min(...size) / 2 - 0.001),
      ),
    [size[0], size[1], size[2], radius],
  );
  return (
    <mesh
      geometry={geo}
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow
      material={material}
    >
      {material ? null : (
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
          emissive={emissive ?? "#000"}
          emissiveIntensity={emissiveIntensity}
        />
      )}
    </mesh>
  );
};

/** 3D question mark built from a torus arc, a stem and a dot. */
export const QuestionMark: React.FC<{
  position: [number, number, number];
  scale: number;
  rotY?: number;
  wobble?: number;
}> = ({ position, scale, rotY = 0, wobble = 0 }) => {
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#FFC21A",
        emissive: "#FFB000",
        emissiveIntensity: 1.4,
        roughness: 0.25,
        clearcoat: 1,
      }),
    [],
  );
  if (scale <= 0.001) return null;
  return (
    <group
      position={position}
      scale={scale}
      rotation={[0, rotY, Math.sin(wobble) * 0.12]}
    >
      <mesh
        material={mat}
        position={[0, 0.16, 0]}
        rotation={[0, 0, -Math.PI * 0.62]}
        castShadow
      >
        <torusGeometry args={[0.1, 0.035, 16, 40, Math.PI * 1.45]} />
      </mesh>
      <mesh material={mat} position={[0, 0.02, 0]} castShadow>
        <capsuleGeometry args={[0.035, 0.07, 8, 16]} />
      </mesh>
      <mesh material={mat} position={[0, -0.11, 0]} castShadow>
        <sphereGeometry args={[0.045, 20, 16]} />
      </mesh>
    </group>
  );
};

/** Wooden memory box with hinged lid. open: 0 closed .. 1 open */
export const MemoryBox: React.FC<{
  position: [number, number, number];
  rotY?: number;
  scale?: number;
  open: number;
  glow?: number;
  children?: React.ReactNode;
}> = ({ position, rotY = 0, scale = 1, open, glow = 0, children }) => {
  const wood = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#A0663D",
        roughness: 0.45,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
      }),
    [],
  );
  const inner = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#5B3A23",
        roughness: 0.8,
        emissive: "#FFC864",
        emissiveIntensity: 0,
      }),
    [],
  );
  inner.emissiveIntensity = glow * 2.5;
  const brass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#D8B25A",
        metalness: 1,
        roughness: 0.3,
      }),
    [],
  );
  const W = 0.5;
  const H = 0.26;
  const D = 0.36;
  const t = 0.03;
  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      {/* bottom + walls */}
      <RBox
        size={[W, t, D]}
        position={[0, t / 2, 0]}
        material={wood}
        radius={0.01}
      />
      <RBox
        size={[W, H, t]}
        position={[0, H / 2, D / 2 - t / 2]}
        material={wood}
        radius={0.01}
      />
      <RBox
        size={[W, H, t]}
        position={[0, H / 2, -D / 2 + t / 2]}
        material={wood}
        radius={0.01}
      />
      <RBox
        size={[t, H, D]}
        position={[W / 2 - t / 2, H / 2, 0]}
        material={wood}
        radius={0.01}
      />
      <RBox
        size={[t, H, D]}
        position={[-W / 2 + t / 2, H / 2, 0]}
        material={wood}
        radius={0.01}
      />
      <mesh
        material={inner}
        position={[0, t + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[W - 2 * t, D - 2 * t]} />
      </mesh>
      {/* lid hinged at back edge */}
      <group position={[0, H, -D / 2]} rotation={[-open * 1.9, 0, 0]}>
        <RBox
          size={[W + 0.02, 0.05, D + 0.02]}
          position={[0, 0.025, D / 2]}
          material={wood}
          radius={0.015}
        />
        <mesh material={brass} position={[0, 0.0, D + 0.012]}>
          <boxGeometry args={[0.06, 0.05, 0.012]} />
        </mesh>
      </group>
      {glow > 0.01 ? (
        <pointLight
          position={[0, H + 0.1, 0]}
          intensity={glow * 3}
          distance={2}
          color="#FFC864"
        />
      ) : null}
      {children}
    </group>
  );
};

/** Flat card with film frame & icon. */
export const Card: React.FC<{
  kind: IconKind;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  glow?: number;
  opacity?: number;
  width?: number;
}> = ({
  kind,
  position,
  rotation,
  scale = 1,
  glow = 0,
  opacity = 1,
  width = 0.6,
}) => {
  const tex = cardTex(kind);
  const h = width * 0.75;
  if (scale <= 0.001 || opacity <= 0.001) return null;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        <planeGeometry args={[width, h]} />
        <meshStandardMaterial
          map={tex}
          emissiveMap={tex}
          emissive="#ffffff"
          emissiveIntensity={0.55 + glow * 1.6}
          roughness={0.4}
          transparent={opacity < 1}
          opacity={opacity}
          side={THREE.DoubleSide}
          toneMapped={glow < 0.05}
        />
      </mesh>
      {glow > 0.01 ? (
        <mesh position={[0, 0, -0.004]}>
          <planeGeometry args={[width * 1.08, h * 1.1]} />
          <meshBasicMaterial
            color="#FFD27A"
            transparent
            opacity={Math.min(1, glow) * opacity}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  );
};

/** Camera-facing thought bubble with the charger inside. */
export const ThoughtBubble: React.FC<{
  position: [number, number, number];
  scale: number;
  opacity?: number;
  faceRotY?: number;
  dim?: number;
}> = ({ position, scale, opacity = 1, faceRotY = 0, dim = 0 }) => {
  const tex = thoughtTex();
  if (scale <= 0.001 || opacity <= 0.001) return null;
  return (
    <group position={position} rotation={[0, faceRotY, 0]} scale={scale}>
      <mesh>
        <planeGeometry args={[0.55, 0.55]} />
        <meshBasicMaterial
          map={tex}
          transparent
          opacity={opacity}
          depthWrite={false}
          color={new THREE.Color(1 - dim * 0.55, 1 - dim * 0.5, 1 - dim * 0.35)}
          toneMapped={false}
        />
      </mesh>
      {/* trailing dots toward the head */}
      {[
        [-0.17, -0.33, 0.05],
        [-0.24, -0.45, 0.032],
      ].map(([x, y, r], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <circleGeometry args={[r, 24]} />
          <meshBasicMaterial
            color="#F2F6FF"
            transparent
            opacity={opacity * (1 - dim * 0.5)}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

/** Glowing idea orb, with the charger icon floating inside. */
export const IdeaOrb: React.FC<{
  position?: [number, number, number];
  scale: number;
  pulse?: number;
  faceRotY?: number;
  light?: boolean;
}> = ({
  position = [0, 0, 0],
  scale,
  pulse = 0,
  faceRotY = 0,
  light = true,
}) => {
  const icon = chargerIconTex();
  if (scale <= 0.001) return null;
  const k = 1 + Math.sin(pulse) * 0.04;
  return (
    <group position={position} scale={scale * k}>
      <mesh>
        <sphereGeometry args={[0.13, 40, 28]} />
        <meshPhysicalMaterial
          color="#FFE7A0"
          emissive="#FFC23A"
          emissiveIntensity={1.6}
          roughness={0.1}
          transparent
          opacity={0.55}
          clearcoat={1}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.165, 32, 20]} />
        <meshBasicMaterial
          color="#FFD56B"
          transparent
          opacity={0.18}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[0, faceRotY, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial
          map={icon}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {light ? (
        <pointLight intensity={2.2} distance={3} color="#FFC864" />
      ) : null}
    </group>
  );
};

/** small sparkle particles (deterministic) */
export const Sparkles: React.FC<{
  t: number;
  start: number;
  count?: number;
  radius?: number;
  position?: [number, number, number];
  color?: string;
  life?: number;
}> = ({
  t,
  start,
  count = 26,
  radius = 0.7,
  position = [0, 0, 0],
  color = "#FFE08A",
  life = 1.6,
}) => {
  const seeds = useMemo(() => {
    const arr: { dir: THREE.Vector3; sp: number; sz: number; delay: number }[] =
      [];
    let s = 42;
    const r = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let i = 0; i < count; i++) {
      const th = r() * Math.PI * 2;
      const ph = Math.acos(r() * 2 - 1);
      arr.push({
        dir: new THREE.Vector3(
          Math.sin(ph) * Math.cos(th),
          Math.abs(Math.cos(ph)) * 0.9 + 0.2,
          Math.sin(ph) * Math.sin(th),
        ),
        sp: 0.5 + r(),
        sz: 0.012 + r() * 0.02,
        delay: r() * 0.35,
      });
    }
    return arr;
  }, [count]);
  const u = t - start;
  if (u < 0 || u > life + 0.4) return null;
  return (
    <group position={position}>
      {seeds.map((p, i) => {
        const k = Math.max(0, Math.min(1, (u - p.delay) / life));
        if (k <= 0 || k >= 1) return null;
        const d = radius * p.sp * (1 - (1 - k) ** 2);
        const sz = p.sz * Math.sin(k * Math.PI);
        return (
          <mesh
            key={i}
            position={[p.dir.x * d, p.dir.y * d, p.dir.z * d]}
            scale={sz}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};
