import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import * as THREE from "three";
import { lerp3 } from "../lib/anim";

export type SceneProps = { dur: number };
type V3 = [number, number, number];

/** Slow camera drift from a to b over the scene. */
export const drift = (frame: number, dur: number, a: V3, b: V3): V3 => {
  const t = Math.min(1, Math.max(0, frame / Math.max(1, dur)));
  const e = t * t * (3 - 2 * t);
  return lerp3(a, b, e);
};

/** Translucent hologram panel. */
export const HoloPanel: React.FC<{ position?: V3; w?: number; h?: number; opacity?: number; children?: React.ReactNode }> = ({
  position = [0, 0, 0],
  w = 2.6,
  h = 1.8,
  opacity = 1,
  children,
}) => {
  const border = useMemo(() => {
    const s = new THREE.Shape();
    const r = 0.18;
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return new THREE.ShapeGeometry(s, 8);
  }, [w, h]);
  return (
    <group position={position} scale={opacity < 1 ? 0.85 + opacity * 0.15 : 1}>
      <mesh geometry={border}>
        <meshBasicMaterial color="#3fd6ff" transparent opacity={0.22 * opacity} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={border} scale={[1.02, 1.03, 1]} position={[0, 0, -0.01]}>
        <meshBasicMaterial color="#9ff0ff" transparent opacity={0.35 * opacity} depthWrite={false} wireframe />
      </mesh>
      {opacity > 0.05 && <group position={[0, 0, 0.02]}>{children}</group>}
    </group>
  );
};

/** HTML label anchored in screen pixels. */
export const Label: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  bg?: string;
  scale?: number;
  opacity?: number;
  rotate?: number;
  pad?: string;
  radius?: number;
  stroke?: string;
}> = ({ x, y, children, size = 64, color = "#fff", bg, scale = 1, opacity = 1, rotate = 0, pad = "18px 34px", radius = 40, stroke }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
        opacity,
        fontFamily: "Montserrat",
        fontWeight: 800,
        fontSize: size,
        color,
        background: bg,
        padding: bg ? pad : 0,
        borderRadius: radius,
        whiteSpace: "nowrap",
        boxShadow: bg ? "0 14px 30px rgba(80,30,10,0.25)" : undefined,
        WebkitTextStroke: stroke ? `10px ${stroke}` : undefined,
        paintOrder: "stroke fill",
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);
