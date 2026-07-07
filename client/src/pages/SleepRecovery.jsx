import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Heart, Loader2, Moon, Footprints, Brain } from "lucide-react";
import { getApiError, getRecoveryRecommendation, loadCurrentUser } from "../lib/healthApi";

const DEFAULT_FORM = {
  total_sleep_min: 420,
  deep_sleep_min: 90,
  rem_sleep_min: 100,
  hr_avg_bpm: 58,
  sleep_score: 78,
  avg_stress_score: 35,
  steps: 8500,
  active_minutes: 45,
};

const SleepRecovery = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [user, setUser] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    loadCurrentUser().then(setUser).catch(() => {});
    try {
      const saved = JSON.parse(localStorage.getItem("gymbro.sleep.history.v1") || "[]");
      setHistory(saved);
    } catch {
      setHistory([]);
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await getRecoveryRecommendation(form);
      setResult(data);
      const entry = { ...form, result: data, date: new Date().toISOString() };
      const next = [entry, ...history].slice(0, 14);
      setHistory(next);
      localStorage.setItem("gymbro.sleep.history.v1", JSON.stringify(next));
    } catch (err) {
      setError(getApiError(err, "Recovery analysis unavailable. Check profile (gender, DOB) and AI service."));
    } finally {
      setLoading(false);
    }
  };

  const sleepHours = (form.total_sleep_min / 60).toFixed(1);
  const deepPct = form.total_sleep_min ? Math.round((form.deep_sleep_min / form.total_sleep_min) * 100) : 0;
  const remPct = form.total_sleep_min ? Math.round((form.rem_sleep_min / form.total_sleep_min) * 100) : 0;

  return (
    <div className="page-shell px-4 py-8 max-w-4xl mx-auto">
      <header className="mb-6">
        <p className="section-title">Recovery Intelligence</p>
        <h1 className="font-display text-2xl font-bold text-primary">Sleep & Recovery</h1>
        <p className="font-body text-sm text-secondary mt-1">
          Sync wearable stats to get AI-powered training readiness recommendations.
        </p>
      </header>

      {!user?.gender && (
        <div className="alert-warning mb-4">
          Complete your profile (gender and date of birth) in Account Settings for accurate recovery predictions.
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-surface space-y-5 mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { name: "total_sleep_min", label: "Total sleep (min)", icon: Moon },
            { name: "deep_sleep_min", label: "Deep sleep (min)", icon: Moon },
            { name: "rem_sleep_min", label: "REM sleep (min)", icon: Brain },
            { name: "hr_avg_bpm", label: "Avg resting HR (bpm)", icon: Heart },
            { name: "sleep_score", label: "Sleep score (0–100)", icon: Activity },
            { name: "avg_stress_score", label: "Stress score (0–100)", icon: Activity },
            { name: "steps", label: "Steps", icon: Footprints },
            { name: "active_minutes", label: "Active minutes", icon: Activity },
          ].map(({ name, label, icon: Icon }) => (
            <div key={name}>
              <label className="field-label flex items-center gap-1.5" htmlFor={name}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </label>
              <input
                id={name}
                name={name}
                type="number"
                min="0"
                value={form[name]}
                onChange={handleChange}
                className="input-field w-full"
                required
              />
            </div>
          ))}
        </div>

        {error && <div className="alert-danger">{error}</div>}

        <button type="submit" className="btn-filled w-full flex items-center justify-center gap-2" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          {loading ? "Analyzing recovery…" : "Get recovery recommendation"}
        </button>
      </form>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card-elevated text-center">
          <p className="text-xs text-tertiary uppercase">Sleep duration</p>
          <p className="font-mono text-2xl font-bold text-primary mt-1">{sleepHours}h</p>
        </div>
        <div className="card-elevated text-center">
          <p className="text-xs text-tertiary uppercase">Deep sleep</p>
          <p className="font-mono text-2xl font-bold text-accent mt-1">{deepPct}%</p>
        </div>
        <div className="card-elevated text-center">
          <p className="text-xs text-tertiary uppercase">REM sleep</p>
          <p className="font-mono text-2xl font-bold text-success mt-1">{remPct}%</p>
        </div>
      </div>

      {result && (
        <section className="card-surface mb-6" style={{ borderLeft: `4px solid ${result.color || "var(--accent)"}` }}>
          <div className="flex items-start gap-4">
            <span className="text-4xl" aria-hidden="true">{result.emoji}</span>
            <div>
              <p className="font-display text-xl font-bold text-primary">{result.recommendation}</p>
              <p className="font-body text-sm text-secondary mt-2 leading-relaxed">{result.message}</p>
              <p className="font-mono text-xs text-tertiary mt-3">
                Confidence: {Math.round((result.confidence || 0) * 100)}%
              </p>
            </div>
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="card-surface">
          <h2 className="font-display text-lg font-semibold text-primary mb-4">14-day history</h2>
          <div className="grid grid-cols-7 gap-2 items-end h-32 mb-2">
            {history.slice(0, 7).reverse().map((entry, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-accent/80"
                  style={{ height: `${Math.max(12, (entry.total_sleep_min / 600) * 100)}%` }}
                  title={`${entry.total_sleep_min} min sleep`}
                />
                <span className="text-[10px] text-tertiary">
                  {new Date(entry.date).toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((entry, i) => (
              <div key={i} className="session-row text-sm">
                <span>{new Date(entry.date).toLocaleDateString()}</span>
                <span className="text-secondary">{entry.result?.recommendation}</span>
                <span className="font-mono text-tertiary">{entry.total_sleep_min}m sleep</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SleepRecovery;
