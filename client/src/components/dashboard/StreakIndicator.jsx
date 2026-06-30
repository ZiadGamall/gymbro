import { Flame } from "lucide-react";

/**
 * StreakIndicator
 * Props:
 *   days (number) — current consecutive active days
 */
const StreakIndicator = ({ days = 0 }) => {
  const isActive = days > 0;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-[10px] border ${
        isActive
          ? "bg-elevated border-border"
          : "bg-surface border-border"
      }`}
      aria-label={`${days}-day streak`}
    >
      {/* Flame icon */}
      <Flame
        className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-success" : "text-tertiary"}`}
        strokeWidth={2}
        fill={isActive ? "var(--success)" : "transparent"}
        fillOpacity={isActive ? 0.2 : 0}
      />

      {/* Streak count + label */}
      <div className="flex items-baseline gap-[5px]">
        <span
          className={`font-mono text-[22px] font-bold leading-none ${
            isActive ? "text-success" : "text-tertiary"
          }`}
        >
          {days}
        </span>
        <span className="font-body text-[13px] text-secondary leading-none">
          day{days !== 1 ? "s" : ""} streak
        </span>
      </div>

      {/* Trailing label for context */}
      {isActive && (
        <span className="ml-auto font-body text-[11px] text-tertiary uppercase tracking-wider">
          Keep going
        </span>
      )}
    </div>
  );
};

export default StreakIndicator;
