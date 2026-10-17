import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Header } from "../components/Header";
import { NUM, C, FONT_BODY, GRAD } from "../theme";
import { Heat, KzMap, SceneProps, breathe, ease, sec } from "./common";

const fmt = (v: number) =>
  v < 100 ? v.toFixed(1).replace(".", ",") : String(Math.round(v));

const newDensity = (NUM.kzPop + NUM.indiaPop) / NUM.kzArea; // ≈540
const BARS = [
  { label: "Қазақстан (қазір)", v: NUM.kzPop / NUM.kzArea, color: C.kz2 },
  { label: "Үндістан", v: NUM.indiaPop / NUM.indiaArea, color: C.india1 },
  { label: "Қазақстан (жаңа)", v: newDensity, color: C.pink },
];

// «Тығыздық ... жеті жарым адамнан бес жүз қырық адамға дейін өседі — бұл Үндістанның өзінен де тығыз!»
export const S13Density: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cam = breathe(frame, dur, -1);
  const count = ease(frame, sec(1.4), sec(4.4));
  const v = interpolate(count, [0, 1], [7.5, 540]);
  const tBars = sec(0.6);
  const tLine = sec(4.9); // «бұл Үндістанның өзінен де тығыз»

  return (
    <AbsoluteFill>
      <KzMap cam={cam} opacity={0.4}>
        <Heat main={1} spread={1} fill={0.45} />
      </KzMap>
      <Header
        kicker="Тығыздық"
        title={`7,5 → ${fmt(v)}`}
        grad={GRAD.warm}
        sub="адам / км²"
      />
      <div
        style={{
          position: "absolute",
          top: 820,
          left: 90,
          right: 90,
          display: "flex",
          flexDirection: "column",
          gap: 34,
        }}
      >
        {BARS.map((b, i) => {
          const isNew = i === 2;
          const grow = isNew
            ? count
            : ease(frame, tBars + i * 6, tBars + i * 6 + 18);
          const val = isNew ? v : b.v * grow;
          return (
            <div
              key={b.label}
              style={{ opacity: ease(frame, tBars + i * 6, tBars + i * 6 + 8) }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: FONT_BODY,
                  fontSize: 38,
                  fontWeight: 700,
                  color: "#e9e6ff",
                  marginBottom: 10,
                }}
              >
                <span>{b.label}</span>
                <span
                  style={{
                    fontWeight: 800,
                    color: b.color,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmt(val)}
                </span>
              </div>
              <div
                style={{
                  height: 30,
                  borderRadius: 99,
                  background: "rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    height: 30,
                    width: `${Math.max(1.2, (val / 560) * 100)}%`,
                    borderRadius: 99,
                    background: `linear-gradient(90deg, ${b.color}aa, ${b.color})`,
                    boxShadow: `0 0 18px ${b.color}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1330,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT_BODY,
          fontWeight: 800,
          fontSize: 50,
          color: "#fff",
          textShadow: `0 0 20px ${C.pink}`,
          opacity: ease(frame, tLine, tLine + 8),
          scale: interpolate(ease(frame, tLine, tLine + 10), [0, 1], [0.85, 1]),
        }}
      >
        Үндістанның өзінен де тығыз
      </div>
    </AbsoluteFill>
  );
};
