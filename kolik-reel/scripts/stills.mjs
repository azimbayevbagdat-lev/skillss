// Render several frames of MainReel to out/stills for visual QA: node scripts/stills.mjs 30 80 ...
import { bundle } from "@remotion/bundler";
import {
  renderStill,
  selectComposition,
  openBrowser,
} from "@remotion/renderer";
import path from "node:path";

const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const puppeteerInstance = await openBrowser("chrome", { browserExecutable });
const envVariables = {
  REMOTION_LOCAL_FONTS: process.env.REMOTION_LOCAL_FONTS ?? "",
};
const composition = await selectComposition({
  serveUrl,
  id: process.env.COMP ?? "Main",
  puppeteerInstance,
  envVariables,
});
for (const frame of frames) {
  await renderStill({
    composition,
    serveUrl,
    frame,
    output: `out/stills/f${String(frame).padStart(4, "0")}.png`,
    puppeteerInstance,
    envVariables,
    scale: Number(process.env.STILL_SCALE ?? 0.5),
  });
  console.log("rendered", frame);
}
await puppeteerInstance.close({ silent: true });
