import React, { useMemo } from "react";
import * as THREE from "three";
import { Easing } from "remotion";
import { lerp, lerp3, pop, prog, V3 } from "../lib/anim";
import { T } from "../timeline";
import { Card, MemoryBox, Sparkles } from "./Props";
import { gradientBg, IconKind } from "./textures";

const makeHemisphere = (side: number) => {
  const g = new THREE.SphereGeometry(1, 128, 96);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    // gyri: layered folded waves
    const f =
      0.045 *
        Math.sin(9 * v.x + 7 * v.y + 3 * Math.sin(5 * v.z)) *
        Math.sin(8 * v.z + 6 * v.y) +
      0.03 * Math.sin(17 * v.y + 4 * Math.sin(9 * v.z) + side) +
      0.02 * Math.sin(23 * v.z + 13 * v.x);
    v.multiplyScalar(1 + f);
    // flatten the medial side
    if (v.x * side < 0) v.x *= 0.35;
    v.set(v.x * 0.62, v.y * 0.72, v.z * 1.0);
    // slightly flatter bottom
    if (v.y < 0) v.y *= 0.8;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};

const fresnelMat = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color("#8FD8FF") },
      power: { value: 2.6 },
      strength: { value: 1.2 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color; uniform float power; uniform float strength;
      varying vec3 vN; varying vec3 vV;
      void main(){
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), power) * strength;
        gl_FragColor = vec4(color * f, f);
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

export const GlassBrain: React.FC<{ glow?: number }> = ({ glow = 0 }) => {
  const geos = useMemo(() => [makeHemisphere(-1), makeHemisphere(1)], []);
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#CDEBFF",
        roughness: 0.06,
        metalness: 0,
        transparent: true,
        opacity: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        iridescence: 0.7,
        iridescenceIOR: 1.4,
        specularIntensity: 1,
        envMapIntensity: 2.2,
        depthWrite: false,
        side: THREE.FrontSide,
      }),
    [],
  );
  const rim = useMemo(fresnelMat, []);
  rim.uniforms.strength.value = 1.1 + glow * 0.8;
  return (
    <group>
      {geos.map((g, i) => (
        <group key={i} position={[i === 0 ? -0.33 : 0.33, 0, 0]}>
          <mesh geometry={g} material={rim} renderOrder={2} />
          <mesh geometry={g} material={glass} renderOrder={3} />
        </group>
      ))}
      {/* cerebellum + stem */}
      <mesh
        position={[0, -0.5, -0.62]}
        scale={[0.75, 0.42, 0.45]}
        material={rim}
      >
        <sphereGeometry args={[0.6, 48, 32]} />
      </mesh>
      <mesh position={[0, -0.85, -0.3]} rotation={[0.35, 0, 0]} material={rim}>
        <cylinderGeometry args={[0.12, 0.09, 0.6, 24]} />
      </mesh>
    </group>
  );
};

const KINDS: IconKind[] = [
  "sofa",
  "window",
  "plant",
  "door",
  "kitchen",
  "charger",
  "cup",
  "phone",
];
const CHARGER_IDX = 5;

export const BrainScene: React.FC<{ t: number }> = ({ t }) => {
  const bg = useMemo(() => gradientBg("#24365C", "#0B1426", "brainbg"), []);
  const N = KINDS.length;
  const cw = 0.48; // card width
  // film-strip phase: contiguous strip that scrolls; then split into separate scenes
  const split = prog(
    t,
    T.filmSplit - 0.2,
    T.filmSplit + 1.0,
    Easing.inOut(Easing.cubic),
  );
  const scroll = (t - 13.78) * 0.12;
  const doorIcons = pop(t, T.doorIcons, 0.5);
  const newScene = prog(t, T.newScene, T.newScene + 0.8);
  const surroundings = prog(t, T.surroundings, T.surroundings + 0.9);

  // scene 5: the charger card flies out into the box
  const out = prog(
    t,
    T.cardOut - 0.3,
    T.lidClose - 0.25,
    Easing.inOut(Easing.cubic),
  );
  const lid =
    1 - prog(t, T.lidClose - 0.2, T.lidClose + 0.08, Easing.in(Easing.quad));
  const boxIn = pop(t, 26.4, 0.6);
  const stored = prog(t, T.stored, T.stored + 1.0);
  const boxPos: V3 = lerp3([0.45, -0.85, 1.1], [0.4, -0.9, 0.95], stored);

  const cards = KINDS.map((kind, i) => {
    // strip layout
    const stripX = (i - (N - 1) / 2) * cw - (scroll % cw) + 0.06;
    // separated layout: arc of scenes with gaps
    const sepGap = cw * 1.32;
    const ang = (i - (N - 1) / 2) * 0.16;
    const sepX = (i - (N - 1) / 2) * sepGap * 0.78;
    const sepY =
      0.06 + Math.cos(ang * 2) * 0.1 - 0.1 + (i % 2 ? 0.17 : -0.17) * 0.6;
    const sepZ = -Math.abs(ang) * 0.6 + 0.15;
    let pos: V3 = lerp3([stripX, 0.05, 0.12], [sepX, sepY, sepZ], split);
    let rotY = lerp(0, -ang * 1.2, split);
    let scale = lerp(1, 0.86, split);
    let glow = 0;
    let opacity = 1;
    if (i === CHARGER_IDX) {
      const hi = prog(t, T.cardOut - 0.9, T.cardOut - 0.3);
      glow = hi * (1 - prog(t, T.lidClose - 0.4, T.lidClose));
      const dest: V3 = [boxPos[0], boxPos[1] + 0.18, boxPos[2]];
      const mid: V3 = [0.75, 0.55, 1.3];
      const a = lerp3(pos, mid, Math.min(1, out * 2));
      pos = lerp3(a, dest, Math.max(0, out * 2 - 1));
      rotY = lerp(rotY, 0, out);
      scale = lerp(scale, 0.55, out);
      opacity = 1 - prog(t, T.lidClose - 0.15, T.lidClose);
    }
    // a "new scene" lighting up when the surroundings change
    if (i === 4)
      glow = Math.max(glow, surroundings * (1 - prog(t, 24.4, 25.2)) * 0.9);
    if (i === 3)
      glow = Math.max(glow, newScene * (1 - prog(t, 22.2, 23)) * 0.8);
    return { kind, pos, rotY, scale, glow, opacity, i };
  });

  return (
    <group>
      <mesh position={[0, 0, -7]} scale={[30, 30, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={bg} toneMapped={false} />
      </mesh>
      {/* floating dust */}
      <hemisphereLight args={["#BFD7FF", "#1A1A2E", 0.7]} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} color="#FFF3E0" />
      <directionalLight position={[-4, 1, 2]} intensity={0.9} color="#7FB7FF" />
      <pointLight
        position={[0, 0.2, 0.3]}
        intensity={2.5}
        distance={3}
        color="#FFD9A0"
      />
      <group position={[0, 0.25, 0]}>
        <GlassBrain glow={surroundings * 0.3} />
        {cards.map((c) => (
          <Card
            key={c.kind}
            kind={c.kind}
            position={c.pos}
            rotation={[0, c.rotY, 0]}
            scale={c.scale}
            glow={c.glow}
            opacity={c.opacity}
            width={cw}
          />
        ))}
        {/* glowing door separators between scenes */}
        {doorIcons > 0.01
          ? cards.slice(0, -1).map((c, i) => {
              const nx = cards[i + 1];
              const p = lerp3(c.pos, nx.pos, 0.5);
              return (
                <group
                  key={i}
                  position={[p[0], p[1] - 0.02, p[2] + 0.02]}
                  scale={doorIcons * 0.9}
                >
                  <mesh>
                    <boxGeometry args={[0.07, 0.14, 0.01]} />
                    <meshBasicMaterial color="#FFB45A" toneMapped={false} />
                  </mesh>
                  <mesh position={[0.018, -0.005, 0.006]}>
                    <sphereGeometry args={[0.008, 8, 6]} />
                    <meshBasicMaterial color="#5B3A23" />
                  </mesh>
                </group>
              );
            })
          : null}
      </group>
      {boxIn > 0.001 ? (
        <MemoryBox
          position={boxPos}
          rotY={-0.45}
          scale={boxIn * 1.25}
          open={lid}
          glow={(1 - stored) * 0.5 * lid}
        />
      ) : null}
      <Sparkles
        t={t}
        start={T.lidClose}
        position={[boxPos[0], boxPos[1] + 0.3, boxPos[2]]}
        radius={0.5}
        count={18}
        life={0.9}
        color="#FFE6A8"
      />
    </group>
  );
};
