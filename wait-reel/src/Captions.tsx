import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./lib/fonts";

type Page = { words: Caption[]; start: number; end: number };

const MAX_WORDS = 4;
const MAX_CHARS = 25;

/**
 * Group word captions into 2–4 word pages: split into phrases at sentence ends,
 * commas and pauses, then cut each phrase into evenly balanced pages.
 */
export const toPages = (caps: Caption[]): Page[] => {
  const phrases: Caption[][] = [];
  let cur: Caption[] = [];
  caps.forEach((w, i) => {
    const prev = caps[i - 1];
    const prevText = prev?.text.trim() ?? "";
    const gap = prev ? w.startMs - prev.endMs : 0;
    if (cur.length && (/[.?!»]$/.test(prevText) || (/[,—]$/.test(prevText) && cur.length >= 2) || gap > 650)) {
      phrases.push(cur);
      cur = [];
    }
    cur.push(w);
  });
  if (cur.length) phrases.push(cur);

  const pages: Page[] = [];
  for (const ph of phrases) {
    const chars = ph.map((c) => c.text.trim()).join(" ").length;
    const k = Math.max(Math.ceil(ph.length / MAX_WORDS), Math.ceil(chars / MAX_CHARS));
    const per = ph.length / k;
    for (let j = 0; j < k; j++) {
      const words = ph.slice(Math.round(j * per), Math.round((j + 1) * per));
      if (words.length) pages.push({ words, start: words[0].startMs, end: words[words.length - 1].endMs });
    }
  }
  return pages;
};

export const Captions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = useMemo(() => toPages(captions), [captions]);

  const idx = pages.findIndex((p, i) => {
    const next = pages[i + 1];
    const until = next ? Math.min(next.start, p.end + 900) : p.end + 900;
    return ms >= p.start - 60 && ms < until;
  });
  if (idx < 0) return null;
  const page = pages[idx];
  const enter = spring({ frame: frame - Math.round(((page.start - 60) / 1000) * fps), fps, config: { damping: 14, stiffness: 220 } });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          // safe area: keep clear of the bottom 20% and the right-hand button rail
          left: 70,
          width: 820,
          top: 1035,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 84,
            lineHeight: 1.12,
            textAlign: "center",
            color: "white",
            textTransform: "none",
            transform: `scale(${interpolate(enter, [0, 1], [0.86, 1])}) translateY(${interpolate(enter, [0, 1], [18, 0])}px)`,
            opacity: interpolate(enter, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
            letterSpacing: -0.5,
          }}
        >
          {page.words.map((w, i) => {
            const nextStart = page.words[i + 1]?.startMs ?? w.endMs + 250;
            const active = ms >= w.startMs - 40 && ms < Math.max(w.endMs, nextStart - 40);
            return (
              <React.Fragment key={i}>
              {i ? " " : null}
              <span
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  color: active ? "#FFE135" : "#FFFFFF",
                  WebkitTextStroke: "14px #000",
                  paintOrder: "stroke fill",
                  textShadow: "0 6px 18px rgba(0,0,0,0.55)",
                  transform: active ? "scale(1.07)" : "scale(1)",
                  transition: "none",
                }}
              >
                {w.text.trim()}
              </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
