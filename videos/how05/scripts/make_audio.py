"""Synthesize the background pad and every SFX into public/ (no downloads).

The SFX URLs in remotion-dev/skills (remotion.media) are not reachable from
this environment, so everything is generated from noise and oscillators.
Usage: python3 -I scripts/make_audio.py
"""

import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
rng = np.random.default_rng(5)


def save(name, x, peak=0.9):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    m = np.max(np.abs(x)) or 1
    x = x / m * peak
    path = ROOT / "public" / name
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def onepole_lp(x, fc):
    try:
        from scipy.signal import lfilter
        a = np.exp(-2 * np.pi * fc / SR)
        return lfilter([1 - a], [1, -a], x)
    except ImportError:
        pass
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def sweep_bp(x, f0, f1, width=0.6):
    """Crude time-varying band-pass via overlapping FFT blocks."""
    n = len(x)
    out = np.zeros(n)
    block = 2048
    hop = block // 2
    win = np.hanning(block)
    for start in range(0, n - block, hop):
        c = start / max(1, n - block)
        fc = f0 * (f1 / f0) ** c
        seg = x[start:start + block] * win
        X = np.fft.rfft(seg)
        f = np.fft.rfftfreq(block, 1 / SR)
        X *= np.exp(-((np.log2(np.maximum(f, 1) / fc)) ** 2) / (2 * width ** 2))
        out[start:start + block] += np.fft.irfft(X, block)
    return out


def env(n, attack, release, curve=4.0):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    r = np.exp(-curve * np.clip(t - attack, 0, None) / release)
    return a * r


# ── SFX ──
def air_burst():
    n = int(0.55 * SR)
    x = bandpass(rng.standard_normal(n), 1500, 9000) * env(n, 0.008, 0.32, 3.5)
    x += 0.3 * bandpass(rng.standard_normal(n), 300, 1500) * env(n, 0.004, 0.12)
    return x


def valve_click():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n) * env(n, 0.0005, 0.006, 6)
    x += 0.5 * np.sin(2 * np.pi * 2300 * t) * env(n, 0.001, 0.05, 5)
    x += 0.4 * np.sin(2 * np.pi * 900 * t) * env(n, 0.001, 0.08, 5)
    # second, softer clack
    d = int(0.045 * SR)
    x[d:] += 0.5 * (rng.standard_normal(n - d) * env(n - d, 0.0005, 0.005, 6))
    return x


def pff():
    n = int(0.45 * SR)
    x = onepole_lp(rng.standard_normal(n), 1400) * env(n, 0.03, 0.3, 3)
    return x


def fan_hum():
    t = t_(2.6)
    n = len(t)
    x = 0.6 * np.sin(2 * np.pi * 92 * t) + 0.3 * np.sin(2 * np.pi * 184 * t) + 0.12 * np.sin(2 * np.pi * 276 * t)
    x *= 1 + 0.15 * np.sin(2 * np.pi * 11 * t)
    x += 0.25 * onepole_lp(rng.standard_normal(n), 600)
    fade = np.minimum(np.clip(t / 0.5, 0, 1), np.clip((t[-1] - t) / 0.7, 0, 1))
    return x * fade


def ui_tick():
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 1850 * t) * env(n, 0.001, 0.02, 5) + 0.3 * np.sin(2 * np.pi * 3700 * t) * env(n, 0.001, 0.01, 5)


def whoosh():
    n = int(0.75 * SR)
    x = sweep_bp(rng.standard_normal(n), 350, 2600, 0.5)
    t = np.arange(n) / SR
    shape = np.sin(np.pi * np.clip(t / t[-1], 0, 1)) ** 1.6
    return x * shape


def key():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return rng.standard_normal(n) * env(n, 0.0005, 0.004, 6) + 0.4 * np.sin(2 * np.pi * 1300 * t) * env(n, 0.001, 0.012, 5)


def send():
    n = int(0.55 * SR)
    x = sweep_bp(rng.standard_normal(n), 600, 4000, 0.45)
    t = np.arange(n) / SR
    x *= np.sin(np.pi * np.clip(t / t[-1], 0, 1)) ** 1.2
    pop = np.sin(2 * np.pi * (500 + 900 * t) * t) * env(n, 0.002, 0.06, 5)
    return 0.8 * x + 0.5 * pop


# ── Background pad: slow 4-chord loop, soft and airy ──
def pad(seconds):
    t = t_(seconds)
    n = len(t)
    chords = [
        [110.0, 164.81, 220.0, 261.63, 329.63],  # Am(add9)-ish
        [87.31, 130.81, 174.61, 220.0, 329.63],  # Fmaj7
        [98.0, 146.83, 196.0, 246.94, 293.66],  # G
        [130.81, 196.0, 261.63, 329.63, 392.0],  # C
    ]
    bar = 8.0
    out = np.zeros(n)
    for ci in range(int(np.ceil(seconds / bar)) + 1):
        chord = chords[ci % 4]
        start = ci * bar - 1.5
        e = np.clip((t - start) / 2.5, 0, 1) * np.clip((start + bar + 3.0 - t) / 2.5, 0, 1)
        if not e.any():
            continue
        for k, f in enumerate(chord):
            for det in (-0.12, 0.12):
                ph = 2 * np.pi * (f * (1 + det / 100)) * t + k
                out += e * (np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)) / (1 + k * 0.4)
    # gentle pulse so it reads as electronic, not organ
    pulse = 0.85 + 0.15 * np.sin(2 * np.pi * (100 / 60 / 2) * t) ** 2
    out *= pulse
    out = onepole_lp(out, 1800)
    air = onepole_lp(rng.standard_normal(n), 3000) * 0.04
    fade = np.minimum(np.clip(t / 2.0, 0, 1), np.clip((seconds - t) / 2.5, 0, 1))
    left = (out + air) * fade
    right = (np.roll(out, 240) + np.roll(air, 1200)) * fade
    return np.stack([left, right], axis=1)


if __name__ == "__main__":
    save("sfx/air-burst.wav", air_burst())
    save("sfx/valve-click.wav", valve_click())
    save("sfx/pff.wav", pff())
    save("sfx/fan-hum.wav", fan_hum())
    save("sfx/ui-tick.wav", ui_tick())
    save("sfx/whoosh.wav", whoosh())
    save("sfx/key.wav", key())
    save("sfx/send.wav", send())
    save("music/pad.wav", pad(92), peak=0.8)
    print("ok")
