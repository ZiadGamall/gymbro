import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Save, Search, Trash2, Loader2 } from "lucide-react";
import { createWorkoutTemplate, getApiError, searchExercises } from "../lib/healthApi";

const WorkoutBuilder = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("My Workout");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
  }, [navigate]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      setResults(await searchExercises(searchTerm.trim()));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addExercise = (ex) => {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: "3",
        repsPerSet: "10",
      },
    ]);
    setResults([]);
    setSearchTerm("");
  };

  const updateExercise = (idx, field, value) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === idx ? { ...ex, [field]: value } : ex)),
    );
  };

  const removeExercise = (idx) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!exercises.length) {
      setError("Add at least one exercise.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createWorkoutTemplate({
        name,
        numberOfExercises: exercises.length,
        exercises,
      });
      setSuccess("Workout saved to your profile.");
      setTimeout(() => navigate("/profile"), 1200);
    } catch (err) {
      setError(getApiError(err, "Failed to save workout."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell px-4 py-8 max-w-3xl mx-auto">
      <header className="mb-6">
        <p className="section-title">Workout library</p>
        <h1 className="font-display text-2xl font-bold text-primary">Build a Workout</h1>
        <p className="font-body text-sm text-secondary mt-1">
          Search exercises, configure sets and reps, and save to your profile.
        </p>
      </header>

      <form onSubmit={handleSave} className="card-surface space-y-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field w-full"
          placeholder="Workout name"
          required
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
          </button>
        </div>

        {results.length > 0 && (
          <div className="rounded-xl border border-border max-h-36 overflow-y-auto">
            {results.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => addExercise(ex)}
                className="w-full text-left px-4 py-2 hover:bg-elevated border-b border-border last:border-0 text-sm"
              >
                {ex.name} <span className="text-tertiary">· {ex.bodyPart}</span>
              </button>
            ))}
          </div>
        )}

        {exercises.map((ex, idx) => (
          <div key={`${ex.exerciseId}-${idx}`} className="grid grid-cols-12 gap-2 items-center">
            <p className="col-span-12 sm:col-span-5 font-medium text-primary text-sm">{ex.exerciseName}</p>
            <input
              value={ex.sets}
              onChange={(e) => updateExercise(idx, "sets", e.target.value)}
              className="input-field col-span-3"
              placeholder="Sets"
            />
            <input
              value={ex.repsPerSet}
              onChange={(e) => updateExercise(idx, "repsPerSet", e.target.value)}
              className="input-field col-span-3"
              placeholder="Reps"
            />
            <button type="button" onClick={() => removeExercise(idx)} className="col-span-1 text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {error && <div className="alert-danger">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <button type="submit" className="btn-filled w-full flex items-center justify-center gap-2" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save workout
        </button>
      </form>
    </div>
  );
};

export default WorkoutBuilder;
