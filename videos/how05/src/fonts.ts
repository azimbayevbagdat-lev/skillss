import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const subsets = ["latin", "latin-ext", "cyrillic", "cyrillic-ext"] as const;
const ranges: Record<(typeof subsets)[number], string> = {
  latin:
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  "latin-ext":
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  cyrillic: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
  "cyrillic-ext": "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F",
};

export const fontsReady = Promise.all([
  ...subsets.flatMap((s) =>
    (["700", "800"] as const).map((weight) =>
      loadFont({
        family: "Manrope",
        url: staticFile(`fonts/manrope-${s}-${weight}-normal.woff2`),
        weight,
        unicodeRange: ranges[s],
      }),
    ),
  ),
  ...(["latin", "cyrillic", "cyrillic-ext"] as const).map((s) =>
    loadFont({
      family: "JetBrains Mono",
      url: staticFile(`fonts/jetbrains-mono-${s}-500-normal.woff2`),
      weight: "500",
      unicodeRange: ranges[s],
    }),
  ),
]);
