import { RoundedBox } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";
import { Lightning, Sparkles3D } from "../lib/props";
import { CamRig, KeyLight, Label, Stage } from "../lib/three";
import { kf, pop, prog, useT } from "../lib/time";

const UNIT = 0.26; // bar height for "1x"
const CY = 1.05; // chart pedestal height

const Companies: React.FC<{ t: number }> = ({ t }) => {
  const items = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => {
        const r = (n: number) => {
          const x = Math.sin(i * 91.3 + n * 47.1) * 43758.5453;
          return x - Math.floor(x);
        };
        const a = r(1) * Math.PI - Math.PI;
        const d = 2.6 + r(2) * 3.2;
        return { x: Math.cos(a) * d, z: Math.sin(a) * d - 0.5, h: 0.25 + r(3) * 0.9, w: 0.18 + r(4) * 0.18, at: 47.8 + r(5) * 1.5, c: r(6) };
      }),
    [],
  );
  const mats = useMemo(
    () => [
      new THREE.MeshPhysicalMaterial({ color: "#3a3466", roughness: 0.4, clearcoat: 0.6 }),
      new THREE.MeshPhysicalMaterial({ color: "#4b4380", roughness: 0.4, clearcoat: 0.6 }),
      new THREE.MeshPhysicalMaterial({ color: "#2e2a52", roughness: 0.4, clearcoat: 0.6 }),
    ],
    [],
  );
  const win = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffd98a", toneMapped: false }), []);
  return (
    <group>
      {items.map((b, i) => {
        const s = pop(t, b.at, 0.5);
        if (s < 0.01) return null;
        return (
          <group key={i} position={[b.x, 0, b.z]} scale={[1, s, 1]}>
            <mesh position={[0, b.h / 2, 0]} material={mats[i % 3]} castShadow receiveShadow>
              <boxGeometry args={[b.w, b.h, b.w]} />
            </mesh>
            {b.c > 0.4 ? (
              <mesh position={[0, b.h * 0.7, b.w / 2 + 0.001]} material={win}>
                <planeGeometry args={[b.w * 0.5, 0.04]} />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
};

const Bar: React.FC<{ h: number; color: string; glow: number; x: number }> = ({ h, color, glow, x }) => (
  <group position={[x, CY + 0.12, 0]}>
    <RoundedBox args={[0.62, Math.max(0.05, h), 0.62]} radius={0.06} smoothness={5} position={[0, Math.max(0.05, h) / 2, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.05} emissive={color} emissiveIntensity={glow} />
    </RoundedBox>
  </group>
);

export const ChartScene: React.FC = () => {
  const t = useT();
  const title = pop(t, 46.8, 0.5);
  const bars = pop(t, 49.6, 0.6);
  const grow = kf(t, [55.9, 57.0], [0, 1]);
  const overshoot = t > 57 ? 1 + Math.exp(-6 * (t - 57)) * Math.sin(10 * (t - 57)) * 0.04 : 1;
  const hFast = UNIT * bars * (1 + 6 * grow) * overshoot;
  const hSlow = UNIT * bars;
  const x7 = pop(t, 56.1, 0.45);
  const win = pop(t, 58.3, 0.5);
  const ang = kf(t, [46.65, 52, 57, 61.85], [-0.5, -0.22, 0.12, 0.3]);
  const d = kf(t, [46.65, 50, 55.5, 61.85], [8.2, 7.2, 7.0, 7.4]);
  const camY = kf(t, [46.65, 55.5, 57.5, 61.85], [2.6, 2.1, 2.4, 2.5]);
  const tgtY = kf(t, [46.65, 55.5, 57.5, 61.85], [1.5, 1.25, 1.35, 1.4]);
  return (
    <>
      <CamRig pos={[Math.sin(ang) * d, camY, Math.cos(ang) * d]} target={[0, tgtY, 0]} fov={36} />
      <Stage bg="#120f22" focus={[0, 1, 0]} focusRange={3} bokeh={3} bloom={1.0} envIntensity={0.9} warm={false}>
        <ambientLight intensity={0.2} />
        <KeyLight position={[3, 6, 4]} intensity={2.3} size={6} target={[0, 0.5, 0]} />
        <spotLight position={[-3, 4, 2]} intensity={20} angle={0.7} penumbra={1} color="#7b5cff" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[10, 64]} />
          <meshPhysicalMaterial color="#1b1734" roughness={0.35} clearcoat={0.9} />
        </mesh>
        <Companies t={t} />
        {/* chart platform */}
        <mesh position={[0, CY / 2, 0]} scale={[1, bars, 1]} castShadow receiveShadow>
          <cylinderGeometry args={[1.25, 1.35, CY, 64]} />
          <meshPhysicalMaterial color="#2a2450" roughness={0.3} clearcoat={1} />
        </mesh>
        <group scale={bars} position={[0, CY - 0.06, 0]}>
          <RoundedBox args={[2.4, 0.12, 1.3]} radius={0.05} position={[0, 0.06, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial color="#efeaff" roughness={0.3} clearcoat={1} />
          </RoundedBox>
        </group>
        <Bar x={-0.55} h={hSlow} color="#8b8fa8" glow={0.05} />
        <Bar x={0.55} h={hFast} color="#22d38a" glow={0.15 + grow * 0.35} />
        {bars > 0.01 ? (
          <>
            <group position={[-0.55, CY + 0.12 + hSlow + 0.22, 0.32]} scale={bars}>
              <Label text="1 сағаттан кейін" size={0.17} color="#e6e6f0" bg="#4a4766" />
            </group>
            <group position={[0.55, CY + 0.12 + hFast + 0.22, 0.32]} scale={bars}>
              <Label text="1 сағат ішінде" size={0.17} color="#ffffff" bg="#139b63" />
            </group>
          </>
        ) : null}
        {x7 > 0.01 ? (
          <group position={[1.55, CY + 0.12 + hFast * 0.55, 0.3]} scale={x7}>
            <Label text="×7" size={0.6} color="#ffe14a" stroke="#3a2a00" glow={1.6} />
          </group>
        ) : null}
        {win > 0.01 ? (
          <group position={[-1.45, CY + 0.12 + hFast * 0.6, 0.2]} scale={win}>
            <Lightning scale={0.6} intensity={3} rotation={[0, t * 0.8, 0.2]} />
          </group>
        ) : null}
        <Sparkles3D t={t} count={26} radius={0.9} position={[0.55, CY + 0.12 + hFast, 0]} color="#9dffcf" opacity={grow} />
        {/* title */}
        <group position={[0, kf(t, [46.65, 49.6], [2.6, 3.0]), -0.6]} scale={title * (1 - prog(t, 55.4, 55.9))}>
          <Label text="Гарвард зерттеуі" size={0.36} color="#ffffff" bg="#7b5cff" />
        </group>
      </Stage>
    </>
  );
};
