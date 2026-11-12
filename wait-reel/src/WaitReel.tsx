import { Audio } from "@remotion/media";
import type { Caption } from "@remotion/captions";
import { ThreeCanvas } from "@remotion/three";
import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captionsJson from "./captions.json";
import { Captions } from "./Captions";
import { FPS, SceneStart, T } from "./lib/time";
import { RoomScenes } from "./scenes/RoomScenes";
import { BrainScene } from "./scenes/BrainScene";
import { DoubtScene } from "./scenes/DoubtScene";
import { HourglassScene } from "./scenes/HourglassScene";
import { ScaleScene } from "./scenes/ScaleScene";
import { ChartScene } from "./scenes/ChartScene";
import { NightScenes } from "./scenes/NightScenes";
import { CtaScene } from "./scenes/CtaScene";

const captions = captionsJson as Caption[];
const XF = 8; // crossfade frames between scenes

const f = (s: number) => Math.round(s * FPS);

const Scene3D: React.FC<{ start: number; end: number; name: string; children: React.ReactNode; first?: boolean; last?: boolean }> = ({
  start,
  end,
  name,
  children,
  first,
  last,
}) => {
  const from = f(start) - (first ? 0 : XF);
  const dur = f(end) - from;
  return (
    <Sequence from={from} durationInFrames={dur} name={name}>
      <SceneFade dur={dur} first={first} last={last}>
        <SceneStart.Provider value={from / FPS}>
          <Canvas3D>{children}</Canvas3D>
        </SceneStart.Provider>
      </SceneFade>
    </Sequence>
  );
};

const SceneFade: React.FC<{ dur: number; first?: boolean; last?: boolean; children: React.ReactNode }> = ({
  dur,
  first,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = first ? 1 : interpolate(frame, [0, XF], [0, 1], { extrapolateRight: "clamp" });
  void dur;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

const Canvas3D: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      dpr={1}
      gl={{ antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      camera={{ fov: 35, near: 0.02, far: 30, position: [0, 1.5, 4] }}
    >
      {children}
    </ThreeCanvas>
  );
};

/** Sound helpers */
const Sfx: React.FC<{ src: string; at: number; volume?: number; dur?: number; name?: string }> = ({
  src,
  at,
  volume = 1,
  dur,
  name,
}) => (
  <Sequence from={f(at)} durationInFrames={dur ? f(dur) : undefined} name={name ?? src} layout="none">
    <Audio src={staticFile(`sfx/${src}`)} volume={volume} />
  </Sequence>
);

const Bed: React.FC<{ src: string; from: number; to: number; vol: (t: number) => number; name: string }> = ({
  src,
  from,
  to,
  vol,
  name,
}) => (
  <Sequence from={f(from)} durationInFrames={f(to) - f(from)} name={name} layout="none">
    <Audio src={staticFile(`sfx/${src}`)} loop volume={(fr) => vol(fr / FPS)} />
  </Sequence>
);

export const WaitReel: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const end = durationInFrames / FPS;
  return (
    <AbsoluteFill style={{ backgroundColor: "#120f1c" }}>
      <Scene3D start={T.s1} end={T.s4} name="1-3 Дүкенге жазу / күту / басқа дүкен" first>
        <RoomScenes />
      </Scene3D>
      <Scene3D start={T.s4} end={T.s5} name="4 Мидағы от">
        <BrainScene />
      </Scene3D>
      <Scene3D start={T.s5} end={T.s6} name="5 Белгісіздік">
        <DoubtScene />
      </Scene3D>
      <Scene3D start={T.s6} end={T.s7} name="6 Құмсағаттар">
        <HourglassScene />
      </Scene3D>
      <Scene3D start={T.s7} end={T.s8} name="7 Таразы">
        <ScaleScene />
      </Scene3D>
      <Scene3D start={T.s8} end={T.s9} name="8 Гарвард диаграммасы">
        <ChartScene />
      </Scene3D>
      <Scene3D start={T.s9} end={T.s11} name="9-10 Түн / чат-бот">
        <NightScenes />
      </Scene3D>
      <Scene3D start={T.s11} end={end} name="11 CTA" last>
        <CtaScene />
      </Scene3D>

      <Captions captions={captions} />

      {/* ---------------- audio ---------------- */}
      <Audio src={staticFile("voiceover.mp3")} name="Voiceover" volume={1} />
      {/* music ≈ -22 dB under the voice (voice mean -16.8 dB, music mean -18.1 dB) */}
      <Audio
        src={staticFile("sfx/music_bg.mp3")}
        name="Music"
        volume={(fr) =>
          interpolate(fr, [0, 20, durationInFrames - 45, durationInFrames], [0, 0.085, 0.085, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <Sfx src="send_whoosh.mp3" at={3.38} volume={0.35} name="Whoosh: хабарлама жіберу" />
      <Bed
        src="clock_tick.mp3"
        name="Сағат тықылы"
        from={4.25}
        to={10.6}
        vol={(t) => interpolate(t, [0, 1.5, 5.6, 6.35], [0.12, 0.3, 0.75, 0], { extrapolateRight: "clamp" })}
      />
      <Sfx src="msg_ding.mp3" at={11.42} volume={0.4} name="Дзың: жауап келді" />
      <Sequence from={f(15.6)} durationInFrames={f(24.9) - f(15.6)} name="От лаулап сөнеді" layout="none">
        <Audio
          src={staticFile("sfx/fire_fade.mp3")}
          volume={(fr) => interpolate(fr / FPS, [0, 0.4, 8.6, 9.3], [0, 0.9, 0.9, 0], { extrapolateRight: "clamp" })}
        />
      </Sequence>
      <Bed
        src="anxiety_drone.mp3"
        name="Белгісіздік дроны"
        from={T.s5}
        to={T.s6 + 0.3}
        vol={(t) => interpolate(t, [0, 2, 9.5, 12.1], [0, 0.11, 0.14, 0], { extrapolateRight: "clamp" })}
      />
      <Sfx src="scale_thud.mp3" at={45.15} volume={1} name="Дүрс: таразы" />
      <Sfx src="rise_whoosh.mp3" at={55.5} volume={0.28} name="Whoosh: диаграмма өседі" />
      <Bed
        src="night_ambience.mp3"
        name="Түнгі атмосфера"
        from={T.s9 - 0.2}
        to={T.s10 + 1.2}
        vol={(t) => interpolate(t, [0, 1, 8.5, 10.2], [0, 1, 1, 0], { extrapolateRight: "clamp" })}
      />
      {[64.2, 65.6, 66.9, 68.1].map((s, i) => (
        <Sfx key={s} src="msg_ding.mp3" at={s} volume={0.16 + i * 0.03} name={`Дзың: түнгі хабарлама ${i + 1}`} />
      ))}
      <Sfx src="robot_sparkle.mp3" at={71.0} volume={0.45} name="Робот пайда болады" />
      {[75.9, 77.5, 79.4].map((s, i) => (
        <Sfx key={s} src="msg_ding.mp3" at={s} volume={0.22} name={`Дзың: бот жауабы ${i + 1}`} />
      ))}
      <Sfx src="cta_chime.mp3" at={86.4} volume={0.5} name="CTA chime" />
    </AbsoluteFill>
  );
};
