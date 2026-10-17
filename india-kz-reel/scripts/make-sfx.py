"""Synthesizes all sound effects (public/sfx/*.wav) and the ambient music bed (public/music.mp3).

Modeled on the reference reel: sub-bass "boom" drops on key beats, whooshes on scene changes,
pops/blips for UI elements, ticks for counters, a shimmer for the particle swarm, risers,
wind for the cold scene and a quiet electronic pad + arpeggio underneath.
Run: python3 scripts/make-sfx.py   (needs numpy + scipy + ffmpeg)
"""
import os
import subprocess
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "sfx")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def sweep(f0_fn, t):
    """Sine with time-varying frequency (Hz array)."""
    return np.sin(2 * np.pi * np.cumsum(f0_fn) / SR)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def moving_bp(noise, centers, q=1.4, block=256):
    """Band-pass noise with a center frequency that moves over time."""
    out = np.zeros_like(noise)
    for i in range(0, len(noise), block):
        c = float(np.clip(centers[min(i, len(centers) - 1)], 60, SR / 2.3))
        sos = butter(2, [c / q, min(c * q, SR / 2.1)], btype="band", fs=SR, output="sos")
        seg = noise[max(0, i - 2048) : i + block]
        out[i : i + block] = sosfilt(sos, seg)[-len(noise[i : i + block]) :]
    return out


def reverb(x, sec=1.2, wet=0.25):
    ir_t = t_axis(sec)
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 5)
    ir = lp(ir, 5000)
    ir /= np.abs(ir).sum() ** 0.5 * 8
    y = np.convolve(x, ir)[: len(x) + len(ir_t)]
    dry = np.pad(x, (0, len(y) - len(x)))
    return dry * (1 - wet) + y * wet


def save(name, x, stereo_pan=None, peak=0.89):
    x = x / (np.abs(x).max() + 1e-9) * peak
    if stereo_pan is not None:  # pan curve -1..1, same length
        l = x * np.sqrt((1 - stereo_pan) / 2)
        r = x * np.sqrt((1 + stereo_pan) / 2)
        data = np.stack([l, r], 1)
    else:
        data = np.stack([x, x], 1)
    wavfile.write(os.path.join(OUT, f"{name}.wav"), SR, (data * 32767).astype(np.int16))


def env_ad(t, a, d):
    return np.minimum(t / a, 1) * np.exp(-np.maximum(t - a, 0) * d)


# 1) BOOM — cinematic sub drop (like the reference's big beats)
t = t_axis(2.4)
f = 32 + 52 * np.exp(-t * 3.2)
sub = sweep(f, t) * env_ad(t, 0.004, 2.4) * np.minimum((2.4 - t) / 0.6, 1)
thump = lp(rng.standard_normal(len(t)), 180) * env_ad(t, 0.002, 28) * 2.5
click = hp(rng.standard_normal(len(t)), 2500) * env_ad(t, 0.0005, 90) * 0.4
boom = np.tanh((sub * 1.3 + thump + click) * 1.6) * np.minimum((2.4 - t) / 0.5, 1)
save("boom", reverb(boom, 1.6, 0.18))

# 2) HIT — smaller punch for secondary reveals
t = t_axis(0.9)
hit = sweep(55 + 90 * np.exp(-t * 14), t) * env_ad(t, 0.003, 6)
hit += lp(rng.standard_normal(len(t)), 900) * env_ad(t, 0.001, 35) * 0.9
save("hit", reverb(np.tanh(hit * 1.4), 0.8, 0.2))

# 3) WHOOSH — scene transitions (band-passed noise sweeping up then down, panned L→R)
for name, dur in (("whoosh", 0.7), ("swoosh", 0.38)):
    t = t_axis(dur)
    u = t / dur
    centers = 350 + 2600 * np.sin(np.pi * u) ** 1.5
    w = moving_bp(rng.standard_normal(len(t)), centers * 1.0) * np.sin(np.pi * u) ** 2
    save(name, w, stereo_pan=np.linspace(-0.7, 0.7, len(w)), peak=0.8)

# 4) POP — UI tags / city pins
t = t_axis(0.18)
pop = sweep(950 * np.exp(-t * 9) + 380, t) * env_ad(t, 0.002, 30)
pop += hp(rng.standard_normal(len(t)), 3000) * env_ad(t, 0.0005, 300) * 0.3
save("pop", pop, peak=0.7)

# 5) BLIP — digital tone (counter tick, like the 650 Hz blips in the reference)
t = t_axis(0.09)
blip = (np.sin(2 * np.pi * 1320 * t) + 0.35 * np.sin(2 * np.pi * 2640 * t)) * env_ad(t, 0.001, 55)
save("blip", blip, peak=0.55)

# 6) TICK — very short click
t = t_axis(0.03)
tick = hp(rng.standard_normal(len(t)), 4000) * env_ad(t, 0.0003, 260)
save("tick", tick, peak=0.5)

# 7) SHIMMER — the particle swarm (glittery grains, rising density)
dur = 3.4
t = t_axis(dur)
sh = np.zeros(len(t))
for _ in range(420):
    s = int(rng.uniform(0, dur - 0.12) ** 0.8 / dur ** 0.8 * dur * SR)
    g = t_axis(rng.uniform(0.04, 0.12))
    fr = rng.uniform(2200, 7000)
    grain = np.sin(2 * np.pi * fr * g) * np.exp(-g * 45) * rng.uniform(0.2, 1)
    sh[s : s + len(g)] += grain[: len(sh) - s]
air = moving_bp(rng.standard_normal(len(t)), 1200 + 3500 * t / dur) * 0.5
shimmer = (sh * 0.5 + air) * np.minimum(t / 0.4, 1) * np.minimum((dur - t) / 0.5, 1)
save("shimmer", shimmer, stereo_pan=0.6 * np.sin(t * 2.3), peak=0.7)

# 8) RISER — tension before a big reveal
dur = 1.6
t = t_axis(dur)
u = t / dur
riser = moving_bp(rng.standard_normal(len(t)), 300 + 5200 * u ** 2) * u ** 2.2
riser += sweep(180 + 700 * u ** 2, t) * 0.35 * u ** 2
save("riser", riser, peak=0.75)

# 9) WIND — cold north scene
dur = 4.4
t = t_axis(dur)
wind = moving_bp(rng.standard_normal(len(t)), 500 + 350 * np.sin(t * 1.7) + 200 * np.sin(t * 4.1), q=1.25)
wind *= (0.6 + 0.4 * np.sin(t * 2.2)) * np.minimum(t / 0.8, 1) * np.minimum((dur - t) / 0.8, 1)
save("wind", wind, stereo_pan=0.5 * np.sin(t * 0.9), peak=0.7)

# 10) ZAP — electric (power plants ⚡)
t = t_axis(0.22)
jit = 140 + 60 * rng.standard_normal(len(t)).cumsum() / 200
zap = np.sign(np.sin(2 * np.pi * np.cumsum(jit) / SR)) * 0.6 + hp(rng.standard_normal(len(t)), 2000) * 0.5
zap = bp(zap, 200, 6000) * env_ad(t, 0.002, 18)
save("zap", zap, peak=0.6)

# 11) GLITCH — heavy UI alarm for "жетіспейді" / "мәселе"
t = t_axis(0.45)
gl = np.sign(np.sin(2 * np.pi * 220 * t)) * (np.floor(t * 40) % 2) * 0.5
gl += bp(rng.standard_normal(len(t)), 800, 4000) * (np.floor(t * 23) % 2) * 0.6
save("glitch", gl * env_ad(t, 0.002, 6), peak=0.6)


# ---------- Music bed: quiet electronic pad + plucked arpeggio (A minor, 96 bpm) ----------
def note(m):
    return 440 * 2 ** ((m - 69) / 12)


DUR = 66.0
t = t_axis(DUR)
music = np.zeros(len(t))
beat = 60 / 96
bar = beat * 4
# chords (midi): Am, F, C, G ... final section darker: Dm, Am
prog = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]]
dark = [[50, 53, 57], [45, 52, 57]]
FINAL_AT = 56.8
pos = 0.0
i = 0
chords = []
while pos < DUR:
    seq = dark if pos >= FINAL_AT - 0.01 else prog
    chords.append((pos, seq[i % len(seq)]))
    pos += bar * 2
    i += 1
    if FINAL_AT - 0.01 > pos - bar * 2 and pos > FINAL_AT and seq is prog:
        pos = FINAL_AT  # switch harmony exactly at the final scene
        i = 0
for start, ch in chords:
    length = bar * 2 + 1.0
    s = int(start * SR)
    seg_t = t_axis(min(length, DUR - start))
    env = np.minimum(seg_t / 0.9, 1) * np.minimum((len(seg_t) / SR - seg_t) / 1.0, 1)
    pad = np.zeros(len(seg_t))
    for m in ch:
        for det in (-0.08, 0.0, 0.08):
            f0 = note(m) * 2 ** (det / 12)
            for h in range(1, 7):
                pad += np.sin(2 * np.pi * f0 * h * seg_t + h) / h ** 1.6
    bass = np.sin(2 * np.pi * note(ch[0] - 12) * seg_t) * 0.5
    music[s : s + len(seg_t)] += (pad * 0.12 + bass * 0.35) * env
    # arpeggio: 8th notes through chord tones one/two octaves up
    arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24]
    n8 = beat / 2
    k = 0
    while k * n8 < bar * 2 and start + k * n8 < DUR - 0.5:
        ps = int((start + k * n8) * SR)
        g = t_axis(0.45)
        f0 = note(arp[k % 4])
        pl = (np.sin(2 * np.pi * f0 * g) + 0.3 * np.sin(4 * np.pi * f0 * g)) * np.exp(-g * 9)
        pl *= np.minimum(g / 0.004, 1) * np.minimum((0.45 - g) / 0.08, 1)
        end = min(ps + len(g), len(music))
        music[ps:end] += pl[: end - ps] * 0.22
        k += 1
music = hp(lp(music, 3200), 70)
# simple stereo delay for width
d = int(beat * 0.75 * SR)
left = music.copy()
right = np.concatenate([np.zeros(d), music[:-d]]) * 0.8 + music * 0.6
fade = np.minimum(t / 1.5, 1) * np.minimum((DUR - t) / 2.5, 1)
stereo = np.stack([left * fade, right * fade], 1)
stereo /= np.abs(stereo).max() / 0.85
tmp = os.path.join(OUT, "_music.wav")
wavfile.write(tmp, SR, (stereo * 32767).astype(np.int16))
subprocess.run(
    ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-b:a", "192k", os.path.join(ROOT, "public", "music.mp3")],
    check=True,
)
os.remove(tmp)
print("done:", sorted(os.listdir(OUT)))
