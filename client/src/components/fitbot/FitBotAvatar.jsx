import { motion } from "framer-motion";

/**
 * FitBotAvatar — premium SVG avatar with 4 animated states.
 *
 * Props:
 *   state  — "idle" | "thinking" | "typing" | "online"
 *   size   — "sm" (28px) | "md" (36px) | "lg" (48px)
 *   showDot — show status dot (default true)
 */

/* ── Colour palette (matches Space Observatory tokens) ── */
const C = {
  bg:       "rgba(91,138,240,0.10)",
  ring:     "rgba(91,138,240,0.25)",
  accent:   "#5B8AF0",
  success:  "#34C97A",
  warning:  "#F0A030",
  tertiary: "#44445A",
  surface:  "#111118",
};

const dotColor = {
  online:   C.success,
  thinking: C.warning,
  typing:   C.accent,
  idle:     C.tertiary,
};

/* ── The SVG mark ──────────────────────────────────────── */
function AvatarSVG({ px }) {
  const s = px * 0.52;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer hex-ring */}
      <path
        d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z"
        stroke={C.accent}
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
      {/* Inner diamond */}
      <path
        d="M16 8 L22 16 L16 24 L10 16 Z"
        fill={C.accent}
        opacity="0.15"
      />
      {/* Core circuit cross */}
      <line x1="16" y1="12" x2="16" y2="20" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="16" x2="20" y2="16" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round" />
      {/* Corner nodes */}
      <circle cx="16" cy="11" r="1.4" fill={C.accent} />
      <circle cx="16" cy="21" r="1.4" fill={C.accent} />
      <circle cx="11" cy="16" r="1.4" fill={C.accent} opacity="0.7" />
      <circle cx="21" cy="16" r="1.4" fill={C.accent} opacity="0.7" />
      {/* Centre */}
      <circle cx="16" cy="16" r="2.2" fill={C.accent} />
    </svg>
  );
}

/* ── Thinking animation: rotating arc ────────────────── */
function ThinkingRing({ px }) {
  return (
    <motion.div
      style={{
        position: "absolute",
        inset: -2,
        borderRadius: "50%",
        border: `1.5px solid transparent`,
        borderTopColor: C.warning,
        borderRightColor: C.warning,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

/* ── Typing animation: pulsing ring ─────────────────── */
function TypingRing() {
  return (
    <motion.div
      style={{
        position: "absolute",
        inset: -3,
        borderRadius: "50%",
        border: `1.5px solid ${C.accent}`,
      }}
      animate={{ opacity: [0.6, 0.1, 0.6], scale: [1, 1.12, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function FitBotAvatar({ state = "online", size = "md", showDot = true }) {
  const px = size === "sm" ? 28 : size === "lg" ? 48 : 36;
  const dotPx = size === "sm" ? 7 : 9;

  return (
    <div
      className={`fitbot-avatar fitbot-avatar--${size}`}
      style={{ width: px, height: px, position: "relative" }}
    >
      {/* Animated state rings */}
      {state === "thinking" && <ThinkingRing px={px} />}
      {state === "typing"   && <TypingRing />}

      {/* SVG mark */}
      <AvatarSVG px={px} />

      {/* Status dot */}
      {showDot && (
        <span
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width:  dotPx,
            height: dotPx,
            borderRadius: "50%",
            background: dotColor[state] || C.tertiary,
            border: `1.5px solid ${C.surface}`,
          }}
        />
      )}
    </div>
  );
}
