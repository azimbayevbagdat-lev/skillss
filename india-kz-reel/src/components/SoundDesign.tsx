import React from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { SCENES, SceneId } from "../theme";

// Sound design modeled on the reference reel. All SFX are synthesized by scripts/make-sfx.py.
type Sfx =
  | "boom"
  | "hit"
  | "whoosh"
  | "swoosh"
  | "pop"
  | "blip"
  | "tick"
  | "shimmer"
  | "riser"
  | "wind"
  | "zap"
  | "glitch";
type Cue = { sfx: Sfx; at: number; volume: number };

const S = (id: SceneId) => SCENES.find((s) => s.id === id)!.start;
const every = (
  sfx: Sfx,
  from: number,
  to: number,
  step: number,
  volume: number,
): Cue[] => {
  const out: Cue[] = [];
  for (let t = from; t < to; t += step) out.push({ sfx, at: t, volume });
  return out;
};
const stagger = (
  sfx: Sfx,
  from: number,
  n: number,
  step: number,
  volume: number,
): Cue[] =>
  new Array(n).fill(0).map((_, i) => ({ sfx, at: from + i * step, volume }));

const CUES: Cue[] = [
  // 1 Hook: India assembles, then the big question lands on a boom
  { sfx: "whoosh", at: 0.0, volume: 0.35 },
  { sfx: "boom", at: 1.6, volume: 0.42 },
  // 2 One moment: particle swarm + counters running
  { sfx: "whoosh", at: S("oneMoment") - 0.2, volume: 0.4 },
  { sfx: "shimmer", at: S("oneMoment") + 0.15, volume: 0.45 },
  ...every("tick", S("oneMoment") + 0.4, S("population") + 0.3, 0.11, 0.22),
  // 3 ×70+
  { sfx: "swoosh", at: S("population") - 0.15, volume: 0.35 },
  ...every("blip", S("population") + 0.15, S("cities") - 0.1, 0.14, 0.16),
  // 4 Cities overflow: boom + pins
  { sfx: "boom", at: S("cities"), volume: 0.42 },
  ...stagger("pop", S("cities") + 0.1, 3, 0.65, 0.4),
  // 5 Shortage: alarm + tags
  { sfx: "glitch", at: S("shortage"), volume: 0.3 },
  ...stagger("pop", S("shortage") + 0.1, 4, 0.45, 0.35),
  // 6 Resettle
  { sfx: "whoosh", at: S("resettle") - 0.2, volume: 0.4 },
  { sfx: "shimmer", at: S("resettle") + 0.2, volume: 0.25 },
  // 7 Problem
  { sfx: "boom", at: S("problem"), volume: 0.42 },
  { sfx: "glitch", at: S("problem") + 0.05, volume: 0.25 },
  // 8 Area: India slides over Kazakhstan, then the verdict
  { sfx: "whoosh", at: S("area") + 0.15, volume: 0.5 },
  { sfx: "hit", at: S("area") + 3.6, volume: 0.45 },
  { sfx: "riser", at: S("area") + 6.3 - 1.5, volume: 0.35 },
  { sfx: "hit", at: S("area") + 6.3, volume: 0.6 },
  // 9 Desert
  { sfx: "swoosh", at: S("desert") - 0.15, volume: 0.35 },
  // 10 North: cold wind
  { sfx: "swoosh", at: S("north") - 0.15, volume: 0.35 },
  { sfx: "hit", at: S("north") + 0.05, volume: 0.35 },
  { sfx: "wind", at: S("north"), volume: 0.45 },
  // 10b Adapt
  { sfx: "swoosh", at: S("adapt") - 0.15, volume: 0.35 },
  // 11 Build: new cities, roads, power plants
  { sfx: "whoosh", at: S("build") - 0.2, volume: 0.35 },
  ...stagger("tick", S("build") + 0.95, 12, 2 / 30, 0.3),
  { sfx: "swoosh", at: S("build") + 1.6, volume: 0.3 },
  ...stagger("pop", S("build") + 0.95, 4, 0.6, 0.35),
  ...stagger("zap", S("build") + 3.1, 6, 0.1, 0.3),
  // 12 Result: riser → boom
  { sfx: "riser", at: S("result") - 1.5, volume: 0.4 },
  { sfx: "boom", at: S("result"), volume: 0.42 },
  // 13 Density counter
  { sfx: "swoosh", at: S("density") - 0.15, volume: 0.35 },
  ...stagger("pop", S("density") + 0.6, 3, 0.2, 0.3),
  ...every("blip", S("density") + 1.4, S("density") + 4.4, 0.1, 0.15),
  { sfx: "hit", at: S("density") + 4.9, volume: 0.5 },
  // 14 Final: riser → boom
  { sfx: "riser", at: S("final") - 1.5, volume: 0.4 },
  { sfx: "boom", at: S("final"), volume: 0.5 },
];

export const SoundDesign: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      {CUES.map((c, i) => (
        <Sequence
          key={i}
          from={Math.max(0, Math.round(c.at * fps))}
          layout="none"
          name={`sfx ${c.sfx}`}
        >
          <Audio src={staticFile(`sfx/${c.sfx}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
    </>
  );
};
