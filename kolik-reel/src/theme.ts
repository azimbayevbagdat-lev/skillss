// Colors, fonts and timing for the "Көлікте жүрек айнуы" doodle reel.
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadPangolin } from "@remotion/google-fonts/Pangolin";
import { loadFont as loadLocalFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import localFonts from "./local-fonts.json";

// Oswald + Pangolin both contain every Kazakh letter (ә ғ қ ң ө ұ ү һ і).
// Amatic SC / Neucha / Rubik Mono One were rejected: no Kazakh letters.
// REMOTION_LOCAL_FONTS=1 loads the same files from public/fonts (offline render).
const useLocal = process.env.REMOTION_LOCAL_FONTS === "1";
if (useLocal) {
  for (const f of localFonts) {
    loadLocalFont({
      family: f.family,
      url: staticFile(`fonts/${f.file}`),
      weight: f.weight,
      unicodeRange: f.unicodeRange,
    });
  }
}
const subsets: ("latin" | "cyrillic" | "cyrillic-ext")[] = [
  "latin",
  "cyrillic",
  "cyrillic-ext",
];
export const FONT_TITLE = useLocal
  ? "Oswald"
  : loadOswald("normal", { weights: ["500", "700"], subsets }).fontFamily;
export const FONT_HAND = useLocal
  ? "Pangolin"
  : loadPangolin("normal", { weights: ["400"], subsets }).fontFamily;

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const TAIL_SECONDS = 0.5; // video = voiceover + 0.5 s

export const C = {
  ink: "#111111",
  red: "#e0261d",
  sky1: "#f3e6cf",
  sky2: "#f6d3b8",
  sun: "#f7b267",
  ground: "#6b4a36",
  grass: "#8fae5e",
  grassDark: "#6f8f45",
  road: "#4a4a4a",
  car: "#7fb0e0",
  carDark: "#5f8fc0",
  skin: "#f7dcc0",
  sick: "#9bd36a",
  hair: "#3a2a20",
  white: "#ffffff",
  purple: "#b9a3e3",
  pink: "#f6a5c0",
  brain: "#f59ab5",
  water: "#6fb7e8",
  green: "#3fae4a",
  blue: "#2f7fd6",
  cta: "#efefef",
  grey: "#8a8a8a",
  seat: "#8b5e44",
  seatDark: "#6e4632",
  glass: "#cfe6f7",
  tree: "#5f8f3e",
};

export const STROKE = 7;
export const BOIL_FPS = 8;

// Scene starts (seconds) — aligned to word timings in public/captions.json
export const SCENES = [
  { id: "hook", start: 0 },
  { id: "signal", start: 2.52 },
  { id: "ear", start: 5.05 },
  { id: "eye", start: 7.48 },
  { id: "brain", start: 11.45 },
  { id: "nausea", start: 15.48 },
  { id: "backseat", start: 19.7 },
  { id: "driver", start: 24.7 },
  { id: "sway", start: 29.5 },
  { id: "kids", start: 35.02 },
  { id: "phone", start: 40.68 },
  { id: "solution", start: 43.38 },
  { id: "window", start: 51.76 },
  { id: "cta", start: 53.28 },
] as const;
export type SceneId = (typeof SCENES)[number]["id"];
export const sceneStart = (id: SceneId) =>
  SCENES.find((s) => s.id === id)!.start;
export const TRANSITION_FRAMES = 7;

// Key phrases: shown on the red second line. `words` = spoken words (lowercase, no punctuation);
// `show` = what is displayed (digits allowed).
export const KEYWORDS: { words: string[]; show: string }[] = [
  { words: ["жүрегің", "айниды"], show: "ЖҮРЕГІҢ АЙНИДЫ?" },
  { words: ["сигнал", "соғысы"], show: "«СИГНАЛ СОҒЫСЫ»" },
  { words: ["бұрылып", "жатырмыз"], show: "«БҰРЫЛЫП ЖАТЫРМЫЗ!»" },
  { words: ["бәрі", "орнында"], show: "«БӘРІ ОРНЫНДА»" },
  { words: ["уланып", "қалған"], show: "«УЛАНЫП ҚАЛҒАН!»" },
  { words: ["көрмейді"], show: "КӨРМЕЙДІ" },
  { words: ["сирек", "айниды"], show: "СИРЕК АЙНИДЫ" },
  { words: ["бес", "секундта"], show: "5 СЕКУНДТА" },
  { words: ["екі", "мен", "он", "екі", "жас"], show: "2–12 ЖАС" },
  { words: ["телефонға"], show: "ТЕЛЕФОНҒА" },
  { words: ["көкжиекке"], show: "КӨКЖИЕККЕ" },
  { words: ["тіркеліңіз"], show: "ТІРКЕЛІҢІЗ!" },
];
