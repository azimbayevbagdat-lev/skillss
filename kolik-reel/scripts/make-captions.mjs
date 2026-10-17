// Builds public/captions.json: word texts from scripts/voiceover.txt, timings from the audio.
// Whisper models can't be downloaded in this sandbox, so timings come from a pause-based
// alignment: energy envelope → candidate pauses → DP picks which pauses are word boundaries
// (keeping speech rate steady, preferring punctuation) → words share time by syllables.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const audio = path.join(root, "public/voiceover.wav");
const text = fs.readFileSync(path.join(root, "scripts/voiceover.txt"), "utf8");

const SR = 16000,
  HOP = 160,
  WIN = 400;
const pcm = execSync(
  `ffmpeg -loglevel error -i "${audio}" -f s16le -ac 1 -ar ${SR} -`,
  { maxBuffer: 1 << 28 },
);
const x = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length / 2);
const db = [];
for (let i = 0; i + WIN < x.length; i += HOP) {
  let s = 0;
  for (let j = i; j < i + WIN; j++) s += (x[j] / 32768) ** 2;
  db.push(10 * Math.log10(s / WIN + 1e-12));
}
const sorted = [...db].sort((a, b) => a - b);
const thr = sorted[Math.floor(sorted.length * 0.1)] + 6;
const tOf = (i) => (i * HOP) / SR;

// speech start/end
let first = db.findIndex((v) => v > thr);
let last = db.length - 1;
while (db[last] <= thr) last--;
const speechStart = tOf(first),
  speechEnd = tOf(last) + 0.03;

// candidate pauses (merge gaps < 0.1 s)
let runs = [];
let st = -1;
for (let i = first; i <= last; i++) {
  if (db[i] < thr && st < 0) st = i;
  if (db[i] >= thr && st >= 0) {
    if (tOf(i) - tOf(st) >= 0.12) runs.push({ start: tOf(st), end: tOf(i) });
    st = -1;
  }
}
const pauses = [];
for (const r of runs) {
  const p = pauses[pauses.length - 1];
  if (p && r.start - p.end < 0.1) p.end = r.end;
  else pauses.push({ ...r });
}

// words ("—" glued to the previous word)
const words = [];
for (const w of text.replace(/\s+/g, " ").trim().split(" ")) {
  if (/^[—–-]$/.test(w) && words.length) words[words.length - 1] += " —";
  else words.push(w);
}
const VOW = /[аәеёиоөуұүыіэюя]/gi;
const syl = words.map((w) => Math.max(1, (w.match(VOW) || []).length) + 0.3);
const strong = words.map(
  (w) => /[.!?…»]$|\.\.\.$/.test(w.replace(/[»"]+$/, "")) || /[.!?]»?$/.test(w),
);
const weak = words.map((w) => /[,:;—»]$/.test(w));
const N = words.length;
const pre = [0];
for (const s of syl) pre.push(pre[pre.length - 1] + s);

// boundaries: index 0 = speech start, 1..K = pauses, K+1 = speech end
const P = [
  { start: speechStart, end: speechStart },
  ...pauses,
  { start: speechEnd, end: speechEnd },
];
const K = P.length;
const totalSpeech =
  speechEnd - speechStart - pauses.reduce((a, p) => a + p.end - p.start, 0);
const rate = pre[N] / totalSpeech;

const INF = 1e18;
const dp = Array.from({ length: K }, () => new Float64Array(N + 1).fill(INF));
const from = Array.from({ length: K }, () => new Array(N + 1).fill(null));
dp[0][0] = 0;
for (let k = 1; k < K; k++) {
  for (let kp = 0; kp < k; kp++) {
    // skipped pauses between kp and k
    let skip = 0,
      skipDur = 0;
    for (let m = kp + 1; m < k; m++) {
      const d = P[m].end - P[m].start;
      skip += d * 6;
      skipDur += d;
    }
    const dur = P[k].start - P[kp].end - skipDur * 0.7;
    if (dur <= 0.05) continue;
    for (let j = 0; j <= N; j++) {
      if (dp[kp][j] >= INF) continue;
      const iMin = k === K - 1 ? N : j + 1;
      const iMax = k === K - 1 ? N : N - 1;
      for (let i = iMin; i <= iMax; i++) {
        const r = (pre[i] - pre[j]) / dur;
        let c = Math.log(r / rate) ** 2 * 4 + skip;
        if (k < K - 1) c += strong[i - 1] ? -0.8 : weak[i - 1] ? -0.4 : 0.6;
        const tot = dp[kp][j] + c;
        if (tot < dp[k][i]) {
          dp[k][i] = tot;
          from[k][i] = [kp, j];
        }
      }
    }
  }
}
// backtrack
const segs = [];
let k = K - 1,
  i = N;
while (k > 0) {
  const [kp, j] = from[k][i];
  segs.unshift({ a: j, b: i, start: P[kp].end, end: P[k].start });
  k = kp;
  i = j;
}
// Refine: snap each word boundary inside a chunk to the deepest nearby energy dip.
const smooth = db.map((_, i) => {
  let a = 0,
    n = 0;
  for (let j = Math.max(0, i - 2); j <= Math.min(db.length - 1, i + 2); j++)
    ((a += db[j]), n++);
  return a / n;
});
const snap = (t, win, lo, hi) => {
  const i0 = Math.max(
    Math.round(((t - win) * SR) / HOP),
    Math.round(((lo + 0.08) * SR) / HOP),
  );
  const i1 = Math.min(
    Math.round(((t + win) * SR) / HOP),
    Math.round(((hi - 0.08) * SR) / HOP),
  );
  if (i1 <= i0) return t;
  let best = Math.round((t * SR) / HOP),
    bv = Infinity;
  for (let i = i0; i <= i1; i++) {
    const v = smooth[i] + Math.abs(tOf(i) - t) * 8; // prefer dips close to the estimate
    if (v < bv) ((bv = v), (best = i));
  }
  const here = smooth[Math.min(smooth.length - 1, Math.round((t * SR) / HOP))];
  return here - smooth[best] > 3 ? tOf(best) : t;
};
const captions = [];
for (const s of segs) {
  const tot = pre[s.b] - pre[s.a];
  let t = s.start;
  console.log(
    `${s.start.toFixed(2)}-${s.end.toFixed(2)} [${(tot / (s.end - s.start)).toFixed(1)}] ${words.slice(s.a, s.b).join(" ")}`,
  );
  for (let w = s.a; w < s.b; w++) {
    const d = ((s.end - s.start) * syl[w]) / tot;
    captions.push({
      text: words[w],
      startMs: Math.round(t * 1000),
      endMs: Math.round((t + d) * 1000),
      timestampMs: Math.round((t + d / 2) * 1000),
      confidence: null,
    });
    t += d;
  }
  // snap internal boundaries
  const firstIdx = captions.length - (s.b - s.a);
  let prevEnd = s.start;
  for (let w = firstIdx; w < captions.length - 1; w++) {
    const est = captions[w].endMs / 1000;
    const punct = strong[s.a + (w - firstIdx)] || weak[s.a + (w - firstIdx)];
    const nextEnd = captions[w + 1].endMs / 1000;
    const durW = est - captions[w].startMs / 1000;
    const durN = nextEnd - est;
    // keep each word at least 60% of its syllable-based length
    const nt = snap(
      est,
      punct ? 0.35 : 0.12,
      prevEnd + durW * 0.6 - 0.08,
      nextEnd - durN * 0.6 + 0.08,
    );
    captions[w].endMs = Math.round(nt * 1000);
    captions[w + 1].startMs = Math.round(nt * 1000);
    prevEnd = nt;
  }
  for (let w = firstIdx; w < captions.length; w++)
    captions[w].timestampMs = Math.round(
      (captions[w].startMs + captions[w].endMs) / 2,
    );
}
fs.writeFileSync(
  path.join(root, "public/captions.json"),
  JSON.stringify(captions, null, 2),
);
console.log(
  `\n${captions.length} words, ${pauses.length} candidate pauses, ${segs.length} chunks, rate ${rate.toFixed(2)}`,
);
