"""Transcribe each pause-delimited speech chunk with Whisper large-v3 (kk).

The chunk transcripts are later fuzzy-matched to SCRIPT by align.py so that
every detected pause lands on the right word gap.

Usage: python3 -I scripts/transcribe_chunks.py <model_dir> public/voice/how05.mp3
Writes scripts/chunks.json
"""

import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import sherpa_onnx

ROOT = Path(__file__).resolve().parent.parent


def load_pcm(audio):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", "16000",
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def speech_chunks(audio, dur):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", audio, "-af",
                          "silencedetect=n=-42dB:d=0.15", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", out)]
    chunks, cur = [], 0.0
    for s, e in zip(starts, ends):
        if s > cur + 0.05:
            chunks.append((cur, s))
        cur = e
    if dur > cur + 0.05:
        chunks.append((cur, dur))
    return chunks


def main():
    model_dir = Path(sys.argv[1])
    audio = sys.argv[2]
    pcm = load_pcm(audio)
    dur = len(pcm) / 16000
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(model_dir / "large-v3-encoder.int8.onnx"),
        decoder=str(model_dir / "large-v3-decoder.int8.onnx"),
        tokens=str(model_dir / "large-v3-tokens.txt"),
        language="kk", task="transcribe", num_threads=4)
    res = []
    for a, b in speech_chunks(audio, dur):
        pad = 0.08
        seg = pcm[int(max(0, a - pad) * 16000): int(min(dur, b + pad) * 16000)]
        st = rec.create_stream()
        st.accept_waveform(16000, seg)
        rec.decode_stream(st)
        text = st.result.text.strip()
        res.append({"start": round(a, 3), "end": round(b, 3), "text": text})
        print(f"{a:6.2f}-{b:6.2f}  {text}", flush=True)
    (ROOT / "scripts" / "chunks.json").write_text(json.dumps(res, ensure_ascii=False, indent=1),
                                                  encoding="utf8")


if __name__ == "__main__":
    main()
