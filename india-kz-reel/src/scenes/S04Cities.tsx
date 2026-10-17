import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Header } from "../components/Header";
import { CITIES, P, toScreen } from "../geo";
import { C, FONT_BODY, GRAD, H, W } from "../theme";
import { Heat, KzMap, SceneProps, breathe, ease, sec } from "./common";

// «Астана, Алматы, Шымкент лық толады.»
const ORDER = [
  { key: "astana", at: 0.1, dx: 0, dy: -46 },
  { key: "almaty", at: 0.75, dx: 40, dy: 54 },
  { key: "shymkent", at: 1.4, dx: -60, dy: 56 },
] as const;

export const S04Cities: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = breathe(frame, dur, 1);
  return (
    <AbsoluteFill>
      <KzMap cam={cam}>
        <Heat main={0.9 + 0.1 * Math.sin(frame / 4)} spread={0.45} />
      </KzMap>
      <svg
        width={W}
        height={H}
        style={{
          position: "absolute",
          inset: 0,
          filter: `drop-shadow(0 0 10px ${C.red})`,
        }}
      >
        {ORDER.map(({ key, at }) => {
          const [x, y] = toScreen(cam, P(CITIES[key].ll));
          const f = frame - sec(at);
          if (f < 0) return null;
          return (
            <g key={key}>
              {[0, 14, 28].map((o) => {
                const t = ((f + o) % 42) / 42;
                return (
                  <circle
                    key={o}
                    cx={x}
                    cy={y}
                    r={10 + t * 70}
                    fill="none"
                    stroke={C.pink}
                    strokeWidth={4 * (1 - t)}
                    opacity={1 - t}
                  />
                );
              })}
              <circle
                cx={x}
                cy={y}
                r={12 + 3 * Math.sin(f / 3)}
                fill="#fff"
                stroke={C.red}
                strokeWidth={5}
              />
            </g>
          );
        })}
      </svg>
      {ORDER.map(({ key, at, dx, dy }) => {
        const [x, y] = toScreen(cam, P(CITIES[key].ll));
        const o = ease(frame, sec(at), sec(at) + 8);
        return (
          <div
            key={key}
            style={{
              position: "absolute",
              left: x + dx - 150,
              top: y + dy - 26,
              width: 300,
              textAlign: "center",
              fontFamily: FONT_BODY,
              fontWeight: 800,
              fontSize: 42,
              color: "#fff",
              textShadow: `0 0 14px ${C.red}, 0 2px 6px #000`,
              opacity: o,
              translate: `0 ${(1 - o) * 14}px`,
            }}
          >
            {CITIES[key].name}
          </div>
        );
      })}
      <Header kicker="Ірі қалалар" title="ЛЫҚ ТОЛЫ" grad={GRAD.danger} />
    </AbsoluteFill>
  );
};
