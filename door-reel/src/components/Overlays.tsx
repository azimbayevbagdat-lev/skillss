import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FREEZE_AT, SCENES, T } from "../timeline";

const BellIcon: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" />
  </svg>
);

const ChatIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#3A6FF8">
    <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <circle cx="8" cy="10.5" r="1.4" fill="#fff" />
    <circle cx="12" cy="10.5" r="1.4" fill="#fff" />
    <circle cx="16" cy="10.5" r="1.4" fill="#fff" />
  </svg>
);

/** Final call to action. Placed in the upper part of the frame, away from the IG buttons. */
export const CallToAction: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.min(frame / fps, FREEZE_AT);
  const f = Math.round(t * fps);
  const start = Math.round((SCENES.s10Cta + 0.25) * fps);
  if (f < start) return null;
  const cardIn = spring({
    frame: f - start,
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const btnStart = Math.round((T.subscribe - 0.9) * fps);
  const btnIn = spring({ frame: f - btnStart, fps, config: { damping: 12 } });
  const pressF = Math.round((T.subscribe + 0.7) * fps);
  const press = interpolate(f, [pressF, pressF + 4, pressF + 10], [1, 0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subscribed = f >= pressF + 4;
  const emph = spring({
    frame: f - Math.round(T.comment * fps),
    fps,
    config: { damping: 10 },
  });

  return (
    <div style={{ position: "absolute", left: 70, top: 210, width: 830 }}>
      <div
        style={{
          background: "rgba(255,255,255,0.94)",
          borderRadius: 44,
          padding: "40px 44px 44px",
          boxShadow: "0 24px 60px rgba(40,25,10,0.35)",
          transform: `translateY(${(1 - cardIn) * -80}px) scale(${0.9 + cardIn * 0.1})`,
          opacity: cardIn,
          fontFamily: "Montserrat",
          fontWeight: 800,
          color: "#1E1B18",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 48,
            color: "#3A6FF8",
          }}
        >
          <ChatIcon size={64} />
          Комментарийге жаз:
        </div>
        <div
          style={{
            fontSize: 70,
            lineHeight: 1.12,
            marginTop: 16,
            transform: `scale(${1 + emph * 0.04})`,
            transformOrigin: "left center",
          }}
        >
          есіктен басқа <span style={{ color: "#E07A2F" }}>кім кінәлі?</span>
        </div>
      </div>
      <div
        style={{
          marginTop: 34,
          display: "flex",
          justifyContent: "center",
          opacity: btnIn,
          transform: `translateY(${(1 - btnIn) * 40}px) scale(${press})`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "24px 56px",
            borderRadius: 999,
            background: subscribed ? "#EDEDED" : "#FF3B5C",
            color: subscribed ? "#2A2A2A" : "#FFFFFF",
            fontFamily: "Montserrat",
            fontWeight: 800,
            fontSize: 50,
            boxShadow: subscribed
              ? "0 10px 30px rgba(0,0,0,0.2)"
              : "0 14px 40px rgba(255,59,92,0.55)",
          }}
        >
          <BellIcon size={52} color={subscribed ? "#2A2A2A" : "#FFFFFF"} />
          {subscribed ? "Жазылдыңыз ✓" : "Жазылу"}
        </div>
      </div>
    </div>
  );
};

/** Quick dip-to-dark at hard cuts between sets. */
export const CutDips: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cuts = [
    SCENES.s4Brain,
    SCENES.s6NewRoom,
    SCENES.s7Experiment,
    SCENES.s8Return,
  ];
  let o = 0;
  for (const c of cuts) {
    const cf = c * fps;
    o = Math.max(
      o,
      interpolate(frame, [cf - 6, cf, cf + 7], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      }),
    );
  }
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#120C08",
        opacity: o * 0.9,
      }}
    />
  );
};
