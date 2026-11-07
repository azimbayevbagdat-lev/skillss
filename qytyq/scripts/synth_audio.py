"""Procedural (license-free) sound effects and background music.
Fallback for ElevenLabs SFX/Music. Writes 48 kHz WAV files.
Usage: python3 -I scripts/synth_audio.py <project_dir>"""
import sys, os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, lfilter

SR = 48000
root = sys.argv[1]
rng = np.random.default_rng(7)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def save(path, x, peak=0.9):
    x = norm(x, peak)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    wavfile.write(os.path.join(root, path), SR, (x * 32767).astype(np.int16))


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def resonator(x, f, bw):
    r = np.exp(-np.pi * bw / SR)
    c = 2 * r * np.cos(2 * np.pi * f / SR)
    return lfilter([1 - r], [1, -c, r * r], x)


def adsr(n, a, d, s, r):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    sus = max(n - a - d - r, 0)
    env = np.concatenate([np.linspace(0, 1, a), np.linspace(1, s, d), np.full(sus, s), np.linspace(s, 0, r)])
    return np.pad(env, (0, max(0, n - len(env))))[:n]


# ---------- voice-like giggle (formant synthesis, "ha-ha-ha") ----------
def laugh(n_syl=5, f0=300, rate=0.16, seed=1):
    g = np.random.default_rng(seed)
    out = np.zeros(int((n_syl * rate + 0.4) * SR))
    for i in range(n_syl):
        dur = rate * g.uniform(0.75, 0.95)
        t = t_(dur)
        pitch = f0 * (1.12 - 0.05 * i) * (1 + 0.08 * np.sin(2 * np.pi * 5 * t))
        phase = 2 * np.pi * np.cumsum(pitch) / SR
        src = sum(np.sin(k * phase) / k ** 1.2 for k in range(1, 30))
        breath = g.normal(0, 1, len(t))
        env_h = np.exp(-t / 0.03)
        env_v = adsr(len(t), 0.025, 0.05, 0.7, 0.05)
        exc = src * env_v + breath * env_h * 0.6 + breath * 0.04
        y = sum(resonator(exc, f, bw) * amp for f, bw, amp in [(850, 90, 1), (1300, 110, 0.6), (2600, 160, 0.25)])
        s = int(i * rate * SR)
        out[s:s + len(y)] += y * (1 - 0.1 * i)
    return lp(out, 6000)


def pop():
    t = t_(0.14)
    f = 900 * np.exp(-t * 25) + 300
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35)
    x += hp(rng.normal(0, 1, len(t)), 3000) * np.exp(-t * 300) * 0.3
    return x


def soft_pop():
    t = t_(0.09)
    f = 1400 * np.exp(-t * 40) + 500
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 55)


def bell():
    t = t_(2.2)
    x = np.zeros_like(t)
    for strike in [0, 0.12, 0.24, 0.36, 0.48]:
        tt = np.clip(t - strike, 0, None)
        on = (t >= strike)
        for f, a, d in [(1318, 1, 1.2), (1318 * 2.76, 0.4, 0.5), (1318 * 5.4, 0.2, 0.25), (1975, 0.5, 0.9)]:
            x += on * a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) * (0.85 if strike else 1)
    return x


def touch():
    t = t_(0.7)
    n = bp(rng.normal(0, 1, len(t)), 300, 1800)
    return n * adsr(len(t), 0.12, 0.2, 0.3, 0.35) * 0.6 + np.sin(2 * np.pi * 220 * t) * np.exp(-t * 6) * 0.15


def startle():
    t = t_(0.6)
    f = 180 + 900 * (1 - np.exp(-t * 18))
    boing = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.15 * np.sin(2 * np.pi * 28 * t))) / SR) * np.exp(-t * 6)
    hit = lp(rng.normal(0, 1, len(t)), 900) * np.exp(-t * 30)
    return boing * 0.7 + hit


def compute():
    t = t_(2.4)
    x = np.zeros_like(t)
    step = 0.08
    for i in range(int(2.4 / step)):
        s = int(i * step * SR)
        f = rng.choice([880, 1046, 1318, 1568, 1760, 2093])
        tt = t_(step * 0.7)
        seg = np.sign(np.sin(2 * np.pi * f * tt)) * 0.25 * np.exp(-tt * 30)
        x[s:s + len(seg)] += seg
    x = lp(x, 5000)
    x += np.sin(2 * np.pi * 110 * t) * 0.08
    return x * adsr(len(t), 0.05, 0.1, 1, 0.3)


def buzz():
    t = t_(0.55)
    x = np.sign(np.sin(2 * np.pi * 110 * t)) + 0.5 * np.sign(np.sin(2 * np.pi * 116 * t))
    x = lp(x, 2200) * adsr(len(t), 0.01, 0.05, 0.9, 0.08)
    return x * (1 - 0.6 * (np.sin(2 * np.pi * 12 * t) > 0.6))


def tick():
    t = t_(0.05)
    return hp(rng.normal(0, 1, len(t)), 2500) * np.exp(-t * 200) + np.sin(2 * np.pi * 3000 * t) * np.exp(-t * 150) * 0.5


def lab_ambience(dur=6.0):
    t = t_(dur)
    hum = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(60, 0.3), (120, 0.15), (180, 0.05)])
    air = lp(rng.normal(0, 1, len(t)), 700) * 0.15
    bub = np.zeros_like(t)
    for _ in range(40):
        s = rng.uniform(0, dur - 0.1)
        tt = t_(0.06)
        f = rng.uniform(600, 1400) * (1 + tt * 12)
        b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 60) * 0.25
        i = int(s * SR)
        bub[i:i + len(b)] += b
    beeps = np.zeros_like(t)
    for s in [1.0, 3.2, 5.0]:
        tt = t_(0.12)
        i = int(s * SR)
        beeps[i:i + len(tt)] += np.sin(2 * np.pi * 1760 * tt) * 0.12 * adsr(len(tt), 0.005, 0.02, 0.8, 0.03)
    return (hum + air + bub + beeps) * adsr(len(t), 0.5, 0.1, 1, 0.8)


def sparkle():
    t = t_(1.0)
    x = np.zeros_like(t)
    for i, f in enumerate([1568, 1976, 2349, 2637, 3136]):
        tt = np.clip(t - i * 0.06, 0, None)
        x += (t >= i * 0.06) * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 6) * 0.5
    return x


# ---------- background music: light, playful "science explainer" loop ----------
def music(dur):
    bpm = 104
    beat = 60 / bpm
    n = int(dur * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    midi = lambda m: 440 * 2 ** ((m - 69) / 12)
    # C - Am - F - G, each one bar (4 beats)
    chords = [[48, 52, 55], [45, 52, 57], [41, 48, 53], [43, 50, 55]]
    scale = [60, 62, 64, 67, 69, 72, 74, 76]

    def add(buf, start, sig):
        i = int(start * SR)
        if i >= n:
            return
        sig = sig[: n - i]
        buf[i:i + len(sig)] += sig

    def marimba(f, d=0.5):
        t = t_(d)
        return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)) * np.exp(-t * 7)

    def pad(fs, d):
        t = t_(d)
        x = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t) for f in fs)
        return x * adsr(len(t), 0.4, 0.3, 0.8, 0.6) * 0.12

    g = np.random.default_rng(3)
    bars = int(dur / (4 * beat)) + 1
    for b in range(bars):
        t0 = b * 4 * beat
        ch = chords[b % 4]
        p = pad([midi(m + 12) for m in ch], 4 * beat + 0.5)
        add(L, t0, p)
        add(R, t0, p)
        # bass
        for k in [0, 2, 2.5]:
            t = t_(beat * 0.9)
            bs = np.sin(2 * np.pi * midi(ch[0] - 12) * t) * np.exp(-t * 3) * 0.5
            add(L, t0 + k * beat, bs)
            add(R, t0 + k * beat, bs)
        # marimba arpeggio / melody (8th notes, sparse)
        for k in range(8):
            if g.random() < 0.72:
                note = g.choice(scale) if k % 2 else ch[(k // 2) % 3] + 24
                m = marimba(midi(note)) * 0.28
                pan = 0.5 + 0.3 * np.sin(k)
                add(L, t0 + k * beat / 2, m * (1 - pan) * 2)
                add(R, t0 + k * beat / 2, m * pan * 2)
        # light percussion: soft kick + shaker
        for k in range(4):
            t = t_(0.25)
            kick = np.sin(2 * np.pi * (50 + 80 * np.exp(-t * 30)) * t) * np.exp(-t * 14) * 0.45
            if k in (0, 2):
                add(L, t0 + k * beat, kick)
                add(R, t0 + k * beat, kick)
        for k in range(8):
            t = t_(0.06)
            sh = hp(g.normal(0, 1, len(t)), 6000) * np.exp(-t * 70) * (0.08 if k % 2 else 0.05)
            add(L, t0 + k * beat / 2, sh)
            add(R, t0 + k * beat / 2 + 0.004, sh)
        # snap on 2 and 4
        for k in (1, 3):
            t = t_(0.1)
            sn = bp(g.normal(0, 1, len(t)), 1500, 5000) * np.exp(-t * 45) * 0.18
            add(L, t0 + k * beat, sn)
            add(R, t0 + k * beat, sn)
    fade = np.ones(n)
    fl = int(2.5 * SR)
    fade[-fl:] = np.linspace(1, 0, fl)
    fade[: int(0.8 * SR)] = np.linspace(0, 1, int(0.8 * SR))
    return np.stack([L * fade, R * fade], axis=1)


if __name__ == "__main__":
    dur = float(sys.argv[2]) if len(sys.argv) > 2 else 74
    save("sfx/laugh_light.wav", laugh(5, 310, 0.15, 1))
    save("sfx/laugh_big.wav", laugh(7, 330, 0.13, 2))
    save("sfx/pop.wav", pop())
    save("sfx/pop_soft.wav", soft_pop())
    save("sfx/bell.wav", bell())
    save("sfx/touch_soft.wav", touch())
    save("sfx/startle.wav", startle())
    save("sfx/compute.wav", compute())
    save("sfx/buzz_error.wav", buzz())
    save("sfx/tick.wav", tick())
    save("sfx/lab_ambience.wav", lab_ambience())
    save("sfx/sparkle.wav", sparkle())
    save("music/bg_music.wav", music(dur), 0.8)
    print("ok")
