import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { C, mockFitnessScore } from '../../mocks/coachData';
import { NumberTicker } from './ui/NumberTicker';

// ── Score Arc ─────────────────────────────────────────────────────────────────
// 270° arc, center (50,50), radius 38.
// Starts at 135° (bottom-left) and ends at 45° (bottom-right) going clockwise.
// Computed: start = (23.13, 76.87), end = (76.87, 76.87)
const ARC = 'M 23.13 76.87 A 38 38 0 1 1 76.87 76.87';

function ScoreArc({ score, color, delay = 0 }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={104}
      height={104}
      style={{ overflow: 'visible', flexShrink: 0 }}
      aria-label={`Fitness score: ${score} out of 100`}
    >
      {/* Background track */}
      <path
        d={ARC}
        fill="none"
        stroke={C.border}
        strokeWidth={6.5}
        strokeLinecap="round"
      />

      {/* Glow layer (blurred duplicate) */}
      <motion.path
        d={ARC}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: score / 100 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay }}
        style={{ filter: 'blur(5px)', opacity: 0.25 }}
      />

      {/* Value arc */}
      <motion.path
        d={ARC}
        fill="none"
        stroke={color}
        strokeWidth={6.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: score / 100 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay }}
      />
    </svg>
  );
}

// ── Sub-score pill ─────────────────────────────────────────────────────────────
function SubScorePill({ label, value, color, animDelay }) {
  return (
    <div
      style={{
        background: C.elevated,
        border: `1px solid ${C.border}`,
        borderRadius: 9,
        padding: '10px 8px 8px',
        textAlign: 'center',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        <NumberTicker value={value} duration={1.3} delay={animDelay} />
      </div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 500,
          color: C.textSecondary,
          letterSpacing: '0.01em',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {/* Mini progress bar */}
      <div
        style={{
          height: 3,
          background: C.border,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: animDelay }}
          style={{ height: '100%', background: color, borderRadius: 2 }}
        />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function FitnessScoreCard({ animDelay = 0.08 }) {
  const { composite, delta, label, summary, subscores } = mockFitnessScore;

  // Arc colour based on score
  const arcColor =
    composite >= 80 ? C.success :
    composite >= 60 ? C.accent  :
    C.warning;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: animDelay }}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '18px 18px 16px',
      }}
    >
      {/* ── Card header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: C.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          Fitness Score
        </span>
        <div
          style={{
            background: `${arcColor}18`,
            border: `1px solid ${arcColor}40`,
            borderRadius: 20,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: arcColor,
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </div>
      </div>

      {/* ── Arc + score details ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        {/* Arc with centered number */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ScoreArc score={composite} color={arcColor} delay={animDelay + 0.15} />
          {/* Centered score overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: C.textPrimary,
                lineHeight: 1,
                letterSpacing: '-0.05em',
              }}
            >
              <NumberTicker value={composite} duration={1.6} delay={animDelay + 0.15} />
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.textTertiary,
                fontWeight: 500,
                marginTop: 2,
              }}
            >
              / 100
            </div>
          </div>
        </div>

        {/* Right: delta + summary */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11.5,
              color: C.textSecondary,
              fontWeight: 500,
              marginBottom: 5,
            }}
          >
            vs last week
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 10,
            }}
          >
            <TrendingUp size={16} color={C.success} />
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: C.success,
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              +{delta} pts
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: C.textSecondary,
              lineHeight: 1.45,
            }}
          >
            {summary}
          </p>
        </div>
      </div>

      {/* ── Sub-score row ── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          paddingTop: 14,
          borderTop: `1px solid ${C.border}`,
        }}
      >
        {subscores.map((sub) => (
          <SubScorePill
            key={sub.id}
            label={sub.label}
            value={sub.value}
            color={sub.color}
            animDelay={animDelay + 0.5}
          />
        ))}
      </div>
    </motion.div>
  );
}
