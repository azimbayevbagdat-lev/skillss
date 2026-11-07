"""Local forced alignment fallback: Whisper (faster-whisper) recognises the audio,
then the known script is aligned to it character by character.
The script text is never changed; only timings are taken from the audio.
Usage: python3 -I scripts/align.py audio/voice.mp3 scripts/script.txt timestamps.json"""
import json, re, sys
from difflib import SequenceMatcher
import subprocess
import numpy as np
from faster_whisper import WhisperModel

audio, script_path, out = sys.argv[1:4]
script = open(script_path, encoding="utf-8").read().strip()

model = WhisperModel("large-v3", device="cpu", compute_type="int8")
pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", audio, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                     capture_output=True, check=True).stdout
wave = np.frombuffer(pcm, dtype=np.float32)
segs, _ = model.transcribe(wave, language="kk", word_timestamps=True, beam_size=5,
                           vad_filter=False, condition_on_previous_text=False)
hyp_words = [w for s in segs for w in s.words]
json.dump([{"w": w.word, "s": w.start, "e": w.end} for w in hyp_words],
          open(out.replace(".json", ".whisper.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

norm = lambda c: c.lower() if c.isalpha() else ""
# hypothesis chars with per-char time
hc, ht = [], []
for w in hyp_words:
    letters = [norm(c) for c in w.word if norm(c)]
    n = max(len(letters), 1)
    for i, c in enumerate(letters):
        hc.append(c); ht.append(w.start + (w.end - w.start) * (i + 0.5) / n)

ref_words = [(m.group(), m.start(), m.end()) for m in re.finditer(r"\S+", script)]
rc, rword = [], []
for wi, (tok, _, _) in enumerate(ref_words):
    for c in tok:
        if norm(c):
            rc.append(norm(c)); rword.append(wi)

sm = SequenceMatcher(None, "".join(rc), "".join(hc), autojunk=False)
rtime = [None] * len(rc)
for a, b, size in sm.get_matching_blocks():
    for k in range(size):
        rtime[a + k] = ht[b + k]

# interpolate unmatched chars
known = [i for i, t in enumerate(rtime) if t is not None]
for i in range(len(rtime)):
    if rtime[i] is None:
        prev = max([k for k in known if k < i], default=None)
        nxt = min([k for k in known if k > i], default=None)
        if prev is None: rtime[i] = rtime[nxt]
        elif nxt is None: rtime[i] = rtime[prev]
        else: rtime[i] = rtime[prev] + (rtime[nxt] - rtime[prev]) * (i - prev) / (nxt - prev)

words = []
for wi, (tok, cs, ce) in enumerate(ref_words):
    ts = [rtime[i] for i in range(len(rc)) if rword[i] == wi]
    words.append({"text": tok, "start": min(ts), "end": max(ts), "charStart": cs, "charEnd": ce})
# widen to plausible word bounds: start a bit earlier, end at next word start when close
for i, w in enumerate(words):
    w["start"] = max(0.0, w["start"] - 0.06)
    nxt = words[i + 1]["start"] - 0.06 if i + 1 < len(words) else w["end"] + 0.25
    w["end"] = min(max(w["end"] + 0.08, w["start"] + 0.12), max(nxt, w["start"] + 0.12))
ratio = sm.ratio()
json.dump({"source": "local-whisper-alignment", "matchRatio": round(ratio, 3), "text": script,
           "words": [{k: (round(v, 3) if isinstance(v, float) else v) for k, v in w.items()} for w in words]},
          open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("words", len(words), "match", round(ratio, 3))
