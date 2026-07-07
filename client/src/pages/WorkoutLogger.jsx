import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dumbbell, Plus, Trash2, Search, Save, Loader2, CheckCircle2 } from "lucide-react";
import {
  addWorkoutSessionApi,
  advanceSplitDay,
  deleteWorkoutSessionApi,
  getApiError,
  loadTodaySplitWorkout,
  loadWorkoutSessions,
  searchExercises,
} from "../lib/healthApi";

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptySet = () => ({ setNumber: 1, weight: "", reps: "" });

const WorkoutLogger = () => {
  const navigate = useNavigate();
  const today = todayISO();
  const [sessions, setSessions] = useState([]);
  const [workoutName, setWorkoutName] = useState("Training Session");
  const [duration, setDuration] = useState(45);
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refreshSessions = async () => {
    const data = await loadWorkoutSessions(today);
    setSessions(data);
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    Promise.all([
      refreshSessions(),
      loadTodaySplitWorkout().catch(() => null),
    ])
      .then(([, splitWorkout]) => {
        if (!splitWorkout?.workout) return;
        setWorkoutName((prev) =>
          prev !== "Training Session"
            ? prev
            : splitWorkout.workout.name || splitWorkout.splitName || "Split Day",
        );
        const fromSplit = (splitWorkout.workout.exercises || []).map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.exerciseName || ex.name || "Exercise",
          sets: [emptySet()],
        }));
        if (fromSplit.length) {
          setExercises((prev) => (prev.length > 0 ? prev : fromSplit));
        }
      })
      .catch(() => setError("Failed to load sessions."))
      .finally(() => setLoading(false));
  }, [navigate, today]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      setSearchResults(await searchExercises(searchTerm.trim()));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addExercise = (ex) => {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id || ex._id,
        name: ex.name,
        sets: [emptySet()],
      },
    ]);
    setSearchResults([]);
    setSearchTerm("");
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== exIdx
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j !== setIdx ? s : { ...s, [field]: value },
              ),
            },
      ),
    );
  };

  const addSet = (exIdx) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== exIdx
          ? ex
          : {
              ...ex,
              sets: [...ex.sets, { setNumber: ex.sets.length + 1, weight: "", reps: "" }],
            },
      ),
    );
  };

  const removeExercise = (exIdx) => {
    setExercises((prev) => prev.filter((_, i) => i !== exIdx));
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    if (!exercises.length) {
      setError("Add at least one exercise with logged sets.");
      return;
    }

    const payload = {
      workoutName: notes ? `${workoutName} — ${notes}` : workoutName,
      duration: Number(duration),
      date: today,
      exercises: exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        sets: ex.sets.map((s, i) => ({
          setNumber: i + 1,
          weight: Number(s.weight) || 0,
          reps: Number(s.reps) || 0,
        })),
      })),
    };

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await addWorkoutSessionApi(payload);
      await advanceSplitDay().catch(() => {});
      await refreshSessions();
      setSuccess("Workout logged successfully.");
      setExercises([]);
      setNotes("");
    } catch (err) {
      setError(getApiError(err, "Failed to save workout."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-content max-w-6xl grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-surface">
            <h1 className="page-title">Workout Logger</h1>
            <p className="page-subtitle">
              Log exercises, sets, reps, and weight. Sessions sync to your training history.
            </p>
            <Link to="/splits" className="text-sm text-[var(--accent)] mt-2 inline-block">
              Browse training splits →
            </Link>
            {error && <div className="alert-danger mt-4">{error}</div>}
            {success && <div className="alert-success mt-4">{success}</div>}
          </div>

          <form onSubmit={handleFinish} className="card-surface space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="input-field w-full"
                placeholder="Workout name"
                required
              />
              <input
                type="number"
                min="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input-field w-full"
                placeholder="Duration (min)"
                required
              />
            </div>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field w-full"
              placeholder="Session notes (optional)"
            />

            <div className="flex gap-2">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full"
                placeholder="Search exercises…"
              />
              <button type="button" className="btn-secondary flex items-center gap-2" onClick={handleSearch} disabled={searching}>
                <Search className="w-4 h-4" />
                {searching ? "…" : "Search"}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] max-h-40 overflow-y-auto">
                {searchResults.map((ex) => (
                  <button
                    key={ex.id || ex._id}
                    type="button"
                    onClick={() => addExercise(ex)}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--bg-tertiary)] border-b border-[var(--border)] last:border-0"
                  >
                    <span className="font-medium text-[var(--text-primary)]">{ex.name}</span>
                    <span className="text-xs text-[var(--text-secondary)] ml-2">{ex.bodyPart} · {ex.target}</span>
                  </button>
                ))}
              </div>
            )}

            {exercises.map((ex, exIdx) => (
              <div key={`${ex.name}-${exIdx}`} className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-[var(--accent)]" />
                    {ex.name}
                  </p>
                  <button type="button" onClick={() => removeExercise(exIdx)} className="text-[var(--text-secondary)] hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-[var(--text-tertiary)] mb-2 px-1">
                  <span>Set</span><span>Weight (kg)</span><span>Reps</span><span />
                </div>
                {ex.sets.map((set, setIdx) => (
                  <div key={setIdx} className="grid grid-cols-4 gap-2 mb-2">
                    <span className="input-field flex items-center justify-center text-sm">{setIdx + 1}</span>
                    <input
                      type="number"
                      min="0"
                      value={set.weight}
                      onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                      className="input-field"
                      placeholder="0"
                    />
                    <input
                      type="number"
                      min="0"
                      value={set.reps}
                      onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                      className="input-field"
                      placeholder="0"
                    />
                    <span />
                  </div>
                ))}
                <button type="button" className="text-sm text-[var(--accent)] mt-1" onClick={() => addSet(exIdx)}>
                  + Add set
                </button>
              </div>
            ))}

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {submitting ? "Saving…" : "Finish & save workout"}
            </button>
          </form>
        </div>

        <div className="card-surface">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Today&apos;s logs</h2>
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton-block h-16" />
              <div className="skeleton-block h-16" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="empty-state py-6">
              <p className="empty-state-title">No sessions yet</p>
              <p className="empty-state-body">Finish a workout to see it logged here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id || session._id} className="rounded-xl border border-[var(--border)] p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{session.planName}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{session.durationMin} min</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <button
                    type="button"
                    className="text-xs text-red-400 mt-2"
                    onClick={async () => {
                      await deleteWorkoutSessionApi(session.id || session._id);
                      await refreshSessions();
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutLogger;
