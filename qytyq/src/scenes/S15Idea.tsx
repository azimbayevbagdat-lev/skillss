import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { pop, wob } from "../lib/anim";
import { cue } from "../lib/timeline";
import { Character } from "../three/Character";
import { GlowDot } from "../three/Props";
import { Backdrop, BlobShadow, Floor, Stage } from "../three/Stage";
import { SceneProps } from "./shared";

const LINES: { t: string; key?: boolean }[][] = [
  [{ t: "Біз" }, { t: "КҮТПЕГЕН", key: true }],
  [{ t: "нәрсені" }, { t: "ғана" }],
  [{ t: "шын" }, { t: "сеземіз" }],
];

/** 15. Slow camera, warm light, the key idea in big letters. */
export const S15Idea: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const at = cue(14, "біз");
  const cam: [number, number, number] = [Math.sin(f * 0.01) * 1.2, 1.6, 9 - (f / dur) * 0.8];
  return (
    <AbsoluteFill>
      <Stage camera={cam} target={[0, 2.0, 0]} warm={1.25} backdrop={<Backdrop top="#ffe2b8" bottom="#f08a5d" bokeh={["#fff1b8", "#ffcf8a", "#ffb08a"]} seed={15} />}>
        <Floor color="#f4bf8f" />
        <BlobShadow size={2.4} />
        <Character position={[0, 0, 0]} scale={0.8} face={{ smile: 0.9, eyesClosed: 0.6, brow: 0.3 }} headNod={-0.12} blush={0.8} />
        {new Array(10).fill(0).map((_, i) => (
          <GlowDot key={i} position={[Math.cos(i * 2.4) * 2.8, 0.5 + ((f * 0.01 + i * 0.37) % 4), -1 + Math.sin(i) * 1.5]} size={0.3} color="#fff0b0" intensity={0.6 + wob(f, 0.1, 0.3, i)} />
        ))}
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 170, pointerEvents: "none" }}>
        {LINES.map((line, li) => (
          <div key={li} style={{ display: "flex", gap: 26 }}>
            {line.map((w, wi) => {
              const k = li * 2 + wi;
              const s = pop(f, at + k * 5, 12);
              return (
                <span
                  key={wi}
                  style={{
                    fontFamily: "Montserrat",
                    fontWeight: 900,
                    fontSize: w.key ? 128 : 112,
                    lineHeight: 1.08,
                    color: w.key ? "#ff6a2b" : "#fffaf2",
                    WebkitTextStroke: "14px #5a2410",
                    paintOrder: "stroke fill",
                    textShadow: "0 10px 0 rgba(90,36,16,0.5)",
                    transform: `scale(${interpolate(s, [0, 1], [0.4, 1])})`,
                    opacity: Math.min(1, s * 1.5),
                    display: "inline-block",
                  }}
                >
                  {w.t}
                </span>
              );
            })}
          </div>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
