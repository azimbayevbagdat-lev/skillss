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
  const exit = ramp(frame, T.s10 - 12, 12, easeInOut);
  if (frame < T.unverified || frame > T.s10) return null;
  const src = ramp(frame, T.unverified + 14, 16, easeOut);
  return (
    <div
      style={{
        position: "absolute",
        top: 720,
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

const PaperPlane: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M21.5 3.2 2.9 10.4c-.9.35-.85 1.64.08 1.92l4.6 1.4 1.8 5.6c.25.8 1.27 1.03 1.85.42l2.5-2.6 4.6 3.4c.65.48 1.58.12 1.75-.67l3.1-14.6c.2-.95-.73-1.75-1.68-1.37Z" fill={color} />
    <path d="m7.7 13.7 10.1-7.3-7.8 8.6-.4 3.9" stroke="#FFFFFF" strokeWidth={1.2} strokeLinejoin="round" />
  </svg>
);

const WORD = "ROADSTER";
export const TYPE_START = T.s10 + 26;
export const TYPE_STEP = 5;
export const SEND_AT = TYPE_START + WORD.length * TYPE_STEP + 14;

/** Scene 10: comment box types ROADSTER, sends, a paper plane flies off. */
export const CTA: React.FC<{ frame: number }> = ({ frame }) => {
  const k = ramp(frame, T.s10, 20, easeOut);
  const exit = ramp(frame, T.next - 10, 10, easeInOut);
  if (frame < T.s10 || frame > T.next + 2) return null;
  const typed = Math.max(0, Math.min(WORD.length, Math.floor((frame - TYPE_START) / TYPE_STEP) + 1));
  const caret = Math.floor(frame / 18) % 2 === 0 && frame < SEND_AT;
  const press = frame >= SEND_AT && frame < SEND_AT + 8 ? 0.92 : 1;
  const sent = ramp(frame, SEND_AT + 4, 22, easeOut);
  const flyStart = Math.max(SEND_AT + 6, T.telegram);
  const fly = ramp(frame, flyStart, 42, easeInOut);
  const planeX = lerp(0, 420, fly);
  const planeY = lerp(0, -560, fly) + Math.sin(fly * Math.PI) * -60;
  const handle = ramp(frame, T.s10 + 30, 18, easeOut);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1080, ...enterStyle(k, exit) }}>
      {/* posted comment bubble */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: -150,
          opacity: sent,
          transform: `translateY(${(1 - sent) * 60}px)`,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{ width: 64, height: 64, borderRadius: 32, background: C.navy, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.ui, fontWeight: 800, fontSize: 28 }}>
          b
        </div>
        <div style={{ ...pillStyle(C.air), fontSize: 38, fontWeight: 800 }}>
          <PillBar color={C.air} />
          {WORD}
        </div>
      </div>
      {/* input row */}
      <div
        style={{
          margin: "0 60px",
          height: 104,
          borderRadius: 52,
          background: C.white,
          boxShadow: "0 18px 50px rgba(22,33,58,0.12), 0 0 0 1px rgba(22,33,58,0.08)",
          display: "flex",
          alignItems: "center",
          padding: "0 14px 0 38px",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, fontFamily: FONT.ui, fontWeight: 800, fontSize: 42, color: typed && frame < SEND_AT + 4 ? C.ink : C.mono, letterSpacing: 1 }}>
          {frame < SEND_AT + 4 ? (typed ? WORD.slice(0, typed) : "") : ""}
          <span style={{ display: "inline-block", width: 3, height: 46, marginLeft: 4, verticalAlign: "-6px", background: C.air, opacity: caret ? 1 : 0 }} />
        </div>
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: 39,
            background: typed === WORD.length ? C.air : "#C9D0DA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${press})`,
          }}
        >
          <div style={{ transform: `translate(${planeX}px, ${planeY}px) rotate(${-12 * fly}deg) scale(${1 + fly * 0.6})`, opacity: 1 - ramp(frame, flyStart + 30, 12) }}>
            <PaperPlane size={40} color={C.white} />
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: 34, fontFamily: FONT.ui, fontWeight: 800, fontSize: 40, color: C.navy, opacity: handle, transform: `translateY(${(1 - handle) * 10}px)` }}>
        @by.bagdat
      </div>
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
