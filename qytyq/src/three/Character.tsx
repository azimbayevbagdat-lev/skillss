import React from "react";

type V3 = [number, number, number];

export type ArmPose = {
  /** raise sideways (rad) */ out: number;
  /** swing forward (rad) */ fwd: number;
  /** elbow bend (rad) */ elbow: number;
  /** twist of the whole arm around its own axis */ twist?: number;
};

export type Face = {
  smile: number; // -1 frown .. 1 big smile
  mouthOpen: number; // 0..1
  eyesClosed: number; // 0..1 (laugh squint "^ ^")
  brow: number; // -1 worried .. 1 raised
  look?: [number, number]; // pupil offset
};

export type CharacterProps = {
  position?: V3;
  rotation?: V3;
  scale?: number;
  skin?: string;
  shirt?: string;
  pants?: string;
  hair?: string;
  hairStyle?: "short" | "bun" | "curly";
  coat?: boolean;
  glasses?: boolean;
  face?: Partial<Face>;
  left?: Partial<ArmPose>;
  right?: Partial<ArmPose>;
  /** torso lean (z roll) and twist (y) for squirming */
  lean?: number;
  twist?: number;
  /** extra lift of both shoulders */
  shrug?: number;
  /** extra head tilt */
  headTilt?: number;
  headNod?: number;
  blush?: number;
};

const clay = (color: string, rough = 0.62) => (
  <meshPhysicalMaterial color={color} roughness={rough} metalness={0} sheen={0.6} sheenColor="#ffffff" clearcoat={0.08} />
);

const Arm: React.FC<{ side: 1 | -1; pose: ArmPose; sleeve: string; skin: string; shrug: number }> = ({
  side,
  pose,
  sleeve,
  skin,
  shrug,
}) => (
  <group position={[0.5 * side, 1.82 + shrug, 0]} rotation={[-pose.fwd, pose.twist ?? 0, pose.out * side]}>
    <mesh position={[0, -0.26, 0]}>
      <capsuleGeometry args={[0.15, 0.32, 8, 20]} />
      {clay(sleeve)}
    </mesh>
    <group position={[0, -0.56, 0]} rotation={[-pose.elbow, 0, 0]}>
      <mesh position={[0, -0.22, 0]}>
        <capsuleGeometry args={[0.13, 0.28, 8, 20]} />
        {clay(sleeve)}
      </mesh>
      <mesh position={[0, -0.5, 0]} scale={[1, 1.05, 0.85]}>
        <sphereGeometry args={[0.16, 24, 18]} />
        {clay(skin)}
      </mesh>
      <mesh position={[0.1 * -side, -0.46, 0.06]} rotation={[0, 0, 0.6 * side]}>
        <capsuleGeometry args={[0.05, 0.1, 6, 10]} />
        {clay(skin)}
      </mesh>
    </group>
  </group>
);

const Eye: React.FC<{ x: number; closed: number; look: [number, number] }> = ({ x, closed, look }) => {
  if (closed > 0.5) {
    // happy squint: an upward arc "^"
    return (
      <mesh position={[x, 0.1, 0.56]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.1, 0.028, 8, 20, Math.PI]} />
        <meshStandardMaterial color="#3b2418" roughness={0.5} />
      </mesh>
    );
  }
  const sy = 1 - closed * 1.4;
  return (
    <group position={[x, 0.08, 0.5]} scale={[1, Math.max(0.15, sy), 1]}>
      <mesh>
        <sphereGeometry args={[0.135, 24, 18]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[look[0] * 0.05, look[1] * 0.05, 0.1]}>
        <sphereGeometry args={[0.078, 20, 14]} />
        <meshStandardMaterial color="#2a1a12" roughness={0.25} />
      </mesh>
      <mesh position={[look[0] * 0.05 + 0.03, look[1] * 0.05 + 0.035, 0.165]}>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

const Mouth: React.FC<{ smile: number; open: number }> = ({ smile, open }) => {
  if (open > 0.08) {
    return (
      <group position={[0, -0.22, 0.55]}>
        <mesh scale={[0.2 + open * 0.03, 0.07 + open * 0.12, 0.06]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color="#7a2430" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.04 - open * 0.04, 0.03]} scale={[0.11, 0.05 + open * 0.03, 0.04]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#f07a86" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.05 + open * 0.06, 0.03]} scale={[0.15, 0.03, 0.03]}>
          <sphereGeometry args={[1, 16, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      </group>
    );
  }
  if (Math.abs(smile) < 0.15) {
    return (
      <mesh position={[0, -0.22, 0.57]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.022, 0.16, 6, 10]} />
        <meshStandardMaterial color="#6b2a2a" roughness={0.5} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, -0.16, 0.56]} rotation={[0.25, 0, smile > 0 ? Math.PI : 0]} scale={[1, Math.abs(smile) * 0.9 + 0.2, 1]}>
      <torusGeometry args={[0.13, 0.026, 8, 24, Math.PI]} />
      <meshStandardMaterial color="#6b2a2a" roughness={0.5} />
    </mesh>
  );
};

const Hair: React.FC<{ color: string; style: "short" | "bun" | "curly" }> = ({ color, style }) => (
  <group>
    <mesh position={[0, 0.06, -0.02]} rotation={[-0.35, 0, 0]}>
      <sphereGeometry args={[0.64, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
      {clay(color, 0.75)}
    </mesh>
    {/* fringe tufts */}
    {[-0.3, -0.1, 0.12, 0.32].map((x, i) => (
      <mesh key={i} position={[x, 0.46 - Math.abs(x) * 0.25, 0.36]} rotation={[0.6, 0, -x]} scale={[1, 0.8, 0.8]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        {clay(color, 0.75)}
      </mesh>
    ))}
    {style === "bun" && (
      <mesh position={[0, 0.62, -0.25]}>
        <sphereGeometry args={[0.26, 24, 16]} />
        {clay(color, 0.75)}
      </mesh>
    )}
    {style === "curly" &&
      [-0.45, -0.2, 0.05, 0.3, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.5 - Math.abs(x) * 0.3, -0.1]}>
          <sphereGeometry args={[0.2, 14, 10]} />
          {clay(color, 0.8)}
        </mesh>
      ))}
  </group>
);

export const Character: React.FC<CharacterProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  skin = "#f1bf98",
  shirt = "#3fa9a0",
  pants = "#3c4a7a",
  hair = "#5a3524",
  hairStyle = "short",
  coat = false,
  glasses = false,
  face = {},
  left = {},
  right = {},
  lean = 0,
  twist = 0,
  shrug = 0,
  headTilt = 0,
  headNod = 0,
  blush = 0.5,
}) => {
  const f: Face = { smile: 0.6, mouthOpen: 0, eyesClosed: 0, brow: 0, look: [0, 0], ...face };
  const lp: ArmPose = { out: 0.15, fwd: 0.05, elbow: 0.2, ...left };
  const rp: ArmPose = { out: 0.15, fwd: 0.05, elbow: 0.2, ...right };
  const top = coat ? "#fbfbf8" : shirt;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* legs */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0.2 * s, 0.42, 0]}>
            <capsuleGeometry args={[0.17, 0.42, 8, 16]} />
            {clay(pants)}
          </mesh>
          <mesh position={[0.2 * s, 0.1, 0.08]} scale={[1, 0.6, 1.4]}>
            <sphereGeometry args={[0.19, 20, 14]} />
            {clay("#5b3a2e")}
          </mesh>
        </group>
      ))}
      <group position={[0, 0.75, 0]} rotation={[0, twist, lean]}>
        <group position={[0, -0.75, 0]}>
          {/* torso */}
          <mesh position={[0, 1.32, 0]} scale={[1, 1, 0.82]}>
            <capsuleGeometry args={[0.5, 0.5, 10, 28]} />
            {clay(top)}
          </mesh>
          {coat && (
            <>
              <mesh position={[0, 1.3, 0.4]} rotation={[0.05, 0, 0]}>
                <boxGeometry args={[0.06, 0.95, 0.04]} />
                {clay("#d9dde3")}
              </mesh>
              <mesh position={[0.25, 1.5, 0.39]}>
                <boxGeometry args={[0.2, 0.16, 0.03]} />
                {clay("#7fb3e8")}
              </mesh>
              <mesh position={[0, 1.83, 0.28]} scale={[1, 0.6, 1]}>
                <sphereGeometry args={[0.2, 16, 12]} />
                {clay("#7fb3e8")}
              </mesh>
            </>
          )}
          <Arm side={-1} pose={lp} sleeve={top} skin={skin} shrug={shrug} />
          <Arm side={1} pose={rp} sleeve={top} skin={skin} shrug={shrug} />
          {/* head */}
          <group position={[0, 2.5, 0]} rotation={[headNod, 0, headTilt]}>
            <mesh>
              <sphereGeometry args={[0.62, 48, 36]} />
              {clay(skin)}
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[0.6 * s, 0, 0]} scale={[0.6, 1, 0.8]}>
                <sphereGeometry args={[0.13, 16, 12]} />
                {clay(skin)}
              </mesh>
            ))}
            <Hair color={hair} style={hairStyle} />
            <Eye x={-0.22} closed={f.eyesClosed} look={f.look!} />
            <Eye x={0.22} closed={f.eyesClosed} look={f.look!} />
            {[-1, 1].map((s) => (
              <mesh
                key={s}
                position={[0.22 * s, 0.3 + f.brow * 0.05, 0.53]}
                rotation={[0, 0, (Math.PI / 2) * 1 + s * (0.12 - f.brow * 0.25)]}
              >
                <capsuleGeometry args={[0.025, 0.14, 6, 8]} />
                <meshStandardMaterial color="#3b2418" roughness={0.6} />
              </mesh>
            ))}
            <mesh position={[0, -0.04, 0.62]}>
              <sphereGeometry args={[0.07, 16, 12]} />
              {clay("#eaa883")}
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[0.38 * s, -0.12, 0.44]} scale={[1, 0.6, 0.4]}>
                <sphereGeometry args={[0.11, 16, 12]} />
                <meshStandardMaterial color="#ff8f8f" transparent opacity={0.35 + blush * 0.4} roughness={0.8} />
              </mesh>
            ))}
            <Mouth smile={f.smile} open={f.mouthOpen} />
            {glasses && (
              <group position={[0, 0.08, 0.6]}>
                {[-1, 1].map((s) => (
                  <mesh key={s} position={[0.22 * s, 0, 0]}>
                    <torusGeometry args={[0.16, 0.025, 10, 28]} />
                    <meshStandardMaterial color="#2b2b38" roughness={0.4} />
                  </mesh>
                ))}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <capsuleGeometry args={[0.02, 0.08, 4, 8]} />
                  <meshStandardMaterial color="#2b2b38" />
                </mesh>
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};
