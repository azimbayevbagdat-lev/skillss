import React from "react";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { MainReel, MainReelProps } from "./MainReel";
import { FPS, H, W } from "./theme";

const getAudioDurationInSeconds = async (src: string) => {
  const input = new Input({ formats: ALL_FORMATS, source: new UrlSource(src) });
  return input.computeDuration();
};

const calculateMetadata: CalculateMetadataFunction<MainReelProps> = async ({
  props,
}) => {
  const seconds = await getAudioDurationInSeconds(staticFile("voiceover.mp3"));
  // Background music is optional: only used when public/music.mp3 exists.
  const hasMusic = await fetch(staticFile("music.mp3"), { method: "HEAD" })
    .then((r) => r.ok)
    .catch(() => false);
  return {
    durationInFrames: Math.ceil(seconds * FPS),
    props: { ...props, hasMusic },
    defaultOutName: "india-kazakhstan",
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MainReel"
    component={MainReel}
    width={W}
    height={H}
    fps={FPS}
    durationInFrames={1945}
    defaultProps={{ hasMusic: false }}
    calculateMetadata={calculateMetadata}
  />
);
