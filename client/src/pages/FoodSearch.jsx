import { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  Clock,
  Star,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import axios from "axios";
import { getApiError } from "../lib/healthApi";

const FoodSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [portionGrams, setPortionGrams] = useState(100);

  const formatNutrientLabel = (key) => {
    const map = {
      vitamin_A: "Vitamin A",
      vitamin_B1: "Vitamin B1",
      vitamin_B2: "Vitamin B2",
      vitamin_B3: "Vitamin B3",
      vitamin_B5: "Vitamin B5",
      vitamin_B6: "Vitamin B6",
      vitamin_B7: "Vitamin B7",
      vitamin_B9: "Vitamin B9",
      vitamin_B12: "Vitamin B12",
      vitamin_C: "Vitamin C",
      vitamin_D: "Vitamin D",
      vitamin_E: "Vitamin E",
      vitamin_K: "Vitamin K",
      total_fat: "Total Fat",
      saturated_fat: "Saturated Fat",
      monounsaturated_fat: "Monounsaturated Fat",
      polyunsaturated_fat: "Polyunsaturated Fat",
    };
    if (map[key]) return map[key];
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const normalizeFood = (item) => {
    if (item?.foodId || item?.foodName) {
      return {
        ...item,
        displayName: item.foodName || item.food || "Unknown Food",
        servingSize: "100g",
        nutrients: {},
        calories: item.caloriesPer100g ?? null,
        protein: item.proteinPer100g ?? null,
        carbs: item.carbsPer100g ?? null,
        fat: item.fatPer100g ?? null,
      };
    }

    const nutrients = item?.nutrients || {};
    return {
      ...item,
      displayName: item?.name || item?.food || "Unknown Food",
      servingSize: item?.servingSize || "100g",
      nutrients,
      calories: nutrients?.calories?.amount ?? item?.calories ?? null,
      protein: nutrients?.protein?.amount ?? item?.protein ?? null,
      carbs: nutrients?.carbohydrates?.amount ?? item?.carbs ?? null,
      fat: nutrients?.total_fat?.amount ?? item?.fat ?? null,
      fiber: nutrients?.fiber?.amount ?? item?.fiber ?? null,
      sugar: nutrients?.sugar?.amount ?? item?.sugar ?? null,
      sodium: nutrients?.sodium?.amount ?? item?.sodium ?? null,
    };
  };

  const scaleAmount = (value) => {
    if (value === undefined || value === null) return null;
    const base = Number(value);
    if (Number.isNaN(base)) return null;
    const grams = Number(portionGrams);
    if (!grams || Number.isNaN(grams)) return null;
    return (base * grams) / 100;
  };

  const formatNumber = (value) => {
    if (value === undefined || value === null) return "—";
    const n = Number(value);
    if (Number.isNaN(n)) return "—";
    const rounded = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
    return String(rounded);
  };

  useEffect(() => {
    const fetchAllFoods = async () => {
      setInitialLoading(true);
      setError("");
      try {
        const response = await axios.get("/api/v1/food/all");
        const foods = (response?.data?.data?.data || []).map(normalizeFood);
        setResults(foods);
        setSelectedFood(foods[0] || null);
        setPortionGrams(100);
        setIsMoreOpen(false);
      } catch (err) {
        setError(getApiError(err, "Failed to load foods. Please try again."));
        setResults([]);
        setSelectedFood(null);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAllFoods();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setSelectedFood(null);

    try {
      const response = await axios.post("/api/v1/food/search", {
        name: searchQuery,
      });

      if (response.data.status === "success") {
        const foods = (response?.data?.data?.data || []).map(normalizeFood);
        setResults(foods);
        setSelectedFood(foods[0] || null);
        setPortionGrams(100);
        setIsMoreOpen(false);
      }
    } catch (err) {
      setError(getApiError(err, "Search failed. Please try again."));
      setResults([]);
      setSelectedFood(null);
    } finally {
      setLoading(false);
    }
  };

  const getNutrientColor = (value, type) => {
    if (type === "protein") return "text-green-400";
    if (type === "carbs") return "text-blue-400";
    if (type === "fat") return "text-yellow-400";
    if (type === "calories") return "text-orange-400";
    return "text-[var(--text-secondary)]";
  };

  const displayedLoading = initialLoading || loading;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Food Search
            </h1>
            <p className="text-[var(--text-secondary)]">
              Find nutritional information for thousands of foods
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field-with-icon pr-32 w-full text-lg"
                placeholder="Search for foods (e.g., chicken breast, rice, apple)..."
                disabled={displayedLoading}
              />
              <button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {searchQuery.trim() ? <>Search Results</> : <>Browse Foods</>}
              </h3>
              <div className="text-sm text-[var(--text-secondary)]">
                {results.length} item{results.length !== 1 ? "s" : ""}
              </div>
            </div>

            {displayedLoading && (
              <div className="card p-6">
                <div className="text-center py-8">
                  <div className="inline-flex items-center space-x-3">
                    <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[var(--text-secondary)]">
                      {initialLoading
                        ? "Loading foods..."
                        : "Searching foods..."}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!displayedLoading && results.length === 0 && (
              <div className="card p-6">
                <div className="text-center py-10 text-[var(--text-secondary)]">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  {searchQuery.trim() ? (
                    <>
                      <p>No foods found for "{searchQuery}"</p>
                      <p className="text-sm mt-2">
                        Try searching for chicken, rice, apple, or other common
                        foods
                      </p>
                    </>
                  ) : (
                    <p>No foods available.</p>
                  )}
                </div>
              </div>
            )}

            {!displayedLoading && results.length > 0 && (
              <div className="space-y-3">
                {results.map((food, index) => (
                  <div
                    key={`${food.displayName || "food"}-${index}`}
                    onClick={() => {
                      setSelectedFood(food);
                      setIsMoreOpen(false);
                      setPortionGrams(100);
                    }}
                    className={`card p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                      selectedFood?.displayName === food?.displayName
                        ? "border-[var(--accent)] bg-[var(--accent)]/5"
                        : "hover:border-[var(--accent)]/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-[var(--text-primary)] text-lg mb-1">
                          {food.displayName}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-[var(--text-secondary)]">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {food.servingSize || "100g"}
                          </span>
                          {food.calories !== undefined &&
                            food.calories !== null && (
                              <span className="flex items-center">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                {food.calories} cal
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="text-[var(--accent)]">
                        <Filter className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {selectedFood?.displayName || "Select a food"}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {selectedFood?.servingSize || "Per 100g"}
                  </p>
                </div>
                {selectedFood && (
                  <button
                    type="button"
                    onClick={() => setSelectedFood(null)}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {!selectedFood && (
                <div className="text-[var(--text-secondary)] text-sm">
                  Click any food from the list to see its nutrition breakdown.
                </div>
              )}

              {selectedFood && (
                <div className="space-y-4">
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          Portion
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Values scale from a 100g base
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={portionGrams}
                          onChange={(e) => setPortionGrams(e.target.value)}
                          className="input-field w-24 text-right"
                        />
                        <span className="text-sm text-[var(--text-secondary)]">
                          g
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-3">
                      <div className="text-xs text-[var(--text-secondary)]">
                        Calories
                      </div>
                      <div
                        className={`text-lg font-semibold ${getNutrientColor(selectedFood.calories, "calories")}`}
                      >
                        {formatNumber(scaleAmount(selectedFood.calories))}
                      </div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-3">
                      <div className="text-xs text-[var(--text-secondary)]">
                        Protein (g)
                      </div>
                      <div
                        className={`text-lg font-semibold ${getNutrientColor(selectedFood.protein, "protein")}`}
                      >
                        {formatNumber(scaleAmount(selectedFood.protein))}
                      </div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-3">
                      <div className="text-xs text-[var(--text-secondary)]">
                        Carbs (g)
                      </div>
                      <div
                        className={`text-lg font-semibold ${getNutrientColor(selectedFood.carbs, "carbs")}`}
                      >
                        {formatNumber(scaleAmount(selectedFood.carbs))}
                      </div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-3">
                      <div className="text-xs text-[var(--text-secondary)]">
                        Fat (g)
                      </div>
                      <div
                        className={`text-lg font-semibold ${getNutrientColor(selectedFood.fat, "fat")}`}
                      >
                        {formatNumber(scaleAmount(selectedFood.fat))}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const nutrients = selectedFood?.nutrients || {};
                    const excluded = new Set([
                      "calories",
                      "protein",
                      "carbohydrates",
                      "total_fat",
                    ]);

                    const entries = Object.entries(nutrients)
                      .filter(
                        ([k, v]) =>
                          !excluded.has(k) &&
                          v?.amount !== undefined &&
                          v?.amount !== null,
                      )
                      .map(([k, v]) => ({
                        key: k,
                        label: formatNutrientLabel(k),
                        amount: v.amount,
                        unit: v.unit,
                      }));

                    if (entries.length === 0) return null;

                    return (
                      <div>
                        <button
                          type="button"
                          onClick={() => setIsMoreOpen((v) => !v)}
                          className="w-full flex items-center justify-between bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-left hover:border-[var(--accent)]/40 transition-colors"
                        >
                          <div>
                            <div className="text-sm font-medium text-[var(--text-primary)]">
                              More nutrients
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                              {entries.length} item
                              {entries.length !== 1 ? "s" : ""}
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${
                              isMoreOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isMoreOpen && (
                          <div className="mt-3 space-y-2 text-sm">
                            {entries.map((n) => (
                              <div
                                key={n.key}
                                className="flex justify-between text-[var(--text-secondary)]"
                              >
                                <span>{n.label}</span>
                                <span className="text-[var(--text-primary)]">
                                  {formatNumber(scaleAmount(n.amount))}
                                  {n.unit ? ` ${n.unit}` : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <button
                    type="button"
                    className="btn-secondary w-full"
                    disabled
                  >
                    Add to diary (coming soon)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodSearch;
