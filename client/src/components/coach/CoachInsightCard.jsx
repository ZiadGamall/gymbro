import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight, Brain } from 'lucide-react';
import { C, mockInsight } from '../../mocks/coachData';
import { BorderBeam } from './ui/BorderBeam';

export function CoachInsightCard({ animDelay = 0.16 }) {
  const { category, verdict, evidence, action } = mockInsight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: animDelay }}
      style={{
        position: 'relative',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Rotating border beam */}
      <BorderBeam colorFrom={C.warning} duration={8} />

      {/* Left accent bar — sits above BorderBeam */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${C.warning} 0%, ${C.warning}40 100%)`,
          zIndex: 2,
          borderRadius: '12px 0 0 12px',
        }}
      />

      {/* Content layer */}
      <div style={{ padding: '16px 16px 16px 20px', position: 'relative', zIndex: 1 }}>
        {/* ── Category row ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: `${C.warning}18`,
              border: `1px solid ${C.warning}2E`,
              borderRadius: 20,
              padding: '3px 10px 3px 8px',
            }}
          >
            <AlertTriangle size={10} color={C.warning} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.warning,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}
            >
              {category}
            </span>
          </div>
          <Brain size={12} color={C.textTertiary} />
        </div>

        {/* ── Verdict ── */}
        <h3
          style={{
            margin: '0 0 13px',
            fontSize: 15.5,
            fontWeight: 700,
            color: C.textPrimary,
            lineHeight: 1.3,
            letterSpacing: '-0.025em',
          }}
        >
          {verdict}
        </h3>

        {/* ── Evidence ── */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: C.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 4,
          }}
        >
          Evidence
        </div>
        <p
          style={{
            margin: '0 0 14px',
            fontSize: 13.5,
            color: C.textSecondary,
            lineHeight: 1.55,
          }}
        >
          {evidence}
        </p>

        {/* ── Action row ── */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.15 }}
          style={{
            background: C.elevated,
            border: `1px solid ${C.warning}20`,
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: C.warning,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
              }}
            >
              Action
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: C.textPrimary,
                lineHeight: 1.45,
                fontWeight: 500,
              }}
            >
              {action}
            </p>
          </div>
          <ChevronRight size={16} color={C.textTertiary} style={{ flexShrink: 0 }} />
        </motion.div>
      </div>
    </motion.div>
  );
}
