import React, { useMemo } from "react";
import * as THREE from "three";
import { Easing, interpolate } from "remotion";
import { pop, prog, walkAlong } from "../lib/anim";
import { T } from "../timeline";
import { Character } from "./Character";
import { RBox, Sparkles, ThoughtBubble } from "./Props";
import { Sun } from "./House";
import { gradientBg, woodFloor } from "./textures";

const LANE_LEN = 3.3;

const Mark: React.FC<{
  ok: boolean;
  position: [number, number, number];
  s: number;
}> = ({ ok, position, s }) => {
  if (s <= 0.001) return null;
  const col = ok ? "#3BB273" : "#E5484D";
  const mat = (
    <meshPhysicalMaterial
      color={col}
      emissive={col}
      emissiveIntensity={0.8}
      roughness={0.3}
      clearcoat={1}
      toneMapped={false}
    />
  );
  return (
    <group position={position} scale={s}>
      <mesh>
        <circleGeometry args={[0.32, 48]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.95}
          toneMapped={false}
        />
      </mesh>
      {ok ? (
        <>
          <mesh position={[-0.07, -0.03, 0.03]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.07, 0.22, 0.05]} />
            {mat}
          </mesh>
          <mesh position={[0.06, 0.03, 0.03]} rotation={[0, 0, -Math.PI / 5]}>
            <boxGeometry args={[0.07, 0.36, 0.05]} />
            {mat}
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0, 0.03]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.07, 0.38, 0.05]} />
            {mat}
          </mesh>
          <mesh position={[0, 0, 0.03]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.07, 0.38, 0.05]} />
            {mat}
          </mesh>
        </>
      )}
    </group>
  );
};

const Lane: React.FC<{
  y: number;
  withDoor: boolean;
  t: number;
  wallColor: string;
  topColor: string;
}> = ({ y, withDoor, t, wallColor, topColor }) => {
  const floor = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: woodFloor([2, 1]),
        roughness: 0.45,
        clearcoat: 0.3,
      }),
    [],
  );
  const wall = useMemo(
    () => new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9 }),
    [wallColor],
  );
  const frame = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#F7F3EC", roughness: 0.5 }),
    [],
  );
  const doorMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#8B5A3C",
        roughness: 0.45,
        clearcoat: 0.5,
      }),
    [],
  );
  const glow = withDoor ? prog(t, T.expDoor, T.expDoor + 0.6) : 0;
  doorMat.emissive.set("#FF9F40");
  doorMat.emissiveIntensity = glow * 0.5;

  const appear = pop(t, T.expPeople + (withDoor ? 0 : 0.25), 0.55);
  const w = walkAlong(t, T.expWalk, 55.2, [
    [-1.25, 0.15],
    [1.25, 0.15],
  ]);
  const facing = w.moving
    ? Math.PI / 2
    : interpolate(t, [55.2, 55.9], [Math.PI / 2, 0.35], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const thought = pop(t, T.expTask + (withDoor ? 0 : 0.2), 0.5);
  // thought pops when crossing the door
  const lost = withDoor
    ? prog(t, T.expCross + 0.15, T.expCross + 0.55, Easing.in(Easing.quad))
    : 0;
  const bubbleScale = thought * (1 - lost) * (1 + lost * 0.3);
  const confused = withDoor ? prog(t, 53.4, 54.0) : 0;
  const happy = withDoor ? 0 : prog(t, T.expResult, T.expResult + 0.6);
  const markS = pop(t, T.expResult + (withDoor ? 0 : 0.25), 0.5);

  return (
    <group position={[0, y, 0]}>
      {/* floating floor slab */}
      <RBox
        size={[LANE_LEN + 0.4, 0.16, 1.9]}
        position={[0, -0.08, 0]}
        material={floor}
        radius={0.05}
      />
      <RBox
        size={[LANE_LEN + 0.4, 1.9, 0.12]}
        position={[0, 0.95, -0.95]}
        material={wall}
        radius={0.03}
      />
      {withDoor ? (
        <group position={[0, 0, -0.1]}>
          {/* partition wall with open doorway along x=0 (wall faces the camera at an angle) */}
          <RBox
            size={[0.12, 1.9, 0.38]}
            position={[0, 0.95, -0.7]}
            material={wall}
            radius={0.02}
          />
          <RBox
            size={[0.12, 1.9, 0.5]}
            position={[0, 0.95, 0.75]}
            material={wall}
            radius={0.02}
          />
          <RBox
            size={[0.12, 0.25, 1.1]}
            position={[0, 1.78, 0.05]}
            material={wall}
            radius={0.02}
          />
          {[
            [0, 1.66, 0.05, 0.16, 0.06, 0.95],
            [0, 0.83, -0.46, 0.16, 1.66, 0.06],
            [0, 0.83, 0.52, 0.16, 1.66, 0.06],
          ].map(([x, yy, z, a, b, c], i) => (
            <mesh key={i} material={frame} position={[x, yy, z]} castShadow>
              <boxGeometry args={[a, b, c]} />
            </mesh>
          ))}
          {/* open door leaf */}
          <group position={[0.02, 0, -0.43]} rotation={[0, 1.45, 0]}>
            <mesh material={doorMat} position={[0, 0.82, 0.45]} castShadow>
              <boxGeometry args={[0.04, 1.62, 0.88]} />
            </mesh>
          </group>
          {glow > 0.01 ? (
            <pointLight
              position={[0.3, 1.0, 0.4]}
              intensity={glow * 4}
              distance={2.5}
              color="#FFB45A"
            />
          ) : null}
        </group>
      ) : null}
      {appear > 0.001 ? (
        <Character
          x={w.x}
          z={w.z}
          rotY={facing}
          walkDist={w.dist}
          walk={w.speed}
          scale={appear * 0.9}
          surprise={confused * 0.8}
          scratch={confused}
          smile={happy * 0.9 + (withDoor ? 0 : 0.2)}
          colorTop={topColor}
          headYaw={confused * Math.sin(t * 3) * 0.3}
        />
      ) : null}
      <ThoughtBubble
        position={[w.x + 0.42, 1.88, w.z + 0.1]}
        scale={bubbleScale * 1.05}
      />
      {withDoor ? (
        <Sparkles
          t={t}
          start={T.expCross + 0.45}
          position={[w.x + 0.42, 1.88, 0.25]}
          radius={0.45}
          count={16}
          life={0.8}
          color="#CFE3FF"
        />
      ) : null}
      <Mark ok={!withDoor} position={[-0.95, 1.45, 0.65]} s={markS * 0.85} />
    </group>
  );
};

export const ExperimentScene: React.FC<{ t: number }> = ({ t }) => {
  const bg = useMemo(() => gradientBg("#E7C9A8", "#B98A63", "expbg2"), []);
  return (
    <group>
      <mesh position={[0, 0, -8]} scale={[40, 40, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={bg} toneMapped={false} />
      </mesh>
      <hemisphereLight args={["#FFF4E6", "#B08968", 0.8]} />
      <Sun
        position={[-4, 8, 6]}
        target={[0, 0, 0]}
        intensity={2.6}
        color="#FFE7C4"
        extent={6}
      />
      <directionalLight position={[4, 2, 6]} intensity={0.7} color="#FFFFFF" />
      <Lane y={1.25} withDoor t={t} wallColor="#E9D3B8" topColor="#E3A93B" />
      <Lane
        y={-1.55}
        withDoor={false}
        t={t}
        wallColor="#C9DECF"
        topColor="#5FA8D3"
      />
    </group>
  );
};
