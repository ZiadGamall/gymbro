import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Utensils, TrendingUp, MessageCircle } from 'lucide-react';
import { C, mockQuickActions } from '../../mocks/coachData';

const ICON_MAP = {
  dumbbell:         Dumbbell,
  utensils:         Utensils,
  'trending-up':    TrendingUp,
  'message-circle': MessageCircle,
};

function Chip({ chip, index, animDelay }) {
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const Icon = ICON_MAP[chip.icon] ?? MessageCircle;
  const isPrimary = chip.highlight;

  const isLit = hovered || active || isPrimary;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
        delay: animDelay + index * 0.06,
      }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setActive(a => !a)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '9px 15px',
        borderRadius: 20,
        border: `1px solid ${
          active     ? C.accent :
          hovered    ? `${C.accent}55` :
          isPrimary  ? `${C.accent}44` :
          C.border
        }`,
        background:
          active    ? `${C.accent}20` :
          isPrimary ? `${C.accent}10` :
          hovered   ? C.elevated :
          'transparent',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        fontFamily: 'inherit',
        transition: 'border-color 0.18s ease, background 0.18s ease',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Icon
        size={13}
        color={isLit ? C.accent : C.textSecondary}
        style={{ transition: 'color 0.18s ease', flexShrink: 0 }}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: isPrimary ? 600 : 500,
          color: isLit ? C.accent : C.textPrimary,
          letterSpacing: '-0.01em',
          transition: 'color 0.18s ease',
        }}
      >
        {chip.label}
      </span>
    </motion.button>
  );
}

export function QuickActionChipRow({ animDelay = 0.24 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: animDelay }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: C.textTertiary,
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          marginBottom: 10,
        }}
      >
        Quick Actions
      </div>

      {/* Horizontal scroll strip */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 2,
          /* hide scrollbar */
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {mockQuickActions.map((chip, i) => (
          <Chip key={chip.id} chip={chip} index={i} animDelay={animDelay} />
        ))}
      </div>
    </motion.div>
  );
}
