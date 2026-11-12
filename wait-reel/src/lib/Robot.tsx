import { RoundedBox } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";

/** Cute helper robot. Origin at the body centre. ~0.75 units tall. */
export const Robot: React.FC<{
  t: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  wave?: number; // 0..1 right arm wave amount
  glow?: number; // 0..1 power-on glow
  happy?: number;
}> = ({ t, position, rotation, scale = 1, wave = 0, glow = 1, happy = 1 }) => {
  const m = useMemo(
    () => ({
      shell: new THREE.MeshPhysicalMaterial({ color: "#f7f8ff", roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 }),
      accent: new THREE.MeshPhysicalMaterial({ color: "#7b5cff", roughness: 0.25, clearcoat: 1, metalness: 0.2 }),
      visor: new THREE.MeshPhysicalMaterial({ color: "#0d0f1e", roughness: 0.05, clearcoat: 1, metalness: 0.3 }),
      joint: new THREE.MeshPhysicalMaterial({ color: "#c8cbe0", metalness: 0.8, roughness: 0.3 }),
    }),
    [],
  );
  const eye = useMemo(() => new THREE.MeshBasicMaterial({ color: "#5ff6ff", toneMapped: false }), []);
  eye.color.setRGB(0.37 * (1 + glow * 2.2), 0.96 * (1 + glow * 2.2), 1.0 * (1 + glow * 2.2));
  const bob = Math.sin(t * 2.2) * 0.03;
  const blink = (t % 3.4) < 0.1 ? 0.15 : 1;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[0, bob, 0]}>
        {/* body */}
        <mesh material={m.shell} castShadow scale={[1, 1.05, 0.9]}>
          <sphereGeometry args={[0.2, 40, 30]} />
        </mesh>
        <mesh material={m.accent} position={[0, 0.02, 0.172]}>
          <circleGeometry args={[0.055, 32]} />
        </mesh>
        <mesh position={[0, 0.02, 0.174]}>
          <ringGeometry args={[0.03, 0.04, 32]} />
          <meshBasicMaterial color="#5ff6ff" toneMapped={false} />
        </mesh>
        {/* head */}
        <group position={[0, 0.33, 0]} rotation={[0, Math.sin(t * 0.9) * 0.15, Math.sin(t * 1.3) * 0.05]}>
          <RoundedBox args={[0.42, 0.3, 0.32]} radius={0.12} smoothness={6} material={m.shell} castShadow />
          <RoundedBox args={[0.34, 0.2, 0.05]} radius={0.06} smoothness={5} position={[0, -0.005, 0.145]} material={m.visor} />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.07, 0.015, 0.172]} scale={[1, blink, 1]} material={eye}>
              <capsuleGeometry args={[0.022, 0.03, 6, 12]} />
            </mesh>
          ))}
          {/* smile */}
          <mesh position={[0, -0.035, 0.172]} rotation={[0, 0, Math.PI + (Math.PI - 2.2) / 2]} material={eye} scale={[1, 0.6 + 0.4 * happy, 1]}>
            <torusGeometry args={[0.04, 0.008, 6, 20, 2.2]} />
          </mesh>
          {/* ears */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.accent}>
              <cylinderGeometry args={[0.05, 0.05, 0.04, 24]} />
            </mesh>
          ))}
          {/* antenna */}
          <mesh position={[0, 0.2, 0]} material={m.joint}>
            <cylinderGeometry args={[0.008, 0.008, 0.1, 8]} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <sphereGeometry args={[0.03, 16, 12]} />
            <meshBasicMaterial color={new THREE.Color("#ffd23f").multiplyScalar(1.5 + glow * 1.5 + Math.sin(t * 6) * 0.5)} toneMapped={false} />
          </mesh>
        </group>
        {/* arms */}
        <group position={[-0.21, 0.05, 0]} rotation={[0, 0, -0.35 - Math.sin(t * 2) * 0.05]}>
          <mesh material={m.shell} position={[0, -0.09, 0]} castShadow>
            <capsuleGeometry args={[0.04, 0.12, 8, 16]} />
          </mesh>
        </group>
        <group position={[0.21, 0.05, 0]} rotation={[0, 0, 0.35 + wave * (2.2 + Math.sin(t * 9) * 0.35)]}>
          <mesh material={m.shell} position={[0, -0.09, 0]} castShadow>
            <capsuleGeometry args={[0.04, 0.12, 8, 16]} />
          </mesh>
        </group>
        {/* hover thruster */}
        <mesh position={[0, -0.22, 0]} material={m.joint}>
          <cylinderGeometry args={[0.07, 0.05, 0.05, 24]} />
        </mesh>
        <mesh position={[0, -0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 24]} />
          <meshBasicMaterial color={new THREE.Color("#5ff6ff").multiplyScalar(1.5 + glow * 2)} toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[0, 0.2, 0.4]} intensity={1.2 * glow} distance={2} color="#7fe9ff" />
    </group>
  );
};
