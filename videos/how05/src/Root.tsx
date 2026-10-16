import { Composition } from "remotion";
import { How05 } from "./How05";
import { FPS, H, W } from "./theme";
import { TOTAL_FRAMES } from "./timeline";

export const RemotionRoot = () => (
  <Composition id="How05" component={How05} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
);
