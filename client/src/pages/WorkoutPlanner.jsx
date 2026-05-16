import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Dumbbell, Plus, Trash2 } from "lucide-react";
import { getHealthState } from "../lib/healthStore";
import {
  addWorkoutSessionApi,
  deleteWorkoutSessionApi,
  loadOnboarding,
  loadWorkoutSessions,
  toggleWorkoutSessionApi,
} from "../lib/healthApi";

const templates = {
  beginner: [
    "Full Body Strength",
    "Cardio + Mobility",
    "Core Stability",
  ],
  intermediate: [
    "Upper Body Strength",
    "Lower Body Power",
    "HIIT Conditioning",
  ],
};

const WorkoutPlanner = () => {
  const [sessions, setSessions] = useState([]);
  const [level, setLevel] = useState(getHealthState().onboarding.level || "beginner");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    planName: templates[level][0],
    durationMin: 40,
    intensity: "moderate",
    notes: "",
  });

  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = useMemo(
    () => sessions.filter((session) => session.date === today),
    [sessions, today],
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [onboarding, daySessions] = await Promise.all([
          loadOnboarding(),
          loadWorkoutSessions(today),
        ]);
        if (onboarding?.level) setLevel(onboarding.level);
        setSessions(daySessions);
      } catch {
        setError("Failed to load workouts.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [today]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await addWorkoutSessionApi({ ...form, date: today });
      const daySessions = await loadWorkoutSessions(today);
      setSessions(daySessions);
      setForm((prev) => ({ ...prev, notes: "" }));
    } catch {
      setError("Failed to add workout session.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Workout Planner</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Generated for {level} level. Track sessions and completion in one place.
            </p>
            {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
          </div>

          <div className="card">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Today plan suggestions</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {templates[level].map((item) => (
                <div key={item} className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                  <div className="text-[var(--text-primary)] font-medium">{item}</div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <Link to="/muscle-lab" className="btn-secondary inline-flex items-center gap-2">
                Open Interactive Muscle Lab
              </Link>
            </div>
          </div>

          <form onSubmit={handleAdd} className="card space-y-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Log workout session</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <select
                value={form.planName}
                onChange={(e) => setForm((f) => ({ ...f, planName: e.target.value }))}
                className="input-field w-full"
              >
                {templates[level].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="10"
                value={form.durationMin}
                onChange={(e) => setForm((f) => ({ ...f, durationMin: Number(e.target.value || 0) }))}
                className="input-field w-full"
                placeholder="Duration (min)"
              />
              <select
                value={form.intensity}
                onChange={(e) => setForm((f) => ({ ...f, intensity: e.target.value }))}
                className="input-field w-full"
              >
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
              <input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="input-field w-full"
                placeholder="Notes"
              />
            </div>
            <button className="btn-primary inline-flex items-center gap-2" type="submit">
              <Plus className="w-4 h-4" />
              Add session
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Today sessions</h2>
          <div className="space-y-3">
            {todaySessions.map((session) => (
              <div key={session.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[var(--text-primary)] font-medium">{session.planName}</div>
                    <div className="text-sm text-[var(--text-secondary)] mt-1">
                      {session.durationMin} min | {session.intensity}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await toggleWorkoutSessionApi(session._id || session.id);
                        const daySessions = await loadWorkoutSessions(today);
                        setSessions(daySessions);
                      } catch {
                        setError("Failed to update workout status.");
                      }
                    }}
                    className="text-[var(--accent)]"
                  >
                    {session.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {session.notes && <div className="text-sm text-[var(--text-secondary)] mt-2">{session.notes}</div>}

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteWorkoutSessionApi(session._id || session.id);
                      const daySessions = await loadWorkoutSessions(today);
                      setSessions(daySessions);
                    } catch {
                      setError("Failed to delete workout session.");
                    }
                  }}
                  className="mt-3 text-sm text-[var(--text-secondary)] hover:text-red-400 inline-flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            ))}

            {!loading && todaySessions.length === 0 && (
              <div className="text-sm text-[var(--text-secondary)]">No sessions logged yet today.</div>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center gap-2 text-[var(--text-primary)] font-medium">
              <Dumbbell className="w-4 h-4 text-[var(--accent)]" />
              Consistency tip
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              For general health, target 3-4 completed sessions each week with at least 1 mobility-focused day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPlanner;
