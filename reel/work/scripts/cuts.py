"""Detect pauses > 0.5 s, build keep-segments, snap word timings to speech, remap to the cut timeline,
write words.json + reel_subs.srt + subtitle groups for Remotion."""
import json, re, subprocess
import numpy as np, soundfile as sf

W = "/home/user/skillss/reel/work/"
R = "/home/user/skillss/reel/"
DUR = 65.1
PAD = 0.14          # breath kept on each side of a cut pause
MIN_PAUSE = 0.5

a, sr = sf.read(W + "audio16k.wav", dtype="float32")
hop = int(sr * 0.01)
rms = np.array([np.sqrt(np.mean(a[i:i + hop * 2] ** 2) + 1e-12) for i in range(0, len(a) - hop * 2, hop)])
db = 20 * np.log10(rms)
speech_lvl = np.percentile(db, 90)
thr = speech_lvl - 13
voiced = db > thr
# smooth: fill gaps < 80 ms, drop blips < 60 ms
def runs(mask):
    out, st = [], None
    for i, v in enumerate(mask):
        if v and st is None: st = i
        if not v and st is not None: out.append([st, i]); st = None
    if st is not None: out.append([st, len(mask)])
    return out
r = runs(voiced)
merged = []
for s, e in r:
    if merged and s - merged[-1][1] < 8: merged[-1][1] = e
    else: merged.append([s, e])
merged = [[s / 100, e / 100] for s, e in merged if e - s >= 6]
pauses = []
for (s0, e0), (s1, e1) in zip(merged, merged[1:]):
    if s1 - e0 > MIN_PAUSE: pauses.append([e0, s1])
lead = merged[0][0]; tail = merged[-1][1]
print(f"speech lvl {speech_lvl:.1f} dB thr {thr:.1f}; lead {lead} tail {tail}")
print("pauses >0.5s:", [(round(x, 2), round(y, 2), round(y - x, 2)) for x, y in pauses])

# keep segments
keep, cur = [], max(0.0, lead - 0.08)
for ps, pe in pauses:
    keep.append([round(cur, 3), round(ps + 0.18, 3)])
    cur = pe - 0.12
keep.append([round(cur, 3), round(DUR - 0.05, 3)])
total = sum(e - s for s, e in keep)
print("segments:", len(keep), "new duration %.2f" % total)

def remap(t):
    acc = 0.0
    for s, e in keep:
        if t < s: return acc
        if t <= e: return acc + (t - s)
        acc += e - s
    return acc

# snap words: no word boundary inside a detected pause
words = json.load(open(W + "words_aligned_full.json", encoding="utf-8"))
for w in words:
    for ps, pe in pauses:
        if ps < w["start"] < pe: w["start"] = round(pe, 3)
        if ps < w["end"] < pe: w["end"] = round(ps, 3)
    if w["end"] <= w["start"]: w["end"] = round(w["start"] + 0.12, 3)

# words judged unspoken (after review) — kept in words.json but hidden from subtitles
UNSPOKEN = {[i for i, w in enumerate(words) if w['word'] == 'Өзіміздің'][1]}  # 2nd one: silent gap, Whisper heard nothing

KEY = [r"^300$", r"^мың$", r"^қажет$", r"^qajet$", r"^такси", r"^жамбыл$", r"^вайб-кодинг", r"^тіркеліп$"]
def is_key(i):
    t = words[i]["word"].lower().strip("«»!?.,:")
    if t in ("қажет", "qajet") and i + 1 < len(words) and words[i + 1]["word"].lower().startswith("такси"): return True
    if t.startswith("такси") and i > 0 and words[i - 1]["word"].lower().strip("«") in ("қажет", "qajet"): return True
    if t == "300" or (t == "мың" and words[i - 1]["word"] == "300"): return True
    return t in ("жамбыл", "тіркеліп") or t.startswith("вайб-кодинг")

out = []
for i, w in enumerate(words):
    out.append({"i": i, "word": w["word"], "start": round(remap(w["start"]), 3), "end": round(remap(w["end"]), 3),
                "src_start": w["start"], "src_end": w["end"], "key": is_key(i), "hidden": i in UNSPOKEN,
                "heard": w["heard"], "sim": w["sim"]})
json.dump({"duration": round(total, 3), "segments": keep, "pauses": pauses, "words": out},
          open(W + "timeline.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump([{"word": o["word"], "start": o["start"], "end": o["end"], "src_start": o["src_start"], "src_end": o["src_end"]}
           for o in out if not o["hidden"]], open(R + "words.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# subtitle groups: phrases split at punctuation / gaps, then balanced 2–4 word chunks
vis = [o for o in out if not o["hidden"]]
phrases, ph = [], []
for k, o in enumerate(vis):
    ph.append(o)
    nxt = vis[k + 1] if k + 1 < len(vis) else None
    if nxt is None or o["word"] == "дайындайсың" or re.search(r"[.,!?:»]$", o["word"]) or nxt["start"] - o["end"] > 0.3:
        phrases.append(ph); ph = []
# attach 1-word phrases to a neighbour
i = 0
while i < len(phrases):
    if len(phrases[i]) == 1 and len(phrases) > 1:
        if i + 1 < len(phrases):
            phrases[i + 1] = phrases[i] + phrases[i + 1]
        else:
            phrases[i - 1] = phrases[i - 1] + phrases[i]
        phrases.pop(i); continue
    i += 1
groups = []
for ph in phrases:
    n = len(ph)
    k = max(1, -(-n // 4))
    while any(sum(len(x["word"]) + 1 for x in ph[j * n // k:(j + 1) * n // k]) > 26 for j in range(k)) and n // (k + 1) >= 2:
        k += 1
    for j in range(k):
        groups.append(ph[j * n // k:(j + 1) * n // k])
# keep keyword pairs (300 мың, Қажет таксиді...) on one line
for gi in range(len(groups) - 1):
    a_, b_ = groups[gi], groups[gi + 1]
    if a_ and b_ and a_[-1]["key"] and b_[0]["key"]:
        if len(a_) > 2: b_.insert(0, a_.pop())
        else: a_.append(b_.pop(0))
groups = [g for g in groups if g]
split = []
for g in groups:
    while len(g) > 4:
        split.append(g[:3]); g = g[3:]
    split.append(g)
groups = split
subs = []
for gi, g in enumerate(groups):
    st = g[0]["start"]; en = g[-1]["end"]
    if gi + 1 < len(groups): en = min(max(en, en + 0.0), groups[gi + 1][0]["start"])
    subs.append({"start": st, "end": en, "words": [{"t": x["word"], "s": x["start"], "e": x["end"], "k": x["key"]} for x in g]})
json.dump(subs, open(W + "rem/src/subs.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"
with open(R + "reel_subs.srt", "w", encoding="utf-8") as f:
    for n, s in enumerate(subs, 1):
        f.write(f"{n}\n{ts(s['start'])} --> {ts(s['end'])}\n{' '.join(w['t'] for w in s['words'])}\n\n")
print("groups:", len(subs))
for s in subs: print(f"{s['start']:6.2f} {s['end']:6.2f}  " + " ".join(("*" if w['k'] else "") + w['t'] for w in s['words']))
