import { useState } from "react";
import { Flame, Loader2 } from "lucide-react";
import { estimateCaloriesBurned, getApiError } from "../../lib/healthApi";

const DEFAULT_FORM = {
  weight: "",
  height: "",
  age: "",
  gender: "male",
  duration: "",
  heartRate: "120",
};

export default function CaloriesBurnedCard() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setResult(null);
    setError(null);
  };

  const isValid =
    form.weight &&
    form.height &&
    form.age &&
    form.duration &&
    form.heartRate &&
    Number(form.weight) > 0 &&
    Number(form.height) > 0 &&
    Number(form.age) > 0 &&
    Number(form.duration) > 0 &&
    Number(form.heartRate) > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        weight: Number(form.weight),
        height: Number(form.height),
        age: Number(form.age),
        gender: form.gender,
        duration: Number(form.duration),
        heart_rate: Number(form.heartRate),
      };
      const data = await estimateCaloriesBurned(payload);
      setResult(data);
    } catch (err) {
      setError(getApiError(err, "Could not calculate — backend unavailable."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fitbot-cal-card">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "rgba(240,160,48,0.12)",
            border: "1px solid rgba(240,160,48,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Flame size={16} color="var(--warning)" strokeWidth={2} />
        </span>
        <div>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            Calories Burned Estimator
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 11.5,
              color: "var(--text-tertiary)",
              marginTop: 2,
            }}
          >
            ML-powered estimate via the calorie predictor service
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="fitbot-cal-grid">
          <div>
            <label className="field-label" htmlFor="cal-weight">Weight (kg)</label>
            <input
              id="cal-weight"
              name="weight"
              type="number"
              min="20"
              max="300"
              step="0.1"
              value={form.weight}
              onChange={handleChange}
              className="input-field"
              placeholder="70"
              required
            />
          </div>

          <div>
            <label className="field-label" htmlFor="cal-height">Height (cm)</label>
            <input
              id="cal-height"
              name="height"
              type="number"
              min="100"
              max="250"
              value={form.height}
              onChange={handleChange}
              className="input-field"
              placeholder="175"
              required
            />
          </div>

          <div>
            <label className="field-label" htmlFor="cal-age">Age</label>
            <input
              id="cal-age"
              name="age"
              type="number"
              min="10"
              max="100"
              value={form.age}
              onChange={handleChange}
              className="input-field"
              placeholder="25"
              required
            />
          </div>

          <div>
            <label className="field-label" htmlFor="cal-duration">Duration (min)</label>
            <input
              id="cal-duration"
              name="duration"
              type="number"
              min="1"
              max="480"
              value={form.duration}
              onChange={handleChange}
              className="input-field"
              placeholder="45"
              required
            />
          </div>

          <div>
            <label className="field-label" htmlFor="cal-gender">Gender</label>
            <select
              id="cal-gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="input-field"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="cal-heartRate">Avg heart rate (bpm)</label>
            <input
              id="cal-heartRate"
              name="heartRate"
              type="number"
              min="30"
              max="220"
              value={form.heartRate}
              onChange={handleChange}
              className="input-field"
              placeholder="120"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-filled"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          disabled={!isValid || loading}
        >
          {loading ? (
            <>
              <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
              Calculating…
            </>
          ) : (
            <>
              <Flame size={15} strokeWidth={2} />
              Calculate Calories
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="alert-danger" style={{ marginTop: 14 }}>
          {error}
        </div>
      )}

      {result && !error && (
        <div className="fitbot-cal-result">
          <div>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 3,
              }}
            >
              Estimated burned
            </p>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--warning)",
                lineHeight: 1,
              }}
            >
              {result.caloriesBurned ?? "—"}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "var(--text-secondary)",
                  marginLeft: 4,
                }}
              >
                kcal
              </span>
            </p>
          </div>
          {result.notes && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                color: "var(--text-secondary)",
                maxWidth: 160,
                textAlign: "right",
                lineHeight: 1.5,
              }}
            >
              {result.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
