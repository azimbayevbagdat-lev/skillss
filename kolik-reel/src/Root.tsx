import React from "react";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { Main } from "./Main";
import { FPS, H, TAIL_SECONDS, W } from "./theme";

const calculateMetadata: CalculateMetadataFunction<
  Record<string, unknown>
> = async () => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(staticFile("voiceover.wav")),
  });
  const seconds = await input.computeDuration();
  return {
    durationInFrames: Math.ceil((seconds + TAIL_SECONDS) * FPS),
    defaultOutName: "kolikte-jurek-ainu",
  };
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Main"
      component={Main}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={1720}
      calculateMetadata={calculateMetadata}
    />
    <Composition
      id="FontTest"
      component={() => (
        <div
          style={{
            background: "#fff",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 40,
          }}
        >
          <div style={{ fontFamily: "Oswald", fontWeight: 700, fontSize: 150 }}>
            ӘҒҚҢӨҰҮҺІ
          </div>
          <div style={{ fontFamily: "Oswald", fontWeight: 700, fontSize: 110 }}>
            әғқңөұүһі
          </div>
          <div style={{ fontFamily: "Pangolin", fontSize: 120 }}>
            ӘҒҚҢӨҰҮҺІ 2–12
          </div>
        </div>
      )}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={1}
    />
  </>
);
