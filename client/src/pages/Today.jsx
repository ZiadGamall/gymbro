import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dumbbell, Utensils, Bot, CheckCircle2, Circle, ChevronRight } from "lucide-react";

import { loadOnboarding, loadNutritionSummary, loadWorkoutSessions } from "../lib/healthApi";
import { getWeeklyProgress } from "../lib/healthStore";
import MacroRing from "../components/dashboard/MacroRing";
import StreakIndicator from "../components/dashboard/StreakIndicator";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const todayISO = () => new Date().toISOString().slice(0, 10);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const formatDate = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
  });

const calcStreak = () => {
  const weekly = getWeeklyProgress(); // newest last
  let streak = 0;
  for (let i = weekly.length - 1; i >= 0; i--) {
    if (weekly[i].workouts > 0) streak++;
    else break;
  }
  return streak;
};

const intensityLabel = (level) => {
  const map = { light: "Light", moderate: "Moderate", intense: "Hard", heavy: "Heavy" };
  return map[level] || level;
};

/* ─── Quick action tile ───────────────────────────────────────────────────── */
const QuickAction = ({ to, Icon, label, sublabel, color }) => (
  <Link to={to} className="quick-action">
    <span
      className={`flex items-center justify-center w-9 h-9 rounded-lg ${color}`}
      aria-hidden="true"
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
    </span>
    <div>
      <p className="font-body text-[13px] font-semibold text-primary leading-snug">{label}</p>
      <p className="font-body text-[11px] text-tertiary mt-[2px]">{sublabel}</p>
    </div>
  </Link>
);

/* ─── Page skeleton ───────────────────────────────────────────────────────── */
const Skeleton = ({ className }) => (
  <div className={`rounded-lg bg-elevated animate-pulse ${className}`} />
);

const LoadingSkeleton = () => (
  <div className="page-shell px-4 pt-12">
    <Skeleton className="h-7 w-48 mb-2" />
    <Skeleton className="h-4 w-32 mb-8" />
    <Skeleton className="h-[58px] mb-4" />
    <Skeleton className="h-[180px] mb-4" />
    <Skeleton className="h-[120px] mb-4" />
    <Skeleton className="h-[100px]" />
  </div>
);

/* ─── Main page ───────────────────────────────────────────────────────────── */
const Today = () => {
  const navigate = useNavigate();

  const [loading,           setLoading]          = useState(true);
  const [onboarding,        setOnboarding]        = useState(null);
  const [nutritionSummary,  setNutritionSummary]  = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [workoutSessions,   setWorkoutSessions]   = useState([]);
  const [streak,            setStreak]            = useState(0);
  const [apiError,          setApiError]          = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    const date = todayISO();

    try {
      const [ob, nutrition, sessions] = await Promise.all([
        loadOnboarding(),
        loadNutritionSummary(date),
        loadWorkoutSessions(date),
      ]);
      setOnboarding(ob);
      setNutritionSummary(nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 });
      setWorkoutSessions(sessions || []);
      setStreak(calcStreak());
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    fetchAll();
  }, [navigate, fetchAll]);

  if (loading) return <LoadingSkeleton />;

  const calorieTarget = onboarding?.calorieTarget ?? 2200;
  const proteinTarget = onboarding?.proteinTarget ?? 120;
  const firstName     = onboarding?.firstName ?? onboarding?.name ?? "";
  const todaySessions = workoutSessions.slice(0, 5);

  return (
    <div className="page-shell">
      {/* ── Greeting header ─────────────────────────────────────────────── */}
      <header className="px-4 pt-12 pb-6">
        <p className="font-body text-[13px] text-tertiary uppercase tracking-wider mb-1">
          {formatDate()}
        </p>
        <h1 className="font-display text-[26px] font-bold text-primary leading-tight tracking-tight">
          {getGreeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
      </header>

      <div className="px-4 flex flex-col gap-5">
        {/* ── API error banner ────────────────────────────────────────── */}
        {apiError && (
          <div className="alert-warning text-[12.5px]">
            Could not reach the server. Showing cached data.
          </div>
        )}

        {/* ── Streak ──────────────────────────────────────────────────── */}
        <StreakIndicator days={streak} />

        {/* ── Macros card ─────────────────────────────────────────────── */}
        <section className="card-surface" aria-labelledby="macros-title">
          <p id="macros-title" className="section-title">Today&apos;s Nutrition</p>
          <MacroRing
            currentCalories={nutritionSummary.calories}
            targetCalories={calorieTarget}
            currentProtein={nutritionSummary.protein}
            targetProtein={proteinTarget}
          />

          {/* Carbs + Fat row */}
          <div className="flex gap-3 mt-5">
            <div className="flex-1 card-elevated text-center">
              <p className="font-body text-[10px] text-tertiary uppercase tracking-wider mb-1">
                Carbs
              </p>
              <p className="font-mono text-[16px] font-semibold text-primary leading-none">
                {nutritionSummary.carbs}
                <span className="font-body text-[10px] text-tertiary font-normal">g</span>
              </p>
            </div>
            <div className="flex-1 card-elevated text-center">
              <p className="font-body text-[10px] text-tertiary uppercase tracking-wider mb-1">
                Fat
              </p>
              <p className="font-mono text-[16px] font-semibold text-primary leading-none">
                {nutritionSummary.fat}
                <span className="font-body text-[10px] text-tertiary font-normal">g</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── Workout sessions ────────────────────────────────────────── */}
        <section aria-labelledby="workouts-title">
          <div className="flex items-center justify-between mb-3">
            <p id="workouts-title" className="section-title" style={{ marginBottom: 0 }}>
              Today&apos;s Workouts
            </p>
            <Link
              to="/train"
              className="font-body text-[12px] text-accent flex items-center gap-[2px]"
            >
              View all
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>

          {todaySessions.length === 0 ? (
            <div className="card-surface">
              <div className="empty-state">
                <Dumbbell className="empty-state-icon" strokeWidth={1.5} />
                <p className="empty-state-title">No sessions logged</p>
                <p className="empty-state-body">
                  Log your first workout for today to start tracking your progress.
                </p>
                <Link to="/train" className="btn-ghost mt-2">
                  Log workout
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {todaySessions.map((session) => (
                <div key={session.id} className="session-row">
                  <span className="flex-shrink-0">
                    {session.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={2} />
                    ) : (
                      <Circle className="w-5 h-5 text-tertiary" strokeWidth={1.5} />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[13.5px] font-medium text-primary truncate">
                      {session.planName}
                    </p>
                    <p className="font-body text-[11px] text-tertiary mt-[1px]">
                      {session.durationMin}min · {intensityLabel(session.intensity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Quick actions ────────────────────────────────────────────── */}
        <section aria-labelledby="actions-title">
          <p id="actions-title" className="section-title">Quick Actions</p>
          <div className="grid grid-cols-3 gap-3">
            <QuickAction
              to="/train"
              Icon={Dumbbell}
              label="Train"
              sublabel="Log a session"
              color="bg-elevated text-accent"
            />
            <QuickAction
              to="/eat"
              Icon={Utensils}
              label="Eat"
              sublabel="Log a meal"
              color="bg-elevated text-success"
            />
            <QuickAction
              to="/coach"
              Icon={Bot}
              label="Ask FitBot"
              sublabel="AI Coach"
              color="bg-elevated text-warning"
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Today;
