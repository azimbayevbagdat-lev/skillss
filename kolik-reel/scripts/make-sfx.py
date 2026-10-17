"""Synthesizes the two sound effects: a soft whoosh (scene changes) and gentle water sloshing
with a 5 s period (sway scene). Run: python3 scripts/make-sfx.py  (numpy + scipy)"""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "sfx")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(5)


def moving_bp(noise, centers, q=1.5, block=256):
    out = np.zeros_like(noise)
    for i in range(0, len(noise), block):
        c = float(np.clip(centers[min(i, len(centers) - 1)], 80, SR / 2.4))
        sos = butter(2, [c / q, min(c * q, SR / 2.1)], btype="band", fs=SR, output="sos")
        seg = noise[max(0, i - 2048) : i + block]
        out[i : i + block] = sosfilt(sos, seg)[-len(noise[i : i + block]) :]
    return out


def save(name, l, r=None, peak=0.8):
    r = l if r is None else r
    m = max(np.abs(l).max(), np.abs(r).max()) + 1e-9
    data = np.stack([l, r], 1) / m * peak
    wavfile.write(os.path.join(OUT, f"{name}.wav"), SR, (data * 32767).astype(np.int16))


# soft whoosh, 0.55 s, panned left → right
dur = 0.55
t = np.arange(int(dur * SR)) / SR
u = t / dur
w = moving_bp(rng.standard_normal(len(t)), 300 + 1800 * np.sin(np.pi * u) ** 1.5) * np.sin(np.pi * u) ** 2
pan = np.linspace(-0.6, 0.6, len(t))
save("whoosh", w * np.sqrt((1 - pan) / 2), w * np.sqrt((1 + pan) / 2))

# water: low sloshing noise swelling every 5 s + small bubbles
dur = 6.0
t = np.arange(int(dur * SR)) / SR
swell = 0.35 + 0.65 * (0.5 - 0.5 * np.cos(2 * np.pi * t / 5)) ** 1.5
water = moving_bp(rng.standard_normal(len(t)), 380 + 260 * np.sin(2 * np.pi * t / 5) + 80 * np.sin(t * 7), q=1.3) * swell
bubbles = np.zeros(len(t))
for _ in range(40):
    s = int(rng.uniform(0, dur - 0.1) * SR)
    g = np.arange(int(0.06 * SR)) / SR
    f = rng.uniform(500, 1400) * (1 + g * 8)
    bubbles[s : s + len(g)] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-g * 70) * 0.25
mix = water + bubbles
fade = np.minimum(t / 0.6, 1) * np.minimum((dur - t) / 0.8, 1)
save("water", mix * fade, np.roll(mix, 900) * fade, peak=0.7)
print("ok", os.listdir(OUT))


# ---------------- cartoon SFX for the scene cues ----------------
def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def env(t, a, d):
    return np.minimum(t / a, 1) * np.exp(-np.maximum(t - a, 0) * d)


def sweep(freqs):
    return np.sin(2 * np.pi * np.cumsum(freqs) / SR)


def hp(x, f):
    return sosfilt(butter(2, f, btype="high", fs=SR, output="sos"), x)


def lp(x, f):
    return sosfilt(butter(2, f, btype="low", fs=SR, output="sos"), x)


def mono(name, x, peak=0.8):
    save(name, x, x, peak)


# pop (bubbles, titles)
t = t_axis(0.18)
mono("pop", sweep(950 * np.exp(-t * 9) + 380) * env(t, 0.002, 30) + hp(rng.standard_normal(len(t)), 3000) * env(t, 0.0005, 300) * 0.3, 0.7)
# blip (stopwatch tick, phone)
t = t_axis(0.1)
mono("blip", (np.sin(2 * np.pi * 1320 * t) + 0.35 * np.sin(2 * np.pi * 2640 * t)) * env(t, 0.001, 50), 0.6)
# zap (lightning)
t = t_axis(0.45)
jit = 160 + 90 * np.cumsum(rng.standard_normal(len(t))) / 300
z = np.sign(np.sin(2 * np.pi * np.cumsum(jit) / SR)) * 0.5 + hp(rng.standard_normal(len(t)), 2500) * 0.6
mono("zap", sosfilt(butter(2, [200, 7000], btype="band", fs=SR, output="sos"), z) * env(t, 0.003, 6), 0.6)
# hit (cartoon impact)
t = t_axis(0.8)
h = sweep(60 + 110 * np.exp(-t * 16)) * env(t, 0.002, 7) + lp(rng.standard_normal(len(t)), 1200) * env(t, 0.001, 40)
mono("hit", np.tanh(h * 1.6), 0.85)
# alarm (warning sign): two-tone beeps
t = t_axis(0.7)
f = np.where((t * 6).astype(int) % 2 == 0, 880, 660)
mono("alarm", np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4 * env(t, 0.005, 2.5), 0.5)
# gulp (nausea): wobbly descending tone
t = t_axis(0.7)
g = sweep(420 * np.exp(-t * 1.6) * (1 + 0.12 * np.sin(2 * np.pi * 9 * t))) * env(t, 0.02, 3)
mono("gulp", lp(g + 0.4 * sweep(210 * np.exp(-t * 1.6)), 2000) * env(t, 0.02, 3), 0.7)
# scribble (marker drawing), 0.8 s
t = t_axis(0.8)
strokes = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 7 * t))
sc = sosfilt(butter(2, [1800, 6000], btype="band", fs=SR, output="sos"), rng.standard_normal(len(t))) * strokes
mono("scribble", sc * np.minimum(t / 0.03, 1) * np.minimum((0.8 - t) / 0.08, 1), 0.6)
# ding (check mark)
t = t_axis(1.4)
d = sum(a * np.sin(2 * np.pi * 1568 * m * t) * np.exp(-t * (3 + m)) for m, a in [(1, 1), (2.01, 0.4), (3.0, 0.15)])
mono("ding", d * np.minimum(t / 0.002, 1), 0.7)
# click (button)
t = t_axis(0.06)
mono("click", hp(rng.standard_normal(len(t)), 1500) * env(t, 0.0005, 160) + np.sin(2 * np.pi * 2200 * t) * env(t, 0.0005, 120) * 0.5, 0.7)
# dizzy (spiral): slow warbling whistle
t = t_axis(2.4)
dz = sweep(700 + 180 * np.sin(2 * np.pi * 2.2 * t) - 120 * t) * np.minimum(t / 0.2, 1) * np.minimum((2.4 - t) / 0.4, 1)
mono("dizzy", dz * 0.6, 0.5)
# swoosh (short, for drawn lines / window glass)
t = t_axis(0.4)
u = t / 0.4
sw = moving_bp(rng.standard_normal(len(t)), 500 + 3000 * u) * np.sin(np.pi * u) ** 2
mono("swoosh", sw, 0.7)
# wind (open window)
t = t_axis(1.8)
wd = moving_bp(rng.standard_normal(len(t)), 500 + 300 * np.sin(t * 3), q=1.25) * np.minimum(t / 0.3, 1) * np.minimum((1.8 - t) / 0.5, 1)
save("wind", wd, np.roll(wd, 1200), 0.7)
print("cartoon sfx:", sorted(os.listdir(OUT)))
