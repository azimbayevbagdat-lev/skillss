"""Audio mix: voice (cut, cleaned, -14 LUFS) + SFX bus placed from plan.json, SFX 12-18 dB under the voice,
sidechain-ducked under speech, final two-pass loudnorm to -14 LUFS / -1 dBTP."""
import json, re, subprocess
import numpy as np, soundfile as sf

W = "/home/user/skillss/reel/work/"
SFX = "/home/user/skillss/reel/sfx/"
SR = 48000
plan = json.load(open(W + "rem/src/plan.json"))
O = {o["id"]: o for o in plan["overlays"]}
DUR = plan["duration"]


def run(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True)


def loudnorm(inp, out, I, TP, extra_pre=""):
    pre = (extra_pre + ",") if extra_pre else ""
    r = run(["ffmpeg", "-hide_banner", "-y", "-i", inp, "-af", f"{pre}loudnorm=I={I}:TP={TP}:LRA=7:print_format=json", "-f", "null", "-"])
    m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S).group(0))
    af = (f"{pre}loudnorm=I={I}:TP={TP}:LRA=7:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    run(["ffmpeg", "-hide_banner", "-y", "-i", inp, "-af", af + ",aresample=48000", "-ar", "48000", "-ac", "2", out])


# 1) voice: high-pass, gentle compression, then -14 LUFS
loudnorm(W + "base.mov", W + "voice.wav", -14, -1.5,
         extra_pre="highpass=f=80,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=4")
voice, _ = sf.read(W + "voice.wav")
n = int(DUR * SR) + SR
voice = np.pad(voice, ((0, max(0, n - len(voice))), (0, 0)))[:n]


def rms_db(x):
    x = x if x.ndim == 1 else x.mean(1)
    a = np.abs(x)
    act = x[a > a.max() * 0.05] if a.max() > 0 else x
    return 20 * np.log10(np.sqrt(np.mean(act ** 2)) + 1e-9)


# voice reference level = RMS of voiced part
v_ref = rms_db(voice)
cache = {}


def load(name):
    if name not in cache:
        x, sr = sf.read(SFX + name + ".wav")
        if x.ndim == 1:
            x = np.stack([x, x], 1)
        cache[name] = x
    return cache[name]


bus = np.zeros_like(voice)


def place(name, t, rel_db):
    """rel_db: SFX level relative to voice (negative, 12..18 dB under)."""
    x = load(name)
    g = 10 ** ((v_ref + rel_db - rms_db(x)) / 20)
    s = int(t * SR)
    e = min(len(bus), s + len(x))
    if s < len(bus):
        bus[s:e] += x[: e - s] * g


events = []
def ev(name, t, rel):
    events.append((round(t, 3), name, rel)); place(name, t, rel)

ev("impact", 0.0, -12); ev("riser", 0.05, -16)
ev("whoosh", O["hook"]["logoAt"] - 0.08, -15); ev("pop", O["hook"]["logoAt"] + 0.1, -14)
t = O["counter"]["from"] + 0.05
while t < O["counter"]["countEnd"] - 0.05:
    ev("tick", t, -18); t += 0.09
ev("ding", O["counter"]["countEnd"], -14)
ev("whoosh", O["profile"]["from"], -15); ev("pop", O["profile"]["circleAt"], -15)
ev("whoosh_down", O["komissiya"]["from"], -14)
ev("coins", O["bonus"]["from"] + 0.08, -14); ev("coins2", O["bonus"]["from"] + 0.3, -17)
ev("tension_hit", O["dumping"]["from"], -12); ev("punch", O["dumping"]["qAt"], -15)
ev("boom", O["kz"]["shakeAt"], -12)
ev("record_scratch", O["chat"]["from"], -14)
ev("ding", O["check"]["from"], -14)
ev("pop", O["hand"]["from"], -14); ev("pop", O["hand"]["heartAt"], -15)
ev("whoosh", O["money"]["from"] + 0.1, -16); ev("cash_bell", O["money"]["landAt"], -13); ev("coins", O["money"]["landAt"] + 0.05, -17)
ev("notification", O["appcard"]["from"], -14)
ev("whoosh", O["jambyl"]["from"], -15); ev("ding", O["jambyl"]["markAt"], -15)
for key in ("terminal", "prompt"):
    o = O[key]
    for i, ch in enumerate(o["text"]):
        if ch.strip():
            ev(["key1", "key2", "key3"][i % 3], o["typeAt"] + i / o["cps"], -18)
ev("magic_chime", O["idea"]["morphAt"] - 0.1, -13)
ev("pop", O["badge"]["from"], -14)
ev("click", O["subscribe"]["clickAt"], -13); ev("notification", O["subscribe"]["clickAt"] + 0.15, -14)

sf.write(W + "sfx_bus.wav", bus.astype(np.float32), SR)
sf.write(W + "voice_pad.wav", voice.astype(np.float32), SR)
# 2) sidechain duck SFX under speech (extra ~3-6 dB when voice is active), mix, final -14 LUFS
run(["ffmpeg", "-hide_banner", "-y", "-i", W + "sfx_bus.wav", "-i", W + "voice_pad.wav", "-filter_complex",
     "[1:a]asplit=2[sc][v];[0:a][sc]sidechaincompress=threshold=0.05:ratio=3:attack=5:release=180[d];"
     "[v][d]amix=inputs=2:duration=first:normalize=0[m]", "-map", "[m]", "-t", str(DUR), W + "premix.wav"])
loudnorm(W + "premix.wav", W + "mix.wav", -14, -1.0)
r = run(["ffmpeg", "-hide_banner", "-i", W + "mix.wav", "-af", "ebur128=peak=true", "-f", "null", "-"])
print(r.stderr[-400:])
json.dump(events, open(W + "sfx_events.json", "w"), indent=0)
print(len(events), "sfx events; voice ref RMS %.1f dBFS" % v_ref)
