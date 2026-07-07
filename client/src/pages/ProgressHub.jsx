import { useEffect, useState } from "react";
import { BarChart3, CalendarCheck2, Flame, Trophy } from "lucide-react";
import { getHealthState, getWeeklyProgress } from "../lib/healthStore";
import {
  loadNutritionSummary,
  loadOnboarding,
  loadWeeklyProgress,
} from "../lib/healthApi";

const getLast7Dates = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    return date.toISOString().slice(0, 10);
  });
};

const normalizeWeeklyData = (data = []) => {
  const rows = Array.isArray(data) ? data : [];

  return getLast7Dates().map((date) => {
    const match = rows.find((item) => item.date === date);

    return {
      date,
      calories: Number(match?.calories || match?.totalCalories || 0),
      workouts: Number(match?.workouts || match?.completedWorkouts || 0),
    };
  });
};

const mergeTodayCalories = (weeklyData, todayTotals) => {
  const today = new Date().toISOString().slice(0, 10);
  const calories = Number(todayTotals?.calories || 0);

  return weeklyData.map((day) =>
    day.date === today
      ? {
          ...day,
          calories: calories || day.calories,
        }
      : day,
  );
};

const ProgressHub = () => {
  const [onboarding, setOnboarding] = useState(getHealthState().onboarding);
  const [weekly, setWeekly] = useState(normalizeWeeklyData(getWeeklyProgress()));
  const [today, setToday] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setWeekly(normalizeWeeklyData(getWeeklyProgress()));
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [profile, weeklyData, todayTotals] = await Promise.all([
          loadOnboarding(),
          loadWeeklyProgress(),
          loadNutritionSummary(new Date().toISOString().slice(0, 10)),
        ]);

        if (profile) setOnboarding((prev) => ({ ...prev, ...profile }));
        setWeekly(mergeTodayCalories(normalizeWeeklyData(weeklyData), todayTotals));
        setToday(todayTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 });
      } catch {
        setWeekly(normalizeWeeklyData(getWeeklyProgress()));
        setError("Failed to load progress data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const completedWorkouts = weekly.reduce((sum, day) => sum + Number(day.workouts || 0), 0);
  const adherence = weekly.filter((day) => day.workouts > 0).length;

  const maxCalories = Math.max(1, ...weekly.map((day) => Number(day.calories || 0)));

  return (
    <div className="page-shell">
      <div className="page-content max-w-7xl space-y-6">
        <div className="card-surface">
          <h1 className="page-title">Progress Hub</h1>
          <p className="page-subtitle">Weekly performance snapshot for nutrition and workouts.</p>
          {error && <div className="alert-danger mt-4">{error}</div>}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="card-surface skeleton-block h-28" />
            ))
          ) : (
          <>
          <div className="card-surface">
            <div className="text-[var(--text-secondary)] text-sm">Completed workouts</div>
            <div className="text-3xl font-bold text-[var(--text-primary)] mt-1">{completedWorkouts}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">last 7 days</div>
          </div>

          <div className="card-surface">
            <div className="text-[var(--text-secondary)] text-sm">7-day active days</div>
            <div className="text-3xl font-bold text-[var(--text-primary)] mt-1">{adherence}/7</div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">days with workouts</div>
          </div>

          <div className="card-surface">
            <div className="text-[var(--text-secondary)] text-sm">Today calories</div>
            <div className="text-3xl font-bold text-[var(--text-primary)] mt-1">{Math.round(today.calories)}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">target {onboarding.calorieTarget} kcal</div>
          </div>

          <div className="card-surface">
            <div className="text-[var(--text-secondary)] text-sm">Current plan</div>
            <div className="text-xl font-bold text-[var(--text-primary)] mt-1 capitalize">{onboarding.level}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-2 capitalize">goal: {(onboarding.goal || "general_health").replace("_", " ")}</div>
          </div>
          </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-surface">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">Calories in last 7 days</h2>
            </div>

            <div className="grid grid-cols-7 gap-3 items-end h-56">
              {weekly.map((day) => {
                const calories = Number(day.calories || 0);
                const height = calories > 0
                  ? Math.max(10, Math.round((calories / maxCalories) * 180))
                  : 4;

                return (
                  <div key={day.date} className="flex flex-col items-center gap-2">
                    <div className="text-xs text-[var(--text-secondary)]">{Math.round(calories)}</div>
                    <div
                      className="w-full rounded-t-lg transition-all duration-300"
                      style={{
                        height: `${height}px`,
                        background:
                          calories > 0
                            ? "linear-gradient(180deg, var(--accent-hover) 0%, var(--accent) 100%)"
                            : "rgba(255, 107, 44, 0.18)",
                        boxShadow:
                          calories > 0
                            ? "0 10px 24px rgba(255, 107, 44, 0.28)"
                            : "none",
                      }}
                      title={`${day.date}: ${Math.round(calories)} kcal`}
                    />
                    <div className="text-[10px] text-[var(--text-secondary)]">{day.date.slice(5)}</div>
                  </div>
                );
              })}
              {!loading && weekly.length === 0 && (
                <div className="col-span-7 text-sm text-[var(--text-secondary)] text-center py-8">No weekly data yet.</div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-surface">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold mb-2">
                <CalendarCheck2 className="w-4 h-4 text-[var(--accent)]" />
                Week checkpoint
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Try to hit at least 3 completed workout days and keep calories within 10% of your target on 5 days.
              </p>
            </div>

            <div className="card-surface">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                Nutrition signal
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Protein today: {Math.round(today.protein)}g / {onboarding.proteinTarget}g.
              </p>
            </div>

            <div className="card-surface">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold mb-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                Milestone
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Complete your next 5 sessions to unlock the next training intensity recommendation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressHub;
