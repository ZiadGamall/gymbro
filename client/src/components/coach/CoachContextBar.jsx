import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dumbbell, Flame, Target, TrendingUp } from "lucide-react";
import { loadNutritionSummary, loadOnboarding } from "../../lib/healthApi";

const ICON_MAP = {
  dumbbell: Dumbbell,
  flame: Flame,
  zap: Target,
  "trending-up": TrendingUp,
};

const GOAL_LABELS = {
  general_health: "General health",
  weight_loss: "Weight loss",
  muscle_gain: "Build muscle",
  muscle_tone: "Muscle tone",
  endurance: "Endurance",
};

export function CoachContextBar() {
  const [index, setIndex] = useState(0);
  const [snapshots, setSnapshots] = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([loadOnboarding(), loadNutritionSummary(today)])
      .then(([ob, totals]) => {
        const items = [];
        if (ob?.goal) {
          items.push({
            id: "goal",
            icon: "trending-up",
            label: "Goal",
            value: GOAL_LABELS[ob.goal] || ob.goal.replace(/_/g, " "),
          });
        }
        if (ob?.calorieTarget) {
          const left = Math.max(0, ob.calorieTarget - (totals?.calories || 0));
          items.push({
            id: "calories",
            icon: "flame",
            label: "Calories left",
            value: `${Math.round(left)} kcal today`,
          });
        }
        if (ob?.proteinTarget) {
          const left = Math.max(0, ob.proteinTarget - (totals?.protein || 0));
          items.push({
            id: "protein",
            icon: "zap",
            label: "Protein left",
            value: `${Math.round(left)}g to target`,
          });
        }
        if (ob?.level) {
          items.push({
            id: "level",
            icon: "dumbbell",
            label: "Training level",
            value: `${ob.level} · ${ob.activityDays || 3}× / week`,
          });
        }
        setSnapshots(items.length ? items : [{
          id: "default",
          icon: "dumbbell",
          label: "FitBot",
          value: "Complete onboarding for personalized context",
        }]);
      })
      .catch(() => {
        setSnapshots([{
          id: "default",
          icon: "dumbbell",
          label: "FitBot",
          value: "Your AI fitness coach",
        }]);
      });
  }, []);

  useEffect(() => {
    if (snapshots.length < 2) return undefined;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % snapshots.length),
      4500,
    );
    return () => clearInterval(id);
  }, [snapshots.length]);

  const snap = snapshots[index] || snapshots[0];
  const Icon = snap ? (ICON_MAP[snap.icon] ?? Target) : Target;

  if (!snap) return null;

  return (
    <div className="coach-context-bar">
      <div className="coach-context-dots">
        {snapshots.map((_, i) => (
          <div
            key={i}
            className="coach-context-dot"
            style={{
              width: i === index ? 14 : 4,
              background: i === index ? "var(--accent)" : "var(--border)",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={snap.id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className="coach-context-label"
        >
          <Icon size={12} className="text-secondary flex-shrink-0" strokeWidth={2} />
          <span className="truncate text-[12.5px]">
            <span className="text-primary font-semibold">{snap.label}</span>
            <span className="text-tertiary"> · </span>
            <span className="text-secondary font-normal">{snap.value}</span>
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
