import { RoundedBox } from "@react-three/drei";
import React from "react";
import { Robot } from "../lib/Robot";
import { CanvasPanel, Sparkles3D } from "../lib/props";
import { CamRig, Draw, font, KeyLight, rr, Stage } from "../lib/three";
import { FREEZE_S, kf, pop, prog, useT } from "../lib/time";

const drawLogo: Draw = (ctx, w, h) => {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font(h * 0.62, 900);
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.55, "#d9ccff");
  g.addColorStop(1, "#9f86ff");
  ctx.shadowColor = "rgba(123,92,255,0.9)";
  ctx.shadowBlur = 30;
  ctx.fillStyle = g;
  ctx.fillText("by.bagdat", w / 2, h / 2 + 6);
};

const drawCta: Draw = (ctx, w, h) => {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font(h * 0.52, 800);
  ctx.lineWidth = h * 0.09;
  ctx.strokeStyle = "#140f26";
  ctx.lineJoin = "round";
  ctx.strokeText("Парақшаға жазылып қой", w / 2, h / 2 + 4);
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Парақшаға жазылып қой", w / 2, h / 2 + 4);
};

const drawButton: Draw = (ctx, w, h) => {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // bell icon
  const bx = w * 0.24;
  const by = h * 0.5;
  const s = h * 0.36;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(bx - s * 0.55, by + s * 0.35);
  ctx.quadraticCurveTo(bx - s * 0.5, by - s * 0.65, bx, by - s * 0.7);
  ctx.quadraticCurveTo(bx + s * 0.5, by - s * 0.65, bx + s * 0.55, by + s * 0.35);
  ctx.closePath();
  ctx.fill();
  rr(ctx, bx - s * 0.7, by + s * 0.3, s * 1.4, s * 0.18, s * 0.09);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bx, by + s * 0.62, s * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = font(h * 0.42, 900);
  ctx.fillText("Жазылу", w * 0.58, h / 2 + 3);
};

export const CtaScene: React.FC = () => {
  const t = useT(); // frozen for the final 3 s
  const logo = pop(t, 85.0, 0.6);
  const cta = pop(t, 85.6, 0.5);
  const btn = pop(t, 86.2, 0.55);
  const pulse = 0.5 + 0.5 * Math.sin((t - 86.2) * 5.5);
  const glow = btn * (0.25 + 0.45 * pulse);
  const ring = ((t - 86.2) * 0.9) % 1;
  const settle = prog(t, 84.85, FREEZE_S);
  const camZ = kf(t, [84.85, FREEZE_S], [5.8, 5.2]);
  const camX = kf(t, [84.85, FREEZE_S], [-0.3, 0.0]);
  return (
    <>
      <CamRig pos={[camX, 1.75, camZ]} target={[0, 1.55, 0]} fov={36} />
      <Stage bg="#120d24" focus={[0, 2.3, 0]} focusRange={3} bokeh={2} bloom={1.1} bloomThreshold={0.8} envIntensity={0.9} warm={false}>
        <ambientLight intensity={0.25} />
        <KeyLight position={[2, 4, 4]} intensity={2} target={[0, 1.2, 0]} />
        <spotLight position={[0, 5, -2]} intensity={30} angle={0.7} penumbra={1} color="#7b5cff" />
        {/* backdrop arcs */}
        <mesh position={[0, 2.3, -1.6]}>
          <torusGeometry args={[1.5, 0.02, 12, 120]} />
          <meshBasicMaterial color="#7b5cff" toneMapped={false} />
        </mesh>
        <mesh position={[0, 2.3, -1.8]}>
          <torusGeometry args={[1.95, 0.012, 12, 120]} />
          <meshBasicMaterial color="#3d2b8f" toneMapped={false} />
        </mesh>
        {/* logo plate */}
        <group position={[0, 2.78, 0]} scale={logo * 0.66}>
          <RoundedBox args={[2.5, 0.75, 0.12]} radius={0.12} smoothness={6} castShadow>
            <meshPhysicalMaterial color="#1c1538" roughness={0.15} clearcoat={1} metalness={0.4} />
          </RoundedBox>
          <CanvasPanel w={2.3} h={0.58} px={1150} draw={drawLogo} drawKey="logo" emissive={1.25} position={[0, 0, 0.065]} />
        </group>
        <group position={[0, 2.3, 0.1]} scale={cta * 0.72}>
          <CanvasPanel w={2.7} h={0.3} px={1350} draw={drawCta} drawKey="cta" emissive={1.05} />
        </group>
        {/* subscribe button */}
        <group position={[0.12, 1.86, 0.15]} scale={0.7 * btn * (1 + pulse * 0.04 * btn)}>
          <RoundedBox args={[1.5, 0.42, 0.16]} radius={0.2} smoothness={8} castShadow>
            <meshPhysicalMaterial color="#ff3b5c" roughness={0.2} clearcoat={1} emissive="#ff2a50" emissiveIntensity={glow} />
          </RoundedBox>
          <CanvasPanel w={1.36} h={0.34} px={800} draw={drawButton} drawKey="btn" emissive={1.0} position={[0, 0, 0.085]} />
          {/* glow ring */}
          <mesh position={[0, 0, -0.02]} scale={[1 + ring * 0.35, 1 + ring * 0.9, 1]}>
            <ringGeometry args={[0.36, 0.4, 64]} />
            <meshBasicMaterial color="#ff6a85" transparent opacity={(1 - ring) * 0.8 * btn} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 0, 0.6]} intensity={2 * glow} distance={3} color="#ff5a78" />
        </group>
        <Sparkles3D t={t} count={30} radius={0.9} position={[0.1, 1.9, 0]} color="#ffd6e0" opacity={btn * 0.9} />
        <Robot t={t} position={[-0.72, 1.92 + (1 - settle) * 0.05, 0.3]} scale={0.5 * pop(t, 85.3, 0.5)} wave={prog(t, 86.4, 86.8)} rotation={[0, 0.45, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <circleGeometry args={[8, 64]} />
          <meshPhysicalMaterial color="#1a1433" roughness={0.3} clearcoat={0.8} />
        </mesh>
      </Stage>
    </>
  );
};
