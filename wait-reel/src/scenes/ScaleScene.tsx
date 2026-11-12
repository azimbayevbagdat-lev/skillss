import { RoundedBox } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";
import { Lightning, Sparkles3D } from "../lib/props";
import { CamRig, KeyLight, Label, Stage, drawCheck } from "../lib/three";
import { kf, pop, prog, useT } from "../lib/time";

const BEAM = 1.05; // half length

const Pan: React.FC<{ children?: React.ReactNode; gold: THREE.Material }> = ({ children, gold }) => (
  <group>
    {/* strings */}
    {[0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.17, -0.35, Math.sin(a) * 0.17]} rotation={[Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25]}>
          <cylinderGeometry args={[0.006, 0.006, 0.72, 6]} />
          <meshStandardMaterial color="#d8c08a" metalness={0.8} roughness={0.3} />
        </mesh>
      );
    })}
    <mesh position={[0, -0.72, 0]} material={gold} castShadow receiveShadow>
      <cylinderGeometry args={[0.4, 0.3, 0.06, 48]} />
    </mesh>
    <group position={[0, -0.69, 0]}>{children}</group>
  </group>
);

const PriceTag: React.FC = () => (
  <group rotation={[0, 0.3, -0.12]}>
    <RoundedBox args={[0.5, 0.3, 0.05]} radius={0.04} position={[0, 0.2, 0]} castShadow>
      <meshPhysicalMaterial color="#ff5d6c" roughness={0.35} clearcoat={1} />
    </RoundedBox>
    <mesh position={[-0.19, 0.2, 0.03]}>
      <circleGeometry args={[0.03, 20]} />
      <meshStandardMaterial color="#2a1a2a" />
    </mesh>
    <Label text="12 000 ₸" size={0.13} position={[0.03, 0.2, 0.027]} color="#fff" />
  </group>
);

export const ScaleScene: React.FC = () => {
  const t = useT();
  const gold = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#e8c46a", metalness: 1, roughness: 0.22, clearcoat: 0.5 }),
    [],
  );
  const appear = pop(t, 42.25, 0.55);
  const priceIn = pop(t, 43.9, 0.45);
  const boltIn = t < 45.0 ? 0 : 1;
  const boltDrop = kf(t, [45.0, 45.2], [1.6, 0], (x) => x * x);
  // beam: price slightly heavier first, then the bolt slams it down
  let tilt = kf(t, [43.9, 44.5], [0, 0.07]);
  if (t >= 45.2) {
    const x = t - 45.2;
    tilt = 0.07 + (-0.42 - 0.07) * (1 - Math.exp(-7 * x) * Math.cos(9 * x));
  }
  const ang = kf(t, [42.15, 46.65], [0.15, -0.1]);
  const d = kf(t, [42.15, 46.65], [6.2, 5.6]);
  const glow = prog(t, 45.2, 45.6);
  return (
    <>
      <CamRig pos={[Math.sin(ang) * d, 1.9, Math.cos(ang) * d]} target={[0, 0.95, 0]} fov={36} />
      <Stage bg="#16122a" focus={[0, 1.2, 0]} focusRange={2.5} bokeh={3} bloom={1.0} envIntensity={1.0}>
        <ambientLight intensity={0.2} />
        <KeyLight position={[2, 5, 3]} intensity={2.4} target={[0, 1, 0]} />
        <spotLight position={[2.5, 3, -2]} intensity={25} angle={0.6} penumbra={1} color="#ffcf5a" />
        <spotLight position={[-3, 3, -1]} intensity={16} angle={0.6} penumbra={1} color="#7b5cff" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[7, 64]} />
          <meshPhysicalMaterial color="#201a3a" roughness={0.3} clearcoat={0.9} />
        </mesh>
        <group scale={appear * 0.72}>
          {/* base & pillar */}
          <mesh position={[0, 0.06, 0]} material={gold} castShadow receiveShadow>
            <cylinderGeometry args={[0.45, 0.55, 0.12, 64]} />
          </mesh>
          <mesh position={[0, 0.95, 0]} material={gold} castShadow>
            <cylinderGeometry args={[0.04, 0.06, 1.75, 24]} />
          </mesh>
          <mesh position={[0, 1.86, 0]} material={gold} castShadow>
            <sphereGeometry args={[0.09, 32, 20]} />
          </mesh>
          {/* beam */}
          <group position={[0, 1.8, 0]} rotation={[0, 0, tilt]}>
            <mesh material={gold} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, BEAM * 2, 16]} />
            </mesh>
            {/* left: price */}
            <group position={[-BEAM, 0, 0]} rotation={[0, 0, -tilt]}>
              <Pan gold={gold}>
                <group scale={priceIn}>
                  <PriceTag />
                </group>
              </Pan>
            </group>
            {/* right: speed */}
            <group position={[BEAM, 0, 0]} rotation={[0, 0, -tilt]}>
              <Pan gold={gold}>
                {boltIn ? (
                  <group position={[0, 0.3 + boltDrop, 0]} rotation={[0, t * 0.6, 0.15]}>
                    <Lightning scale={0.55} intensity={2 + glow * 3} />
                    <pointLight intensity={3 + glow * 4} distance={2.5} color="#ffc21a" />
                  </group>
                ) : null}
              </Pan>
            </group>
          </group>
          <Sparkles3D t={t} count={22} radius={0.6} position={[BEAM, 1.0 - tilt * 1.2, 0]} color="#ffe27a" opacity={glow} />
        </group>
        {/* labels under the pans */}
        <group position={[-0.62, 1.95, 0.3]} scale={priceIn * 0.75}>
          <Label text="БАҒА" size={0.2} color="#ffd6dc" />
        </group>
        <group position={[0.62, 1.95, 0.3]} scale={pop(t, 45.25, 0.4) * 0.75}>
          <Label text="ЖЫЛДАМДЫҚ" size={0.2} color="#ffe27a" glow={1.4} />
        </group>
      </Stage>
    </>
  );
};

// keep tree-shaking honest
void drawCheck;
