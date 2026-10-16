// Render several stills from one bundle: node scripts/stills.mjs out/stills 220 870 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "node:path";

const [outDir, ...frames] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions: { gl: "angle" } });
const composition = await selectComposition({ serveUrl, id: "How05", puppeteerInstance: browser });
for (const f of frames.map(Number)) {
  const t0 = Date.now();
  await renderStill({
    composition,
    serveUrl,
    frame: f,
    output: path.join(outDir, `f${String(f).padStart(5, "0")}.png`),
    puppeteerInstance: browser,
    chromiumOptions: { gl: "angle" },
  });
  console.log(f, `${Date.now() - t0}ms`);
}
await browser.close({ silent: true });
