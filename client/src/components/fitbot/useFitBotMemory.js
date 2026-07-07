import { useEffect, useState } from "react";
import { loadOnboarding } from "../../lib/healthApi";

const GOAL_LABELS = {
  general_health: "General health",
  weight_loss: "Weight loss",
  muscle_gain: "Build muscle",
  muscle_tone: "Muscle tone",
  endurance: "Endurance",
};

export default function useFitBotMemory() {
  const [chips, setChips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOnboarding()
      .then((ob) => {
        if (!ob) {
          setChips([]);
          return;
        }
        const next = [];
        if (ob.goal) next.push(`Goal: ${GOAL_LABELS[ob.goal] || ob.goal.replace(/_/g, " ")}`);
        if (ob.level) next.push(`${ob.level} level`);
        if (ob.activityDays) next.push(`${ob.activityDays}× / week`);
        if (ob.calorieTarget) next.push(`${ob.calorieTarget} kcal target`);
        if (ob.proteinTarget) next.push(`${ob.proteinTarget}g protein`);
        if (ob.limitations) next.push(`Limit: ${ob.limitations}`);
        setChips(next);
      })
      .catch(() => setChips([]))
      .finally(() => setLoading(false));
  }, []);

  return { chips, loading };
}
