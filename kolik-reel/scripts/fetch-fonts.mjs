// Downloads the Google Fonts files used by theme.ts into public/fonts (for offline renders).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { getInfo as oswald } from "@remotion/google-fonts/Oswald";
import { getInfo as pangolin } from "@remotion/google-fonts/Pangolin";

const SUBSETS = ["latin", "cyrillic", "cyrillic-ext"];
const fonts = [
  { info: oswald(), weights: ["500", "700"] },
  { info: pangolin(), weights: ["400"] },
];
fs.mkdirSync("public/fonts", { recursive: true });
const manifest = [];
for (const { info, weights } of fonts) {
  for (const w of weights) {
    for (const s of SUBSETS) {
      const url = info.fonts.normal[w]?.[s];
      if (!url) continue;
      const file = `${info.importName}-${w}-${s}.woff2`;
      execFileSync("curl", ["-sSfL", "-o", `public/fonts/${file}`, url]);
      manifest.push({
        family: info.fontFamily,
        weight: w,
        file,
        unicodeRange: info.unicodeRanges[s],
      });
    }
  }
}
fs.writeFileSync("src/local-fonts.json", JSON.stringify(manifest, null, 2));
console.log(`Downloaded ${manifest.length} font files`);
