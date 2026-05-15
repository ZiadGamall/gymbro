import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarCheck2, Flame, Trophy } from "lucide-react";
import { getPhase2State } from "../lib/phase2Store";
import {
  loadNutritionSummary,
  loadOnboarding,
  loadWeeklyProgress,
} from "../lib/phase2Api";

const ProgressHub = () => {
  const [onboarding, setOnboarding] = useState(getPhase2State().onboarding);
  const [weekly, setWeekly] = useState([]);
  const [today, setToday] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

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
        setWeekly(Array.isArray(weeklyData) ? weeklyData : []);
        setToday(todayTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 });
      } catch {
        setError("Failed to load progress data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const completedWorkouts = weekly.reduce((sum, day) => sum + Number(day.workouts || 0), 0);
  const adherence = weekly.filter((day) => day.workouts > 0).length;

  const maxCalories = Math.max(1, ...weekly.map((day) => day.calories));

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="card">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Progress Hub</h1>
          <p className="text-[var(--text-secondary)] mt-1">Weekly performance snapshot for nutrition and workouts.</p>
          {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-[var(--text-secondary)] text-sm">Completed workouts</div>
            <div className="text-3xl font-bold text-[var(--text-primary)] mt-1">{completedWorkouts}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">last 7 days</div>
          </div>

          <div className="card">
            <div className="text-[var(--text-secondary)] text-sm">7-day active days</div>
            <div className="text-3xl font-bold text-[var(--text-primary)] mt-1">{adherence}/7</div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">days with workouts</div>
          </div>

          <div className="card">
            <div className="text-[var(--text-secondary)] text-sm">Today calories</div>
            <div className="text-3xl font-bold text-[var(--text-primary)] mt-1">{Math.round(today.calories)}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">target {onboarding.calorieTarget} kcal</div>
          </div>

          <div className="card">
            <div className="text-[var(--text-secondary)] text-sm">Current plan</div>
            <div className="text-xl font-bold text-[var(--text-primary)] mt-1 capitalize">{onboarding.level}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-2 capitalize">goal: {(onboarding.goal || "general_health").replace("_", " ")}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">Calories in last 7 days</h2>
            </div>

            <div className="grid grid-cols-7 gap-3 items-end h-56">
              {weekly.map((day) => {
                const height = Math.max(8, Math.round((day.calories / maxCalories) * 180));
                return (
                  <div key={day.date} className="flex flex-col items-center gap-2">
                    <div className="text-xs text-[var(--text-secondary)]">{Math.round(day.calories)}</div>
                    <div
                      className="w-full rounded-t-lg bg-[var(--accent)]/70"
                      style={{ height: `${height}px` }}
                      title={`${day.date}: ${Math.round(day.calories)} kcal`}
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
            <div className="card">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold mb-2">
                <CalendarCheck2 className="w-4 h-4 text-[var(--accent)]" />
                Week checkpoint
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Try to hit at least 3 completed workout days and keep calories within 10% of your target on 5 days.
              </p>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                Nutrition signal
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Protein today: {Math.round(today.protein)}g / {onboarding.proteinTarget}g.
              </p>
            </div>

            <div className="card">
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
