import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { C, mockDailyBrief } from '../../mocks/coachData';

export function DailyBriefCard({ animDelay = 0 }) {
  const { greeting, focus, coachNote, recommendation, timestamp } = mockDailyBrief;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: animDelay }}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${C.success} 0%, ${C.success}44 100%)`,
          borderRadius: '12px 0 0 12px',
        }}
      />

      <div style={{ padding: '16px 16px 16px 20px' }}>
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 11,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11.5,
                color: C.textSecondary,
                fontWeight: 500,
                marginBottom: 3,
                letterSpacing: '0.01em',
              }}
            >
              {greeting}
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: C.textPrimary,
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
              }}
            >
              {focus}
            </h2>
          </div>

          {/* Icon chip */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: `${C.success}18`,
              border: `1px solid ${C.success}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginLeft: 12,
            }}
          >
            <Sparkles size={15} color={C.success} />
          </div>
        </div>

        {/* ── Coach note ── */}
        <p
          style={{
            margin: '0 0 13px',
            fontSize: 13.5,
            color: C.textSecondary,
            lineHeight: 1.58,
          }}
        >
          {coachNote}
        </p>

        {/* ── Recommendation box ── */}
        <div
          style={{
            background: C.elevated,
            border: `1px solid ${C.border}`,
            borderLeft: `2px solid ${C.accent}`,
            borderRadius: '0 8px 8px 0',
            padding: '10px 13px',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: C.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
          >
            Today's Focus
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: C.textPrimary,
              lineHeight: 1.48,
              fontWeight: 500,
            }}
          >
            {recommendation}
          </p>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 11, color: C.textTertiary }}>{timestamp}</span>

          <motion.button
            whileHover={{ x: 2 }}
            transition={{ duration: 0.15 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: C.accent,
              fontSize: 12.5,
              fontWeight: 600,
              padding: '4px 0',
              letterSpacing: '-0.01em',
              fontFamily: 'inherit',
            }}
          >
            View Full Brief
            <ArrowRight size={13} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
