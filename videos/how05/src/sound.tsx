import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";
import { CALLOUTS } from "./callouts";
import { shotStarts } from "./camera";
import { LIFTOFF, MORPH } from "./state";
import { FPS } from "./theme";
import { HAS_VOICE, T, TOTAL_FRAMES, VOICE_END_FRAME, WORDS } from "./timeline";

type Hit = { at: number; src: string; volume: number };

const sfx = (name: string) => staticFile(`sfx/${name}.wav`);

// Music ducks under speech: precompute a smoothed envelope per frame.
const DUCK = (() => {
  const speaking = new Float32Array(TOTAL_FRAMES);
  WORDS.forEach((w) => {
    for (let f = Math.round(w.start * FPS) - 6; f < Math.round(w.end * FPS) + 6; f++) if (f >= 0 && f < TOTAL_FRAMES) speaking[f] = 1;
  });
  const out = new Float32Array(TOTAL_FRAMES);
  let v = 0;
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const target = speaking[f];
    v += (target - v) * (target > v ? 0.25 : 0.04); // fast duck, slow release
    out[f] = v;
  }
  return out;
})();

const musicVolume = (f: number) => {
  const d = DUCK[Math.min(TOTAL_FRAMES - 1, Math.max(0, f))];
  const fadeOut = Math.min(1, Math.max(0, (TOTAL_FRAMES - f) / 45));
  return (0.07 - 0.035 * d) * fadeOut;
};

const HITS: Hit[] = [
  // air bursts
  { at: 2, src: sfx("air-burst"), volume: 0.3 },
  { at: MORPH, src: sfx("air-burst"), volume: 0.22 },
  { at: T.valve + 32, src: sfx("air-burst"), volume: 0.3 },
  { at: T.carUp + 4, src: sfx("air-burst"), volume: 0.3 },
  { at: LIFTOFF, src: sfx("air-burst"), volume: 0.32 },
  ...[0, 18, 36, 54].map((d) => ({ at: T.pulses + d, src: sfx("air-burst"), volume: 0.2 })),
  { at: T.land, src: sfx("air-burst"), volume: 0.26 },
  // valve
  { at: T.valve + 28, src: sfx("valve-click"), volume: 0.32 },
  // balloon
  { at: T.airOut, src: sfx("pff"), volume: 0.3 },
  { at: T.roadsterToo + 10, src: sfx("pff"), volume: 0.24 },
  // fans
  { at: T.fans, src: sfx("fan-hum"), volume: 0.3 },
  // UI ticks for callouts and cards
  ...CALLOUTS.map((c) => ({ at: c.at + 10, src: sfx("ui-tick"), volume: 0.22 })),
  ...[T.litres, T.unverified, T.limited + 10, T.ten + 20, T.s5 + 20, 12].map((at) => ({ at, src: sfx("ui-tick"), volume: 0.2 })),
  // camera flights between scenes
  ...shotStarts.slice(1).map((at) => ({ at: Math.max(0, at - 4), src: sfx("whoosh"), volume: 0.2 })),
  { at: T.next, src: sfx("ui-tick"), volume: 0.2 },
];

export const Soundtrack: React.FC = () => (
  <>
    {HAS_VOICE && (
      <Audio
        src={staticFile("voice/how05.mp3")}
        trimAfter={VOICE_END_FRAME}
        volume={(f) => Math.min(1, Math.max(0, (VOICE_END_FRAME - f) / 6))}
      />
    )}
    <Audio src={staticFile("music/pad.mp3")} volume={musicVolume} />
    {HITS.map((h, i) => (
      <Sequence key={i} from={h.at} durationInFrames={Math.round(3 * FPS)} layout="none">
        <Audio src={h.src} volume={h.volume} />
      </Sequence>
    ))}
  </>
);
