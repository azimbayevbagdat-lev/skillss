import { Composition } from "remotion";
import { Qytyq } from "./Qytyq";
import { FPS } from "./lib/anim";
import { TOTAL_FRAMES } from "./lib/timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition id="Qytyq" component={Qytyq} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
  );
};
