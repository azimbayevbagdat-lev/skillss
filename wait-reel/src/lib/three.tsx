import { Environment, Lightformer } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import React, { useEffect, useMemo } from "react";
import { continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { FONT, useFontsReady } from "./fonts";

/* ---------------------------------------------------------- camera ---- */

export const CamRig: React.FC<{
  pos: [number, number, number];
  target: [number, number, number];
  fov?: number;
  roll?: number;
  up?: [number, number, number];
}> = ({ pos, target, fov = 35, roll = 0, up }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  // Driven every render from useCurrentFrame() values (deterministic)
  camera.position.set(...pos);
  if (up) camera.up.set(...up).normalize();
  else camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.lookAt(...target);
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  return null;
};

/* ----------------------------------------------------------- stage ---- */

export const Stage: React.FC<{
  bg: string;
  focus: [number, number, number];
  focusRange?: number;
  bokeh?: number;
  bloom?: number;
  bloomThreshold?: number;
  envIntensity?: number;
  warm?: boolean;
  night?: boolean;
  fog?: [number, number];
  children?: React.ReactNode;
}> = ({
  bg,
  focus,
  focusRange = 0.6,
  bokeh = 4,
  bloom = 0.9,
  bloomThreshold = 0.85,
  envIntensity = 0.75,
  warm = true,
  night = false,
  fog,
  children,
}) => {
  const target = useMemo(() => new THREE.Vector3(), []);
  target.set(...focus);
  return (
    <>
      <color attach="background" args={[bg]} />
      {fog ? <fog attach="fog" args={[bg, fog[0], fog[1]]} /> : null}
      {/* Image based lighting from soft light-cards: studio reflections without network HDRIs */}
      <Environment resolution={256} frames={1} environmentIntensity={envIntensity}>
        <Lightformer
          form="rect"
          intensity={night ? 0.6 : 2.2}
          color={night ? "#8fa8ff" : "#ffffff"}
          position={[0, 5, -2]}
          rotation-x={Math.PI / 2}
          scale={[10, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={night ? 0.4 : 1.4}
          color={warm ? "#ffd2a8" : "#cfe3ff"}
          position={[-5, 1.5, 2]}
          rotation-y={Math.PI / 2}
          scale={[6, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={night ? 0.5 : 1.1}
          color={night ? "#5a78ff" : "#bcd6ff"}
          position={[5, 2, -1]}
          rotation-y={-Math.PI / 2}
          scale={[6, 3, 1]}
        />
        <Lightformer
          form="ring"
          intensity={night ? 0.3 : 0.8}
          color="#ffffff"
          position={[0, 2, 6]}
          scale={3}
        />
      </Environment>
      {children}
      <EffectComposer multisampling={4} enableNormalPass={false}>
        <DepthOfField
          target={target}
          focalLength={0.02}
          // cocMaterial.focusRange is normalised by the camera depth range (near 0.02, far 30)
          focusRange={focusRange / 30}
          bokehScale={bokeh}
        />
        <Bloom
          intensity={bloom}
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={0.2}
          mipmapBlur
          radius={0.7}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.25} darkness={0.55} />
      </EffectComposer>
      <WarmUp />
    </>
  );
};

/**
 * The first frame a tab renders can be captured before the composer, environment map and
 * canvas textures exist. Re-render a few times (holding the frame) once everything is mounted.
 */
const WarmUp: React.FC = () => {
  const advance = useThree((st) => st.advance);
  const ready = useFontsReady();
  useEffect(() => {
    const h = delayRender("Warming up WebGL scene");
    let done = false;
    let n = 0;
    const tick = () => {
      if (done) return;
      advance(performance.now());
      if (++n < 4) requestAnimationFrame(tick);
      else {
        done = true;
        continueRender(h);
      }
    };
    requestAnimationFrame(tick);
    return () => {
      if (!done) {
        done = true;
        continueRender(h);
      }
    };
  }, [advance, ready]);
  return null;
};

/** Key light with soft shadows */
export const KeyLight: React.FC<{
  position: [number, number, number];
  intensity?: number;
  color?: string;
  size?: number;
  target?: [number, number, number];
}> = ({ position, intensity = 2.5, color = "#fff1e0", size = 4, target = [0, 0, 0] }) => {
  const light = useMemo(() => new THREE.DirectionalLight(), []);
  light.target.position.set(...target);
  light.target.updateMatrixWorld();
  return (
    <primitive
      object={light}
      position={position}
      intensity={intensity}
      color={color}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-radius={6}
      shadow-bias={-0.0004}
      shadow-normalBias={0.02}
      shadow-camera-left={-size}
      shadow-camera-right={size}
      shadow-camera-top={size}
      shadow-camera-bottom={-size}
      shadow-camera-near={0.5}
      shadow-camera-far={30}
    />
  );
};

/* -------------------------------------------------- canvas textures ---- */

export type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/**
 * A CanvasTexture redrawn synchronously whenever `key` changes.
 * Drawing happens during render so the texture is always in sync with the frame.
 */
export const useCanvasTexture = (w: number, h: number, draw: Draw, key: string) => {
  const ready = useFontsReady();
  const { canvas, tex } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return { canvas: c, tex: t };
  }, [w, h]);
  useMemo(() => {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    if (ready) draw(ctx, w, h);
    tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready, canvas, tex]);
  return tex;
};

export const font = (size: number, weight = 800) => `${weight} ${size}px ${FONT}`;

export const rr = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

/** Check mark drawn as a path (the font has no ✓ glyph) */
export const drawCheck = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string,
  lw = s * 0.16,
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.55);
  ctx.lineTo(x + s * 0.36, y + s * 0.88);
  ctx.lineTo(x + s, y + s * 0.15);
  ctx.stroke();
  ctx.restore();
};

/** Flat text label as a mesh (canvas texture on a plane) */
export const Label: React.FC<{
  text: string;
  size?: number; // world height of the plane
  color?: string;
  weight?: number;
  bg?: string;
  stroke?: string;
  glow?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  opacity?: number;
  pxWidth?: number;
}> = ({
  text,
  size = 0.3,
  color = "#ffffff",
  weight = 800,
  bg,
  stroke,
  glow = 1,
  position,
  rotation,
  opacity = 1,
  pxWidth = 1024,
}) => {
  const pxH = 256;
  const tex = useCanvasTexture(
    pxWidth,
    pxH,
    (ctx, w, h) => {
      if (bg) {
        ctx.fillStyle = bg;
        rr(ctx, 6, 6, w - 12, h - 12, (h - 12) / 2);
        ctx.fill();
      }
      ctx.font = font(150, weight);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let fs = 150;
      while (ctx.measureText(text).width > w - 80 && fs > 40) {
        fs -= 6;
        ctx.font = font(fs, weight);
      }
      if (stroke) {
        ctx.lineWidth = fs * 0.14;
        ctx.strokeStyle = stroke;
        ctx.lineJoin = "round";
        ctx.strokeText(text, w / 2, h / 2 + fs * 0.04);
      }
      ctx.fillStyle = color;
      ctx.fillText(text, w / 2, h / 2 + fs * 0.04);
    },
    `${text}|${color}|${bg}|${stroke}|${weight}`,
  );
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[(size * pxWidth) / pxH, size]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={opacity}
        toneMapped={false}
        color={new THREE.Color(glow, glow, glow)}
        depthWrite={false}
      />
    </mesh>
  );
};
