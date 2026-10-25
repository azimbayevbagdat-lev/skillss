import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import plan from "./plan.json";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={Reel}
      durationInFrames={Math.round(plan.duration * plan.fps)}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
