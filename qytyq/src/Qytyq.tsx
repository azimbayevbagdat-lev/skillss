import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import { fade } from "@remotion/transitions/fade";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { captionPageStartsMs, KaraokeCaptions } from "./Captions";
import { FPS } from "./lib/anim";
import { captions, cue, sceneStartFrames, TOTAL_FRAMES, words } from "./lib/timeline";
import { S01Tickled } from "./scenes/S01Tickled";
import { S02SelfTickle } from "./scenes/S02SelfTickle";
import { S03Why } from "./scenes/S03Why";
import { S04Brain } from "./scenes/S04Brain";
import { S05Predict } from "./scenes/S05Predict";
import { S06Compute } from "./scenes/S06Compute";
import { S07Dampen } from "./scenes/S07Dampen";
import { S08SoftTouch } from "./scenes/S08SoftTouch";
import { S09Unknown } from "./scenes/S09Unknown";
import { S10Startle } from "./scenes/S10Startle";
import { S11Lab } from "./scenes/S11Lab";
import { S12Delay } from "./scenes/S12Delay";
import { S13Mismatch } from "./scenes/S13Mismatch";
import { S14Machine } from "./scenes/S14Machine";
import { S15Idea } from "./scenes/S15Idea";
import { S16Subscribe } from "./scenes/S16Subscribe";

loadFont({ family: "Montserrat", url: staticFile("Montserrat.ttf"), weight: "100 900" });

const T = 10; // cross-fade length in frames

const SCENES = [
  S01Tickled, S02SelfTickle, S03Why, S04Brain, S05Predict, S06Compute, S07Dampen, S08SoftTouch,
  S09Unknown, S10Startle, S11Lab, S12Delay, S13Mismatch, S14Machine, S15Idea, S16Subscribe,
];
const NAMES = [
  "1 Қытықтау", "2 Өзін қытықтау", "3 Неге?", "4 Ми шығады", "5 Болжам голограммасы", "6 Есептеу",
  "7 Сигнал әлсірейді", "8 Жай жанасу", "9 Басқа адамның қолы", "10 Селт ету", "11 Зертхана",
  "12 +0.2 сек", "13 Болжам қате", "14 Болжау машинасы", "15 Басты ой", "16 Жазылу",
];

/** Scene i spans [start_i, start_{i+1}) plus the transition overlap, so it starts exactly on its sentence. */
const sceneDur = (i: number) => (i + 1 < sceneStartFrames.length ? sceneStartFrames[i + 1] : TOTAL_FRAMES) - sceneStartFrames[i] + (i + 1 < sceneStartFrames.length ? T : 0);

const abs = (scene: number, token: string, nth = 0) => sceneStartFrames[scene] + cue(scene, token, nth);

type Sfx = { name: string; src: string; at: number; vol: number };

const buildSfx = (): Sfx[] => {
  const s: Sfx[] = [];
  const add = (name: string, file: string, at: number, vol: number) => s.push({ name, src: `sfx/${file}`, at: Math.max(0, Math.round(at)), vol });
  // whoosh on every scene change
  sceneStartFrames.slice(1).forEach((f, i) => add(`whoosh ${i + 2}`, "whoosh.wav", f - 4, 0.22));
  add("laugh 1", "laugh_light.wav", abs(0, "шыдай") - 6, 0.45);
  add("tickle touch", "touch_soft.wav", 6, 0.35);
  add("shrug pluck", "pluck.wav", abs(1, "Ештеңе"), 0.4);
  add("question pop", "pop.wav", abs(2, "Неге?") - 2, 0.6);
  add("question sparkle", "sparkle.wav", abs(2, "Неге?"), 0.3);
  add("brain appears", "sparkle.wav", sceneStartFrames[3] + 6, 0.35);
  add("brain pop", "pop_soft.wav", sceneStartFrames[3] + 8, 0.45);
  add("hologram", "compute_kenney.wav", abs(4, "біліп"), 0.25);
  add("target lights", "confirm.wav", abs(4, "біліп") + 8, 0.3);
  add("computing", "compute.wav", sceneStartFrames[5] + 4, 0.35);
  add("bubble pop", "pop_soft.wav", abs(6, "«Бұл"), 0.5);
  add("weaken", "glitch.wav", abs(6, "сезімді"), 0.18);
  add("soft touch", "touch_soft.wav", abs(7, "терің") - 4, 0.5);
  [0, 48, 96, 144].forEach((d, i) => add(`hand pops ${i + 1}`, "pop_soft.wav", sceneStartFrames[8] + d + 2, 0.3));
  add("startle", "startle.wav", abs(9, "Селт") - 3, 0.55);
  add("signal flash", "sparkle.wav", abs(9, "тигенде") + 12, 0.35);
  add("laugh 2", "laugh_big.wav", abs(9, "күлкің") - 8, 0.5);
  add("lab ambience", "lab_ambience.wav", sceneStartFrames[10], 0.3);
  [0, 1, 2, 3, 4, 5].forEach((k) => add(`tick ${k + 1}`, "tick_clock.wav", abs(11, "кешігіп") - 4 + k * 8, 0.35));
  add("error buzz", "buzz_error.wav", abs(12, "алмай"), 0.32);
  add("laugh 3", "laugh_light.wav", abs(12, "қытығын") - 6, 0.45);
  add("machine", "compute_kenney.wav", sceneStartFrames[13] + 6, 0.2);
  add("idea sparkle", "sparkle.wav", abs(14, "біз"), 0.25);
  add("button click", "mouse-click.wav", abs(15, "парақшаға") - 2, 0.6);
  add("bell", "bell.wav", abs(15, "парақшаға") + 4, 0.45);
  // a very light pop for every new caption page
  captionPageStartsMs(captions).forEach((ms, i) => add(`caption pop ${i + 1}`, "pop_soft.wav", (ms / 1000) * FPS - 2, 0.07));
  return s;
};

/** Music ducking: low under speech, louder in pauses (attack 4 frames, release 14 frames). */
const useDuckEnvelope = () =>
  useMemo(() => {
    const active = new Float32Array(TOTAL_FRAMES);
    for (const w of words) {
      for (let f = Math.floor((w.start - 0.08) * FPS); f <= Math.ceil((w.end + 0.08) * FPS); f++) if (f >= 0 && f < TOTAL_FRAMES) active[f] = 1;
    }
    const env = new Float32Array(TOTAL_FRAMES);
    let v = 0;
    for (let f = 0; f < TOTAL_FRAMES; f++) {
      const target = active[f];
      v += (target - v) * (target > v ? 1 / 4 : 1 / 14);
      env[f] = v;
    }
    return env;
  }, []);

export const Qytyq: React.FC = () => {
  const sfx = useMemo(buildSfx, []);
  const duck = useDuckEnvelope();
  return (
    <AbsoluteFill style={{ background: "#f7c9a6" }}>
      <TransitionSeries>
        {SCENES.map((Scene, i) => {
          const d = sceneDur(i);
          return (
            <React.Fragment key={i}>
              <TransitionSeries.Sequence name={NAMES[i]} durationInFrames={d}>
                <Scene dur={d} />
              </TransitionSeries.Sequence>
              {i + 1 < SCENES.length && <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      <KaraokeCaptions captions={captions} />
      <Audio name="Дауыс" src={staticFile("audio/voice.mp3")} volume={1} />
      <Audio
        name="Фон музыкасы"
        src={staticFile("music/bg_music.wav")}
        volume={(f) => {
          const e = duck[Math.min(duck.length - 1, Math.max(0, f))];
          return 0.32 - e * 0.24; // 0.32 in pauses, 0.08 under speech
        }}
      />
      {sfx.map((s) => (
        <Sequence key={s.name} name={`SFX ${s.name}`} from={s.at} layout="none">
          <Audio src={staticFile(s.src)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
