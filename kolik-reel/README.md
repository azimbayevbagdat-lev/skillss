# Көлікте неге жүрек айниды? — doodle reel (Remotion)

1080×1920, 30 fps, length = `public/voiceover.wav` + 0.5 s (calculateMetadata).

- `src/theme.ts` — colors, fonts (Oswald + Pangolin, both have all Kazakh letters), scene starts, key phrases
- `src/doodle/` — line-boil filter (feTurbulence + feDisplacementMap, 8 fps), paper grain, stick figure, car, brain/eye/ear, scenery
- `src/scenes/S01…S14` — one component per scene, joined with 7-frame fades/slides
- `src/Captions.tsx` — top typography: black words pop in one by one, key phrase on a red second line
- `public/captions.json` — built by `node scripts/make-captions.mjs` (script text + pause/energy alignment;
  Whisper models could not be downloaded in the build sandbox)
- `public/sfx/` — synthesized whoosh + water (`python3 scripts/make-sfx.py`), volume 0.1

```bash
npm i
npx remotion studio
npx remotion render Main out/kolikte-jurek-ainu.mp4 --codec=h264 --crf=18
# offline fonts / local Chrome:
node scripts/fetch-fonts.mjs
REMOTION_LOCAL_FONTS=1 REMOTION_BROWSER=/path/to/headless_shell npx remotion render Main ...
```
