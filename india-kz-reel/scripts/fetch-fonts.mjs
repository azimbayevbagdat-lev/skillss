// Downloads the exact Google Fonts files used by theme.ts into public/fonts,
// for rendering in environments where the headless browser can't reach Google Fonts.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { getInfo as montserrat } from "@remotion/google-fonts/Montserrat";

const SUBSETS = ["latin", "cyrillic", "cyrillic-ext"];
const fonts = [
  { info: montserrat(), weights: ["500", "600", "700", "800", "900"] },
];
fs.mkdirSync("public/fonts", { recursive: true });
const manifest = [];
for (const { info, weights } of fonts) {
  for (const w of weights) {
    for (const s of SUBSETS) {
      const url = info.fonts.normal[w][s];
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
// "≈" and "→" are not in Montserrat's standard subsets: fetch a tiny subset with just them.
for (const w of ["800", "900"]) {
  const css = execFileSync("curl", [
    "-sSfL",
    "-H",
    "User-Agent: Mozilla/5.0 Chrome/120",
    `https://fonts.googleapis.com/css2?family=Montserrat:wght@${w}&text=%E2%89%88%E2%86%92`,
  ]).toString();
  const url = css.match(/url\((https:[^)]+)\)/)[1];
  execFileSync("curl", [
    "-sSfL",
    "-o",
    `public/fonts/Montserrat-${w}-symbols.woff2`,
    url,
  ]);
}
fs.writeFileSync("src/local-fonts.json", JSON.stringify(manifest, null, 2));
console.log(`Downloaded ${manifest.length} font files`);
