import { CoachNavBar }        from '../components/coach/CoachNavBar';
import { CoachContextBar }    from '../components/coach/CoachContextBar';
import { DailyBriefCard }     from '../components/coach/DailyBriefCard';
import { FitnessScoreCard }   from '../components/coach/FitnessScoreCard';
import { CoachInsightCard }   from '../components/coach/CoachInsightCard';
import { QuickActionChipRow } from '../components/coach/QuickActionChipRow';
import { C }                  from '../mocks/coachData';
import CaloriesBurnedCard     from '../components/fitbot/CaloriesBurnedCard';

// Stagger delays — each card enters slightly after the previous
const DELAYS = {
  brief:   0.05,
  score:   0.12,
  insight: 0.19,
  chips:   0.26,
};

export default function AICoach() {
  return (
    <div
      className="page-shell"
      style={{
        background: C.void,
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ── Sticky chrome ── */}
      <CoachNavBar />
      <CoachContextBar />

      {/* ── Page header ── */}
      <div style={{ padding: '20px 20px 4px' }}>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: C.textTertiary,
            marginBottom: 4,
          }}
        >
          AI Coach
        </p>
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: C.textPrimary,
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          FitBot Hub
        </h1>
      </div>

      {/* ── Card grid ── */}
      <div
        style={{
          padding: '16px 20px 20px',
          display: 'grid',
          gap: 14,
          /* Single column on mobile, 2 columns on tablet+, 3 on wide desktop */
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
        }}
      >
        <DailyBriefCard     animDelay={DELAYS.brief}   />
        <FitnessScoreCard   animDelay={DELAYS.score}   />
        <CoachInsightCard   animDelay={DELAYS.insight} />

        {/* CaloriesBurnedCard — same grid cell width */}
        <CaloriesBurnedCard />

        {/* QuickActionChipRow spans full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <QuickActionChipRow animDelay={DELAYS.chips} />
        </div>
      </div>
    </div>
  );
}
