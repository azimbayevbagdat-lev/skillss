// Builds public/captions.json from the script text + pause positions in the voiceover.
// Whisper/Vosk models can't be downloaded in this environment, so we align heuristically:
// 1) ffmpeg silencedetect finds pauses, 2) a DP assigns each pause to a word boundary
// (preferring punctuation, keeping speech rate steady), 3) words share chunk time by syllables.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const audio = path.join(root, "public/voiceover.mp3");
const text = fs.readFileSync(path.join(root, "scripts/voiceover.txt"), "utf8");

const duration = parseFloat(
  execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${audio}"`,
  ).toString(),
);
const log = execSync(
  `ffmpeg -i "${audio}" -af silencedetect=noise=-35dB:d=0.25 -f null - 2>&1`,
).toString();
const silences = [];
for (const m of log.matchAll(
  /silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g,
)) {
  const end = parseFloat(m[1]);
  silences.push({ start: end - parseFloat(m[2]), end });
}
// Speech chunks between pauses
const chunks = [];
let cur = 0.05;
for (const s of silences) {
  chunks.push({ start: cur, end: s.start });
  cur = s.end;
}
chunks.push({ start: cur, end: Math.min(duration - 0.1, duration) });

// Words; dashes glue to the previous word
const raw = text.replace(/\s+/g, " ").trim().split(" ");
const words = [];
for (const w of raw) {
  if (/^[—–-]$/.test(w) && words.length) words[words.length - 1] += " —";
  else words.push(w);
}
const VOWELS = /[аәеёиоөуұүыіэюя]/gi;
const syl = words.map((w) => Math.max(1, (w.match(VOWELS) || []).length) + 0.3);
const endsPunct = words.map((w) => /[.,!?…—:]$/.test(w));
const strongPunct = words.map((w) => /[.!?…]$/.test(w));

const N = words.length;
const K = chunks.length;
const pre = [0];
for (const s of syl) pre.push(pre[pre.length - 1] + s);
const totalSpeech = chunks.reduce((a, c) => a + (c.end - c.start), 0);
const rate = pre[N] / totalSpeech;

// dp[k][i] = min cost when first k chunks cover words [0, i)
const INF = 1e18;
const dp = Array.from({ length: K + 1 }, () => new Array(N + 1).fill(INF));
const from = Array.from({ length: K + 1 }, () => new Array(N + 1).fill(-1));
dp[0][0] = 0;
for (let k = 1; k <= K; k++) {
  const d = chunks[k - 1].end - chunks[k - 1].start;
  for (let i = k; i <= N; i++) {
    for (let j = k - 1; j < i; j++) {
      if (dp[k - 1][j] >= INF) continue;
      const r = (pre[i] - pre[j]) / d;
      let c = Math.log(r / rate) ** 2 * 4;
      if (i < N) c += strongPunct[i - 1] ? -0.6 : endsPunct[i - 1] ? -0.3 : 0.5;
      const tot = dp[k - 1][j] + c;
      if (tot < dp[k][i]) {
        dp[k][i] = tot;
        from[k][i] = j;
      }
    }
  }
}
const bounds = [N];
for (let k = K, i = N; k > 0; k--) {
  i = from[k][i];
  bounds.unshift(i);
}

const captions = [];
for (let k = 0; k < K; k++) {
  const a = bounds[k];
  const b = bounds[k + 1];
  const { start, end } = chunks[k];
  const s = pre[b] - pre[a];
  let t = start;
  console.log(
    `${start.toFixed(2)}-${end.toFixed(2)} [${(s / (end - start)).toFixed(1)} syl/s] ${words.slice(a, b).join(" ")}`,
  );
  for (let w = a; w < b; w++) {
    const dur = ((end - start) * syl[w]) / s;
    captions.push({
      text: (captions.length ? " " : "") + words[w],
      startMs: Math.round(t * 1000),
      endMs: Math.round((t + dur) * 1000),
      timestampMs: Math.round((t + dur / 2) * 1000),
      confidence: null,
      // start a new caption page after sentence ends
      pageBreakAfter: strongPunct[w] || undefined,
    });
    t += dur;
  }
}
fs.writeFileSync(
  path.join(root, "public/captions.json"),
  JSON.stringify(captions, null, 2),
);
console.log(
  `\n${captions.length} words, rate ${rate.toFixed(2)} syl/s, ${K} chunks`,
);
