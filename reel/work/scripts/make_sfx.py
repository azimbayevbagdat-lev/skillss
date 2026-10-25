"""Build the SFX set: Kenney CC0 files (via soundcn repo) + sounds synthesized with numpy."""
import numpy as np, soundfile as sf, subprocess, os
from scipy.signal import butter, sosfilt

SR = 48000
OUT = "/home/user/skillss/reel/sfx/"
K = "/home/user/skillss/reel/work/dl/soundcn/assets/"
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def save(name, x):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    peak = np.max(np.abs(x)) + 1e-9
    x = x / peak * 0.89  # -1 dBFS peak
    sf.write(OUT + name + ".wav", x.astype(np.float32), SR)


def t(d):
    return np.arange(int(SR * d)) / SR


def env(d, a=0.005, decay=5.0):
    tt = t(d)
    e = np.exp(-tt * decay)
    na = int(SR * a)
    if na > 0:
        e[:na] *= np.linspace(0, 1, na)
    return e


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "bandpass", fs=SR, output="sos"), x)


def lp(x, f):
    return sosfilt(butter(2, f, "lowpass", fs=SR, output="sos"), x)


def sweep_noise(d, f0, f1, q=0.6, shape=None):
    """Band-passed noise whose centre frequency sweeps f0->f1 (block processed)."""
    n = int(SR * d); x = rng.standard_normal(n); y = np.zeros(n)
    blk = 512
    for i in range(0, n, blk):
        fc = f0 * (f1 / f0) ** (i / n)
        lo, hi = max(40, fc * (1 - q)), min(SR / 2 - 100, fc * (1 + q))
        seg = x[max(0, i - 2048):i + blk]
        yy = bp(seg, lo, hi)
        y[i:i + blk] = yy[-len(x[i:i + blk]):]
    return y


def kenney(name, rel):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", K + rel, "-ar", str(SR), "-ac", "2", OUT + name + ".wav"], check=True)


# --- synthesized ---
d = 0.55; tt = t(d)
whoosh = sweep_noise(d, 300, 3500) * np.sin(np.pi * tt / d) ** 2
save("whoosh", whoosh)
d = 0.7; tt = t(d)
save("whoosh_down", sweep_noise(d, 4000, 180) * np.sin(np.pi * tt / d) ** 1.5)

d = 1.6; tt = t(d)
f = 120 * (2400 / 120) ** (tt / d)
riser = 0.35 * np.sin(2 * np.pi * np.cumsum(f) / SR) + sweep_noise(d, 400, 8000, 0.5)
riser *= (tt / d) ** 2
save("riser", riser)

d = 0.9; tt = t(d)
sub = np.sin(2 * np.pi * (45 + 60 * np.exp(-tt * 18)) * tt) * env(d, 0.002, 5)
click = rng.standard_normal(len(tt)) * env(d, 0.0005, 60)
save("impact", sub + 0.35 * lp(click, 3000))

d = 0.18; tt = t(d)
f = 900 * np.exp(-tt * 14) + 300
save("pop", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.002, 28))

d = 1.4; tt = t(d)
ding = sum(a * np.sin(2 * np.pi * fr * tt) * np.exp(-tt * dc) for fr, a, dc in
           [(1760, 1, 3.5), (3520, .35, 6), (5280, .15, 9), (2640, .2, 5)])
ding[:100] *= np.linspace(0, 1, 100)
save("ding", ding)

d = 1.6; tt = t(d)
tens = (np.sin(2 * np.pi * 55 * tt) + .6 * np.sin(2 * np.pi * 58.3 * tt) + .4 * np.sin(2 * np.pi * 110 * tt)) * env(d, 0.003, 2.2)
tens += 0.5 * lp(rng.standard_normal(len(tt)), 900) * env(d, 0.001, 14)
save("tension_hit", tens)

d = 0.8; tt = t(d)
mod = 900 + 700 * np.sin(2 * np.pi * (3.2 * tt + 2 * tt ** 2))
y = np.zeros(len(tt)); x = rng.standard_normal(len(tt))
for i in range(0, len(tt), 256):
    fc = mod[i]; seg = x[max(0, i - 1024):i + 256]
    y[i:i + 256] = bp(seg, fc * .6, fc * 1.6)[-len(x[i:i + 256]):]
save("record_scratch", y * np.minimum(1, (d - tt) * 6) * np.minimum(1, tt * 60))

d = 1.8; tt = t(d)
notes = [1046.5, 1318.5, 1568, 2093, 2637]
chime = np.zeros(len(tt))
for k, fr in enumerate(notes):
    st = int(SR * 0.07 * k); seg = tt[: len(tt) - st]
    chime[st:] += np.sin(2 * np.pi * fr * seg) * np.exp(-seg * 3) * (1 + .3 * np.sin(2 * np.pi * 6 * seg))
save("magic_chime", chime)

d = 0.7; tt = t(d)
n1 = np.sin(2 * np.pi * 1318.5 * tt) * env(d, 0.003, 9)
n2 = np.zeros(len(tt)); st = int(SR * .12); s2 = tt[:len(tt) - st]
n2[st:] = np.sin(2 * np.pi * 1975.5 * s2) * np.exp(-s2 * 7)
save("notification", n1 + n2)

# cash register: two bells + drawer thunk
d = 1.3; tt = t(d)
bell = sum(np.sin(2 * np.pi * fr * tt) * np.exp(-tt * 4) for fr in (2093, 2637, 3136))
bell2 = np.zeros(len(tt)); st = int(SR * .09); s2 = tt[:len(tt) - st]
bell2[st:] = sum(np.sin(2 * np.pi * fr * s2) * np.exp(-s2 * 3.5) for fr in (2349, 2960, 3520))
thunk = lp(rng.standard_normal(len(tt)), 400) * env(d, 0.001, 25)
save("cash_bell", bell + bell2 + 1.5 * thunk)

# --- Kenney CC0 ---
kenney("tick", "kenney_interface-sounds/tick_001.ogg")
kenney("click", "kenney_interface-sounds/click_002.ogg")
kenney("key1", "kenney_interface-sounds/click_001.ogg")
kenney("key2", "kenney_interface-sounds/click_003.ogg")
kenney("key3", "kenney_interface-sounds/click_004.ogg")
kenney("coins", "kenney_rpg-audio/handleCoins.ogg")
kenney("coins2", "kenney_casino-audio/chips-collide-3.ogg")
kenney("boom", "kenney_sci-fi-sounds/lowFrequency_explosion_000.ogg")
kenney("punch", "kenney_impact-sounds/impactPunch_heavy_000.ogg")
kenney("confirm", "kenney_interface-sounds/confirmation_002.ogg")
print(sorted(os.listdir(OUT)))
