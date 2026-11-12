import React, { useMemo } from "react";
import * as THREE from "three";

export type Pose = {
  x: number;
  z: number;
  y?: number;
  rotY: number;
  /** distance travelled, drives the walk cycle */
  walkDist?: number;
  /** 0..1 how much of the walk cycle is applied */
  walk?: number;
  /** 0 standing .. 1 seated */
  sit?: number;
  headYaw?: number;
  headPitch?: number;
  /** 0 neutral .. 1 big smile */
  smile?: number;
  /** 0..1 eyebrows up, eyes wide, mouth "o" */
  surprise?: number;
  /** 0..1 right arm reaches forward (holding something) */
  holdR?: number;
  /** 0..1 both arms slightly raised in joy */
  cheer?: number;
  /** 0..1 right hand scratches head (confused) */
  scratch?: number;
  scale?: number;
  colorTop?: string;
  colorPants?: string;
  /** children are attached in front of the right hand */
  handChild?: React.ReactNode;
  children?: React.ReactNode;
};

const SKIN = "#F2C29E";
const HAIR = "#3A2A22";

const useMats = (top: string, pants: string) =>
  useMemo(
    () => ({
      skin: new THREE.MeshPhysicalMaterial({
        color: SKIN,
        roughness: 0.55,
      }),
      hair: new THREE.MeshStandardMaterial({ color: HAIR, roughness: 0.7 }),
      top: new THREE.MeshPhysicalMaterial({
        color: top,
        roughness: 0.9,
      }),
      pants: new THREE.MeshStandardMaterial({ color: pants, roughness: 0.85 }),
      shoe: new THREE.MeshStandardMaterial({
        color: "#F4F1EA",
        roughness: 0.6,
      }),
      sole: new THREE.MeshStandardMaterial({
        color: "#8A6F5A",
        roughness: 0.8,
      }),
      eye: new THREE.MeshStandardMaterial({ color: "#1E1712", roughness: 0.2 }),
      eyeHi: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
      mouth: new THREE.MeshStandardMaterial({
        color: "#8E3B33",
        roughness: 0.6,
      }),
      cheek: new THREE.MeshStandardMaterial({
        color: "#F29A8C",
        roughness: 0.8,
        transparent: true,
        opacity: 0.55,
      }),
    }),
    [top, pants],
  );

const Limb: React.FC<{
  len: number;
  r: number;
  mat: THREE.Material;
}> = ({ len, r, mat }) => (
  <mesh position={[0, -len / 2, 0]} material={mat} castShadow receiveShadow>
    <capsuleGeometry args={[r, len, 6, 14]} />
  </mesh>
);

/**
 * A stylised but realistically proportioned person, built from primitives.
 * Everything is driven by props (no internal animation) so Remotion renders deterministically.
 */
export const Character: React.FC<Pose> = ({
  x,
  z,
  y = 0,
  rotY,
  walkDist = 0,
  walk = 0,
  sit = 0,
  headYaw = 0,
  headPitch = 0,
  smile = 0,
  surprise = 0,
  holdR = 0,
  cheer = 0,
  scratch = 0,
  scale = 1,
  colorTop = "#E3A93B",
  colorPants = "#34466B",
  handChild,
  children,
}) => {
  const m = useMats(colorTop, colorPants);
  const phase = (walkDist / 0.72) * Math.PI * 2; // stride ~0.72m per cycle
  const s = Math.sin(phase);
  const c = Math.cos(phase);

  // legs
  const thighL = s * 0.5 * walk - sit * 1.5;
  const thighR = -s * 0.5 * walk - sit * 1.5;
  const kneeL = (Math.max(0, -c) * 0.8 + 0.08) * walk + sit * 1.5;
  const kneeR = (Math.max(0, c) * 0.8 + 0.08) * walk + sit * 1.5;
  const bob = Math.abs(c) * 0.035 * walk;
  const hipY = 0.93 - sit * 0.42 + bob - 0.02 * walk;

  // arms
  const armSwing = s * 0.45 * walk;
  const shoulderL = -armSwing - cheer * 0.6;
  const shoulderR =
    armSwing * (1 - holdR) - holdR * 0.95 - cheer * 0.6 - scratch * 2.6;
  const shoulderSideL = 0.08 + cheer * 0.5;
  const shoulderSideR = -0.08 - cheer * 0.5 - scratch * 0.25;
  const elbowL = -0.25 - 0.25 * walk - cheer * 0.9 - sit * 0.6;
  const elbowR =
    -0.25 -
    0.25 * walk * (1 - holdR) -
    holdR * 0.35 -
    cheer * 0.9 -
    scratch * 1.6 -
    sit * 0.6 * (1 - holdR);
  const torsoLean = 0.05 * walk + sit * 0.12;

  const mouthArc = Math.PI * (0.55 + smile * 0.35);

  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]} scale={scale}>
      {/* soft contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.38, 32]} />
        <meshBasicMaterial
          color="#000"
          transparent
          opacity={0.18 * (1 - sit * 0.5)}
          depthWrite={false}
        />
      </mesh>
      <group position={[0, hipY, 0]}>
        {/* pelvis */}
        <mesh
          material={m.pants}
          castShadow
          position={[0, 0.02, 0]}
          scale={[1, 0.8, 0.75]}
        >
          <sphereGeometry args={[0.17, 24, 16]} />
        </mesh>
        {/* legs */}
        {[
          { side: -1, th: thighL, kn: kneeL },
          { side: 1, th: thighR, kn: kneeR },
        ].map(({ side, th, kn }) => (
          <group
            key={side}
            position={[side * 0.095, 0, 0]}
            rotation={[-th, 0, 0]}
          >
            <Limb len={0.38} r={0.075} mat={m.pants} />
            <group position={[0, -0.43, 0]} rotation={[kn, 0, 0]}>
              <Limb len={0.36} r={0.062} mat={m.pants} />
              <group
                position={[0, -0.44, 0.04]}
                rotation={[-kn * 0.4 + th * 0.2, 0, 0]}
              >
                <mesh
                  material={m.shoe}
                  castShadow
                  position={[0, 0.0, 0.03]}
                  scale={[1, 0.62, 1.7]}
                >
                  <sphereGeometry args={[0.065, 20, 12]} />
                </mesh>
                <mesh
                  material={m.sole}
                  position={[0, -0.03, 0.03]}
                  scale={[1.05, 0.2, 1.75]}
                >
                  <sphereGeometry args={[0.065, 20, 8]} />
                </mesh>
              </group>
            </group>
          </group>
        ))}

        {/* torso */}
        <group rotation={[torsoLean, 0, 0]}>
          <mesh
            material={m.top}
            castShadow
            receiveShadow
            position={[0, 0.3, 0]}
            scale={[1, 1, 0.7]}
          >
            <cylinderGeometry args={[0.19, 0.155, 0.46, 28]} />
          </mesh>
          <mesh
            material={m.top}
            castShadow
            position={[0, 0.52, 0]}
            scale={[1, 0.42, 0.7]}
          >
            <sphereGeometry args={[0.19, 28, 16]} />
          </mesh>
          <mesh
            material={m.top}
            castShadow
            position={[0, 0.08, 0]}
            scale={[1, 0.35, 0.7]}
          >
            <sphereGeometry args={[0.156, 24, 12]} />
          </mesh>
          {/* collar */}
          <mesh material={m.top} position={[0, 0.52, 0]} scale={[1, 0.5, 0.9]}>
            <torusGeometry args={[0.07, 0.03, 10, 24]} />
          </mesh>
          {/* neck */}
          <mesh material={m.skin} position={[0, 0.57, 0]}>
            <cylinderGeometry args={[0.048, 0.055, 0.1, 16]} />
          </mesh>

          {/* head */}
          <group position={[0, 0.72, 0]} rotation={[headPitch, headYaw, 0]}>
            <mesh material={m.skin} castShadow scale={[0.95, 1.08, 1]}>
              <sphereGeometry args={[0.135, 32, 24]} />
            </mesh>
            {/* ears */}
            {[-1, 1].map((sd) => (
              <mesh
                key={sd}
                material={m.skin}
                position={[sd * 0.128, -0.005, -0.005]}
                scale={[0.5, 1, 0.75]}
              >
                <sphereGeometry args={[0.032, 12, 10]} />
              </mesh>
            ))}
            {/* hair: cap + fringe */}
            <mesh
              material={m.hair}
              castShadow
              position={[0, 0.03, -0.012]}
              scale={[1.02, 1.0, 1.04]}
            >
              <sphereGeometry
                args={[0.14, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.52]}
              />
            </mesh>
            <mesh
              material={m.hair}
              position={[0.03, 0.095, 0.085]}
              rotation={[0.9, 0, -0.35]}
              scale={[1.5, 0.55, 0.7]}
            >
              <sphereGeometry args={[0.06, 16, 10]} />
            </mesh>
            <mesh
              material={m.hair}
              position={[0, 0.02, -0.06]}
              scale={[1.0, 1.05, 0.95]}
            >
              <sphereGeometry args={[0.135, 24, 16]} />
            </mesh>
            {/* eyes */}
            {[-1, 1].map((sd) => (
              <group key={sd} position={[sd * 0.048, 0.012, 0.118]}>
                <mesh material={m.eye} scale={[1, 1 + surprise * 0.35, 0.6]}>
                  <sphereGeometry args={[0.019, 16, 12]} />
                </mesh>
                <mesh material={m.eyeHi} position={[0.006, 0.007, 0.011]}>
                  <sphereGeometry args={[0.0055, 8, 6]} />
                </mesh>
                {/* brow */}
                <mesh
                  material={m.hair}
                  position={[0, 0.042 + surprise * 0.018, 0.005]}
                  rotation={[
                    0,
                    0,
                    Math.PI / 2 + sd * (-0.12 + surprise * 0.25 - smile * 0.1),
                  ]}
                >
                  <capsuleGeometry args={[0.0075, 0.03, 4, 8]} />
                </mesh>
              </group>
            ))}
            {/* nose */}
            <mesh
              material={m.skin}
              position={[0, -0.018, 0.133]}
              scale={[0.8, 1, 0.9]}
            >
              <sphereGeometry args={[0.018, 12, 10]} />
            </mesh>
            {/* cheeks */}
            {[-1, 1].map((sd) => (
              <mesh
                key={sd}
                material={m.cheek}
                position={[sd * 0.075, -0.035, 0.1]}
                scale={[1, 0.6, 0.3]}
              >
                <sphereGeometry args={[0.022 + smile * 0.006, 12, 8]} />
              </mesh>
            ))}
            {/* mouth */}
            {surprise > 0.5 ? (
              <mesh
                material={m.mouth}
                position={[0, -0.062, 0.122]}
                scale={[1, 1.3, 0.5]}
              >
                <sphereGeometry args={[0.016, 12, 10]} />
              </mesh>
            ) : (
              <mesh
                material={m.mouth}
                position={[0, -0.05 - smile * 0.004, 0.124]}
                rotation={[0.25, 0, Math.PI + (Math.PI - mouthArc) / 2]}
              >
                <torusGeometry
                  args={[
                    0.03 + smile * 0.008,
                    0.0065 + smile * 0.004,
                    8,
                    20,
                    mouthArc,
                  ]}
                />
              </mesh>
            )}
          </group>

          {/* arms */}
          {[
            { side: -1, sh: shoulderL, sd: shoulderSideL, el: elbowL, hold: 0 },
            {
              side: 1,
              sh: shoulderR,
              sd: shoulderSideR,
              el: elbowR,
              hold: holdR,
            },
          ].map(({ side, sh, sd, el, hold }) => (
            <group
              key={side}
              position={[side * 0.2, 0.47, 0]}
              rotation={[sh, 0, side * -sd]}
            >
              <mesh material={m.top} castShadow position={[0, -0.01, 0]}>
                <sphereGeometry args={[0.056, 16, 12]} />
              </mesh>
              <Limb len={0.25} r={0.048} mat={m.top} />
              <group position={[0, -0.29, 0]} rotation={[el, 0, 0]}>
                <Limb len={0.21} r={0.04} mat={m.top} />
                <mesh
                  material={m.skin}
                  castShadow
                  position={[0, -0.27, 0]}
                  scale={[0.85, 1.1, 0.6]}
                >
                  <sphereGeometry args={[0.048, 16, 12]} />
                </mesh>
                {side === 1 && hold > 0.01 && handChild ? (
                  <group
                    position={[0, -0.36, 0.02]}
                    rotation={[-(sh + el), 0, 0]}
                  >
                    {handChild}
                  </group>
                ) : null}
              </group>
            </group>
          ))}
        </group>
      </group>
      {children}
    </group>
  );
};
