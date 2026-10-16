"""Align SCRIPT words to the voice track without an ASR model.

Whisper weights could not be downloaded in this environment, so this does a
pause-anchored forced alignment instead:
  1. ffmpeg silencedetect finds the pauses in the voice track.
  2. A dynamic program decides which word gap each pause belongs to, preferring
     gaps at punctuation and chunk durations that match a steady syllable rate.
  3. Inside each speech chunk, words get time in proportion to their syllables.

Output: src/timing.json  ->  {"words": [{"text", "start", "end"}], "duration"}
Usage: python3 -I scripts/align.py public/voice/how05.mp3
"""

import json
import math
import re
import difflib
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOWELS = set("аәеиоөуұүыіэюяёaeiouy")


# The sherpa-onnx Whisper detokenizer drops several Kazakh letters, so both
# sides are reduced to a shared skeleton before comparing.
DROP = set("ңғөұүәқһіыъь")
LATIN = {"tesla": "тесла", "roadster": "роадстер", "telegram": "телеграм"}


NUMBERS = {"600": "алты жүз", "10": "он"}


def skeleton(text):
    out = []
    for digits, words in NUMBERS.items():
        text = text.replace(digits, words)
    for w in re.findall(r"[\w-]+", text.lower()):
        w = w.split("-")[0] if w.split("-")[0] in LATIN else w
        w = LATIN.get(w, w)
        out.append("".join(c for c in w if c.isalpha() and c not in DROP))
    return "".join(out)


def similarity(heard, span):
    """How well `span` starts with what Whisper heard.

    Whisper often stops early on sub-3 s clips, so only the head of the span is
    compared; that is enough to pin each chunk's first word.
    """
    a, b = skeleton(heard), skeleton(span)
    if not a or not b:
        return 0.0
    return difflib.SequenceMatcher(None, a, b[: len(a) + 2]).ratio()


def load_transcripts():
    p = ROOT / "scripts" / "chunks.json"
    return json.loads(p.read_text(encoding="utf8")) if p.exists() else None


def script_words():
    src = (ROOT / "src" / "script.ts").read_text(encoding="utf8")
    text = re.search(r"`([\s\S]*)`", src).group(1)
    raw = [t for t in text.split() if t != "—"]
    words = []
    for i, t in enumerate(raw):
        words.append({"text": t, "syl": max(1, sum(c in VOWELS for c in t.lower()))})
    # punctuation strength of the gap *after* each word
    tokens = text.split()
    gaps = []
    for i, t in enumerate(tokens):
        if t == "—":
            if gaps:
                gaps[-1] = max(gaps[-1], 1.0)
            continue
        if t[-1] in ".?!":
            gaps.append(2.0)
        elif t[-1] in ",:»" or t.endswith("—"):
            gaps.append(1.0)
        else:
            gaps.append(0.0)
    return words, gaps


def pauses(audio):
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", audio, "-af",
         "silencedetect=n=-42dB:d=0.15", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", out)]
    dur = float(re.search(r"Duration: (\d+):(\d+):([0-9.]+)", out).groups()[2]) + \
        60 * float(re.search(r"Duration: (\d+):(\d+):", out).group(2))
    ps = list(zip(starts, ends))
    lead = 0.0
    if ps and ps[0][0] < 0.05:
        lead = ps[0][1]
        ps = ps[1:]
    tail = dur
    if len(starts) > len(ends):
        tail = starts[-1]
        ps = [p for p in ps if p[0] < tail]
    return lead, tail, ps, dur


def align(words, gaps, lead, tail, ps, transcripts=None):
    n, m = len(words), len(ps)
    syl = [0]
    for w in words:
        syl.append(syl[-1] + w["syl"])
    speech = (tail - lead) - sum(e - s for s, e in ps)
    rate = speech / syl[-1]  # seconds per syllable
    # chunk k spans from end of pause k-1 (or lead) to start of pause k (or tail)
    bounds = [lead] + [e for _, e in ps]
    ends_ = [s for s, _ in ps] + [tail]
    INF = 1e18
    # dp[j][i]: best cost when pause j (0-based, as chunk end) closes right after word i (1..n)
    best = [[INF] * (n + 1) for _ in range(m + 1)]
    back = [[None] * (n + 1) for _ in range(m + 1)]
    MAXSPAN = 4

    texts = [w["text"] for w in words]

    def chunk_cost(a, b, t0, t1, skipped, jp, j):
        if b <= a:
            return INF
        pred = (syl[b] - syl[a]) * rate
        dur = (t1 - t0) - skipped
        cost = (4 if transcripts else 30) * math.log(max(dur, 0.05) / pred) ** 2
        if transcripts:
            heard = " ".join(c["text"] for c in transcripts
                             if t0 - 0.05 <= (c["start"] + c["end"]) / 2 <= t1 + 0.05)
            cost -= 8 * similarity(heard, " ".join(texts[a:b]))
        return cost

    # virtual start state: pause index -1, word 0
    for j in range(m + 1):  # j = index of pause closing the chunk (m = tail)
        for jp in range(max(-1, j - MAXSPAN), j):
            t0 = lead if jp == -1 else ps[jp][1]
            t1 = ends_[j]
            skipped = sum(ps[k][1] - ps[k][0] for k in range(jp + 1, j))
            skip_pen = 1.2 * (j - jp - 1)
            for i in range(1, n + 1):
                if j == m and i != n:
                    continue
                if j < m and i == n:
                    continue
                gap_bonus = 0 if j == m else (-2.0 * gaps[i - 1] + (1.5 if gaps[i - 1] == 0 else 0))
                lo = max(0, i - 40)
                for ip in range(lo, i):
                    prev = 0.0 if (jp == -1 and ip == 0) else (best[jp][ip] if jp >= 0 else INF)
                    if prev >= INF:
                        continue
                    c = prev + chunk_cost(ip, i, t0, t1, skipped, jp, j) + skip_pen + gap_bonus
                    if c < best[j][i]:
                        best[j][i] = c
                        back[j][i] = (jp, ip)
    # trace
    chunks = []
    j, i = m, n
    while j >= 0 and i > 0:
        jp, ip = back[j][i]
        chunks.append((ip, i, jp, j))
        j, i = jp, ip
    chunks.reverse()
    out = []
    for ip, i, jp, j in chunks:
        t0 = lead if jp == -1 else ps[jp][1]
        t1 = ends_[j]
        inner = [ps[k] for k in range(jp + 1, j)]
        # map syllable fraction onto speech-only time inside the chunk
        segs = []
        cur = t0
        for s, e in inner:
            segs.append((cur, s))
            cur = e
        segs.append((cur, t1))
        total = sum(b - a for a, b in segs)

        def at(frac):
            x = frac * total
            for a, b in segs:
                if x <= b - a + 1e-9:
                    return a + x
                x -= b - a
            return segs[-1][1]

        tot_syl = syl[i] - syl[ip]
        for k in range(ip, i):
            f0 = (syl[k] - syl[ip]) / tot_syl
            f1 = (syl[k + 1] - syl[ip]) / tot_syl
            out.append({"text": words[k]["text"], "start": round(at(f0), 3), "end": round(at(f1), 3)})
    return out, rate


def main():
    audio = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "public/voice/how05.mp3")
    words, gaps = script_words()
    lead, tail, ps, dur = pauses(audio)
    transcripts = load_transcripts()
    aligned, rate = align(words, gaps, lead, tail, ps, transcripts)
    (ROOT / "src" / "timing.json").write_text(
        json.dumps({"duration": dur, "hasVoice": True,
                    "method": "whisper large-v3 chunk transcripts + pause-anchored alignment"
                    if transcripts else "pause-anchored syllable alignment",
                    "words": aligned}, ensure_ascii=False, indent=1), encoding="utf8")
    print(f"{len(aligned)} words, {len(ps)} pauses, {rate*1000:.0f} ms/syllable, audio {dur:.2f}s")
    line, t = [], None
    for w in aligned:
        if t is None:
            t = w["start"]
        line.append(w["text"])
        if w["text"][-1] in ".?!":
            print(f"{t:6.2f}-{w['end']:6.2f}  {' '.join(line)}")
            line, t = [], None


if __name__ == "__main__":
    main()
