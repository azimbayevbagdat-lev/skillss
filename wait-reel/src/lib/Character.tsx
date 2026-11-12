import { RoundedBox } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";

export type Expr = {
  /** -1 angry/impatient, 0 neutral, +1 worried */
  brow?: number;
  /** -1 frown, 0 flat, 1 big smile */
  smile?: number;
  /** 0 open eyes, 1 closed */
  eyesClosed?: number;
  /** 0..1 open mouth "o" */
  mouthOpen?: number;
  /** pupils offset (look direction) */
  look?: [number, number];
};

type Arm = { x: number; z: number; y?: number; elbow: number; wrist?: number };

export type Pose = {
  headYaw?: number;
  headPitch?: number;
  headRoll?: number;
  torsoPitch?: number;
  torsoRoll?: number;
  armL?: Arm;
  armR?: Arm;
  /** thigh pitch (negative = forward, sitting = -1.45) */
  thighL?: number;
  thighR?: number;
  kneeL?: number;
  kneeR?: number;
  legSpread?: number;
};

const SKIN = "#d9996f";

export const useCharacterMaterials = (shirt = "#ff6f4f") =>
  useMemo(
    () => ({
      skin: new THREE.MeshPhysicalMaterial({
        color: SKIN,
        roughness: 0.55,
        sheen: 0.4,
        sheenColor: new THREE.Color("#ffb59a"),
        sheenRoughness: 0.6,
      }),
      hair: new THREE.MeshPhysicalMaterial({
        color: "#2b1a12",
        roughness: 0.45,
        sheen: 1,
        sheenColor: new THREE.Color("#7a4a30"),
        clearcoat: 0.3,
        clearcoatRoughness: 0.5,
      }),
      shirt: new THREE.MeshPhysicalMaterial({
        color: shirt,
        roughness: 0.85,
        sheen: 1,
        sheenColor: new THREE.Color("#ffd0c0"),
        sheenRoughness: 0.8,
      }),
      pants: new THREE.MeshPhysicalMaterial({
        color: "#2d3a5c",
        roughness: 0.8,
        sheen: 0.6,
        sheenColor: new THREE.Color("#7f90c0"),
      }),
      shoe: new THREE.MeshPhysicalMaterial({ color: "#f4f4f6", roughness: 0.5, clearcoat: 0.4 }),
      sole: new THREE.MeshStandardMaterial({ color: "#d94f3a", roughness: 0.7 }),
      eyeWhite: new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.15, clearcoat: 1 }),
      pupil: new THREE.MeshPhysicalMaterial({ color: "#1b120c", roughness: 0.1, clearcoat: 1 }),
      iris: new THREE.MeshPhysicalMaterial({ color: "#5a3a22", roughness: 0.2, clearcoat: 1 }),
      glint: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
      mouth: new THREE.MeshStandardMaterial({ color: "#8a2f2a", roughness: 0.6 }),
      blush: new THREE.MeshBasicMaterial({
        color: "#ff7f7f",
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
      brow: new THREE.MeshStandardMaterial({ color: "#24150e", roughness: 0.8 }),
    }),
    [shirt],
  );

const Limb: React.FC<{
  r: number;
  len: number;
  mat: THREE.Material;
}> = ({ r, len, mat }) => (
  <mesh position={[0, -len / 2, 0]} castShadow receiveShadow material={mat}>
    <capsuleGeometry args={[r, len, 8, 20]} />
  </mesh>
);

const ArmRig: React.FC<{
  side: 1 | -1;
  a: Arm;
  m: ReturnType<typeof useCharacterMaterials>;
  hand?: React.ReactNode;
}> = ({ side, a, m, hand }) => (
  <group position={[side * 0.215, 0.5, 0]} rotation={[a.x, a.y ?? 0, side * a.z]}>
    {/* shoulder ball */}
    <mesh material={m.shirt} castShadow>
      <sphereGeometry args={[0.068, 24, 16]} />
    </mesh>
    <Limb r={0.058} len={0.24} mat={m.shirt} />
    <group position={[0, -0.27, 0]} rotation={[a.elbow, 0, 0]}>
      <Limb r={0.048} len={0.18} mat={m.shirt} />
      {/* cuff + forearm skin */}
      <mesh position={[0, -0.205, 0]} material={m.skin} castShadow>
        <cylinderGeometry args={[0.038, 0.04, 0.05, 20]} />
      </mesh>
      <group position={[0, -0.25, 0]} rotation={[a.wrist ?? 0, 0, 0]}>
        <mesh material={m.skin} castShadow scale={[0.85, 1.1, 0.55]}>
          <sphereGeometry args={[0.042, 24, 16]} />
        </mesh>
        {/* thumb */}
        <mesh
          material={m.skin}
          position={[side * -0.03, -0.012, 0.018]}
          rotation={[0.4, 0, side * 0.6]}
          castShadow
        >
          <capsuleGeometry args={[0.011, 0.026, 6, 12]} />
        </mesh>
        {hand}
      </group>
    </group>
  </group>
);

const LegRig: React.FC<{
  side: 1 | -1;
  thigh: number;
  knee: number;
  spread: number;
  m: ReturnType<typeof useCharacterMaterials>;
}> = ({ side, thigh, knee, spread, m }) => (
  <group position={[side * 0.1, 0, 0]} rotation={[thigh, 0, side * spread]}>
    <Limb r={0.085} len={0.34} mat={m.pants} />
    <group position={[0, -0.4, 0]} rotation={[knee, 0, 0]}>
      <Limb r={0.068} len={0.34} mat={m.pants} />
      <group position={[0, -0.43, 0.03]}>
        <RoundedBox args={[0.11, 0.08, 0.24]} radius={0.035} position={[0, 0, 0.04]} castShadow material={m.shoe} />
        <RoundedBox args={[0.115, 0.025, 0.245]} radius={0.01} position={[0, -0.04, 0.04]} castShadow material={m.sole} />
      </group>
    </group>
  </group>
);

const Brow: React.FC<{ side: 1 | -1; brow: number; m: ReturnType<typeof useCharacterMaterials> }> = ({
  side,
  brow,
  m,
}) => (
  <mesh
    material={m.brow}
    position={[side * 0.046, 0.072 + Math.max(0, brow) * 0.008 - Math.max(0, -brow) * 0.006, 0.118]}
    rotation={[0, side * 0.25, Math.PI / 2 + side * (brow * 0.38)]}
  >
    <capsuleGeometry args={[0.0065, 0.03, 4, 10]} />
  </mesh>
);

const Eye: React.FC<{
  side: 1 | -1;
  closed: number;
  look: [number, number];
  m: ReturnType<typeof useCharacterMaterials>;
}> = ({ side, closed, look, m }) => {
  const open = 1 - closed;
  return (
    <group position={[side * 0.046, 0.022, 0.108]}>
      {open > 0.05 ? (
        <group scale={[1, Math.max(0.08, open), 1]}>
          <mesh material={m.eyeWhite} scale={[1, 1.15, 0.6]}>
            <sphereGeometry args={[0.026, 24, 16]} />
          </mesh>
          <group position={[look[0] * 0.008, look[1] * 0.008, 0.012]}>
            <mesh material={m.iris} scale={[1, 1.12, 0.5]}>
              <sphereGeometry args={[0.018, 20, 14]} />
            </mesh>
            <mesh material={m.pupil} position={[0, 0, 0.004]} scale={[1, 1.12, 0.5]}>
              <sphereGeometry args={[0.011, 16, 12]} />
            </mesh>
            <mesh material={m.glint} position={[0.006, 0.007, 0.01]}>
              <sphereGeometry args={[0.0045, 10, 8]} />
            </mesh>
          </group>
        </group>
      ) : null}
      {closed > 0.5 ? (
        // closed eye: a soft arc (sleeping / happy squint)
        <mesh material={m.brow} rotation={[0, 0, Math.PI]} position={[0, 0.004, 0.012]}>
          <torusGeometry args={[0.018, 0.0045, 6, 16, Math.PI]} />
        </mesh>
      ) : null}
    </group>
  );
};

const Mouth: React.FC<{ smile: number; open: number; m: ReturnType<typeof useCharacterMaterials> }> = ({
  smile,
  open,
  m,
}) => {
  if (open > 0.05) {
    return (
      <mesh material={m.mouth} position={[0, -0.058, 0.118]} scale={[0.8 + smile * 0.3, 0.5 + open * 0.8, 0.4]}>
        <sphereGeometry args={[0.022, 20, 14]} />
      </mesh>
    );
  }
  const curve = Math.abs(smile);
  if (curve < 0.12) {
    return (
      <mesh material={m.mouth} position={[0, -0.06, 0.121]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.005, 0.03, 4, 8]} />
      </mesh>
    );
  }
  const arc = 0.9 + curve * 1.6;
  return (
    <mesh
      material={m.mouth}
      position={[0, smile > 0 ? -0.045 : -0.075, 0.118]}
      rotation={[0.15, 0, smile > 0 ? Math.PI + (Math.PI - arc) / 2 : (Math.PI - arc) / 2]}
    >
      <torusGeometry args={[0.024, 0.0055, 8, 20, arc]} />
    </mesh>
  );
};

/**
 * Stylised human: realistic-ish proportions, cute face. Origin = pelvis.
 */
export const Character: React.FC<{
  pose?: Pose;
  expr?: Expr;
  shirt?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  rightHand?: React.ReactNode;
  leftHand?: React.ReactNode;
  chestChild?: React.ReactNode;
}> = ({ pose = {}, expr = {}, shirt, position, rotation, scale = 1, rightHand, leftHand, chestChild }) => {
  const m = useCharacterMaterials(shirt);
  const {
    headYaw = 0,
    headPitch = 0,
    headRoll = 0,
    torsoPitch = 0,
    torsoRoll = 0,
    armL = { x: 0, z: 0.12, elbow: -0.2 },
    armR = { x: 0, z: 0.12, elbow: -0.2 },
    thighL = 0,
    thighR = 0,
    kneeL = 0,
    kneeR = 0,
    legSpread = 0.04,
  } = pose;
  const { brow = 0, smile = 0.3, eyesClosed = 0, mouthOpen = 0, look = [0, 0] } = expr;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* legs */}
      <LegRig side={1} thigh={thighL} knee={kneeL} spread={legSpread} m={m} />
      <LegRig side={-1} thigh={thighR} knee={kneeR} spread={legSpread} m={m} />
      {/* pelvis */}
      <mesh material={m.pants} position={[0, 0.02, 0]} scale={[1.25, 0.7, 0.85]} castShadow>
        <sphereGeometry args={[0.15, 28, 20]} />
      </mesh>
      <group rotation={[torsoPitch, 0, torsoRoll]}>
        {/* torso (hoodie) */}
        <mesh material={m.shirt} position={[0, 0.3, 0]} scale={[1.2, 1, 0.78]} castShadow receiveShadow>
          <capsuleGeometry args={[0.165, 0.3, 10, 28]} />
        </mesh>
        {/* hood around the neck */}
        <mesh material={m.shirt} position={[0, 0.55, -0.025]} rotation={[Math.PI / 2 + 0.25, 0, 0]} castShadow>
          <torusGeometry args={[0.085, 0.035, 12, 28]} />
        </mesh>
        {chestChild}
        <ArmRig side={1} a={armL} m={m} hand={leftHand} />
        <ArmRig side={-1} a={armR} m={m} hand={rightHand} />
        {/* neck */}
        <mesh material={m.skin} position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.062, 0.1, 20]} />
        </mesh>
        {/* head */}
        <group position={[0, 0.66, 0]} rotation={[headPitch, headYaw, headRoll]}>
          <group position={[0, 0.11, 0]}>
            <mesh material={m.skin} scale={[1, 1.1, 1.02]} castShadow receiveShadow>
              <sphereGeometry args={[0.125, 40, 30]} />
            </mesh>
            {/* jaw/cheeks */}
            <mesh material={m.skin} position={[0, -0.045, 0.02]} scale={[1, 0.8, 0.95]} castShadow>
              <sphereGeometry args={[0.105, 32, 24]} />
            </mesh>
            {/* ears */}
            {[-1, 1].map((s) => (
              <mesh key={s} material={m.skin} position={[s * 0.123, 0.0, -0.005]} scale={[0.5, 1, 0.8]} castShadow>
                <sphereGeometry args={[0.03, 16, 12]} />
              </mesh>
            ))}
            {/* hair: cap + swoosh fringe */}
            <mesh material={m.hair} position={[0, 0.02, -0.008]} scale={[1.07, 1.1, 1.08]} castShadow>
              <sphereGeometry args={[0.126, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
            </mesh>
            <mesh material={m.hair} position={[0, 0.0, -0.02]} scale={[1.06, 1.06, 1.06]} castShadow>
              <sphereGeometry args={[0.126, 40, 24, Math.PI * 0.62, Math.PI * 0.76, 0, Math.PI * 0.75]} />
            </mesh>
            <mesh material={m.hair} position={[0.035, 0.1, 0.07]} rotation={[0.9, 0.2, -0.45]} scale={[1.25, 0.42, 0.62]} castShadow>
              <sphereGeometry args={[0.055, 24, 16]} />
            </mesh>
            <mesh material={m.hair} position={[-0.045, 0.095, 0.065]} rotation={[0.8, -0.3, 0.4]} scale={[1.05, 0.4, 0.55]} castShadow>
              <sphereGeometry args={[0.05, 24, 16]} />
            </mesh>
            {/* face */}
            <Eye side={1} closed={eyesClosed} look={look} m={m} />
            <Eye side={-1} closed={eyesClosed} look={look} m={m} />
            <Brow side={1} brow={brow} m={m} />
            <Brow side={-1} brow={brow} m={m} />
            <mesh material={m.skin} position={[0, -0.018, 0.128]} scale={[0.8, 0.9, 0.8]}>
              <sphereGeometry args={[0.016, 16, 12]} />
            </mesh>
            <Mouth smile={smile} open={mouthOpen} m={m} />
            {[-1, 1].map((s) => (
              <mesh key={s} material={m.blush} position={[s * 0.072, -0.03, 0.1]} rotation={[0, s * 0.6, 0]}>
                <circleGeometry args={[0.018, 20]} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
};

/* Common poses */
export const SIT: Pose = {
  thighL: -1.5,
  thighR: -1.5,
  kneeL: 1.45,
  kneeR: 1.45,
  legSpread: 0.06,
};

// solved with forward kinematics so both hands meet at the phone (0, 0.36, 0.33)
export const HOLD_PHONE = {
  armL: { x: -0.55, y: -0.5, z: -0.2, elbow: -1.6, wrist: 0.3 },
  armR: { x: -0.55, y: 0.5, z: -0.2, elbow: -1.6, wrist: 0.3 },
};
