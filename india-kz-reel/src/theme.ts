// Single source of truth for colors, fonts, numbers and scene timing.
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadLocalFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import localFonts from "./local-fonts.json";

// Font: Montserrat (Black 900 for titles). Unbounded was rejected: it has no
// Kazakh letters (Ә Ғ Қ Ң Ө Ұ Ү Һ). In Montserrat they live in "cyrillic-ext", і in "cyrillic".
// Default: @remotion/google-fonts. With REMOTION_LOCAL_FONTS=1 the same Google Fonts
// files are loaded from public/fonts (see scripts/fetch-fonts.mjs) for offline renders.
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
// "≈" and "→" are missing from Montserrat's standard subsets → tiny local subset.
for (const w of ["800", "900"]) {
  loadLocalFont({
    family: "Montserrat Symbols",
    url: staticFile(`fonts/Montserrat-${w}-symbols.woff2`),
    weight: w,
    unicodeRange: "U+2192, U+2248",
  });
}

const subsets: ("latin" | "cyrillic" | "cyrillic-ext")[] = [
  "latin",
  "cyrillic",
  "cyrillic-ext",
];
const montserrat = useLocal
  ? "Montserrat"
  : loadMontserrat("normal", {
      weights: ["500", "600", "700", "800", "900"],
      subsets,
    }).fontFamily;

export const FONT_TITLE = `"Montserrat Symbols", ${montserrat}`;
export const FONT_BODY = `"Montserrat Symbols", ${montserrat}`;

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const MAP_CY = 1010; // vertical center of the map area

export const C = {
  bg: "#07061a",
  bgGlow: "#1a1450",
  kz1: "#4b3fd6",
  kz2: "#6a5cff",
  india1: "#ff8a2a",
  india2: "#ffb25c",
  heatHot: "#ffd25a",
  heatPink: "#ff4f9a",
  highlight: "#ffd25a",
  pink: "#ff3d8b",
  red: "#ff2e63",
  sand1: "#e8a93f",
  sand2: "#ffd37a",
  ice1: "#9fd8ff",
  ice2: "#f2fbff",
  green1: "#b9d84a",
  green2: "#6fcf7a",
  white: "#ffffff",
  grey: "#9d98c7",
  dimLand: "#2a2560",
};

export const GRAD = {
  default: ["#ffffff", "#b9adff"],
  warm: ["#ffe38a", "#ff9a3c"],
  danger: ["#ff9ac0", "#ff2e63"],
  ice: ["#ffffff", "#8fd3ff"],
  sand: ["#fff1b8", "#f0a83a"],
} as const;

export const NUM = {
  kzPop: 20.5e6,
  indiaPop: 1.45e9,
  kzArea: 2.725e6,
  indiaArea: 3.287e6,
};

// Scene starts in seconds, aligned to pauses in public/voiceover.mp3
// (see scripts/make-captions.mjs output). Last scene runs to the end of the audio.
export const SCENES = [
  { id: "hook", start: 0 },
  { id: "oneMoment", start: 3.95 },
  { id: "population", start: 7.3 },
  { id: "cities", start: 9.72 },
  { id: "shortage", start: 12.68 },
  { id: "resettle", start: 15.52 },
  { id: "problem", start: 19.12 },
  { id: "area", start: 20.98 },
  { id: "desert", start: 29.48 },
  { id: "north", start: 32.98 },
  { id: "adapt", start: 36.76 },
  { id: "build", start: 40.38 },
  { id: "result", start: 46.65 },
  { id: "density", start: 49.8 },
  { id: "final", start: 56.8 },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];

export const TRANSITION_FRAMES = 9;

export const sceneStartFrame = (id: SceneId) =>
  Math.round(SCENES.find((s) => s.id === id)!.start * FPS);
