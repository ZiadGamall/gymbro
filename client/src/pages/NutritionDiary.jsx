import { useEffect, useState } from "react";
import { Trash2, Plus, Flame, Beef, Wheat, Droplets, Search } from "lucide-react";
import { getHealthState } from "../lib/healthStore";
import {
  addNutritionEntryApi,
  deleteNutritionEntryApi,
  getApiError,
  loadNutritionEntries,
  loadNutritionSummary,
  loadOnboarding,
  searchFoodByName,
} from "../lib/healthApi";
import FoodScanner from "../components/FoodScanner";

const mealOptions = ["breakfast", "lunch", "dinner", "snack"];

const NutritionDiary = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [targets, setTargets] = useState(getHealthState().onboarding);
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
    mealType: "breakfast",
    foodId: "",
    foodName: "",
    weightConsumed: "100",
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

  const handleSearchFood = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    try {
      const results = await searchFoodByName(searchQuery.trim());
      setSearchResults(results);
      if (results.length === 0) {
        setError("No foods found. Try another search term.");
      }
    } catch (err) {
      setSearchResults([]);
      setError(getApiError(err, "Food search failed."));
    } finally {
      setSearching(false);
    }
  };

  const selectFood = (food) => {
    setForm((prev) => ({
      ...prev,
      foodId: food.foodId,
      foodName: food.foodName,
    }));
    setSearchResults([]);
    setSearchQuery(food.foodName);
    setError("");
  };

  const refreshDay = async () => {
    const [dayEntries, dayTotals] = await Promise.all([
      loadNutritionEntries(today),
      loadNutritionSummary(today),
    ]);
    setEntries(dayEntries);
    setTotals(dayTotals);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.foodId || !form.weightConsumed) {
      setError("Search and select a food, then enter the portion weight in grams.");
      return;
    }
    setError("");
    try {
      await addNutritionEntryApi({
        foodId: form.foodId,
        weightConsumed: Number(form.weightConsumed),
        mealType: form.mealType,
        date: today,
      });
      await refreshDay();
      setForm({
        mealType: "breakfast",
        foodId: "",
        foodName: "",
        weightConsumed: "100",
      });
      setSearchQuery("");
    } catch (err) {
      setError(getApiError(err, "Failed to add nutrition entry."));
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
    <div className="page-shell">
      <div className="page-content max-w-7xl grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-surface">
            <h1 className="page-title">Nutrition Diary</h1>
            <p className="page-subtitle">Log meals and track macro adherence in real time.</p>
            {error && <div className="alert-danger mt-4">{error}</div>}
          </div>

          <FoodScanner onEntryAdded={refreshDay} />

          <form onSubmit={handleAdd} className="card-surface space-y-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Manual search</h2>

            <div className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food database (e.g. chicken, rice)"
                className="input-field w-full"
              />
              <button
                type="button"
                onClick={handleSearchFood}
                className="btn-secondary inline-flex items-center gap-2 flex-shrink-0"
                disabled={searching || !searchQuery.trim()}
              >
                <Search className="w-4 h-4" />
                {searching ? "..." : "Search"}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] max-h-48 overflow-y-auto">
                {searchResults.map((food) => (
                  <button
                    key={food.foodId}
                    type="button"
                    onClick={() => selectFood(food)}
                    className="w-full text-left px-4 py-3 hover:bg-[var(--bg-tertiary)] border-b border-[var(--border)] last:border-b-0"
                  >
                    <div className="text-[var(--text-primary)] font-medium">{food.foodName}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {food.caloriesPer100g} kcal / 100g · P {food.proteinPer100g}g · C {food.carbsPer100g}g · F {food.fatPer100g}g
                    </div>
                  </button>
                ))}
              </div>
            )}

            {form.foodName && (
              <p className="text-sm text-[var(--accent)]">Selected: {form.foodName}</p>
            )}

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
                value={form.weightConsumed}
                onChange={(e) => setForm((f) => ({ ...f, weightConsumed: e.target.value }))}
                type="number"
                min="1"
                placeholder="Portion weight (g)"
                className="input-field w-full"
                required
              />
            </div>
            <button type="submit" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add entry
            </button>
          </form>

          <div className="card-surface">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Today entries</h2>
            <div className="space-y-3">
              {loading ? (
                <>
                  <div className="skeleton-block h-16" />
                  <div className="skeleton-block h-16" />
                </>
              ) : (
                <>
              {entries
                .filter((entry) => entry.date === today)
                .map((entry) => (
                  <div key={entry.id || entry._id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[var(--text-primary)] font-medium">
                        {entry.foodName}{" "}
                        <span className="text-[var(--text-secondary)] text-sm">({entry.mealType})</span>
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
                          await refreshDay();
                        } catch (err) {
                          setError(getApiError(err, "Failed to delete nutrition entry."));
                        }
                      }}
                      className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--bg-tertiary)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              {!loading && entries.filter((entry) => entry.date === today).length === 0 && (
                <div className="empty-state py-8">
                  <p className="empty-state-title">No meals logged yet</p>
                  <p className="empty-state-body">Search for a food above to add your first entry today.</p>
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {progressCards.map(([label, value, target, unit, Icon]) => {
            const p = progressValue(value, target);
            return (
              <div key={label} className="card-surface">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[var(--text-secondary)]">{label}</div>
                  <Icon className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <div className="text-xl font-bold text-[var(--text-primary)]">
                  {Math.round(value)} / {target} {unit}
                </div>
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
