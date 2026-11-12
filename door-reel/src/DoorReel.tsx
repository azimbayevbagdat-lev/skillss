import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { World } from "./three/World";
import { Captions } from "./components/Captions";
import { CallToAction, CutDips } from "./components/Overlays";
import { CAPTIONS } from "./captions";
import { SCENES, T, VOICE_DURATION } from "./timeline";

/** Music sits ~22 dB under the voice (voice −17.3 LUFS, music −16.4 LUFS → gain −22.9 dB). */
const MUSIC_GAIN = 0.071;

type Sfx = {
  name: string;
  file: string;
  at: number;
  volume: number;
  dur?: number;
  fadeOut?: number;
};

const SFX: Sfx[] = [
  // scene 1–2: walk to the door, door opens, stop
  {
    name: "Footsteps to door",
    file: "footsteps.mp3",
    at: T.walkStart,
    volume: 0.6,
    dur: T.stop - T.walkStart,
    fadeOut: 0.3,
  },
  {
    name: "Door creak",
    file: "door-creak.mp3",
    at: T.doorOpen1 - 0.1,
    volume: 0.55,
  },
  {
    name: "Record scratch",
    file: "record-scratch.mp3",
    at: T.stop - 0.05,
    volume: 0.22,
    dur: 1.2,
    fadeOut: 0.4,
  },
  // scene 3: «Кінәлі — ЕСІК»
  {
    name: "Boom",
    file: "boom.mp3",
    at: T.doorHit - 0.04,
    volume: 0.3,
    dur: 3.2,
    fadeOut: 1.4,
  },
  // scene changes
  {
    name: "Whoosh → brain",
    file: "whoosh.mp3",
    at: SCENES.s4Brain - 0.35,
    volume: 0.32,
  },
  {
    name: "Lid click",
    file: "box-click.mp3",
    at: T.lidClose - 0.05,
    volume: 0.4,
    dur: 1.2,
  },
  {
    name: "Whoosh → new room",
    file: "whoosh.mp3",
    at: SCENES.s6NewRoom - 0.35,
    volume: 0.32,
  },
  {
    name: "Footsteps kitchen",
    file: "footsteps.mp3",
    at: T.kitchenWalk,
    volume: 0.5,
    dur: 2.4,
    fadeOut: 0.3,
  },
  {
    name: "Whip pan",
    file: "whoosh.mp3",
    at: T.oldThought - 0.15,
    volume: 0.18,
  },
  {
    name: "Lid click (old thought)",
    file: "box-click.mp3",
    at: T.oldThought + 1.25,
    volume: 0.25,
    dur: 1.2,
  },
  {
    name: "Whoosh → experiment",
    file: "whoosh.mp3",
    at: SCENES.s7Experiment - 0.35,
    volume: 0.32,
  },
  {
    name: "Footsteps experiment",
    file: "footsteps.mp3",
    at: T.expWalk,
    volume: 0.35,
    dur: 4,
    fadeOut: 0.8,
  },
  {
    name: "Thought pop",
    file: "whoosh.mp3",
    at: T.expCross + 0.2,
    volume: 0.22,
  },
  {
    name: "Whoosh → return",
    file: "whoosh.mp3",
    at: SCENES.s8Return - 0.35,
    volume: 0.32,
  },
  // scene 8: back to the first room
  {
    name: "Door creak 2",
    file: "door-creak.mp3",
    at: T.doorOpen2 - 0.1,
    volume: 0.45,
  },
  {
    name: "Footsteps back",
    file: "footsteps.mp3",
    at: T.walkBack,
    volume: 0.55,
    dur: 2.9,
    fadeOut: 0.3,
  },
  {
    name: "Box sparkle",
    file: "sparkle.mp3",
    at: T.boxOpen - 0.05,
    volume: 0.35,
  },
  { name: "Idea ding", file: "ding.mp3", at: T.aha - 0.05, volume: 0.6 },
  // scene 9: carry the thought through the door
  {
    name: "Orb sparkle",
    file: "sparkle.mp3",
    at: T.orbForm - 0.2,
    volume: 0.25,
  },
  {
    name: "Footsteps carry",
    file: "footsteps.mp3",
    at: T.carryWalk,
    volume: 0.55,
    dur: 3.0,
    fadeOut: 0.4,
  },
  // scene 10: CTA
  { name: "Whoosh → CTA", file: "whoosh.mp3", at: SCENES.s10Cta, volume: 0.25 },
  {
    name: "CTA chime",
    file: "chime.mp3",
    at: SCENES.s10Cta + 0.25,
    volume: 0.7,
  },
  {
    name: "Subscribe click",
    file: "box-click.mp3",
    at: T.subscribe + 0.7,
    volume: 0.3,
    dur: 1,
  },
];

export const DoorReel: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill>
        <World />
      </AbsoluteFill>
      <CutDips />
      <CallToAction />
      {/* captions: slightly below centre, right edge and bottom 20% kept free for the IG/TikTok UI */}
      <Captions captions={CAPTIONS} left={70} width={830} top={1150} />

      <Audio name="Voiceover" src={staticFile("voiceover.mp3")} volume={1} />
      <Audio
        name="Music"
        src={staticFile("sfx/music-a.mp3")}
        volume={(f) =>
          MUSIC_GAIN *
          interpolate(
            f,
            [0, 0.6 * fps, durationInFrames - 2.5 * fps, durationInFrames],
            [0, 1, 1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          )
        }
        trimAfter={Math.ceil(VOICE_DURATION * fps) + 5}
      />
      {SFX.map((s, i) => {
        const from = Math.max(0, Math.round(s.at * fps));
        const durF = s.dur ? Math.round(s.dur * fps) : undefined;
        const fade = s.fadeOut ? s.fadeOut * fps : 0;
        return (
          <Sequence
            key={i}
            name={s.name}
            from={from}
            durationInFrames={durF ?? Math.round(4 * fps)}
            layout="none"
          >
            <Audio
              src={staticFile("sfx/" + s.file)}
              volume={(f) =>
                s.volume *
                (durF && fade > 0
                  ? interpolate(f, [durF - fade, durF], [1, 0], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    })
                  : 1)
              }
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
