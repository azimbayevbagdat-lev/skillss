"""Align the reference script words to Whisper word timestamps (char-level DP).
Whisper text is used only for timing; the output words come from script.txt."""
import json, re, sys
from rapidfuzz.distance import Levenshtein

W = "/home/user/skillss/reel/work/"
ref_text = open(W + "script.txt", encoding="utf-8").read()
hyp = json.load(open(W + "whisper_words.json", encoding="utf-8"))

TR = {
    "а": "a", "ә": "a", "б": "b", "в": "v", "г": "g", "ғ": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "j", "з": "z", "и": "i", "й": "i", "к": "k", "қ": "k", "л": "l", "м": "m", "н": "n",
    "ң": "n", "о": "o", "ө": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ұ": "u",
    "ү": "u", "ф": "f", "х": "h", "һ": "h", "ц": "c", "ч": "ch", "ш": "sh", "щ": "sh", "ъ": "",
    "ы": "y", "і": "i", "ь": "", "э": "e", "ю": "iu", "я": "ia",
    "q": "k", "c": "k", "w": "v", "x": "ks", "y": "i",
}
NUM = {"300": "ushjuz"}


def skel(s):
    s = s.lower()
    for k, v in NUM.items():
        s = s.replace(k, v)
    out = []
    for ch in s:
        if ch.isalnum():
            out.append(TR.get(ch, ch))
    return "".join(out)


# reference tokens (display text keeps punctuation)
ref = []
for line_no, line in enumerate(ref_text.strip().split("\n")):
    for tok in line.split():
        if not re.search(r"\w", tok):
            continue
        ref.append({"text": tok, "para": line_no, "sk": skel(tok)})

# char streams
rc, rmap = [], []
for i, r in enumerate(ref):
    for ch in r["sk"]:
        rc.append(ch); rmap.append(i)
hc, hmap = [], []
for j, h in enumerate(hyp):
    for ch in skel(h["w"]):
        hc.append(ch); hmap.append(j)

# global alignment DP
n, m = len(rc), len(hc)
INF = 10**9
import numpy as np
D = np.zeros((n + 1, m + 1), dtype=np.int32)
D[:, 0] = np.arange(n + 1); D[0, :] = np.arange(m + 1)
hc_arr = np.array([ord(c) for c in hc])
for i in range(1, n + 1):
    sub = D[i - 1, :-1] + (hc_arr != ord(rc[i - 1]))
    row = np.minimum(sub, D[i - 1, 1:] + 1)
    # insertion pass (left to right)
    cur = np.empty(m + 1, dtype=np.int32); cur[0] = i
    for j in range(1, m + 1):
        v = row[j - 1]
        w_ = cur[j - 1] + 1
        cur[j] = v if v < w_ else w_
    D[i] = cur
# backtrack
pairs = []
i, j = n, m
while i > 0 and j > 0:
    if D[i, j] == D[i - 1, j - 1] + (rc[i - 1] != hc[j - 1]):
        pairs.append((i - 1, j - 1)); i -= 1; j -= 1
    elif D[i, j] == D[i - 1, j] + 1:
        i -= 1
    else:
        j -= 1

# char time inside a hyp word: linear interpolation
def char_time(j):
    w = hmap[j]
    h = hyp[w]
    idxs = [k for k in range(len(hmap)) if hmap[k] == w]
    pos = idxs.index(j)
    L = len(idxs)
    return h["s"] + (h["e"] - h["s"]) * pos / L, h["s"] + (h["e"] - h["s"]) * (pos + 1) / L

per_word = {}
for ri, hj in pairs:
    per_word.setdefault(rmap[ri], []).append(hj)

out = []
for i, r in enumerate(ref):
    js = sorted(per_word.get(i, []))
    if len(js) >= max(1, len(r["sk"]) // 3):
        s = char_time(js[0])[0]; e = char_time(js[-1])[1]
        hw = sorted({hmap[j] for j in js})
        heard = " ".join(hyp[k]["w"] for k in hw)
        out.append({"word": r["text"], "start": round(s, 3), "end": round(e, 3), "para": r["para"],
                    "heard": heard, "sim": round(1 - Levenshtein.normalized_distance(r["sk"], skel(heard)), 2)})
    else:
        out.append({"word": r["text"], "start": None, "end": None, "para": r["para"], "heard": "", "sim": 0})

# interpolate missing
for i, o in enumerate(out):
    if o["start"] is None:
        prev_e = next((out[k]["end"] for k in range(i - 1, -1, -1) if out[k]["end"] is not None), 0)
        nxt_s = next((out[k]["start"] for k in range(i + 1, len(out)) if out[k]["start"] is not None), prev_e + 0.3)
        o["start"], o["end"] = round(prev_e, 3), round(max(prev_e + 0.05, nxt_s), 3)
        o["interp"] = True
# monotonic fix
for i in range(1, len(out)):
    if out[i]["start"] < out[i - 1]["end"]:
        out[i]["start"] = out[i - 1]["end"]
    if out[i]["end"] <= out[i]["start"]:
        out[i]["end"] = round(out[i]["start"] + 0.05, 3)

json.dump(out, open(W + "words_aligned_full.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for o in out:
    flag = "  <<" if o["sim"] < 0.6 else ""
    print(f'{o["start"]:6.2f}-{o["end"]:6.2f}  {o["word"]:<22} heard: {o["heard"]:<25} {o["sim"]}{flag}')
