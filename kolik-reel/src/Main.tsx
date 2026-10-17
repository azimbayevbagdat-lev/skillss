import React from "react";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { BoilDefs, PaperGrain } from "./doodle/Boil";
import { Captions } from "./Captions";
import { SoundDesign } from "./SoundDesign";
import { FPS, SCENES, SceneId, TRANSITION_FRAMES } from "./theme";
import { SceneProps } from "./scenes/common";
import { S01Hook } from "./scenes/S01Hook";
import { S02Signal } from "./scenes/S02Signal";
import { S03Ear } from "./scenes/S03Ear";
import { S04Eye } from "./scenes/S04Eye";
import { S05Brain } from "./scenes/S05Brain";
import { S06Nausea } from "./scenes/S06Nausea";
import { S07Backseat } from "./scenes/S07Backseat";
import { S08Driver } from "./scenes/S08Driver";
import { S09Sway } from "./scenes/S09Sway";
import { S10Kids } from "./scenes/S10Kids";
import { S11Phone } from "./scenes/S11Phone";
import { S12Solution } from "./scenes/S12Solution";
import { S13Window } from "./scenes/S13Window";
import { S14Cta } from "./scenes/S14Cta";

const COMPONENTS: Record<SceneId, React.FC<SceneProps>> = {
  hook: S01Hook,
  signal: S02Signal,
  ear: S03Ear,
  eye: S04Eye,
  brain: S05Brain,
  nausea: S06Nausea,
  backseat: S07Backseat,
  driver: S08Driver,
  sway: S09Sway,
  kids: S10Kids,
  phone: S11Phone,
  solution: S12Solution,
  window: S13Window,
  cta: S14Cta,
};

// Alternate quick fades and soft slides (7 frames)
const presentationFor = (i: number) =>
  i % 3 === 2 ? slide({ direction: "from-right" }) : fade();

export const Main: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const starts = SCENES.map((s) => Math.round(s.start * FPS));
  const T = TRANSITION_FRAMES;
  return (
    <AbsoluteFill style={{ backgroundColor: "#f3e6cf" }}>
      <BoilDefs />
      <TransitionSeries>
        {SCENES.map((s, i) => {
          const last = i === SCENES.length - 1;
          const len = (last ? durationInFrames : starts[i + 1]) - starts[i];
          const seqDur = last ? len : len + T;
          const Comp = COMPONENTS[s.id];
          return (
            <React.Fragment key={s.id}>
              <TransitionSeries.Sequence durationInFrames={seqDur} name={s.id}>
                <Comp dur={seqDur} />
              </TransitionSeries.Sequence>
              {!last ? (
                <TransitionSeries.Transition
                  presentation={presentationFor(i)}
                  timing={linearTiming({ durationInFrames: T })}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      <PaperGrain opacity={0.28} />
      <Captions />
      <Audio src={staticFile("voiceover.wav")} />
      <SoundDesign />
    </AbsoluteFill>
  );
};
