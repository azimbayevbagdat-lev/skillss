import type { Caption } from "@remotion/captions";
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}-]/gu, "");

/** Key words get their own colour. "алдын ала" is matched as a pair. */
const isKeyword = (caps: Caption[], i: number) => {
  const w = norm(caps[i].text);
  if (w === "неге" || w.startsWith("күтпеген") || w.startsWith("кідіріс")) return true;
  if (w === "алдын" && caps[i + 1] && norm(caps[i + 1].text) === "ала") return true;
  if (w === "ала" && caps[i - 1] && norm(caps[i - 1].text) === "алдын") return true;
  return false;
};

type Page = { from: number; to: number; items: number[] };

/** 2–4 words per page, breaking at punctuation. */
const paginate = (caps: Caption[]): Page[] => {
  const pages: Page[] = [];
  let cur: number[] = [];
  const flush = () => {
    if (cur.length) pages.push({ from: caps[cur[0]].startMs, to: caps[cur[cur.length - 1]].endMs, items: cur });
    cur = [];
  };
  caps.forEach((c, i) => {
    cur.push(i);
    const t = c.text.trim();
    const sentenceEnd = /[.?!:»]$/.test(t);
    const comma = /[,;]$/.test(t);
    const longWord = cur.reduce((n, k) => n + caps[k].text.trim().length, 0) > 22;
    if (cur.length >= 4 || sentenceEnd || (comma && cur.length >= 2) || (longWord && cur.length >= 2)) flush();
  });
  flush();
  return pages;
};

export const KaraokeCaptions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = useMemo(() => paginate(captions), [captions]);

  const pi = pages.findIndex((p, k) => ms >= p.from - 60 && (k + 1 >= pages.length || ms < pages[k + 1].from - 60));
  if (pi < 0) return null;
  const page = pages[pi];
  // hide a page if a long pause follows it
  if (ms > page.to + 700) return null;
  const pageStartFrame = ((page.from - 60) / 1000) * fps;
  const pageIn = spring({ frame: frame - pageStartFrame, fps, config: { damping: 14, mass: 0.5 } });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 140, // keep clear of Reels/TikTok side buttons
          top: 1235,
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${(1 - pageIn) * 24}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            columnGap: 20,
            rowGap: 6,
            fontFamily: "Montserrat",
            fontWeight: 800,
            fontSize: 74,
            lineHeight: 1.12,
            textAlign: "center",
          }}
        >
          {page.items.map((i) => {
            const c = captions[i];
            const startF = (c.startMs / 1000) * fps;
            const spoken = ms >= c.startMs - 40;
            const active = ms >= c.startMs - 40 && ms < c.endMs + 40;
            const s = spring({ frame: frame - startF + 2, fps, config: { damping: 12, mass: 0.45, stiffness: 180 } });
            const kw = isKeyword(captions, i);
            const color = kw ? "#ff7a45" : active ? "#ffd84d" : "#ffffff";
            const scale = spoken ? interpolate(s, [0, 1], [0.6, 1]) * (active ? 1.08 : 1) : 0.6;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  color,
                  opacity: spoken ? Math.min(1, s * 1.4) : 0,
                  transform: `scale(${scale}) translateY(${spoken ? (1 - s) * 18 : 18}px)`,
                  WebkitTextStroke: "12px #2a1408",
                  paintOrder: "stroke fill",
                  textShadow: "0 8px 0 rgba(42,20,8,0.55), 0 14px 28px rgba(0,0,0,0.35)",
                  padding: kw && active ? "0 14px" : 0,
                  borderRadius: 22,
                  background: kw && active ? "rgba(255,255,255,0.18)" : "transparent",
                }}
              >
                {c.text.trim()}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const captionPageStartsMs = (captions: Caption[]) => paginate(captions).map((p) => p.from);
