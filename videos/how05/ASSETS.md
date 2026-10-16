# How05 assets

| Asset | Source | License |
|---|---|---|
| Car (generic sports-car silhouette) | Procedural, `src/three/Car.tsx` (extruded profile, no brand design or logo) | Own work |
| Balloon, ramp, valve schematic, arrows, studio floor | Procedural, `src/three/*.tsx` | Own work |
| Studio reflections | `three/examples/jsm/environments/RoomEnvironment` (procedural) | MIT (three.js) |
| Fonts: Manrope 700/800, JetBrains Mono 500 | `@fontsource/manrope`, `@fontsource/jetbrains-mono`, copied to `public/fonts` | SIL OFL 1.1 |
| Voice | `public/voice/how05.mp3`, supplied by the author | Author's |
| Background pad, all SFX | Synthesized by `scripts/make_audio.py` (noise + oscillators) | Own work |
| Word timing | Whisper large-v3 (sherpa-onnx int8 export) + `scripts/align.py` | MIT (Whisper weights) |

The SFX URLs listed in remotion-dev/skills (`remotion.media`) were not reachable from the build machine, so the effects are generated instead.
