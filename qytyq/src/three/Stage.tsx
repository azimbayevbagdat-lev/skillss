import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";

type V3 = [number, number, number];

const CameraRig: React.FC<{ position: V3; target: V3; fov: number }> = ({ position, target, fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.fov = fov;
    camera.near = 0.1;
    camera.far = 200;
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  });
  return null;
};

/** Soft radial texture, used for blob shadows, floor fade and glows. */
export const useRadialTexture = (inner = "rgba(0,0,0,1)", outer = "rgba(0,0,0,0)") =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, inner);
    grad.addColorStop(1, outer);
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [inner, outer]);

export const BlobShadow: React.FC<{ position?: V3; size?: number; opacity?: number }> = ({
  position = [0, 0.01, 0],
  size = 2.2,
  opacity = 0.35,
}) => {
  const tex = useRadialTexture("rgba(90,40,20,1)", "rgba(90,40,20,0)");
  return (
    <mesh position={position} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[size, size * 0.7]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
};

export const Floor: React.FC<{ color?: string; size?: number; y?: number }> = ({
  color = "#f3c9a6",
  size = 26,
  y = 0,
}) => {
  const alpha = useRadialTexture("rgba(255,255,255,1)", "rgba(255,255,255,0)");
  return (
    <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2}>
      <circleGeometry args={[size / 2, 64]} />
      <meshStandardMaterial color={color} roughness={0.95} alphaMap={alpha} transparent depthWrite={false} />
    </mesh>
  );
};

/** Warm, out-of-focus backdrop: gradient + blurred bokeh discs (fake depth of field). */
export const Backdrop: React.FC<{ top?: string; bottom?: string; bokeh?: string[]; seed?: number }> = ({
  top = "#ffe7cf",
  bottom = "#f7b98f",
  bokeh = ["#fff3c4", "#ffd0a8", "#ffc1c1", "#fff"],
  seed = 1,
}) => {
  const frame = useCurrentFrame();
  const dots = useMemo(() => {
    let s = seed * 9301;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    return new Array(9).fill(0).map((_, i) => ({
      x: r() * 1080,
      y: r() * 1300,
      d: 120 + r() * 260,
      c: bokeh[i % bokeh.length],
      o: 0.25 + r() * 0.35,
      sp: 0.2 + r() * 0.4,
    }));
  }, [seed, bokeh]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`, overflow: "hidden" }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x - d.d / 2 + Math.sin(frame * 0.01 * d.sp + i) * 30,
            top: d.y - d.d / 2 + Math.cos(frame * 0.008 * d.sp + i) * 20,
            width: d.d,
            height: d.d,
            borderRadius: "50%",
            background: d.c,
            opacity: d.o,
            filter: "blur(28px)",
          }}
        />
      ))}
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0) 50%, rgba(120,50,20,0.22) 100%)" }}
      />
    </AbsoluteFill>
  );
};

export const Lights: React.FC<{ warm?: number; keyPos?: V3 }> = ({ warm = 1, keyPos = [4, 7, 6] }) => (
  <>
    <hemisphereLight args={["#fff4e6", "#e8a27a", 0.9 * warm]} />
    <ambientLight intensity={0.35} color="#ffe2c8" />
    <directionalLight position={keyPos} intensity={1.8 * warm} color="#fff1dd" />
    <directionalLight position={[-5, 3, -2]} intensity={0.7} color="#ffb7a1" />
    <directionalLight position={[0, 4, -6]} intensity={0.9} color="#ffd9b0" />
  </>
);

export const Stage: React.FC<{
  camera: V3;
  target: V3;
  fov?: number;
  backdrop?: React.ReactNode;
  children: React.ReactNode;
  warm?: number;
}> = ({ camera, target, fov = 36, backdrop, children, warm }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {backdrop ?? <Backdrop />}
      <ThreeCanvas width={width} height={height} gl={{ alpha: true, antialias: true }} dpr={1}>
        <CameraRig position={camera} target={target} fov={fov} />
        <Lights warm={warm} />
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
