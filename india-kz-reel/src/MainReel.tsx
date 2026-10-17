import React from "react";
import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Background, Vignette, Watermark } from "./components/Background";
import { CounterPills } from "./components/CounterPills";
import { Captions } from "./components/Captions";
import { SoundDesign } from "./components/SoundDesign";
import { FONT_BODY, FPS, SCENES, SceneId, TRANSITION_FRAMES } from "./theme";
import { SceneProps } from "./scenes/common";
import { S01Hook } from "./scenes/S01Hook";
import { S02OneMoment } from "./scenes/S02OneMoment";
import { S03Population } from "./scenes/S03Population";
import { S04Cities } from "./scenes/S04Cities";
import { S05Shortage } from "./scenes/S05Shortage";
import { S06Resettle } from "./scenes/S06Resettle";
import { S07Problem } from "./scenes/S07Problem";
import { S08Area } from "./scenes/S08Area";
import { S09Desert } from "./scenes/S09Desert";
import { S10North } from "./scenes/S10North";
import { S10bAdapt } from "./scenes/S10bAdapt";
import { S11Build } from "./scenes/S11Build";
import { S12Result } from "./scenes/S12Result";
import { S13Density } from "./scenes/S13Density";
import { S14Final } from "./scenes/S14Final";

const COMPONENTS: Record<SceneId, React.FC<SceneProps>> = {
  hook: S01Hook,
  oneMoment: S02OneMoment,
  population: S03Population,
  cities: S04Cities,
  shortage: S05Shortage,
  resettle: S06Resettle,
  problem: S07Problem,
  area: S08Area,
  desert: S09Desert,
  north: S10North,
  adapt: S10bAdapt,
  build: S11Build,
  result: S12Result,
  density: S13Density,
  final: S14Final,
};

export type MainReelProps = { hasMusic: boolean };

export const MainReel: React.FC<MainReelProps> = ({ hasMusic }) => {
  const { durationInFrames } = useVideoConfig();
  const starts = SCENES.map((s) => Math.round(s.start * FPS));
  const T = TRANSITION_FRAMES;

  return (
    <AbsoluteFill style={{ fontFamily: FONT_BODY }}>
      <Background />
      <TransitionSeries>
        {SCENES.map((s, i) => {
          const isLast = i === SCENES.length - 1;
          const len = (isLast ? durationInFrames : starts[i + 1]) - starts[i];
          const Comp = COMPONENTS[s.id];
          // Each sequence is extended by T so the next one starts exactly on its voice cue.
          const seqDur = isLast ? len : len + T;
          return (
            <React.Fragment key={s.id}>
              <TransitionSeries.Sequence durationInFrames={seqDur} name={s.id}>
                <Comp dur={seqDur} />
              </TransitionSeries.Sequence>
              {!isLast ? (
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: T })}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      <Vignette />
      <CounterPills />
      <Captions />
      <Watermark />
      <Audio src={staticFile("voiceover.mp3")} />
      <SoundDesign />
      {hasMusic ? <Audio src={staticFile("music.mp3")} volume={0.09} /> : null}
    </AbsoluteFill>
  );
};
