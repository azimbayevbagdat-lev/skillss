# How05 — «Tesla Roadster қалай секіреді?»

Remotion + `@remotion/three`, 1080×1920, 60fps. Series: «Бұл қалай жұмыс істейді?» · 05.

```bash
npm install
npx remotion studio                 # preview
python3 -I scripts/make_audio.py    # regenerate pad + SFX
# re-time after replacing public/voice/how05.mp3:
python3 -I scripts/transcribe_chunks.py <sherpa-onnx-whisper-large-v3 dir> public/voice/how05.mp3
python3 -I scripts/align.py public/voice/how05.mp3
npx remotion render How05 out/how05.mp4 --codec h264 --crf 16 --audio-bitrate 320k --gl=angle
```

- `src/timeline.ts` — every scene beat is a trigger word from SCRIPT (fires 3 frames early).
- `src/state.ts` — pure frame → state for the car, balloon, ramp, valve.
- `src/camera.ts` — one continuous camera; scene changes are flights.
- `TIMING.md` — timing table; `review/` — review stills.
