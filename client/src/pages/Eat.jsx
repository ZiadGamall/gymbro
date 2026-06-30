import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Utensils, Plus, ArrowRight } from "lucide-react";

import { loadNutritionSummary, loadOnboarding } from "../lib/healthApi";

const todayISO = () => new Date().toISOString().slice(0, 10);

const MacroBar = ({ label, current, target, color }) => {
  const pct = Math.min(current / Math.max(target, 1), 1) * 100;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-body text-[12px] text-secondary">{label}</span>
        <span className="font-mono text-[12px] text-primary">
          {current}
          <span className="text-tertiary font-normal"> / {target}</span>
          {label !== "Calories" && "g"}
        </span>
      </div>
      <div className="h-[5px] rounded-full bg-elevated overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemax={target}
        />
      </div>
    </div>
  );
};

const Eat = () => {
  const navigate = useNavigate();
  const [summary,    setSummary]    = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [onboarding, setOnboarding] = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    Promise.all([loadNutritionSummary(todayISO()), loadOnboarding()])
      .then(([nutr, ob]) => {
        setSummary(nutr || { calories: 0, protein: 0, carbs: 0, fat: 0 });
        setOnboarding(ob);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  const calTarget  = onboarding?.calorieTarget ?? 2200;
  const protTarget = onboarding?.proteinTarget ?? 120;
  const carbTarget = onboarding?.carbsTarget   ?? 250;
  const fatTarget  = onboarding?.fatTarget     ?? 70;

  return (
    <div className="page-shell">
      {/* Header */}
      <header className="px-4 pt-12 pb-6 flex items-end justify-between">
        <div>
          <p className="font-body text-[12px] text-tertiary uppercase tracking-wider mb-1">
            Nutrition
          </p>
          <h1 className="font-display text-[26px] font-bold text-primary tracking-tight">
            Eat
          </h1>
        </div>
        <Link
          to="/nutrition"
          className="btn-ghost flex items-center gap-2"
          aria-label="Open Nutrition Diary"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Log
        </Link>
      </header>

      <div className="px-4 flex flex-col gap-5">
        {/* Macro summary card */}
        <section className="card-surface" aria-labelledby="eat-macros-title">
          <p id="eat-macros-title" className="section-title">Today&apos;s Macros</p>

          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[36px] rounded-lg bg-elevated animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <MacroBar
                label="Calories"
                current={summary.calories}
                target={calTarget}
                color="bg-accent"
              />
              <MacroBar
                label="Protein"
                current={summary.protein}
                target={protTarget}
                color="bg-success"
              />
              <MacroBar
                label="Carbs"
                current={summary.carbs}
                target={carbTarget}
                color="bg-warning"
              />
              <MacroBar
                label="Fat"
                current={summary.fat}
                target={fatTarget}
                color="bg-danger"
              />
            </div>
          )}
        </section>

        {/* No entries state */}
        {!loading && summary.calories === 0 && (
          <div className="card-surface">
            <div className="empty-state">
              <Utensils className="empty-state-icon" strokeWidth={1.5} />
              <p className="empty-state-title">Nothing logged yet</p>
              <p className="empty-state-body">
                Log your meals and snacks to track daily nutrition.
              </p>
            </div>
          </div>
        )}

        {/* CTA — bridge to legacy NutritionDiary */}
        <div className="card-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-[15px] font-semibold text-primary">
                Nutrition Diary
              </p>
              <p className="font-body text-[12px] text-secondary mt-1">
                Log meals, search foods, scan barcodes
              </p>
            </div>
            <Link
              to="/nutrition"
              className="btn-filled flex items-center gap-2 flex-shrink-0"
              aria-label="Go to Nutrition Diary"
            >
              Open
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </div>

        <p className="font-body text-[11px] text-tertiary text-center pb-2">
          Native food diary coming in Day 3.
        </p>
      </div>
    </div>
  );
};

export default Eat;
