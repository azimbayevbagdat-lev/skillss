import { useMemo } from "react";
import * as THREE from "three";
import { C } from "../theme";

const floorVertex = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

// Soft grey grid on a white-grey cyclorama floor that dissolves into the backdrop.
const floorFragment = /* glsl */ `
uniform vec3 uFloor;
uniform vec3 uGrid;
uniform vec3 uFar;
varying vec3 vWorld;
float line(float coord, float width) {
  float d = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
  return 1.0 - min(d / width, 1.0);
}
void main() {
  vec2 p = vWorld.xz;
  float minor = max(line(p.x * 2.0, 0.9), line(p.y * 2.0, 0.9)) * 0.35;
  float major = max(line(p.x * 0.5, 1.1), line(p.y * 0.5, 1.1)) * 0.75;
  float g = max(minor, major);
  float dist = length(p);
  float fade = 1.0 - smoothstep(9.0, 26.0, dist);
  vec3 col = mix(uFloor, uGrid, g * fade);
  col = mix(uFar, col, smoothstep(30.0, 12.0, dist));
  gl_FragColor = vec4(col, 1.0);
}`;

export const Studio: React.FC = () => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: floorVertex,
        fragmentShader: floorFragment,
        uniforms: {
          uFloor: { value: new THREE.Color("#ECEFF4") },
          uGrid: { value: new THREE.Color(C.grid) },
          uFar: { value: new THREE.Color("#EDF0F4") },
        },
      }),
    [],
  );
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat}>
      <planeGeometry args={[120, 120]} />
    </mesh>
  );
};

/** Radial-gradient texture shared by the soft contact shadows. */
let shadowTex: THREE.Texture | null = null;
const getShadowTexture = () => {
  if (shadowTex) return shadowTex;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(22,33,58,0.55)");
  g.addColorStop(0.45, "rgba(22,33,58,0.28)");
  g.addColorStop(1, "rgba(22,33,58,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  shadowTex = new THREE.CanvasTexture(canvas);
  return shadowTex;
};

/** Soft contact shadow; spreads and fades as the object rises. */
export const SoftShadow: React.FC<{
  x: number;
  z: number;
  height: number;
  sx: number;
  sz: number;
  opacity?: number;
  y?: number;
}> = ({ x, z, height, sx, sz, opacity = 1, y = 0.004 }) => {
  const tex = getShadowTexture();
  const spread = 1 + height * 0.35;
  const strength = opacity * Math.max(0.15, 1 - height * 0.32);
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[sx * spread, sz * spread, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent opacity={strength} depthWrite={false} />
    </mesh>
  );
};

/** Corner brackets marking the car's parking spot on the floor. */
export const FloorMarks: React.FC<{ opacity: number }> = ({ opacity }) => {
  const segs = useMemo(() => {
    const pts: number[] = [];
    const w = 2.75;
    const d = 1.35;
    const l = 0.45;
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        pts.push(sx * w, 0, sz * d, sx * (w - l), 0, sz * d);
        pts.push(sx * w, 0, sz * d, sx * w, 0, sz * (d - l));
      }
    // tyre marks: faint short dashes ahead of each wheel
    for (const wx of [-1.38, 1.38])
      for (const wz of [-0.84, 0.84]) pts.push(wx - 0.25, 0, wz, wx + 0.25, 0, wz);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={segs} position={[0, 0.006, 0]}>
      <lineBasicMaterial color={C.weight} transparent opacity={0.55 * opacity} />
    </lineSegments>
  );
};
