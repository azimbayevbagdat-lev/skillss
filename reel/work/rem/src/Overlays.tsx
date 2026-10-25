import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import plan from "./plan.json";

// Overlay band: top of frame, above the head (face spans ~500..1250px).
// Safe area: top 220px, right 120px (Instagram UI).
const BAND_TOP = 228;
const BAND_H = 250;
const BAND_LEFT = 80;
const BAND_W = 880;

const YELLOW = "#FFD400";
const NAVY = "#1B2A6B";
const GREEN = "#22C55E";
const FONT = "Montserrat";

type O = (typeof plan.overlays)[number] & Record<string, unknown>;

const emoji = (code: string) => staticFile(code === "KZ" ? "emoji/KZ.svg" : `emoji/${code}.png`);

/** shared enter (spring pop) / exit (fade + shrink) envelope, local frame based */
const useEnvelope = (dur: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, config: { damping: 12, stiffness: 180, mass: 0.7 } });
  const exit = interpolate(f, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { f, fps, enter, exit, scale: (0.6 + 0.4 * enter) * (0.85 + 0.15 * exit), opacity: Math.min(1, enter * 1.5) * exit };
};

const Band: React.FC<{ children: React.ReactNode; dur: number; fit?: number; style?: React.CSSProperties }> = ({ children, dur, fit = 1, style }) => {
  const { scale, opacity } = useEnvelope(dur);
  return (
    <div
      style={{
        position: "absolute",
        top: BAND_TOP,
        left: BAND_LEFT,
        width: BAND_W,
        height: BAND_H,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale * fit})`,
        opacity,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.96)",
      borderRadius: 40,
      boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
      padding: "28px 40px",
      fontFamily: FONT,
      fontWeight: 900,
      color: NAVY,
      display: "flex",
      alignItems: "center",
      gap: 28,
      ...style,
    }}
  >
    {children}
  </div>
);

const Emoji: React.FC<{ code: string; size: number; style?: React.CSSProperties }> = ({ code, size, style }) => (
  <Img src={emoji(code)} style={{ width: size, height: size, ...style }} />
);

const sec = (s: number, fps: number) => Math.round(s * fps);

// ---------------------------------------------------------------- overlays

const Hook: React.FC<{ dur: number; o: O }> = ({ dur, o }) => {
  const { f, fps } = useEnvelope(dur);
  const logoF = f - sec((o.logoAt as number) - o.from, fps);
  const logo = spring({ frame: logoF, fps, config: { damping: 11, stiffness: 160 } });
  const rot = interpolate(logo, [0, 1], [-540, 0]);
  return (
    <Band dur={dur}>
      <div
        style={{
          background: YELLOW,
          borderRadius: 44,
          padding: "22px 36px 22px 230px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          fontFamily: FONT,
          fontWeight: 900,
          color: NAVY,
          textAlign: "center",
          position: "relative",
          width: 860,
        }}
      >
        <div style={{ fontSize: 50, lineHeight: 1 }}>1 АПТАДА</div>
        <div style={{ fontSize: 118, lineHeight: 1.02, letterSpacing: -2 }}>300 000</div>
        <div style={{ fontSize: 50, lineHeight: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
          ЖҮКТЕУ <Emoji code="1f695" size={64} />
        </div>
        {logoF >= 0 && (
          <Img
            src={staticFile("qajet_logo.jpg")}
            style={{
              position: "absolute",
              width: 170,
              height: 170,
              borderRadius: 38,
              left: 34,
              top: 22,
              transform: `scale(${logo}) rotate(${rot}deg)`,
              boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
              border: "6px solid white",
            }}
          />
        )}
      </div>
    </Band>
  );
};

const Counter: React.FC<{ dur: number; o: O }> = ({ dur, o }) => {
  const { f, fps } = useEnvelope(dur);
  const end = sec((o.countEnd as number) - o.from, fps);
  const v = interpolate(f, [2, end], [0, 300000], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const done = f >= end;
  const bounce = done ? 1 + 0.12 * Math.exp(-(f - end) / 3) : 1;
  const arrowY = (f % 15) * 2;
  return (
    <Band dur={dur}>
      <Card style={{ padding: "34px 48px" }}>
        <div style={{ width: 130, height: 150, overflow: "hidden", display: "flex", justifyContent: "center" }}>
          <Emoji code="2b07" size={130} style={{ transform: `translateY(${arrowY - 10}px)` }} />
        </div>
        <div>
          <div style={{ fontSize: 120, lineHeight: 1, color: done ? GREEN : NAVY, transform: `scale(${bounce})`, transformOrigin: "left center", fontVariantNumeric: "tabular-nums" }}>
            {Math.round(v).toLocaleString("ru-RU").replace(/ /g, " ")}
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, opacity: 0.75 }}>жүктеу · 1 апта</div>
        </div>
      </Card>
    </Band>
  );
};

const Profile: React.FC<{ dur: number; o: O }> = ({ dur, o }) => {
  const { f, fps } = useEnvelope(dur);
  // crop of qajet_profile.jpg (987x764): rows 110..460
  const W = 820;
  const k = W / 987;
  const cropTop = 150;
  const cropH = 200;
  const slide = interpolate(spring({ frame: f, fps, config: { damping: 14 } }), [0, 1], [700, 0]);
  const cf = f - sec((o.circleAt as number) - o.from, fps);
  const draw = interpolate(cf, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // "21,2 тыс." in image coords ≈ centre (690, 280)
  const cx = 690 * k;
  const cy = (280 - cropTop) * k;
  const rx = 135 * k;
  const ry = 52 * k;
  const perim = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  return (
    <Band dur={dur}>
      <div style={{ transform: `translateX(${slide}px)`, position: "relative", width: W, height: cropH * k, borderRadius: 34, overflow: "hidden", boxShadow: "0 18px 50px rgba(0,0,0,0.4)", background: "white" }}>
        <Img src={staticFile("qajet_profile.jpg")} style={{ position: "absolute", width: W, top: -cropTop * k, left: 0 }} />
        <svg width={W} height={cropH * k} style={{ position: "absolute", left: 0, top: 0 }}>
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill="none"
            stroke={YELLOW}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={perim}
            strokeDashoffset={perim * (1 - draw)}
            transform={`rotate(-4 ${cx} ${cy})`}
            style={{ filter: "drop-shadow(0 0 6px rgba(0,0,0,0.35))" }}
          />
        </svg>
      </div>
    </Band>
  );
};

const Komissiya: React.FC<{ dur: number }> = ({ dur }) => {
  const { f } = useEnvelope(dur);
  const drop = interpolate(f % 14, [0, 14], [-30, 50]);
  const fade = interpolate(f % 14, [0, 3, 11, 14], [0, 1, 1, 0]);
  return (
    <Band dur={dur}>
      <Card style={{ padding: "30px 46px" }}>
        <div>
          <div style={{ fontSize: 96, color: "#E11D2E", lineHeight: 1 }}>Комиссия</div>
          <div style={{ fontSize: 40, fontWeight: 800, opacity: 0.7, marginTop: 10 }}>Яндекс · inDrive</div>
        </div>
        <svg width={100} height={170} viewBox="0 0 120 200">
          <g transform={`translate(0 ${drop})`} opacity={fade}>
            <rect x={42} y={10} width={36} height={90} rx={10} fill="#E11D2E" />
            <polygon points="10,90 110,90 60,150" fill="#E11D2E" />
          </g>
        </svg>
      </Card>
    </Band>
  );
};

const Bonus: React.FC<{ dur: number }> = ({ dur }) => {
  const { f } = useEnvelope(dur);
  const coins = Array.from({ length: 9 }, (_, i) => i);
  const shake = Math.sin(f * 1.4) * interpolate(f, [0, 8, 14], [0, 8, 0], { extrapolateRight: "clamp" });
  return (
    <Band dur={dur} fit={0.7}>
      <div style={{ position: "relative", width: 600, height: 400 }}>
        {coins.map((i) => {
          const start = 4 + i * 2;
          const lt = Math.max(0, f - start);
          const ang = (-150 + (i * 120) / 8) * (Math.PI / 180);
          const v = 26;
          const x = Math.cos(ang) * v * lt;
          const y = Math.sin(ang) * v * lt + 0.9 * lt * lt;
          const op = f < start ? 0 : interpolate(lt, [0, 3, 22, 30], [0, 1, 1, 0], { extrapolateRight: "clamp" });
          return (
            <Emoji key={i} code="1fa99" size={90} style={{ position: "absolute", left: 255 + x, top: 170 + y, opacity: op, transform: `rotate(${lt * 25}deg)` }} />
          );
        })}
        <Emoji code="1f381" size={260} style={{ position: "absolute", left: 170, top: 90, transform: `rotate(${shake}deg)` }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: -30, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 70, color: YELLOW, WebkitTextStroke: "10px #000", paintOrder: "stroke fill" }}>
          БОНУС
        </div>
      </div>
    </Band>
  );
};

const Dumping: React.FC<{ dur: number; o: O }> = ({ dur, o }) => {
  const { f, fps } = useEnvelope(dur);
  const qf = f - sec((o.qAt as number) - o.from, fps);
  const q = qf >= 0 ? spring({ frame: qf, fps, config: { damping: 8, stiffness: 200 } }) : 0;
  const clash = Math.sin(f * 0.9) * 6;
  return (
    <Band dur={dur} fit={0.78}>
      <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
        <div style={{ textAlign: "center" }}>
          <Emoji code="2694" size={230} style={{ transform: `rotate(${clash}deg)` }} />
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 62, color: "white", WebkitTextStroke: "10px #000", paintOrder: "stroke fill" }}>ДЕМПИНГ</div>
        </div>
        {qf >= 0 && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 330, lineHeight: 1, color: YELLOW, WebkitTextStroke: "16px #000", paintOrder: "stroke fill", transform: `scale(${q}) rotate(${(1 - q) * -30}deg)` }}>?</div>}
      </div>
    </Band>
  );
};

const Kz: React.FC<{ dur: number }> = ({ dur }) => {
  const { f } = useEnvelope(dur);
  const wave = Math.sin(f / 4) * 4;
  return (
    <Band dur={dur} fit={0.85}>
      <div style={{ position: "relative", transform: `rotate(${wave}deg)` }}>
        <Img src={emoji("KZ")} style={{ width: 560, height: 280, borderRadius: 26, boxShadow: "0 0 70px rgba(0,175,202,0.85), 0 18px 40px rgba(0,0,0,0.4)" }} />
      </div>
    </Band>
  );
};

const Chat: React.FC<{ dur: number; o: O }> = ({ dur, o }) => {
  const { f, fps } = useEnvelope(dur);
  const tf = f - sec((o.typeAt as number) - o.from, fps);
  const typing = tf < 10;
  const think = spring({ frame: f - 22, fps, config: { damping: 9 } });
  const dots = [0, 1, 2].map((i) => 0.4 + 0.6 * Math.abs(Math.sin((f + i * 4) / 4)));
  return (
    <Band dur={dur} fit={0.92}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 18, width: 840 }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, background: "linear-gradient(135deg,#94a3b8,#475569)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 900, color: "white", fontSize: 44 }}>?</div>
        <div style={{ position: "relative", background: "#F1F2F6", borderRadius: "40px 40px 40px 10px", padding: "26px 34px", boxShadow: "0 14px 40px rgba(0,0,0,0.35)", fontFamily: FONT, color: "#111" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#6B7280", marginBottom: 6 }}>user_kz · қазір</div>
          {typing ? (
            <div style={{ display: "flex", gap: 12, padding: "14px 4px" }}>
              {dots.map((d, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: 11, background: "#9CA3AF", opacity: d }} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.12 }}>Қазақ тазиктен басқа не шығарды?</div>
          )}
          <Emoji code="1f914" size={120} style={{ position: "absolute", right: -50, top: -30, transform: `scale(${think}) rotate(${(1 - think) * 40}deg)` }} />
        </div>
      </div>
    </Band>
  );
};

const Check: React.FC<{ dur: number }> = ({ dur }) => (
  <Band dur={dur} fit={0.78}>
    <Emoji code="2705" size={300} style={{ filter: "drop-shadow(0 14px 30px rgba(0,0,0,0.4))" }} />
  </Band>
);

const Hand: React.FC<{ dur: number; o: O }> = ({ dur, o }) => {
  const { f, fps } = useEnvelope(dur);
  const hf = f - sec((o.heartAt as number) - o.from, fps);
  const h = hf >= 0 ? spring({ frame: hf, fps, config: { damping: 7, stiffness: 220 } }) : 0;
  const beat = 1 + 0.08 * Math.max(0, Math.sin(hf / 3));
  return (
    <Band dur={dur} fit={0.85}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <Emoji code="1f91d" size={270} style={{ filter: "drop-shadow(0 14px 30px rgba(0,0,0,0.4))" }} />
        <Emoji code="2764" size={170} style={{ marginLeft: -30, transform: `scale(${h * beat})`, filter: "drop-shadow(0 10px 24px rgba(225,29,46,0.6))" }} />
      </div>
    </Band>
  );
};

const Money: React.FC<{ dur: number; o: O }> = ({ dur, o }) => {
  const { f, fps } = useEnvelope(dur);
  const land = sec((o.landAt as number) - o.from, fps);
  const p = interpolate(f, [4, land], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const x = interpolate(p, [0, 1], [0, 470]);
  const y = -Math.sin(p * Math.PI) * 170;
  const bagScale = interpolate(p, [0, 0.9, 1], [1, 0.8, 0.0]);
  const flagPulse = f >= land ? 1 + 0.18 * Math.exp(-(f - land) / 4) : 1;
  return (
    <Band dur={dur} fit={0.7}>
      <div style={{ position: "relative", width: 840, height: 400 }}>
        <Img src={emoji("KZ")} style={{ position: "absolute", right: 0, top: 110, width: 300, height: 150, borderRadius: 18, transform: `scale(${flagPulse})`, boxShadow: f >= land ? "0 0 60px rgba(254,197,12,0.9)" : "0 12px 30px rgba(0,0,0,0.35)" }} />
        {[0, 1, 2].map((i) => {
          const pp = Math.max(0, p - i * 0.08);
          return (
            <Emoji key={i} code="1f4b8" size={90} style={{ position: "absolute", left: 60 + pp * 470 - i * 40, top: 140 - Math.sin(pp * Math.PI) * 140 + i * 30, opacity: p > 0 && p < 1 ? 0.85 : 0 }} />
          );
        })}
        <Emoji code="1f4b0" size={220} style={{ position: "absolute", left: 20 + x, top: 90 + y, transform: `scale(${bagScale})` }} />
      </div>
    </Band>
  );
};

const AppCard: React.FC<{ dur: number }> = ({ dur }) => {
  const { f } = useEnvelope(dur);
  const press = interpolate(f, [36, 40, 44], [1, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Band dur={dur} fit={0.92}>
      <Card style={{ width: 840, padding: "34px 36px", gap: 30, alignItems: "center" }}>
        <Img src={staticFile("qajet_logo.jpg")} style={{ width: 190, height: 190, borderRadius: 44, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 58, color: "#111", lineHeight: 1.05 }}>Qajet Taxi</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#6B7280", marginTop: 6 }}>Әзірлеуші:</div>
          <div style={{ fontSize: 50, color: "#2563EB", lineHeight: 1.1 }}>Жамбыл</div>
        </div>
        <div style={{ background: "#2563EB", color: "white", borderRadius: 40, padding: "16px 34px", fontSize: 36, transform: `scale(${press})` }}>АЛУ</div>
      </Card>
    </Band>
  );
};

const Jambyl: React.FC<{ dur: number; o: O }> = ({ dur, o }) => {
  const { f, fps } = useEnvelope(dur);
  const W = 820;
  const k = W / 976;
  const cropTop = 395;
  const cropH = 180;
  const slide = interpolate(spring({ frame: f, fps, config: { damping: 15 } }), [0, 1], [-900, 0]);
  const mf = f - sec((o.markAt as number) - o.from, fps);
  const m = interpolate(mf, [0, 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  // "App Store-ға 2 апп" in image coords: x 98..470, y 505..560
  const mx = 92 * k;
  const my = (500 - cropTop) * k;
  const mw = (480 - 92) * k;
  const mh = 64 * k;
  return (
    <Band dur={dur}>
      <div style={{ transform: `translateX(${slide}px)`, position: "relative", width: W, height: cropH * k, borderRadius: 34, overflow: "hidden", boxShadow: "0 18px 50px rgba(0,0,0,0.4)", background: "white" }}>
        <Img src={staticFile("jambyyl.jpg")} style={{ position: "absolute", width: W, top: -cropTop * k, left: 0 }} />
        <div style={{ position: "absolute", left: mx, top: my, width: mw * m, height: mh, background: YELLOW, mixBlendMode: "multiply", borderRadius: 8, opacity: 0.85 }} />
      </div>
    </Band>
  );
};

const typed = (text: string, f: number, startF: number, cps: number, fps: number) => {
  const chars = Array.from(text);
  const n = Math.max(0, Math.min(chars.length, Math.floor(((f - startF) / fps) * cps)));
  return chars.slice(0, n).join("");
};

const Terminal: React.FC<{ dur: number; o: O }> = ({ dur, o }) => {
  const { f, fps } = useEnvelope(dur);
  const s = typed(o.text as string, f, sec((o.typeAt as number) - o.from, fps), o.cps as number, fps);
  const cursor = Math.floor(f / 8) % 2 === 0;
  return (
    <Band dur={dur} fit={0.95}>
      <div style={{ width: 820, borderRadius: 30, overflow: "hidden", background: "#0D1117", boxShadow: "0 18px 50px rgba(0,0,0,0.5)", fontFamily: "'DejaVu Sans Mono', monospace" }}>
        <div style={{ display: "flex", gap: 14, padding: "20px 26px", background: "#161B22", alignItems: "center" }}>
          {["#FF5F56", "#FFBD2E", "#27C93F"].map((c) => (
            <div key={c} style={{ width: 24, height: 24, borderRadius: 12, background: c }} />
          ))}
          <div style={{ color: "#8B949E", fontSize: 28, marginLeft: 16 }}>~/qajet-taxi</div>
        </div>
        <div style={{ padding: "40px 36px 50px", fontSize: 64, color: "#E6EDF3", fontWeight: 700, display: "flex", alignItems: "center" }}>
          <span style={{ color: GREEN, marginRight: 22 }}>$</span>
          <span>{s.replace("⚡", "")}</span>
          {s.includes("⚡") && <Emoji code="26a1" size={66} style={{ marginLeft: 6 }} />}
          <span style={{ display: "inline-block", width: 34, height: 70, background: cursor ? "#E6EDF3" : "transparent", marginLeft: 8 }} />
        </div>
      </div>
    </Band>
  );
};

const Idea: React.FC<{ dur: number; o: O }> = ({ dur, o }) => {
  const { f, fps } = useEnvelope(dur);
  const mf = f - sec((o.morphAt as number) - o.from, fps);
  const p = interpolate(mf, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const glow = 0.6 + 0.4 * Math.sin(f / 5);
  const sparkle = mf >= 0 ? interpolate(mf, [0, 6, 20], [0, 1, 0], { extrapolateRight: "clamp" }) : 0;
  return (
    <Band dur={dur} fit={0.75}>
      <div style={{ position: "relative", width: 400, height: 400 }}>
        <Emoji code="1f4a1" size={300} style={{ position: "absolute", left: 50, top: 50, opacity: 1 - p, transform: `scale(${1 - 0.6 * p}) rotate(${p * 90}deg)`, filter: `blur(${p * 14}px) drop-shadow(0 0 ${40 * glow}px rgba(255,212,0,0.9))` }} />
        <Emoji code="1f4f1" size={300} style={{ position: "absolute", left: 50, top: 50, opacity: p, transform: `scale(${0.4 + 0.6 * p}) rotate(${(1 - p) * -90}deg)`, filter: `blur(${(1 - p) * 14}px) drop-shadow(0 14px 30px rgba(0,0,0,0.45))` }} />
        {[[-40, 20], [330, 10], [300, 320], [-20, 300]].map(([x, y], i) => (
          <Emoji key={i} code="2728" size={90} style={{ position: "absolute", left: x, top: y, opacity: sparkle, transform: `scale(${0.5 + sparkle})` }} />
        ))}
      </div>
    </Band>
  );
};

const Prompt: React.FC<{ dur: number; o: O }> = ({ dur, o }) => {
  const { f, fps } = useEnvelope(dur);
  const s = typed(o.text as string, f, sec((o.typeAt as number) - o.from, fps), o.cps as number, fps);
  const cursor = Math.floor(f / 8) % 2 === 0;
  return (
    <Band dur={dur} fit={0.88}>
      <div style={{ width: 840, background: "white", borderRadius: 36, boxShadow: "0 18px 50px rgba(0,0,0,0.4)", padding: "26px 30px", fontFamily: FONT }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#6B7280", marginBottom: 14 }}>Промпт</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
          <div style={{ flex: 1, minHeight: 150, border: "4px solid #E5E7EB", borderRadius: 24, padding: "18px 22px", fontSize: 50, fontWeight: 800, color: "#111", lineHeight: 1.2 }}>
            {s}
            <span style={{ display: "inline-block", width: 5, height: 56, background: cursor ? "#111" : "transparent", marginLeft: 4, verticalAlign: "middle" }} />
          </div>
          <div style={{ width: 96, height: 96, borderRadius: 48, background: s.length > 3 ? "#111" : "#D1D5DB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Band>
  );
};

const Badge: React.FC<{ dur: number }> = ({ dur }) => (
  <Band dur={dur}>
    <div style={{ background: "linear-gradient(90deg,#F58529,#DD2A7B,#8134AF,#515BD4)", padding: 8, borderRadius: 80, boxShadow: "0 18px 50px rgba(0,0,0,0.4)" }}>
      <div style={{ background: "white", borderRadius: 74, padding: "26px 56px", display: "flex", alignItems: "center", gap: 22, fontFamily: FONT, fontWeight: 900 }}>
        <svg width={70} height={70} viewBox="0 0 24 24" fill="none" stroke="#DD2A7B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
        <span style={{ fontSize: 78, color: "#111" }}>@by.bagdat</span>
      </div>
    </div>
  </Band>
);

const Subscribe: React.FC<{ dur: number; o: O }> = ({ dur, o }) => {
  const { f, fps } = useEnvelope(dur);
  const cf = f - sec((o.clickAt as number) - o.from, fps);
  const press = interpolate(cf, [-3, 0, 4], [1, 0.88, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const done = cf >= 2;
  const pop = done ? spring({ frame: cf - 2, fps, config: { damping: 9 } }) : 0;
  // cursor hand moving to the button
  const hx = interpolate(f, [0, Math.max(1, cf + f - 2)], [260, 0], { extrapolateRight: "clamp" });
  return (
    <Band dur={dur}>
      <div style={{ position: "relative" }}>
        <div
          style={{
            background: done ? "#E5E7EB" : "#0095F6",
            color: done ? "#111" : "white",
            borderRadius: 30,
            padding: "34px 80px",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 76,
            transform: `scale(${press * (done ? 0.94 + 0.06 * pop : 1)})`,
            boxShadow: "0 18px 50px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          {done ? (
            <>
              Тіркелдіңіз <span style={{ color: GREEN }}>✓</span>
            </>
          ) : (
            "Тіркелу"
          )}
        </div>
        {cf < 12 && (
          <svg width={110} height={110} viewBox="0 0 24 24" style={{ position: "absolute", right: -30 - hx, bottom: -60 - hx * 0.3 }} fill="white" stroke="#111" strokeWidth={1.2} strokeLinejoin="round">
            <path d="M5 3l14 8-6 1.5L10 19z" />
          </svg>
        )}
      </div>
    </Band>
  );
};

const MAP: Record<string, React.FC<{ dur: number; o: O }>> = {
  hook: Hook,
  counter: Counter,
  profile: Profile,
  komissiya: Komissiya,
  bonus: Bonus,
  dumping: Dumping,
  kz: Kz,
  chat: Chat,
  check: Check,
  hand: Hand,
  money: Money,
  appcard: AppCard,
  jambyl: Jambyl,
  terminal: Terminal,
  idea: Idea,
  prompt: Prompt,
  badge: Badge,
  subscribe: Subscribe,
};

export const Overlays: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      {plan.overlays.map((o) => {
        const C = MAP[o.id];
        const from = Math.round(o.from * fps);
        const dur = Math.round(o.to * fps) - from;
        return (
          <Sequence key={o.id} name={o.id} from={from} durationInFrames={dur} layout="none">
            <C dur={dur} o={o as O} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
