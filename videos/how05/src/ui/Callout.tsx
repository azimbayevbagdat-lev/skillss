import { easeInOut, easeOutCubic, ramp } from "../anim";
import { C, FONT, H, W } from "../theme";

export const pillStyle = (bar: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 16,
  padding: "16px 30px 16px 18px",
  background: C.white,
  borderRadius: 999,
  boxShadow: "0 14px 40px rgba(22,33,58,0.10), 0 2px 6px rgba(22,33,58,0.06), 0 0 0 1px rgba(22,33,58,0.06)",
  fontFamily: FONT.ui,
  fontWeight: 700,
  fontSize: 34,
  lineHeight: 1.1,
  color: C.ink,
  whiteSpace: "nowrap",
  ["--bar" as string]: bar,
});

export const PillBar: React.FC<{ color: string }> = ({ color }) => (
  <span style={{ width: 8, height: 36, borderRadius: 4, background: color, flex: "none" }} />
);

/**
 * Label pill tied to a point by a thin black leader line.
 * The line draws first (dash offset), then the pill opens.
 */
export const Callout: React.FC<{
  frame: number;
  at: number;
  out: number;
  anchor: { x: number; y: number };
  dx: number;
  dy: number;
  label: string;
  color: string;
}> = ({ frame, at, out, anchor, dx, dy, label, color }) => {
  if (frame < at || frame > out + 2) return null;
  const draw = ramp(frame, at, 12, easeOutCubic);
  const open = ramp(frame, at + 9, 14, easeOutCubic);
  const exit = ramp(frame, out - 12, 12, easeInOut);
  const end = { x: anchor.x + dx, y: anchor.y + dy };
  const len = Math.hypot(dx, dy);
  const right = dx >= 0;
  const alpha = 1 - exit;
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: alpha }}>
        <line
          x1={anchor.x}
          y1={anchor.y}
          x2={end.x}
          y2={end.y}
          stroke={C.ink}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - draw)}
        />
        <circle cx={anchor.x} cy={anchor.y} r={9 * Math.min(1, draw * 2)} fill={C.white} stroke={C.ink} strokeWidth={2.5} />
        <circle cx={anchor.x} cy={anchor.y} r={4 * Math.min(1, draw * 2)} fill={color} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: end.x,
          top: end.y,
          opacity: open * alpha,
          transform: `translate(${right ? 0 : -100}%, -50%) translateX(${(right ? 1 : -1) * (1 - open) * 14}px) scale(${0.96 + 0.04 * open})`,
          transformOrigin: right ? "left center" : "right center",
        }}
      >
        <div style={pillStyle(color)}>
          <PillBar color={color} />
          {label}
        </div>
      </div>
    </>
  );
};
