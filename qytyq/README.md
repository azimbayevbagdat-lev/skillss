# «Неге өзімізді өзіміз қытықтай алмаймыз?» — 3D видео

Remotion + @remotion/three (React Three Fiber). Формат: 1080×1920, 30 fps.

## Құрылым
- `audio/voice.mp3` — дауыс (өзгертілмеген)
- `timestamps.json` — сөз деңгейіндегі уақыт белгілері
- `sfx/` — дыбыс эффекттері, `music/` — фон музыкасы
- `src/scenes/` — 16 сахна (әрқайсысы бөлек компонент), `src/three/` — 3D кейіпкер мен заттар
- `src/Captions.tsx` — karaoke субтитр
- `output/` — дайын видео (git-ке кірмейді)

## Командалар
```bash
npm i
npx remotion studio                       # алдын ала қарау
npx remotion render Qytyq output/qytyq_raw.mp4 --gl=swangle --concurrency=3
# дыбыс қаттылығын -14 LUFS-қа келтіру: scripts/loudnorm.sh
```

## Дыбыс (ElevenLabs-сыз нұсқа)
- Уақыт белгілері: `scripts/align.py` (faster-whisper large-v3, kk) + `scripts/refine_silence.py`.
  Мәтін өзгермейді, Whisper тек уақытты береді. `HF_HUB_DISABLE_XET=1` қажет болуы мүмкін.
- Эффекттер мен музыка: `scripts/synth_audio.py` (процедуралық синтез, лицензиясыз),
  қосымша Kenney (CC0, `sfx/LICENSE-kenney-CC0.txt`) және remotion.media дыбыстары.
- ElevenLabs кілті пайда болса: `.env` → `ELEVENLABS_API_KEY=...` (файл git-ке кірмейді).
