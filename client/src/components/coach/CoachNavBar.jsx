import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { C } from '../../mocks/coachData';

function FitBotNavAvatar() {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 11,
        background: `linear-gradient(135deg, ${C.accent}18 0%, ${C.accent}30 100%)`,
        border: `1px solid ${C.accent}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle inner glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 30%, ${C.accent}22, transparent 70%)`,
        }}
      />
      {/* Bot/AI face icon */}
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ position: 'relative', zIndex: 1 }}>
        {/* Head */}
        <rect x="3" y="8" width="16" height="11" rx="3.5" stroke={C.accent} strokeWidth="1.4" fill="none" />
        {/* Eyes */}
        <circle cx="8.5" cy="13.5" r="2" fill={C.accent} opacity="0.9" />
        <circle cx="13.5" cy="13.5" r="2" fill={C.accent} opacity="0.9" />
        {/* Antenna stems */}
        <line x1="8.5" y1="3.5" x2="8.5" y2="8" stroke={C.accent} strokeWidth="1.4" strokeLinecap="round" />
        <line x1="13.5" y1="3.5" x2="13.5" y2="8" stroke={C.accent} strokeWidth="1.4" strokeLinecap="round" />
        {/* Antenna tips */}
        <circle cx="8.5" cy="3" r="1.5" fill={C.accent} />
        <circle cx="13.5" cy="3" r="1.5" fill={C.accent} />
      </svg>
    </div>
  );
}

export function CoachNavBar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '0 20px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Left: avatar + identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <FitBotNavAvatar />
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: C.textPrimary,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
            }}
          >
            FitBot
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: C.textSecondary,
              lineHeight: 1.2,
              fontWeight: 500,
            }}
          >
            AI Coach
          </div>
        </div>
      </div>

      {/* Right: memory badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: C.elevated,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: '5px 11px 5px 9px',
        }}
      >
        <Brain size={11} color={C.textSecondary} />
        <span
          style={{
            fontSize: 11,
            color: C.textSecondary,
            fontWeight: 500,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          Remembers 30d
        </span>
      </div>
    </motion.nav>
  );
}
