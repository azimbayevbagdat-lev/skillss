import type { Caption } from "@remotion/captions";
import data from "../../timestamps.json";
import { FPS } from "./anim";

export type Word = { text: string; start: number; end: number };
export const words: Word[] = (data as { words: Word[] }).words;

export const AUDIO_DURATION = 70.69;
export const TAIL_SECONDS = 1.6;
export const TOTAL_FRAMES = Math.ceil((Math.max(AUDIO_DURATION, words[words.length - 1].end) + TAIL_SECONDS) * FPS);

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}-]/gu, "");

/** First words of each of the 16 scenes, in script order. */
export const SCENE_MARKERS = [
  "Біреу сені",
  "Ал өзіңді",
  "Неге?",
  "Себебі",
  "Сен қолыңды",
  "Ол оны",
  "Ал алдын",
  "Сондықтан",
  "Ал басқа",
  "Күтпеген",
  "Ғалымдар",
  "бірақ құрылғы",
  "ми болжай",
  "Яғни",
  "Ал біз",
  "Денең",
] as const;

const findSeq = (tokens: string[], from: number) => {
  for (let i = from; i < words.length; i++) {
    if (tokens.every((t, k) => words[i + k] && norm(words[i + k].text) === norm(t))) return i;
  }
  throw new Error(`Marker not found: ${tokens.join(" ")}`);
};

export const sceneWordIndex: number[] = [];
{
  let cursor = 0;
  for (const m of SCENE_MARKERS) {
    const i = findSeq(m.split(" "), cursor);
    sceneWordIndex.push(i);
    cursor = i + 1;
  }
}

const LEAD = 5; // scene starts slightly before its sentence
export const sceneStartFrames = sceneWordIndex.map((wi, k) =>
  k === 0 ? 0 : Math.max(0, Math.round(words[wi].start * FPS) - LEAD),
);

export const sec = (s: number) => Math.round(s * FPS);
export const wordStartFrame = (i: number) => Math.round(words[i].start * FPS);
export const wordEndFrame = (i: number) => Math.round(words[i].end * FPS);

/** Index of the nth word inside scene `scene` that starts with `token`. */
export const findWord = (scene: number, token: string, nth = 0) => {
  const from = sceneWordIndex[scene];
  const to = scene + 1 < sceneWordIndex.length ? sceneWordIndex[scene + 1] : words.length;
  let seen = 0;
  for (let i = from; i < to; i++) {
    if (norm(words[i].text).startsWith(norm(token))) {
      if (seen === nth) return i;
      seen++;
    }
  }
  throw new Error(`Word "${token}" not found in scene ${scene + 1}`);
};

/** Frame of a word, relative to the scene's own start. */
export const cue = (scene: number, token: string, nth = 0) =>
  wordStartFrame(findWord(scene, token, nth)) - sceneStartFrames[scene];

/** Remotion Caption objects, one per word (leading space before every word but the first). */
export const captions: Caption[] = words.map((w, i) => ({
  text: (i === 0 ? "" : " ") + w.text,
  startMs: Math.round(w.start * 1000),
  endMs: Math.round(w.end * 1000),
  timestampMs: Math.round(((w.start + w.end) / 2) * 1000),
  confidence: null,
}));
