import React from "react";
import { Character } from "../three/Character";
import { RobotArm } from "../three/Props";
import { BlobShadow } from "../three/Stage";

const glass = (c: string) => <meshPhysicalMaterial color={c} roughness={0.1} transmission={0} transparent opacity={0.55} clearcoat={1} />;

/** Shared lab set: wall, table, flasks, scientist, subject on a stool, robot tickler. */
export const LabSet: React.FC<{
  frame: number;
  a1: number;
  a2: number;
  subjectFace?: Parameters<typeof Character>[0]["face"];
  subjectLean?: number;
  scientistFace?: Parameters<typeof Character>[0]["face"];
}> = ({ frame, a1, a2, subjectFace, subjectLean = 0, scientistFace }) => (
  <group>
    {/* back wall + floor */}
    <mesh position={[0, 3, -3]}>
      <planeGeometry args={[20, 10]} />
      <meshStandardMaterial color="#f6e3cf" roughness={1} />
    </mesh>
    <mesh position={[0, 0, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[20, 12]} />
      <meshStandardMaterial color="#e9c8a8" roughness={1} />
    </mesh>
    {/* shelf with jars */}
    <mesh position={[0, 4.2, -2.85]}>
      <boxGeometry args={[6, 0.12, 0.5]} />
      <meshStandardMaterial color="#c98b5e" />
    </mesh>
    {["#7bdff2", "#ffd166", "#ff8fb1", "#9be564", "#7bdff2"].map((c, i) => (
      <mesh key={i} position={[-2.2 + i * 1.1, 4.55, -2.8]}>
        <cylinderGeometry args={[0.2, 0.2, 0.55, 20]} />
        {glass(c)}
      </mesh>
    ))}
    {/* table with flasks (left) */}
    <mesh position={[-2.6, 1.0, -1.6]}>
      <boxGeometry args={[2.2, 0.15, 1.2]} />
      <meshStandardMaterial color="#d7dde5" roughness={0.4} />
    </mesh>
    {[-0.9, 0.9].map((x) => (
      <mesh key={x} position={[-2.6 + x, 0.5, -1.6]}>
        <cylinderGeometry args={[0.07, 0.07, 1, 10]} />
        <meshStandardMaterial color="#9aa5b1" />
      </mesh>
    ))}
    <group position={[-3.0, 1.35, -1.5]}>
      <mesh>
        <sphereGeometry args={[0.32, 24, 16]} />
        {glass("#9be564")}
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.4, 12]} />
        {glass("#ffffff")}
      </mesh>
    </group>
    <mesh position={[-2.2, 1.38, -1.4]}>
      <cylinderGeometry args={[0.18, 0.3, 0.5, 20]} />
      {glass("#ff8fb1")}
    </mesh>
    {/* scientist */}
    <BlobShadow position={[-1.65, 0.01, 0.3]} size={2.2} />
    <Character
      position={[-1.65, 0, 0.3]}
      rotation={[0, 0.6, 0]}
      scale={0.95}
      coat
      glasses
      hair="#2f2a33"
      hairStyle="bun"
      skin="#e8b48c"
      face={{ smile: 0.6, brow: 0.3, look: [0.8, 0], ...scientistFace }}
      right={{ out: 0.2, fwd: 0.9, elbow: 1.3 }}
      left={{ out: 0.15, fwd: 0.4, elbow: 1.0 }}
    />
    {/* clipboard */}
    <mesh position={[-1.15, 1.75, 0.9]} rotation={[-0.3, 0.6, 0]}>
      <boxGeometry args={[0.5, 0.65, 0.04]} />
      <meshStandardMaterial color="#c98b5e" />
    </mesh>
    {/* subject on a stool (right) */}
    <mesh position={[1.5, 0.45, 0.2]}>
      <cylinderGeometry args={[0.6, 0.5, 0.9, 24]} />
      <meshStandardMaterial color="#7bb7e0" roughness={0.6} />
    </mesh>
    <BlobShadow position={[1.5, 0.01, 0.2]} size={2.4} />
    <Character
      position={[1.5, 0.35, 0.2]}
      rotation={[0, -0.5, 0]}
      lean={subjectLean}
      face={{ smile: 0.3, brow: 0, look: [-0.8, -0.2], ...subjectFace }}
      right={{ out: 0.3, fwd: 0.6, elbow: 0.8 }}
      left={{ out: 0.3, fwd: 0.6, elbow: 0.8 }}
    />
    {/* robot tickler between them */}
    <BlobShadow position={[0.05, 0.01, 1.0]} size={1.6} />
    <RobotArm position={[0.05, 0, 1.0]} a1={a1} a2={a2} frame={frame} base={-0.2} />
  </group>
);
