import React, { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type Caption = { text: string; startMs: number; endMs: number };

type Page = { words: Caption[]; startMs: number; endMs: number };

const PUNCT = /[.,!?:;»]$/;

/** Group words into pages of 2–4 words, breaking at punctuation. */
export const toPages = (caps: Caption[]): Page[] => {
  const groups: Caption[][] = [];
  let cur: Caption[] = [];
  caps.forEach((w, idx) => {
    cur.push(w);
    const chars = cur.map((c) => c.text.trim()).join(" ").length;
    const end = PUNCT.test(w.text.trim());
    if (
      cur.length >= 4 ||
      (end && cur.length >= 2) ||
      (cur.length >= 3 && chars > 22)
    ) {
      const nextW = caps[idx + 1];
      // don't leave the last word of a sentence alone: carry one word over with it
      if (!end && cur.length >= 3 && nextW && PUNCT.test(nextW.text.trim())) {
        const carry = cur.pop()!;
        groups.push(cur);
        cur = [carry];
        return;
      }
      groups.push(cur);
      cur = [];
    }
  });
  if (cur.length) groups.push(cur);
  // merge single-word pages into a neighbour: a word that ends a sentence joins the previous
  // page, otherwise it joins the next one (pages may grow to 5 short words at most)
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].length !== 1) continue;
    const w = groups[i][0];
    const prev = groups[i - 1];
    const next = groups[i + 1];
    const endsSentence = PUNCT.test(w.text.trim());
    const prevGap = prev ? w.startMs - prev[prev.length - 1].endMs : Infinity;
    if (prev && (endsSentence || !next) && prev.length < 5 && prevGap < 700) {
      prev.push(w);
      groups.splice(i, 1);
      i--;
    } else if (next && next.length < 5) {
      next.unshift(w);
      groups.splice(i, 1);
      i--;
    }
  }
  return groups.map((g, i) => {
    const startMs = g[0].startMs;
    const nextStart = groups[i + 1]?.[0].startMs ?? Infinity;
    const lastEnd = g[g.length - 1].endMs;
    return { words: g, startMs, endMs: Math.min(nextStart, lastEnd + 900) };
  });
};

export const Captions: React.FC<{
  captions: Caption[];
  /** left edge and width of the caption area (keeps the right edge free for IG buttons) */
  left: number;
  width: number;
  top: number;
  fontSize?: number;
}> = ({ captions, left, width, top, fontSize = 76 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = useMemo(() => toPages(captions), [captions]);
  const page = pages.find((p) => ms >= p.startMs && ms < p.endMs);
  if (!page) return null;
  const appear = interpolate(ms - page.startMs, [0, 130], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: "Montserrat",
          fontWeight: 800,
          fontSize,
          lineHeight: 1.18,
          textAlign: "center",
          color: "white",
          WebkitTextStroke: "14px #000",
          paintOrder: "stroke fill",
          textShadow: "0 8px 18px rgba(0,0,0,0.45)",
          transform: `translateY(${(1 - appear) * 18}px) scale(${0.94 + appear * 0.06})`,
          opacity: appear,
          letterSpacing: -0.5,
          overflowWrap: "break-word",
          maxWidth: width,
        }}
      >
        {page.words.map((w, i) => {
          const active =
            ms >= w.startMs && ms < (page.words[i + 1]?.startMs ?? page.endMs);
          return (
            <span
              key={i}
              style={{
                color: active ? "#FFD60A" : "#FFFFFF",
                display: "inline-block",
                transform: active ? "scale(1.07)" : "scale(1)",
                margin: "0 0.12em",
              }}
            >
              {w.text.trim()}
            </span>
          );
        })}
      </div>
    </div>
  );
};
