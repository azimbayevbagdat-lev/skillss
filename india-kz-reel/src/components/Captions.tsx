import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption, TikTokPage } from "@remotion/captions";
import { C, FONT_BODY } from "../theme";

// ~3–5 Kazakh words per page; sentence ends always start a new page.
const SWITCH_CAPTIONS_EVERY_MS = 1300;

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = page.startMs + (frame / fps) * 1000;
  const appear = interpolate(frame, [0, 5], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "flex-start", alignItems: "center" }}
    >
      <div
        style={{
          position: "absolute",
          top: 1545,
          maxWidth: 940,
          padding: "18px 34px",
          borderRadius: 34,
          background: "rgba(0, 0, 0, 0.55)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontFamily: FONT_BODY,
          fontWeight: 800,
          fontSize: 52,
          lineHeight: 1.22,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          opacity: appear,
          scale: interpolate(appear, [0, 1], [0.94, 1]),
        }}
      >
        {page.tokens.map((token, i) => {
          const active = token.fromMs <= t && token.toMs > t;
          const past = token.toMs <= t;
          return (
            <span
              key={`${token.fromMs}-${i}`}
              style={{
                color: active ? C.highlight : past ? "#ffffff" : "#b9b6d3",
                textShadow: active ? `0 0 18px ${C.highlight}88` : "none",
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC = () => {
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender("captions"));
  const { fps } = useVideoConfig();

  const fetchCaptions = useCallback(async () => {
    try {
      const res = await fetch(staticFile("captions.json"));
      setCaptions(await res.json());
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [continueRender, cancelRender, handle]);

  useEffect(() => {
    fetchCaptions();
  }, [fetchCaptions]);

  const pages = useMemo(
    () =>
      captions
        ? createTikTokStyleCaptions({
            captions,
            combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
          }).pages
        : [],
    [captions],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, index) => {
        const next = pages[index + 1] ?? null;
        const start = Math.round((page.startMs / 1000) * fps);
        const lastEnd = page.tokens[page.tokens.length - 1].toMs;
        const end = Math.round(
          ((next ? next.startMs : lastEnd + 400) / 1000) * fps,
        );
        if (end - start <= 0) return null;
        return (
          <Sequence
            key={index}
            from={start}
            durationInFrames={end - start}
            name={`Caption ${index}`}
          >
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
