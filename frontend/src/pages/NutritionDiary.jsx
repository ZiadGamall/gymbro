import { useEffect, useMemo, useState } from "react";
import { Trash2, Plus, Flame, Beef, Wheat, Droplets } from "lucide-react";
import { getPhase2State } from "../lib/phase2Store";
import {
  addNutritionEntryApi,
  deleteNutritionEntryApi,
  loadNutritionEntries,
  loadNutritionSummary,
  loadOnboarding,
} from "../lib/phase2Api";

const mealOptions = ["breakfast", "lunch", "dinner", "snack"];

const NutritionDiary = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [targets, setTargets] = useState(getPhase2State().onboarding);
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    mealType: "breakfast",
    foodName: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [onboarding, dayEntries, dayTotals] = await Promise.all([
          loadOnboarding(),
          loadNutritionEntries(today),
          loadNutritionSummary(today),
        ]);

        if (onboarding) {
          setTargets((prev) => ({ ...prev, ...onboarding }));
        }

        setEntries(dayEntries);
        setTotals(dayTotals);
      } catch {
        setError("Failed to load nutrition data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [today]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.foodName.trim()) return;
    setError("");
    try {
      await addNutritionEntryApi({ ...form, date: today });
      const [dayEntries, dayTotals] = await Promise.all([
        loadNutritionEntries(today),
        loadNutritionSummary(today),
      ]);
      setEntries(dayEntries);
      setTotals(dayTotals);
      setForm({
        mealType: "breakfast",
        foodName: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
      });
    } catch {
      setError("Failed to add nutrition entry.");
    }
  };

  const progressValue = (val, target) => {
    if (!target) return 0;
    return Math.min(100, Math.round((val / target) * 100));
  };

  const progressCards = [
    ["Calories", totals.calories, targets.calorieTarget, "kcal", Flame],
    ["Protein", totals.protein, targets.proteinTarget, "g", Beef],
    ["Carbs", totals.carbs, targets.carbsTarget, "g", Wheat],
    ["Fat", totals.fat, targets.fatTarget, "g", Droplets],
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Nutrition Diary</h1>
            <p className="text-[var(--text-secondary)] mt-1">Log meals and track macro adherence in real time.</p>
            {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
          </div>

          <form onSubmit={handleAdd} className="card space-y-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Add meal entry</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <select
                value={form.mealType}
                onChange={(e) => setForm((f) => ({ ...f, mealType: e.target.value }))}
                className="input-field w-full"
              >
                {mealOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                value={form.foodName}
                onChange={(e) => setForm((f) => ({ ...f, foodName: e.target.value }))}
                placeholder="Food name"
                className="input-field w-full"
                required
              />
              <input
                value={form.calories}
                onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
                type="number"
                min="0"
                placeholder="Calories"
                className="input-field w-full"
              />
              <input
                value={form.protein}
                onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
                type="number"
                min="0"
                placeholder="Protein (g)"
                className="input-field w-full"
              />
              <input
                value={form.carbs}
                onChange={(e) => setForm((f) => ({ ...f, carbs: e.target.value }))}
                type="number"
                min="0"
                placeholder="Carbs (g)"
                className="input-field w-full"
              />
              <input
                value={form.fat}
                onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))}
                type="number"
                min="0"
                placeholder="Fat (g)"
                className="input-field w-full"
              />
            </div>
            <button type="submit" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add entry
            </button>
          </form>

          <div className="card">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Today entries</h2>
            <div className="space-y-3">
              {entries
                .filter((entry) => entry.date === new Date().toISOString().slice(0, 10))
                .map((entry) => (
                  <div key={entry.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[var(--text-primary)] font-medium">
                        {entry.foodName} <span className="text-[var(--text-secondary)] text-sm">({entry.mealType})</span>
                      </div>
                      <div className="text-sm text-[var(--text-secondary)] mt-1">
                        {entry.calories} kcal | P {entry.protein}g | C {entry.carbs}g | F {entry.fat}g
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteNutritionEntryApi(entry._id || entry.id);
                          const [dayEntries, dayTotals] = await Promise.all([
                            loadNutritionEntries(today),
                            loadNutritionSummary(today),
                          ]);
                          setEntries(dayEntries);
                          setTotals(dayTotals);
                        } catch {
                          setError("Failed to delete nutrition entry.");
                        }
                      }}
                      className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-[var(--bg-tertiary)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              {!loading && entries.filter((entry) => entry.date === today).length === 0 && (
                <div className="text-sm text-[var(--text-secondary)]">No entries yet for today.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {progressCards.map(([label, value, target, unit, Icon]) => {
            const p = progressValue(value, target);
            return (
              <div key={label} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[var(--text-secondary)]">{label}</div>
                  <Icon className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <div className="text-xl font-bold text-[var(--text-primary)]">{Math.round(value)} / {target} {unit}</div>
                <div className="mt-3 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div className="h-full bg-[var(--accent)]" style={{ width: `${p}%` }} />
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-2">{p}% of target</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NutritionDiary;
