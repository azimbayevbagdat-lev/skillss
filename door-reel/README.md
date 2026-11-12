# Door effect reel (Instagram / TikTok)

«Бөлмеге кірген соң неге не үшін келгеніңді ұмытасың?» — 3D animated reel, 1080×1920, 30 fps.

- `public/voiceover.mp3` — the provided ElevenLabs voiceover (unchanged); the video length follows it (94.93 s).
- `src/captions.ts` — word-level captions: Whisper large-v3 (`kk`) word timestamps, text replaced by the original script.
- `public/sfx/` — sound effects and background music generated with ElevenLabs (sound effects v2, music v2.5).
- `public/fonts/Montserrat-ExtraBold-KK.woff2` — Montserrat 800 (latin + cyrillic + cyrillic-ext: full Kazakh alphabet).
- `src/three/` — procedural 3D scenes (React Three Fiber via `@remotion/three`): character, house, glass brain, experiment.
- `src/timeline.ts` — scene boundaries and story beats, taken from the word timestamps.

```bash
npm i
npx remotion studio                 # preview
npx remotion render DoorReel out/door-reel.mp4 --codec=h264 --audio-codec=aac --crf=18 --gl=swangle
```
