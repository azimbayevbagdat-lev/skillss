import { RoundedBox } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";
import { Sparkles3D } from "../lib/props";
import { CamRig, KeyLight, Label, Stage } from "../lib/three";
import { kf, pop, prog, useT, wobble } from "../lib/time";

/** Brain-like geometry: an ellipsoid with folded "gyri" and a central fissure */
const useBrainGeometry = () =>
  useMemo(() => {
    const g = new THREE.SphereGeometry(1, 160, 120);
    const p = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const { x, y, z } = v;
      let r = 1;
      // folds
      r += 0.03 * Math.sin(9 * x + 3 * Math.sin(4 * z)) * Math.sin(11 * y + 2 * Math.cos(5 * x)) * Math.cos(8 * z);
      r += 0.015 * Math.sin(17 * z + 4 * y) * Math.sin(13 * x);
      // longitudinal fissure between the hemispheres (top only)
      if (y > -0.2) r -= 0.16 * Math.exp(-Math.pow(x / 0.09, 2)) * Math.min(1, (y + 0.2) * 1.6);
      // flatter bottom, temporal lobe bulge
      let sy = y > 0 ? 0.82 : 0.66;
      if (y < -0.1 && Math.abs(x) > 0.5) sy += 0.08;
      v.set(x * r * 0.92, y * r * sy, z * r * 1.18);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

const Flame: React.FC<{ t: number; size: number }> = ({ t, size }) => {
  const tongues = useMemo(
    () =>
      [
        { c: "#ff4a12", s: [0.42, 1.0, 0.42], o: [0, 0, 0], k: 3.0 },
        { c: "#ff6a1a", s: [0.3, 0.85, 0.3], o: [0.16, -0.05, 0.05], k: 2.6 },
        { c: "#ff6a1a", s: [0.28, 0.8, 0.28], o: [-0.15, -0.06, -0.04], k: 2.6 },
        { c: "#ff9a2e", s: [0.26, 0.75, 0.26], o: [0.02, 0.02, 0.1], k: 3.5 },
        { c: "#ffc24a", s: [0.22, 0.62, 0.22], o: [0, 0.0, 0], k: 5 },
        { c: "#fff4b8", s: [0.13, 0.4, 0.13], o: [0, -0.08, 0], k: 9 },
      ] as const,
    [],
  );
  if (size < 0.01) return null;
  return (
    <group scale={size}>
      {tongues.map((tg, i) => {
        const fl = 1 + 0.12 * Math.sin(t * (7 + i * 1.7) + i * 2.1) + 0.08 * Math.sin(t * 13.3 + i);
        const sway = 0.08 * Math.sin(t * (3.1 + i * 0.4) + i);
        return (
          <mesh
            key={i}
            position={[tg.o[0] + sway * 0.3, tg.o[1] + tg.s[1] * fl * 0.5, tg.o[2]]}
            rotation={[0, 0, sway]}
            scale={[tg.s[0], tg.s[1] * fl, tg.s[2]]}
          >
            <sphereGeometry args={[0.5, 32, 24]} />
            <meshStandardMaterial
              color="#000"
              emissive={tg.c}
              emissiveIntensity={tg.k}
              toneMapped={false}
              transparent
              opacity={0.85}
              depthWrite={false}
            />
          </mesh>
        );
      })}
      {/* embers */}
      {Array.from({ length: 14 }).map((_, i) => {
        const ph = (t * (0.6 + (i % 5) * 0.12) + i * 0.37) % 1;
        const a = i * 2.39996;
        return (
          <mesh key={`e${i}`} position={[Math.cos(a) * 0.18 * (1 + ph), 0.2 + ph * 1.1, Math.sin(a) * 0.18 * (1 + ph)]} scale={0.03 * (1 - ph)}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color="#ffb347" toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

const Smoke: React.FC<{ t: number; amount: number }> = ({ t, amount }) => {
  if (amount < 0.01) return null;
  return (
    <group>
      {Array.from({ length: 7 }).map((_, i) => {
        const ph = (t * 0.35 + i / 7) % 1;
        return (
          <mesh key={i} position={[Math.sin(i * 1.7 + t) * 0.08 * ph, -0.15 + ph * 0.9, Math.cos(i * 2.3) * 0.05]} scale={0.08 + ph * 0.18}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color="#8d8a99" transparent opacity={amount * 0.35 * (1 - ph)} depthWrite={false} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
};

const ShoppingBag: React.FC<{ s: number; t: number }> = ({ s, t }) => {
  if (s < 0.01) return null;
  return (
    <group position={[1.15, 0.85 + wobble(t, 2) * 0.04, 0.2]} rotation={[0.1, -0.5 + Math.sin(t) * 0.15, 0.1]} scale={0.55 * s}>
      <RoundedBox args={[0.7, 0.8, 0.32]} radius={0.04} castShadow>
        <meshPhysicalMaterial color="#7b5cff" roughness={0.45} clearcoat={0.6} emissive="#7b5cff" emissiveIntensity={0.25} />
      </RoundedBox>
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, 0.45, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.1, 0.018, 10, 24, Math.PI]} />
          <meshPhysicalMaterial color="#2d1e7a" roughness={0.4} />
        </mesh>
      ))}
      <Label text="₸" size={0.42} position={[0, -0.02, 0.165]} color="#ffffff" />
    </group>
  );
};

export const BrainScene: React.FC = () => {
  const t = useT();
  const geo = useBrainGeometry();
  const appear = pop(t, 13.95, 0.6);
  // fire: ignites with "лаулап", dies after "Бірақ бұл от"
  const ignite = pop(t, 16.35, 0.5);
  const decay = kf(t, [20.75, 22.0, 23.1, 23.25, 23.6, 23.75, 24.1, 24.25, 24.75], [1, 0.75, 0.58, 0.45, 0.4, 0.27, 0.22, 0.1, 0.05]);
  const fire = Math.max(0, ignite * decay * (0.18 + 0.82 * prog(t, 15.6, 16.6)));
  const minuteLabel = t >= 24.1 ? "3 минут" : t >= 23.6 ? "2 минут" : t >= 23.1 ? "1 минут" : "";
  const bag = prog(t, 17.6, 18.0) * (1 - prog(t, 20.4, 20.8));

  const ang = kf(t, [13.85, 24.8], [-0.55, 0.45]);
  const dist = kf(t, [13.85, 16.5, 22.5, 24.8], [5.6, 4.9, 4.6, 4.8]);
  const camY = kf(t, [13.85, 24.8], [1.25, 0.9]);
  const brainY = 0.55;

  return (
    <>
      <CamRig pos={[Math.sin(ang) * dist, camY, Math.cos(ang) * dist]} target={[0, brainY - 0.35, 0]} fov={34} />
      <Stage bg="#0c0a16" focus={[0, brainY, 0]} focusRange={1.4} bokeh={4} bloom={1.3} bloomThreshold={0.9} envIntensity={0.6} warm={false}>
        <ambientLight intensity={0.12} />
        <KeyLight position={[3, 5, 3]} intensity={1.4} color="#c9d4ff" />
        <spotLight position={[-3, 3, -3]} intensity={18} angle={0.5} penumbra={1} color="#7b5cff" />
        <pointLight position={[0, brainY, 0]} intensity={6 * fire} distance={6} color="#ff8a3a" />
        {/* pedestal */}
        <mesh position={[0, -0.72, 0]} receiveShadow>
          <cylinderGeometry args={[1.5, 1.6, 0.18, 96]} />
          <meshPhysicalMaterial color="#17142a" roughness={0.25} metalness={0.3} clearcoat={1} />
        </mesh>
        <mesh position={[0, -0.625, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.42, 1.47, 96]} />
          <meshBasicMaterial color="#7b5cff" toneMapped={false} />
        </mesh>
        <group position={[0, brainY, 0]} scale={appear} rotation={[0.05, t * 0.12, 0]}>
          <Flame t={t} size={fire * 0.9} />
          <Smoke t={t} amount={prog(t, 23.0, 24.0)} />
          <mesh geometry={geo} castShadow>
            <meshPhysicalMaterial
              color="#ffd6ea"
              roughness={0.12}
              metalness={0}
              transmission={1}
              thickness={0.35}
              ior={1.18}
              attenuationColor="#ffb3d4"
              attenuationDistance={3}
              clearcoat={1}
              clearcoatRoughness={0.05}
              emissive="#ff7fb0"
              emissiveIntensity={0.06}
              specularIntensity={1}
              envMapIntensity={1.4}
            />
          </mesh>
          {/* brain stem */}
          <mesh position={[0, -0.62, -0.25]} rotation={[0.35, 0, 0]}>
            <capsuleGeometry args={[0.14, 0.35, 8, 24]} />
            <meshPhysicalMaterial color="#ffe3ef" roughness={0.1} transmission={1} thickness={0.4} ior={1.38} />
          </mesh>
        </group>
        <Sparkles3D t={t} count={30} radius={1.8} position={[0, brainY, 0]} color="#ffcf7a" size={0.025} opacity={fire} />
        <ShoppingBag s={bag} t={t} />
        {minuteLabel ? (
          <group position={[0, brainY + 1.25, 0.3]} rotation={[0, ang, 0]} scale={pop(t, t >= 24.1 ? 24.1 : t >= 23.6 ? 23.6 : 23.1, 0.3)}>
            <Label text={minuteLabel} size={0.26} bg="#e2557a" color="#fff" />
          </group>
        ) : null}
      </Stage>
    </>
  );
};
