import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FREEZE_AT, SCENES } from "../timeline";
import { cameraAt } from "./camera";
import { HouseScene } from "./HouseScene";
import { BrainScene } from "./BrainScene";
import { ExperimentScene } from "./ExperimentScene";

const Env: React.FC<{ intensity: number }> = ({ intensity }) => {
  const { gl, scene } = useThree();
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    return tex;
  }, [gl]);
  scene.environment = env;
  scene.environmentIntensity = intensity;
  return null;
};

/**
 * The EffectComposer only takes over rendering after its passes are mounted, so the very first
 * advance() of a fresh tab draws nothing. Render a few extra times before the first screenshot.
 */
const Warmup: React.FC = () => {
  const { advance } = useThree();
  const [handle] = useState(() =>
    delayRender("Warming up the post-processing composer"),
  );
  useEffect(() => {
    // Mounted after <EffectComposer>. Render a few times, yielding to the event loop between
    // renders via MessageChannel (unlike timers/rAF it is not throttled in background tabs).
    let n = 0;
    let cancelled = false;
    const ch = new MessageChannel();
    ch.port1.onmessage = () => {
      if (cancelled) return;
      advance(performance.now());
      if (++n < 6) ch.port2.postMessage(0);
      else continueRender(handle);
    };
    ch.port2.postMessage(0);
    return () => {
      cancelled = true;
      ch.port1.close();
    };
  }, [advance, handle]);
  return null;
};

/** Sets the camera synchronously during render so every frame is deterministic. */
const CameraRig: React.FC<{ t: number }> = ({ t }) => {
  const { camera, size } = useThree();
  const c = cameraAt(t);
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...c.pos);
  cam.fov = c.fov;
  cam.aspect = size.width / size.height;
  cam.near = 0.05;
  cam.far = 80;
  cam.lookAt(...c.target);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  return null;
};

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = Math.min(frame / fps, FREEZE_AT);

  const inBrain = t >= SCENES.s4Brain && t < SCENES.s6NewRoom;
  const inExp = t >= SCENES.s7Experiment && t < SCENES.s8Return;
  const inHouse = !inBrain && !inExp;
  const c = cameraAt(t);

  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      dpr={1}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      }}
      camera={{ fov: 48, position: [0, 1.5, 5], near: 0.05, far: 80 }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.toneMapping = THREE.NoToneMapping;
      }}
    >
      <color
        attach="background"
        args={[inBrain ? "#0B1426" : inExp ? "#F3DCC4" : "#EADBC8"]}
      />
      <Env intensity={inBrain ? 0.6 : 0.35} />
      <CameraRig t={t} />
      <group visible={inHouse}>{inHouse ? <HouseScene t={t} /> : null}</group>
      <group visible={inBrain}>{inBrain ? <BrainScene t={t} /> : null}</group>
      <group visible={inExp}>{inExp ? <ExperimentScene t={t} /> : null}</group>
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <DepthOfField
          focusDistance={c.focus}
          focusRange={inBrain ? 3.2 : 2.6}
          bokehScale={inBrain ? 2.2 : 3.2}
        />
        <Bloom
          mipmapBlur
          luminanceThreshold={0.92}
          luminanceSmoothing={0.2}
          intensity={0.75}
          radius={0.7}
        />
        <Vignette offset={0.32} darkness={0.42} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
      <Warmup />
    </ThreeCanvas>
  );
};
