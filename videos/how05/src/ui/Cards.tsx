import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { easeInOut, easeOut, easeOutCubic, lerp, ramp } from "../anim";
import { airReserve, CEILING_Y, LIFTOFF } from "../state";
import { C, FONT } from "../theme";
import { Car } from "../three/Car";
import { Ramp } from "../three/Props";
import { Studio } from "../three/Studio";
import { T } from "../timeline";
import { PillBar, pillStyle } from "./Callout";

const enterStyle = (k: number, exit = 0, dy = 14): React.CSSProperties => ({
  opacity: k * (1 - exit),
  transform: `translateY(${(1 - k) * dy - exit * 8}px) scale(${0.97 + 0.03 * k})`,
});

/** Scene 1: date card, text only. */
export const HeaderCard: React.FC<{ frame: number }> = ({ frame }) => {
  const k = ramp(frame, 12, 22, easeOut);
  const exit = ramp(frame, T.s2 - 14, 14, easeInOut);
  if (frame > T.s2) return null;
  return (
    <div style={{ position: "absolute", top: 210, left: 0, right: 0, display: "flex", justifyContent: "center", ...enterStyle(k, exit) }}>
      <div style={{ ...pillStyle(C.navy), fontSize: 36, fontWeight: 800 }}>
        <PillBar color={C.navy} />
        Tesla Roadster
        <span style={{ color: C.mono, fontWeight: 700 }}>· 15 қазан 2026</span>
      </div>
    </div>
  );
};

const InsetCamera: React.FC = () => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(1.2, 2.3, 21);
  camera.fov = 30;
  camera.lookAt(0.5, 2.2, 0);
  camera.updateProjectionMatrix();
  return null;
};

/** Scene 1 "төңкеріліп": small inset of the car driving on a ramp ceiling. */
export const InvertInset: React.FC<{ frame: number }> = ({ frame }) => {
  const k = ramp(frame, T.invert, 18, easeOut);
  const exit = ramp(frame, T.s2 - 12, 12, easeInOut);
  if (frame < T.invert || frame > T.s2) return null;
  const drive = lerp(-0.6, 0.6, ramp(frame, T.invert, T.s2 - T.invert, easeInOut));
  return (
    <div
      style={{
        position: "absolute",
        left: 560,
        top: 300,
        width: 460,
        height: 460,
        borderRadius: 36,
        overflow: "hidden",
        background: C.studioTop,
        boxShadow: "0 24px 60px rgba(22,33,58,0.16), 0 0 0 1px rgba(22,33,58,0.08)",
        transformOrigin: "left center",
        ...enterStyle(k, exit),
      }}
    >
      <ThreeCanvas width={460} height={460} flat>
        <InsetCamera />
        <hemisphereLight args={["#FFFFFF", "#D5DBE4", 1.6]} />
        <directionalLight position={[4, 9, 6]} intensity={2} />
        <Studio />
        <Ramp opacity={1} />
        <Car
          state={{ pos: [1.0 + drive, CEILING_Y - 0.09, 0], rot: [Math.PI, 0, 0], opacity: 1, scale: 1, xray: 0, jets: [] }}
          frame={frame}
        />
      </ThreeCanvas>
    </div>
  );
};

const bigNumber: React.CSSProperties = {
  fontFamily: FONT.ui,
  fontWeight: 800,
  fontSize: 132,
  lineHeight: 1,
  letterSpacing: -4,
  color: C.navy,
  fontVariantNumeric: "tabular-nums",
};
const caption: React.CSSProperties = {
  fontFamily: FONT.mono,
  fontWeight: 500,
  fontSize: 22,
  letterSpacing: 1,
  color: C.mono,
  marginTop: 12,
};

/** Scene 2: 0 → 600 l counter. */
export const LitreCounter: React.FC<{ frame: number }> = ({ frame }) => {
  const k = ramp(frame, T.litres, 16, easeOut);
  const exit = ramp(frame, T.s3 - 14, 14, easeInOut);
  if (frame < T.litres || frame > T.s3) return null;
  const n = Math.round(600 * ramp(frame, T.litres, 55, easeOutCubic));
  return (
    <div style={{ position: "absolute", left: 64, top: 230, ...enterStyle(k, exit) }}>
      <div style={bigNumber}>
        {n}
        <span style={{ fontSize: 72, letterSpacing: -1, marginLeft: 10, color: C.air }}>л</span>
      </div>
      <div style={caption}>Tesla дерегі</div>
    </div>
  );
};

/** Scene 3 headline with colour-coded nouns. */
export const BalloonHeadline: React.FC<{ frame: number }> = ({ frame }) => {
  const k = ramp(frame, T.airOut, 18, easeOut);
  const exit = ramp(frame, T.roadsterToo + 30, 14, easeInOut);
  if (frame < T.airOut || frame > T.roadsterToo + 46) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 230,
        left: 60,
        right: 60,
        textAlign: "center",
        fontFamily: FONT.ui,
        fontWeight: 800,
        fontSize: 58,
        lineHeight: 1.12,
        letterSpacing: -1,
        color: C.navy,
        ...enterStyle(k, exit),
      }}
    >
      <span style={{ color: C.air }}>Ауа</span> бір жаққа —<br />
      <span style={{ color: C.thrust }}>шар</span> қарсы жаққа
    </div>
  );
};

/** Scene 5: thrust vs weight; the sign flips at lift-off. */
export const ForceFormula: React.FC<{ frame: number }> = ({ frame }) => {
  const k = ramp(frame, T.s5 + 20, 18, easeOut);
  const exit = ramp(frame, T.s6 - 14, 14, easeInOut);
  if (frame < T.s5 + 20 || frame > T.s6) return null;
  const won = frame >= LIFTOFF;
  const pop = ramp(frame, LIFTOFF, 14, easeOut);
  return (
    <div style={{ position: "absolute", top: 220, left: 0, right: 0, display: "flex", justifyContent: "center", ...enterStyle(k, exit) }}>
      <div style={{ ...pillStyle(C.thrust), fontSize: 58, fontWeight: 800, padding: "18px 40px 18px 22px", gap: 22 }}>
        <PillBar color={won ? C.thrust : C.weight} />
        <span style={{ color: C.thrust }}>Итеру</span>
        <span style={{ display: "inline-block", width: 44, textAlign: "center", transform: `scale(${won ? 0.8 + 0.2 * pop : 1})` }}>{won ? ">" : "<"}</span>
        <span style={{ color: C.weight }}>Салмақ</span>
      </div>
    </div>
  );
};

/** Scene 6: counts the nozzles as they light up. */
export const NozzleCounter: React.FC<{ frame: number }> = ({ frame }) => {
  const k = ramp(frame, T.ten + 20, 16, easeOut);
  const exit = ramp(frame, T.pulses - 12, 12, easeInOut);
  if (frame < T.ten + 20 || frame > T.pulses) return null;
  let n = 0;
  for (let i = 0; i < 10; i++) if (frame >= T.ten + 30 + i * 7) n = i + 1;
  return (
    <div style={{ position: "absolute", left: 64, top: 230, ...enterStyle(k, exit) }}>
      <div style={bigNumber}>{n}</div>
      <div style={caption}>ИТЕРГІШ</div>
    </div>
  );
};

/** Scene 8: compressed-air reserve as a battery. */
export const AirBattery: React.FC<{ frame: number }> = ({ frame }) => {
  const k = ramp(frame, T.limited + 10, 18, easeOut);
  const exit = ramp(frame, T.s9 - 12, 12, easeInOut);
  if (frame < T.limited + 10 || frame > T.s9) return null;
  const level = airReserve(frame);
  const low = level < 0.3;
  const label = ramp(frame, T.limited + 40, 14, easeOutCubic);
  return (
    <div
      style={{
        position: "absolute",
        top: 215,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
        ...enterStyle(k, exit),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            position: "relative",
            width: 300,
            height: 112,
            borderRadius: 26,
            border: `5px solid ${C.navy}`,
            padding: 8,
            boxSizing: "border-box",
            background: C.white,
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              borderRadius: 16,
              background: low ? C.thrust : C.air,
              transform: `scaleX(${level})`,
              transformOrigin: "left",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT.ui,
              fontWeight: 800,
              fontSize: 46,
              color: C.navy,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(level * 100)}%
          </div>
        </div>
        <div style={{ width: 14, height: 44, borderRadius: "0 8px 8px 0", background: C.navy }} />
      </div>
      <div style={{ ...pillStyle(C.air), opacity: label, transform: `translateY(${(1 - label) * 10}px)` }}>
        <PillBar color={C.air} />
        Шектеулі ауа қоры
      </div>
    </div>
  );
};

/** Scene 8: hairline divider between the two systems. */
export const SplitDivider: React.FC<{ frame: number; y: number }> = ({ frame, y }) => {
  const k = ramp(frame, T.s8 + 25, 24, easeOutCubic);
  const exit = ramp(frame, T.s9, 20, easeInOut);
  if (k <= 0 || exit >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        right: 48,
        top: y,
        height: 2,
        background: C.navy,
        opacity: 0.35 * (1 - exit),
        transform: `scaleX(${k})`,
      }}
    />
  );
};

/** Scene 9: claims are not independently tested. */
export const WarningCard: React.FC<{ frame: number }> = ({ frame }) => {
  const k = ramp(frame, T.unverified, 18, easeOut);
  const exit = ramp(frame, T.next - 12, 12, easeInOut);
  if (frame < T.unverified || frame > T.next) return null;
  const src = ramp(frame, T.unverified + 14, 16, easeOut);
  return (
    <div
      style={{
        position: "absolute",
        top: 330,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 26,
        ...enterStyle(k, exit),
      }}
    >
      <div style={{ ...pillStyle(C.warn), fontSize: 38, padding: "22px 36px 22px 20px" }}>
        <PillBar color={C.warn} />
        <span>⚠ Tesla мәлімдемесі · тәуелсіз тест жоқ</span>
      </div>
      <div style={{ ...caption, marginTop: 0, opacity: src }}>Дереккөз: TechCrunch, Electrek · 15.10.2026</div>
    </div>
  );
};

/** Last 1.5 s. */
export const NextEpisode: React.FC<{ frame: number }> = ({ frame }) => {
  const k = ramp(frame, T.next, 16, easeOut);
  if (frame < T.next) return null;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18, opacity: k }}>
      <div style={{ fontFamily: FONT.ui, fontWeight: 800, fontSize: 84, letterSpacing: -2, color: C.navy, transform: `translateY(${(1 - k) * 14}px)` }}>
        Келесі бөлім: 06
      </div>
    </div>
  );
};
