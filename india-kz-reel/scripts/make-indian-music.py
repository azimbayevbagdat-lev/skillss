"""Indian-style background music for the reel -> public/music.mp3

Tanpura drone + sitar-like plucked melody (raga Bhairav, Sa = D) + tabla in Keherwa taal,
96 bpm, arranged to the scene timeline (tabla drops out for "problem/area", final section darker).
Run: python3 scripts/make-indian-music.py   (needs numpy + scipy + ffmpeg)
"""
import os
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter, sosfilt

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(11)
DUR = 66.0
BPM = 96
BEAT = 60 / BPM
SA = 146.83  # D3
# Scene cues (seconds) — keep in sync with src/theme.ts
PROBLEM, DESERT, FINAL = 19.12, 29.48, 56.8

# Bhairav: S r G m P d N  (semitones)
BHAIRAV = [0, 1, 4, 5, 7, 8, 11]


def hz(degree, octave=0):
    o, d = divmod(degree, 7)
    return SA * 2 ** ((BHAIRAV[d] + 12 * (o + octave)) / 12)


def ta(sec):
    return np.arange(int(sec * SR)) / SR


def lp(x, f):
    return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f):
    return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)


def karplus(freq, sec, decay=0.996, bright=1.0):
    """Plucked string via Karplus-Strong as one IIR filter (fast)."""
    n = len(ta(sec))
    N = max(2, int(SR / freq))
    burst = rng.uniform(-1, 1, N)
    if bright < 1:
        burst = lp(burst, 1000 + 8000 * bright)
    x = np.zeros(n)
    x[:N] = burst
    a = np.zeros(N + 2)
    a[0] = 1
    a[N] = -decay / 2
    a[N + 1] = -decay / 2
    return lfilter([1.0], a, x)


def jawari(x, amt=2.2):
    """Buzzing bridge: asymmetric soft clipping adds the sitar/tanpura 'buzz'."""
    y = np.tanh(amt * x + 0.25 * x**2)
    return hp(y, 90)


def bend(x, ratio_curve):
    """Pitch-bend a rendered note by a time-varying ratio (meend)."""
    phase = np.cumsum(ratio_curve)
    phase = phase[phase < len(x) - 1]
    return np.interp(phase, np.arange(len(x)), x)


out_l = np.zeros(int(DUR * SR))
out_r = np.zeros(int(DUR * SR))


def place(sig, at, gain=1.0, pan=0.0):
    s = max(0, int(at * SR))
    if s >= len(out_l):
        return
    e = min(len(out_l), s + len(sig))
    sig = sig[: e - s] * gain
    out_l[s:e] += sig * np.sqrt((1 - pan) / 2)
    out_r[s:e] += sig * np.sqrt((1 + pan) / 2)


# ---------- Tanpura: Pa Sa' Sa' Sa (cycle), long buzzing strings ----------
cycle = [hz(4, -1), hz(0), hz(0), hz(0, -1)]
t = 0.0
k = 0
while t < DUR:
    f = cycle[k % 4]
    note = jawari(karplus(f, 4.5, decay=0.9993, bright=0.6) * 0.8, 1.6)
    note *= np.minimum(ta(4.5) / 0.01, 1)
    place(lp(note, 3500), t, 0.18, pan=-0.35 + 0.7 * (k % 2))
    t += BEAT * 1.5
    k += 1


# ---------- Tabla (Keherwa: Dha Ge Na Ti | Na Ke Dhi Na) ----------
def dayan(kind):
    tt = ta(0.7)
    f0 = SA * 2  # right drum tuned to Sa
    if kind == "na":
        partials = [(1, 1.0, 9), (2, 0.5, 12), (3, 0.35, 16), (4, 0.2, 22)]
        click = 0.5
    else:  # "tin" — softer, rounder
        partials = [(1, 1.0, 14), (2, 0.25, 20), (3, 0.1, 30)]
        click = 0.25
    y = sum(a * np.sin(2 * np.pi * f0 * m * tt) * np.exp(-tt * d) for m, a, d in partials)
    y += hp(rng.standard_normal(len(tt)), 2500) * np.exp(-tt * 120) * click
    return y


def bayan():
    tt = ta(0.7)
    f = 78 + 38 * (1 - np.exp(-tt * 7))  # upward "ghe" glide
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 6) * 0.55


def ke():
    tt = ta(0.08)
    return lp(rng.standard_normal(len(tt)), 900) * np.exp(-tt * 60) * 0.7


BOLS = {
    "dha": lambda: dayan("na") + bayan(),
    "ge": bayan,
    "na": lambda: dayan("na"),
    "ti": lambda: dayan("tin") * 0.8,
    "ke": ke,
    "dhi": lambda: dayan("tin") + bayan(),
}
KEHERWA = ["dha", "ge", "na", "ti", "na", "ke", "dhi", "na"]
FILL = ["dha", "ti", "ti", "dha", "ti", "ti", "dha", "dha"]
step = BEAT / 2  # 8 bols per 4 beats
t = 0.0
i = 0
while t < DUR - 0.3:
    in_break = PROBLEM - 0.05 <= t < DESERT - 0.05
    in_final = t >= FINAL - 0.05
    bar_idx = i // 8
    bol = (FILL if bar_idx % 4 == 3 else KEHERWA)[i % 8]
    if in_final:
        bol = "ge" if i % 8 == 0 else None  # sparse heartbeat
    elif in_break:
        bol = "ge" if i % 8 in (0, 6) else None
    if bol:
        human = rng.normal(0, 0.004)
        place(BOLS[bol](), t + human, 0.42 * rng.uniform(0.85, 1.0), pan=0.15)
    t += step
    i += 1


# ---------- Sitar melody (Bhairav phrases with meend) ----------
def sitar(freq, sec, glide_to=None, glide_at=0.5):
    raw = karplus(freq, sec + 0.3, decay=0.9985, bright=1.0)
    if glide_to:
        n = len(raw)
        r = np.ones(n)
        g0 = int(glide_at * SR)
        ramp = np.clip((np.arange(n) - g0) / (0.18 * SR), 0, 1)
        r = 1 + (glide_to / freq - 1) * (0.5 - 0.5 * np.cos(np.pi * ramp))
        raw = bend(raw, r)
    y = jawari(raw * 1.4, 2.6)
    y = lp(y, 5200)
    y = y[: int(sec * SR)]
    tt = np.arange(len(y)) / SR
    return y * np.minimum(tt / 0.002, 1) * np.minimum((len(y) / SR - tt) / 0.08, 1)


# phrases: (degree, beats, optional glide target degree)
PHRASES = [
    [(0, 1), (1, 0.5), (2, 0.5), (3, 1), (4, 1, 5)],
    [(5, 0.5), (4, 0.5), (3, 1), (2, 1, 1), (1, 0.5), (0, 0.5)],
    [(4, 1), (5, 0.5), (6, 0.5), (7, 1.5, 6), (4, 0.5)],
    [(3, 0.5), (2, 0.5), (1, 1, 0), (0, 2)],
]
SLOW = [[(0, 2, 1), (1, 2, 0)], [(-3, 2), (-2, 1, -3), (0, 1)]]  # darker final
t = 0.25
p = 0
while t < DUR - 1.5:
    if PROBLEM - 0.2 <= t < DESERT - 0.2:
        phrase, octv, gain = [(0, 4)], 0, 0.0  # rest during the "problem/area" break
    elif t >= FINAL - 0.2:
        phrase, octv, gain = SLOW[p % 2], 0, 0.22
    else:
        phrase, octv, gain = PHRASES[p % 4], 1, 0.26
    for n in phrase:
        deg, beats = n[0], n[1]
        sec = beats * BEAT
        if gain > 0:
            target = hz(n[2], octv) if len(n) > 2 else None
            place(sitar(hz(deg, octv), sec + 0.6, target, glide_at=sec * 0.45), t, gain, pan=-0.1)
        t += sec
    t += BEAT  # breathe between phrases
    p += 1

# ---------- Mix ----------
mix = np.stack([hp(out_l, 55), hp(out_r, 55)], 1)
# carve space for the voice (1–3 kHz) a little
for ch in range(2):
    mid = sosfilt(butter(2, [1000, 3000], btype="band", fs=SR, output="sos"), mix[:, ch])
    mix[:, ch] -= mid * 0.35
tt = ta(DUR)
fade = np.minimum(tt / 0.8, 1) * np.minimum((DUR - tt) / 2.5, 1)
mix *= fade[:, None]
mix /= np.abs(mix).max() / 0.89
tmp = os.path.join(ROOT, "public", "_music.wav")
wavfile.write(tmp, SR, (mix * 32767).astype(np.int16))
subprocess.run(
    ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-b:a", "192k", os.path.join(ROOT, "public", "music.mp3")],
    check=True,
)
os.remove(tmp)
print("wrote public/music.mp3")
