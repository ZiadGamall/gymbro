import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dumbbell, Flame, Zap, TrendingUp } from 'lucide-react';
import { C, mockContextSnapshots } from '../../mocks/coachData';

const ICON_MAP = {
  dumbbell:    Dumbbell,
  flame:       Flame,
  zap:         Zap,
  'trending-up': TrendingUp,
};

const INTERVAL_MS = 4000;

export function CoachContextBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex(i => (i + 1) % mockContextSnapshots.length),
      INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);

  const snap = mockContextSnapshots[index];
  const Icon = ICON_MAP[snap.icon] ?? Zap;

  return (
    <div
      style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '0 20px',
        height: 42,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Step-dot indicator */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
        {mockContextSnapshots.map((_, i) => (
          <div
            key={i}
            style={{
              height: 4,
              width: i === index ? 14 : 4,
              borderRadius: 2,
              background: i === index ? C.accent : C.border,
              transition: 'width 0.35s ease, background 0.35s ease',
            }}
          />
        ))}
      </div>

      {/* Animated label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={snap.id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Icon size={12} color={C.textSecondary} style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: 12.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ color: C.textPrimary, fontWeight: 600 }}>{snap.label}</span>
            <span style={{ color: C.textTertiary }}> · </span>
            <span style={{ color: C.textSecondary, fontWeight: 400 }}>{snap.value}</span>
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
