import { RoundedBox } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";
import { Draw, drawCheck, font, rr, useCanvasTexture } from "./three";

/* ------------------------------------------------------ question mark -- */
export const QuestionMark: React.FC<{
  color?: string;
  emissive?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ color = "#ffd23f", emissive = 0.6, position, rotation, scale = 1 }) => {
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        emissive: new THREE.Color(color),
        emissiveIntensity: emissive,
        roughness: 0.25,
        clearcoat: 1,
      }),
    [color, emissive],
  );
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh material={mat} position={[0, 0.18, 0]} rotation={[0, 0, -Math.PI * 0.62]} castShadow>
        <torusGeometry args={[0.13, 0.05, 20, 48, Math.PI * 1.45]} />
      </mesh>
      <mesh material={mat} position={[0, -0.02, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.08, 8, 16]} />
      </mesh>
      <mesh material={mat} position={[0, -0.2, 0]} castShadow>
        <sphereGeometry args={[0.058, 24, 16]} />
      </mesh>
    </group>
  );
};

/* -------------------------------------------------------------- clock -- */
export const Clock3D: React.FC<{
  minuteAngle: number;
  hourAngle: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  face?: string;
  rim?: string;
}> = ({ minuteAngle, hourAngle, position, rotation, scale = 1, face = "#fffaf2", rim = "#ff6f4f" }) => {
  const mats = useMemo(
    () => ({
      rim: new THREE.MeshPhysicalMaterial({ color: rim, roughness: 0.3, clearcoat: 1, metalness: 0.1 }),
      face: new THREE.MeshPhysicalMaterial({ color: face, roughness: 0.6 }),
      hand: new THREE.MeshPhysicalMaterial({ color: "#1d1b26", roughness: 0.3, metalness: 0.5 }),
      tick: new THREE.MeshStandardMaterial({ color: "#2a2733" }),
      glass: new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        roughness: 0.02,
        transmission: 1,
        thickness: 0.05,
        transparent: true,
        opacity: 0.25,
      }),
      bell: new THREE.MeshPhysicalMaterial({ color: "#f5c242", metalness: 0.9, roughness: 0.25 }),
    }),
    [face, rim],
  );
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh material={mats.rim} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.14, 64]} />
      </mesh>
      <mesh material={mats.face} position={[0, 0, 0.071]}>
        <circleGeometry args={[0.43, 64]} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const big = i % 3 === 0;
        return (
          <mesh
            key={i}
            material={mats.tick}
            position={[Math.sin(a) * 0.36, Math.cos(a) * 0.36, 0.075]}
            rotation={[0, 0, -a]}
          >
            <boxGeometry args={[big ? 0.03 : 0.016, big ? 0.07 : 0.045, 0.01]} />
          </mesh>
        );
      })}
      <group position={[0, 0, 0.085]} rotation={[0, 0, -hourAngle]}>
        <mesh material={mats.hand} position={[0, 0.1, 0]}>
          <boxGeometry args={[0.035, 0.22, 0.012]} />
        </mesh>
      </group>
      <group position={[0, 0, 0.095]} rotation={[0, 0, -minuteAngle]}>
        <mesh material={mats.hand} position={[0, 0.15, 0]}>
          <boxGeometry args={[0.022, 0.32, 0.012]} />
        </mesh>
      </group>
      <mesh material={mats.rim} position={[0, 0, 0.105]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 20]} />
      </mesh>
      {/* alarm bells */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={mats.bell} position={[s * 0.33, 0.43, 0]} rotation={[0, 0, s * -0.6]} castShadow>
          <sphereGeometry args={[0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} material={mats.rim} position={[s * 0.3, -0.5, 0]} rotation={[0, 0, s * 0.5]} castShadow>
          <capsuleGeometry args={[0.03, 0.12, 6, 12]} />
        </mesh>
      ))}
    </group>
  );
};

/* ------------------------------------------------------- chat bubble --- */
export const Bubble3D: React.FC<{
  text: string;
  me?: boolean;
  width?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  check?: boolean;
  color?: string;
  textColor?: string;
  glow?: number;
}> = ({ text, me = true, width = 0.6, position, rotation, scale = 1, check, color, textColor, glow = 0 }) => {
  const h = 0.2;
  const bg = color ?? (me ? "#7b5cff" : "#ffffff");
  const fg = textColor ?? (me ? "#ffffff" : "#16161d");
  const pxW = Math.round((width / h) * 256);
  const tex = useCanvasTexture(
    pxW,
    256,
    (ctx, w, hh) => {
      ctx.font = font(110, 800);
      let fs = 110;
      const extra = check ? 130 : 0;
      while (ctx.measureText(text).width > w - 90 - extra && fs > 40) {
        fs -= 4;
        ctx.font = font(fs, 800);
      }
      ctx.fillStyle = fg;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(text, w / 2 - extra / 2, hh / 2 + fs * 0.05);
      if (check) {
        const tw = ctx.measureText(text).width;
        drawCheck(ctx, w / 2 - extra / 2 + tw / 2 + 30, hh / 2 - 45, 90, fg, 18);
      }
    },
    `${text}|${fg}|${check}|${pxW}`,
  );
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: bg,
        roughness: 0.25,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        emissive: new THREE.Color(bg),
        emissiveIntensity: glow,
      }),
    [bg, glow],
  );
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundedBox args={[width, h, 0.06]} radius={0.028} smoothness={6} material={mat} castShadow />
      {/* tail */}
      <mesh
        material={mat}
        position={[me ? width / 2 - 0.05 : -width / 2 + 0.05, -h / 2 - 0.012, 0]}
        rotation={[0, 0, me ? -0.6 : 0.6]}
      >
        <coneGeometry args={[0.035, 0.07, 3]} />
      </mesh>
      <mesh position={[0, 0, 0.0305]}>
        <planeGeometry args={[width, h]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
};

/* -------------------------------------------------------------- cloud -- */
export const Cloud3D: React.FC<{
  position?: [number, number, number];
  scale?: number;
  dark?: number; // 0 light grey, 1 storm
  seed?: number;
}> = ({ position, scale = 1, dark = 1, seed = 1 }) => {
  const mat = useMemo(() => {
    const c = new THREE.Color("#b8bcc8").lerp(new THREE.Color("#2a2c36"), dark);
    return new THREE.MeshPhysicalMaterial({
      color: c,
      roughness: 0.95,
      sheen: 1,
      sheenColor: new THREE.Color("#6b6f86"),
      sheenRoughness: 0.9,
    });
  }, [dark]);
  const puffs = useMemo(() => {
    const r = (n: number) => {
      const x = Math.sin(seed * 91.7 + n * 12.3) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 7 }).map((_, i) => ({
      p: [(i - 3) * 0.17 + (r(i) - 0.5) * 0.06, Math.sin((i / 6) * Math.PI) * 0.12 + r(i + 9) * 0.05, (r(i + 4) - 0.5) * 0.12] as [
        number,
        number,
        number,
      ],
      s: 0.13 + Math.sin((i / 6) * Math.PI) * 0.1 + r(i + 2) * 0.03,
    }));
  }, [seed]);
  return (
    <group position={position} scale={scale}>
      {puffs.map((p, i) => (
        <mesh key={i} position={p.p} material={mat} castShadow>
          <sphereGeometry args={[p.s, 28, 20]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------------------------------------------------------- lightning -- */
export const Lightning: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  intensity?: number;
}> = ({ position, rotation, scale = 1, intensity = 2.5 }) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0.06, 0.5);
    s.lineTo(-0.2, -0.04);
    s.lineTo(-0.02, -0.04);
    s.lineTo(-0.1, -0.5);
    s.lineTo(0.22, 0.08);
    s.lineTo(0.03, 0.08);
    s.lineTo(0.14, 0.5);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.02,
      bevelSegments: 4,
    });
    g.center();
    return g;
  }, []);
  return (
    <mesh geometry={geo} position={position} rotation={rotation} scale={scale} castShadow>
      <meshPhysicalMaterial
        color="#ffe14a"
        emissive="#ffc21a"
        emissiveIntensity={intensity}
        roughness={0.2}
        clearcoat={1}
        toneMapped={false}
      />
    </mesh>
  );
};

/* ---------------------------------------------------------- sparkles --- */
/** Deterministic glitter points driven by time */
export const Sparkles3D: React.FC<{
  t: number;
  count?: number;
  radius?: number;
  color?: string;
  position?: [number, number, number];
  size?: number;
  opacity?: number;
}> = ({ t, count = 30, radius = 1, color = "#ffe9a8", position, size = 0.03, opacity = 1 }) => {
  const seeds = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const r = (n: number) => {
          const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
          return x - Math.floor(x);
        };
        return { a: r(1) * Math.PI * 2, e: (r(2) - 0.5) * Math.PI, d: 0.3 + r(3) * 0.7, sp: 0.3 + r(4), ph: r(5) * 6 };
      }),
    [count],
  );
  return (
    <group position={position}>
      {seeds.map((s, i) => {
        const tw = 0.5 + 0.5 * Math.sin(t * 5 * s.sp + s.ph);
        const a = s.a + t * 0.4 * s.sp;
        const d = s.d * radius;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * Math.cos(s.e) * d, Math.sin(s.e) * d + Math.sin(t * s.sp + s.ph) * 0.05, Math.sin(a) * Math.cos(s.e) * d]}
            scale={size * (0.4 + tw)}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={color} toneMapped={false} transparent opacity={opacity * (0.3 + 0.7 * tw)} />
          </mesh>
        );
      })}
    </group>
  );
};

/* -------------------------------------------------------- living room -- */
export const Sofa: React.FC<{ position?: [number, number, number]; color?: string }> = ({
  position,
  color = "#3f6f8f",
}) => {
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.9,
        sheen: 1,
        sheenColor: new THREE.Color("#a9d3ea"),
        sheenRoughness: 0.7,
      }),
    [color],
  );
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: "#6b4528", roughness: 0.5 }), []);
  return (
    <group position={position}>
      <RoundedBox args={[2.2, 0.36, 0.95]} radius={0.12} position={[0, 0.32, 0]} material={mat} castShadow receiveShadow />
      <RoundedBox args={[2.2, 0.8, 0.28]} radius={0.13} position={[0, 0.78, -0.36]} rotation={[-0.12, 0, 0]} material={mat} castShadow receiveShadow />
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.26, 0.62, 0.95]} radius={0.12} position={[s * 1.07, 0.5, 0]} material={mat} castShadow receiveShadow />
      ))}
      {[-0.52, 0.52].map((x) => (
        <RoundedBox key={x} args={[1.0, 0.16, 0.78]} radius={0.07} position={[x, 0.55, 0.06]} material={mat} castShadow receiveShadow />
      ))}
      {[
        [-0.95, -0.38],
        [0.95, -0.38],
        [-0.95, 0.38],
        [0.95, 0.38],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.07, z]} material={wood} castShadow>
          <cylinderGeometry args={[0.035, 0.025, 0.14, 12]} />
        </mesh>
      ))}
      {/* cushion */}
      <RoundedBox args={[0.42, 0.42, 0.14]} radius={0.06} position={[0.72, 0.8, -0.16]} rotation={[-0.2, -0.3, 0.12]} castShadow>
        <meshPhysicalMaterial color="#f2b84b" roughness={0.9} sheen={1} sheenColor="#fff0c0" />
      </RoundedBox>
    </group>
  );
};

export const Plant: React.FC<{ position?: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => {
  const leaf = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#3f9b5a", roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color("#b8f0c0"), side: THREE.DoubleSide }),
    [],
  );
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.44, 32]} />
        <meshPhysicalMaterial color="#e9e2d6" roughness={0.35} clearcoat={0.6} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return (
          <group key={i} position={[0, 0.44, 0]} rotation={[0, a, 0]}>
            <mesh material={leaf} position={[0, 0.3 + (i % 3) * 0.08, 0.15]} rotation={[0.55 + (i % 2) * 0.2, 0, 0]} scale={[0.5, 1, 0.12]} castShadow>
              <sphereGeometry args={[0.28, 20, 14]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const FloorLamp: React.FC<{ position?: [number, number, number]; on?: number }> = ({ position, on = 1 }) => (
  <group position={position}>
    <mesh position={[0, 0.02, 0]} castShadow>
      <cylinderGeometry args={[0.18, 0.2, 0.04, 32]} />
      <meshPhysicalMaterial color="#222" metalness={0.8} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0.8, 0]} castShadow>
      <cylinderGeometry args={[0.015, 0.015, 1.6, 12]} />
      <meshPhysicalMaterial color="#222" metalness={0.8} roughness={0.3} />
    </mesh>
    <mesh position={[0, 1.62, 0]} castShadow>
      <cylinderGeometry args={[0.16, 0.26, 0.3, 32, 1, true]} />
      <meshPhysicalMaterial color="#fff2dc" roughness={0.8} side={THREE.DoubleSide} emissive="#ffcf8a" emissiveIntensity={0.9 * on} />
    </mesh>
    <pointLight position={[0, 1.5, 0]} intensity={2.2 * on} distance={5} color="#ffbe7a" />
  </group>
);

/** Flat canvas texture panel (posters, screens, signs) */
export const CanvasPanel: React.FC<{
  w: number;
  h: number;
  px?: number;
  draw: Draw;
  drawKey: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  emissive?: number;
  basic?: boolean;
  opacity?: number;
}> = ({ w, h, px = 512, draw, drawKey, position, rotation, emissive = 1, basic = true, opacity = 1 }) => {
  const tex = useCanvasTexture(px, Math.round((px * h) / w), draw, drawKey);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[w, h]} />
      {basic ? (
        <meshBasicMaterial map={tex} transparent toneMapped={false} opacity={opacity} color={new THREE.Color(emissive, emissive, emissive)} depthWrite={false} />
      ) : (
        <meshStandardMaterial map={tex} transparent roughness={0.5} opacity={opacity} />
      )}
    </mesh>
  );
};

/** "Жазылдыңыз ✓" pill used in the chat-bot scene */
export const drawPill = (text: string, bg: string): Draw => (ctx, w, h) => {
  ctx.fillStyle = bg;
  rr(ctx, 4, 4, w - 8, h - 8, (h - 8) / 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = font(h * 0.42, 800);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const tw = ctx.measureText(text).width;
  const total = tw + h * 0.55;
  const x0 = (w - total) / 2;
  ctx.fillText(text, x0, h / 2 + 2);
  drawCheck(ctx, x0 + tw + h * 0.18, h * 0.3, h * 0.38, "#fff", h * 0.08);
};
