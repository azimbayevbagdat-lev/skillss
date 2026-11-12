import { Composition, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { DoorReel } from "./DoorReel";
import { DURATION_FRAMES, FPS } from "./timeline";

// Montserrat ExtraBold, merged latin + cyrillic + cyrillic-ext subsets (full Kazakh alphabet: ә ғ қ ң ө ұ ү һ і)
loadFont({
  family: "Montserrat",
  url: staticFile("fonts/Montserrat-ExtraBold-KK.woff2"),
  weight: "800",
});

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DoorReel"
      component={DoorReel}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
