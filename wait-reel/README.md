# «Неге клиент күтуге шыдамайды?» — 3D reel

Remotion + `@remotion/three` (React Three Fiber) project. 1080×1920, 30 fps, length = `voiceover.mp3` (91.25 s → 2738 frames).

## Files

| Path | What |
| --- | --- |
| `voiceover.mp3`, `public/voiceover.mp3` | Original ElevenLabs voice (unchanged) |
| `data/words_raw.json` | ElevenLabs Scribe word timestamps (language detected: `kaz`) |
| `data/original.txt` | Original script |
| `scripts_align.py` | Aligns Scribe words to the original script → `data/captions.json` |
| `src/captions.json` | Final captions (original words only, Scribe timings) |
| `sfx/*.mp3` | ElevenLabs sound effects + lo-fi music (copied to `public/sfx/`) |
| `src/WaitReel.tsx` | Composition: scenes, captions, audio mix |
| `src/Captions.tsx` | 2–4 word pages, active word in yellow, white ExtraBold with black outline |
| `src/scenes/*` | 11 scenes (room, brain, doubt, hourglasses, scale, chart, night/bot, CTA) |
| `src/lib/*` | Character, phone, robot, props, lighting/post-processing (bloom, DOF) |

## Commands

```bash
npm install
npx remotion studio                      # preview
npx remotion render WaitReel out/wait-reel.mp4 --concurrency=2 --timeout=240000
```

Rendering uses software WebGL (`swangle`, see `remotion.config.ts`) because the container has no GPU.

## Timing

Scene cut points are in `src/lib/time.ts` (`T`), derived from the word timings.
The last 3 seconds are frozen (`FREEZE_S`).

## Audio mix

- Music ≈ −21 dB under the voice (volume 0.085, voice mean −16.8 dB / music mean −18.1 dB).
- SFX volumes are set in `src/WaitReel.tsx`; the voice is never ducked.
