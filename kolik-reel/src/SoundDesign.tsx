import React from "react";
import { Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { FPS, SCENES, SceneId, sceneStart } from "./theme";

// Cartoon sound design. All files are synthesized by scripts/make-sfx.py.
// Levels stay well under the voice (most ≤ 0.25).
type Sfx =
  | "whoosh"
  | "water"
  | "pop"
  | "blip"
  | "zap"
  | "hit"
  | "alarm"
  | "gulp"
  | "scribble"
  | "ding"
  | "click"
  | "dizzy"
  | "swoosh"
  | "wind";
type Cue = { sfx: Sfx; at: number; volume: number; dur?: number };

const S = sceneStart;
const at = (id: SceneId, local: number) => S(id) + local;

const CUES: Cue[] = [
  // soft whoosh on every scene change
  ...SCENES.slice(1).map((s) => ({
    sfx: "whoosh" as const,
    at: s.start - 0.18,
    volume: 0.1,
  })),
  // 1 hook: face turns green
  { sfx: "gulp", at: at("hook", 1.7), volume: 0.27 },
  // 2 signal war: two bolts, then the clash
  { sfx: "zap", at: at("signal", 0.13), volume: 0.34 },
  { sfx: "zap", at: at("signal", 0.3), volume: 0.31 },
  { sfx: "hit", at: at("signal", 0.87), volume: 0.3 },
  // 3 inner ear: magnifier zoom + speech bubble
  { sfx: "swoosh", at: at("ear", 0.2), volume: 0.27 },
  { sfx: "pop", at: at("ear", 0.7), volume: 0.4 },
  // 4 eye: speech bubble
  { sfx: "pop", at: at("eye", 0.6), volume: 0.4 },
  // 5 brain: signals arrive, then the warning
  { sfx: "blip", at: at("brain", 0.3), volume: 0.22 },
  { sfx: "blip", at: at("brain", 0.8), volume: 0.22 },
  { sfx: "alarm", at: at("brain", 1.85), volume: 0.18 },
  { sfx: "hit", at: at("brain", 1.85), volume: 0.2 },
  // 6 nausea: bottle pops in, queasy gulp, arrow shoots up
  { sfx: "pop", at: at("nausea", 0.2), volume: 0.35 },
  { sfx: "gulp", at: at("nausea", 0.4), volume: 0.3 },
  { sfx: "swoosh", at: at("nausea", 1.0), volume: 0.3 },
  // 7 back seat: red dashed circle is drawn
  { sfx: "scribble", at: at("backseat", 1.0), volume: 0.36 },
  // 8 driver: thought cloud + green arrow drawn
  { sfx: "pop", at: at("driver", 1.2), volume: 0.35 },
  { sfx: "scribble", at: at("driver", 1.8), volume: 0.32 },
  // 9 slow sway: water + stopwatch ticks 1…5
  { sfx: "water", at: at("sway", 0), volume: 0.1, dur: S("kids") - S("sway") },
  ...[1, 2, 3, 4, 5].map((k) => ({
    sfx: "blip" as const,
    at: at("sway", 0.2 + k),
    volume: 0.12,
  })),
  // 10 kids: "2–12" hand-written
  { sfx: "scribble", at: at("kids", 2.3), volume: 0.36 },
  // 11 phone: notification + dizzy spiral
  { sfx: "blip", at: at("phone", 0.15), volume: 0.27 },
  { sfx: "dizzy", at: at("phone", 0.4), volume: 0.16 },
  // 12 solution: gaze line to the horizon, then the check mark
  { sfx: "swoosh", at: at("solution", 4.2), volume: 0.27 },
  { sfx: "ding", at: at("solution", 5.7), volume: 0.3 },
  // 13 window opens, wind blows in
  { sfx: "swoosh", at: at("window", 0.05), volume: 0.22 },
  { sfx: "wind", at: at("window", 0.2), volume: 0.23 },
  // 14 CTA: title pops, button click
  { sfx: "pop", at: at("cta", 0.15), volume: 0.35 },
  { sfx: "click", at: at("cta", 2.95), volume: 0.3 },
  { sfx: "ding", at: at("cta", 3.0), volume: 0.22 },
];

export const SoundDesign: React.FC = () => (
  <>
    {CUES.map((c, i) => (
      <Sequence
        key={i}
        from={Math.max(0, Math.round(c.at * FPS))}
        durationInFrames={c.dur ? Math.round(c.dur * FPS) : undefined}
        layout="none"
        name={`sfx ${c.sfx}`}
      >
        <Audio src={staticFile(`sfx/${c.sfx}.wav`)} volume={c.volume} />
      </Sequence>
    ))}
  </>
);
