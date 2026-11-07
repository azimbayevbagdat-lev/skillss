"""Snap word boundaries that fall inside detected silences to the silence edges.
Usage: python3 -I scripts/refine_silence.py audio/voice.mp3 timestamps.json"""
import json, re, subprocess, sys
audio, path = sys.argv[1:3]
log = subprocess.run(["ffmpeg", "-hide_banner", "-i", audio, "-af", "silencedetect=noise=-35dB:d=0.2", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
sil = list(zip(st, en))
d = json.load(open(path, encoding="utf-8"))
prev = ""
for w in d["words"]:
    sentence_start = re.search(r"[.?!:]»?$", prev) is not None
    prev = w["text"]
    for a, b in sil:
        # a sentence-initial word placed just before a pause really starts after it
        if sentence_start and a - 0.12 < w["start"] <= a and w["end"] < b + 0.1:
            dur = w["end"] - w["start"]
            w["start"] = round(b - 0.03, 3); w["end"] = round(w["start"] + max(dur, 0.18), 3)
    for a, b in sil:
        if a < w["start"] < b: w["start"] = round(b - 0.03, 3)
        if a < w["end"] < b: w["end"] = round(a + 0.05, 3)
        if w["start"] <= a and w["end"] >= b and a - w["start"] < 0.15: w["start"] = round(b - 0.03, 3)
    w["end"] = max(w["end"], w["start"] + 0.1)
W = d["words"]
for i in range(len(W) - 1):
    W[i + 1]["start"] = round(max(W[i + 1]["start"], W[i]["start"] + 0.1), 3)
    W[i]["end"] = round(min(W[i]["end"], W[i + 1]["start"]), 3)
    W[i + 1]["end"] = round(max(W[i + 1]["end"], W[i + 1]["start"] + 0.1), 3)
d["silences"] = [[round(a, 3), round(b, 3)] for a, b in sil]
json.dump(d, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("silences", len(sil))
