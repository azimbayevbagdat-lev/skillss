import { Composition } from "remotion";
import { DURATION_FRAMES, FPS } from "./lib/time";
import { WaitReel } from "./WaitReel";
import "./lib/fonts";

export const RemotionRoot = () => (
  <Composition
    id="WaitReel"
    component={WaitReel}
    durationInFrames={DURATION_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
