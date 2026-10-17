# Егер бүкіл Үндістан Қазақстанға көшсе? — Remotion Reel

9:16 (1080×1920, 30 fps) explainer. Duration = length of `public/voiceover.mp3`
(computed in `calculateMetadata` with Mediabunny).

## Structure

- `src/theme.ts` — colors, fonts, numbers, scene start times (aligned to voice pauses)
- `src/geo.ts` — world-atlas 50m + d3-geo, one **equal-area** projection (honest area comparison), cameras
- `src/components/` — `DotCountry` (hex dot-matrix + glow + heat-map via SVG mask), `Header`, `CounterPills`, `Captions`, `Tags`, `Particles`/`Snow`, `Background`
- `src/scenes/S01…S14` (+ `S10bAdapt` for the "үйренуге тура келер еді" sentence), joined with `<TransitionSeries>` fades
- `public/captions.json` — word timings, built by `scripts/make-captions.mjs`

## Captions

Whisper/Vosk models could not be downloaded in the build sandbox, so captions use the exact
script text (`scripts/voiceover.txt`) aligned heuristically: ffmpeg finds the 19 pauses, a DP
assigns each pause to a word boundary (all landed on punctuation), words share time by syllables.

```bash
node scripts/make-captions.mjs
```

## Fonts

Montserrat (Black 900 for titles) — Unbounded has no Kazakh letters (Ә Ғ Қ Ң Ө Ұ Ү Һ).
Default loads via `@remotion/google-fonts`. If the render browser can't reach Google Fonts:

```bash
node scripts/fetch-fonts.mjs          # once
REMOTION_LOCAL_FONTS=1 npx remotion render ...
```

## Commands

```bash
npm i
npx remotion studio
npx remotion still MainReel out/frame.png --frame=350
npx remotion render MainReel out/india-kazakhstan.mp4 --codec=h264 --crf=18
```

## Sound design

`src/components/SoundDesign.tsx` places synthesized SFX (sub-bass booms on key beats, whooshes on
scene changes, pops, counter ticks/blips, particle shimmer, risers, wind, zaps) modeled on the
reference reel. No background music is used. Regenerate the SFX with `python3 scripts/make-sfx.py`.
Optional: `python3 scripts/make-indian-music.py` writes an Indian-style bed to `public/music.mp3`,
which the composition picks up automatically (volume 0.22). Delete the file to go back to no music.

For Reels loudness (≈ −14 LUFS), normalize after rendering:

```bash
ffmpeg -i out/india-kazakhstan.mp4 -c:v copy -af loudnorm=I=-14:TP=-1:LRA=11 -ar 48000 -c:a aac -b:a 192k out/final.mp4
```

Use `REMOTION_BROWSER=/path/to/chrome` if Remotion can't download its own browser.
