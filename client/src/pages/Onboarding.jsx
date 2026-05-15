import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Target, Activity, UtensilsCrossed, ArrowRight, Sparkles } from "lucide-react";
import { loadOnboarding, saveOnboarding } from "../lib/phase2Api";

const steps = [
  { id: 1, title: "Goal" },
  { id: 2, title: "Level" },
  { id: 3, title: "Lifestyle" },
  { id: 4, title: "Nutrition Targets" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    goal: "general_health",
    level: "beginner",
    activityDays: 3,
    dietPreference: "balanced",
    allergies: "",
    calorieTarget: 2200,
    proteinTarget: 120,
    carbsTarget: 250,
    fatTarget: 70,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchOnboarding = async () => {
      setLoading(true);
      setError("");
      try {
        const existing = await loadOnboarding();
        if (existing) {
          setForm((prev) => ({ ...prev, ...existing }));
        }
      } catch {
        setError("Failed to load onboarding profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchOnboarding();
  }, [navigate]);

  const progress = useMemo(() => Math.round((step / steps.length) * 100), [step]);

  const next = () => setStep((s) => Math.min(steps.length, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      await saveOnboarding(form);
      navigate("/dashboard");
    } catch {
      setError("Failed to save onboarding profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="card mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Build Your Health Baseline</h1>
              <p className="text-[var(--text-secondary)] mt-1">
                4 quick steps to personalize your workouts and nutrition.
              </p>
            </div>
            <div className="hidden md:flex w-14 h-14 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 items-center justify-center">
              <Sparkles className="w-7 h-7 text-[var(--accent)]" />
            </div>
          </div>

          <div className="mt-6">
            <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
              <div className="h-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 text-sm text-[var(--text-secondary)]">
              Step {step} of {steps.length}: {steps[step - 1].title}
            </div>
          </div>
        </div>

        <div className="card min-h-[360px]">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-[var(--accent)]" />
                What is your main focus?
              </h2>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  ["general_health", "General Health"],
                  ["fat_loss", "Fat Loss"],
                  ["muscle_tone", "Muscle Tone"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, goal: value }))}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.goal === value
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-[var(--border)] bg-[var(--bg-secondary)]"
                    }`}
                  >
                    <div className="font-medium text-[var(--text-primary)]">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[var(--accent)]" />
                Choose your current level
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  ["beginner", "Beginner", "0-6 months of consistent training"],
                  ["intermediate", "Intermediate", "6+ months, comfortable with routines"],
                ].map(([value, label, desc]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, level: value }))}
                    className={`p-4 rounded-xl border text-left ${
                      form.level === value
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : "border-[var(--border)] bg-[var(--bg-secondary)]"
                    }`}
                  >
                    <div className="font-medium text-[var(--text-primary)]">{label}</div>
                    <div className="text-sm text-[var(--text-secondary)] mt-1">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[var(--accent)]" />
                Lifestyle preferences
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Workout days per week</label>
                  <input
                    type="range"
                    min="2"
                    max="6"
                    value={form.activityDays}
                    onChange={(e) => setForm((f) => ({ ...f, activityDays: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-[var(--text-primary)] mt-2">{form.activityDays} days</div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Diet preference</label>
                  <select
                    value={form.dietPreference}
                    onChange={(e) => setForm((f) => ({ ...f, dietPreference: e.target.value }))}
                    className="input-field w-full"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="high_protein">High protein</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm text-[var(--text-secondary)] mb-2">Allergies or restrictions</label>
                <textarea
                  value={form.allergies}
                  onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
                  className="input-field w-full min-h-24"
                  placeholder="e.g. lactose intolerance, peanut allergy"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Set your daily nutrition targets
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  ["calorieTarget", "Calories", "kcal"],
                  ["proteinTarget", "Protein", "g"],
                  ["carbsTarget", "Carbs", "g"],
                  ["fatTarget", "Fat", "g"],
                ].map(([field, label, unit]) => (
                  <label key={field} className="block">
                    <span className="text-sm text-[var(--text-secondary)]">{label} ({unit})</span>
                    <input
                      type="number"
                      min="0"
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: Number(e.target.value || 0) }))}
                      className="input-field w-full mt-2"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button type="button" onClick={prev} className="btn-secondary" disabled={step === 1}>
              Back
            </button>

            {step < steps.length ? (
              <button type="button" onClick={next} className="btn-primary inline-flex items-center gap-2" disabled={loading}>
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSave} className="btn-primary" disabled={loading}>
                {loading ? "Saving..." : "Save and open dashboard"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
