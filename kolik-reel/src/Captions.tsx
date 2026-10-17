import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import type { Caption } from "@remotion/captions";
import { C, FONT_TITLE, KEYWORDS } from "./theme";

// Top-of-screen typography: line 1 black words appear one by one, line 2 is the red key phrase.
type Word = { text: string; startMs: number };
type Page = {
  black: Word[];
  key: { text: string; startMs: number } | null;
  startMs: number;
  endMs: number;
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[«»"!?,.:;…—–]/g, "")
    .trim();
const MAX_W = 940;
const CH = 0.5; // Oswald bold caps average advance (em), measured on Cyrillic + margin

const buildPages = (caps: Caption[]): Page[] => {
  const pages: Page[] = [];
  let cur: Page = { black: [], key: null, startMs: 0, endMs: 0 };
  const flush = () => {
    if (cur.black.length || cur.key) {
      cur.startMs = cur.black[0]?.startMs ?? cur.key!.startMs;
      pages.push(cur);
    }
    cur = { black: [], key: null, startMs: 0, endMs: 0 };
  };
  for (let i = 0; i < caps.length; i++) {
    const kw = KEYWORDS.find((k) =>
      k.words.every((w, j) => norm(caps[i + j]?.text ?? "") === w),
    );
    if (kw) {
      cur.key = { text: kw.show, startMs: caps[i].startMs };
      i += kw.words.length - 1;
      // keep trailing words like "дейді." on the same page if they follow immediately
      flush();
      continue;
    }
    const t = caps[i].text.replace(/\s*—$/, "");
    const shown = t.replace(/[«»"]/g, "");
    cur.black.push({ text: shown.toUpperCase(), startMs: caps[i].startMs });
    const chars = cur.black.map((w) => w.text).join(" ").length;
    const nextLen = (caps[i + 1]?.text.length ?? 0) + 1;
    const nextIsKey = KEYWORDS.some(
      (k) => norm(caps[i + 1]?.text ?? "") === k.words[0],
    );
    if (
      /[.!?…]$/.test(shown) ||
      (/[,:;]$/.test(shown) && chars > 8) ||
      (!nextIsKey && chars + nextLen > 18)
    )
      flush();
  }
  flush();
  for (let p = 0; p < pages.length; p++) {
    const next = pages[p + 1];
    pages[p].endMs = next ? next.startMs : pages[p].startMs + 4000;
  }
  return pages;
};

const sizeFor = (text: string, max: number) =>
  Math.floor(Math.min(max, MAX_W / (text.length * CH)));

const PageView: React.FC<{ page: Page }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  if (ms < page.startMs - 10 || ms >= page.endMs) return null;
  const blackText = page.black.map((w) => w.text).join(" ");
  const bSize = sizeFor(blackText, 104);
  const rSize = page.key ? sizeFor(page.key.text, 124) : 0;
  const out = interpolate(ms, [page.endMs - 120, page.endMs], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pop = (startMs: number) => {
    const f = frame - Math.round((startMs / 1000) * fps);
    const s = spring({
      frame: f,
      fps,
      config: { damping: 14, stiffness: 180, mass: 0.6 },
    });
    return { s, visible: f >= 0 };
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 270,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        opacity: out,
        filter: "url(#boilText)",
      }}
    >
      {page.black.length ? (
        <div
          style={{
            fontFamily: FONT_TITLE,
            fontWeight: 700,
            fontSize: bSize,
            lineHeight: 1.1,
            color: C.ink,
            whiteSpace: "nowrap",
          }}
        >
          {page.black.map((w, i) => {
            const { s, visible } = pop(w.startMs);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: i < page.black.length - 1 ? "0.25em" : 0,
                  opacity: visible
                    ? interpolate(s, [0, 0.4], [0, 1], {
                        extrapolateRight: "clamp",
                      })
                    : 0,
                  translate: `0 ${interpolate(s, [0, 1], [20, 0])}px`,
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      ) : null}
      {page.key
        ? (() => {
            const { s, visible } = pop(page.key.startMs);
            return (
              <div
                style={{
                  fontFamily: FONT_TITLE,
                  fontWeight: 700,
                  fontSize: rSize,
                  lineHeight: 1.08,
                  color: C.red,
                  whiteSpace: "nowrap",
                  opacity: visible
                    ? interpolate(s, [0, 0.4], [0, 1], {
                        extrapolateRight: "clamp",
                      })
                    : 0,
                  translate: `0 ${interpolate(s, [0, 1], [20, 0])}px`,
                  scale: String(interpolate(s, [0, 1], [0.85, 1])),
                }}
              >
                {page.key.text}
              </div>
            );
          })()
        : null}
    </div>
  );
};

export const Captions: React.FC = () => {
  const [caps, setCaps] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender("captions"));
  const load = useCallback(async () => {
    try {
      setCaps(await (await fetch(staticFile("captions.json"))).json());
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [continueRender, cancelRender, handle]);
  useEffect(() => {
    load();
  }, [load]);
  // The last page ("ПАРАҚШАҒА ТІРКЕЛІҢІЗ!") is shown as the big CTA title instead.
  const pages = useMemo(
    () =>
      caps ? buildPages(caps).filter((p) => p.key?.text !== "ТІРКЕЛІҢІЗ!") : [],
    [caps],
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {pages.map((p, i) => (
        <PageView key={i} page={p} />
      ))}
    </AbsoluteFill>
  );
};

export { buildPages };
