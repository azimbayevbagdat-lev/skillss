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
