import { easeOut, ramp } from "../anim";
import { C, FONT, FPS } from "../theme";
import { LEAD, Word, WORDS } from "../timeline";

type Page = { words: Word[]; from: number; to: number };

// 3–4 words per page; break early at sentence ends and after commas once 3 words are in.
const buildPages = (): Page[] => {
  const pages: Word[][] = [];
  let cur: Word[] = [];
  WORDS.forEach((w) => {
    cur.push(w);
    const chars = cur.reduce((n, x) => n + x.text.length + 1, 0);
    const end = /[.?!]$/.test(w.text);
    const soft = /[,:»]$/.test(w.text);
    if (end || cur.length >= 4 || (cur.length >= 3 && (soft || chars > 24)) || chars > 30) {
      pages.push(cur);
      cur = [];
    }
  });
  if (cur.length) pages.push(cur);
  return pages.map((words, i) => {
    const from = Math.round(words[0].start * FPS) - LEAD;
    const next = pages[i + 1] ? Math.round(pages[i + 1][0].start * FPS) - LEAD : Infinity;
    const to = Math.min(next, Math.round(words[words.length - 1].end * FPS) + Math.round(0.5 * FPS));
    return { words, from, to };
  });
};

const PAGES = buildPages();

export const Subtitles: React.FC<{ frame: number }> = ({ frame }) => {
  const page = PAGES.find((p) => frame >= p.from && frame < p.to);
  if (!page) return null;
  const enter = ramp(frame, page.from, 8, easeOut);
  const t = frame / FPS;
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: 1500,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(-50%) translateY(${(1 - enter) * 10}px)`,
        opacity: enter,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 4,
          padding: "12px 14px",
          borderRadius: 30,
          background: "rgba(31,35,41,0.88)",
          maxWidth: 960,
        }}
      >
        {page.words.map((w, i) => {
          const active = t >= w.start - LEAD / FPS && t < w.end;
          const spoken = t >= w.end;
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT.ui,
                fontWeight: 800,
                fontSize: 46,
                lineHeight: 1.15,
                padding: "4px 12px",
                borderRadius: 14,
                background: active ? C.white : "transparent",
                color: active ? C.ink : C.white,
                opacity: active || spoken ? 1 : 0.45,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
