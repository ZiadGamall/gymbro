import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Video, CheckCircle2, AlertTriangle, Loader2, History } from "lucide-react";
import {
  analyzeFormVideo,
  getApiError,
  loadFormCheckHistory,
} from "../lib/healthApi";

const MODES = ["Beginner", "Pro"];
const EXERCISES = [
  { label: "Squats", value: "squats" },
  { label: "Biceps Curl", value: "biceps-curl" },
  { label: "Shoulder Press", value: "shoulder-press" },
];

const FormChecker = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("Beginner");
  const [exercise, setExercise] = useState("squats");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    loadFormCheckHistory().then(setHistory).catch(() => {});
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a workout video to analyze.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setProgress("Uploading video…");

    try {
      setProgress("Analyzing form with AI…");
      const data = await analyzeFormVideo(file, mode, exercise);
      setResult(data);
      setProgress("");
      const updated = await loadFormCheckHistory();
      setHistory(updated);
    } catch (err) {
      setError(getApiError(err, "Form analysis failed. Ensure the AI service is running."));
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  const totalReps = result
    ? (result.correct_reps || 0) + (result.incorrect_reps || 0)
    : 0;
  const accuracy = totalReps
    ? Math.round(((result.correct_reps || 0) / totalReps) * 100)
    : 0;

  return (
    <div className="page-shell px-4 py-8 max-w-4xl mx-auto">
      <header className="mb-6">
        <p className="section-title">AI Form Analysis</p>
        <h1 className="font-display text-2xl font-bold text-primary">Form Checker</h1>
        <p className="font-body text-sm text-secondary mt-1">
          Upload a training video to get rep counts, error detection, and coaching feedback.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="card-surface space-y-5 mb-6">
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            file ? "border-accent bg-accent/5" : "border-border"
          }`}
        >
          <Video className="w-10 h-10 mx-auto text-accent mb-3" strokeWidth={1.5} />
          <p className="font-body text-sm text-primary font-medium">
            {file ? file.name : "Drop or select a video file"}
          </p>
          <p className="font-body text-xs text-tertiary mt-1">MP4, MOV, or WebM · max 100MB</p>
          <label className="btn-ghost inline-flex items-center gap-2 mt-4 cursor-pointer">
            <Upload className="w-4 h-4" />
            Choose video
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setError("");
              }}
            />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label" htmlFor="form-exercise">Exercise</label>
            <select
              id="form-exercise"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
              className="input-field w-full"
            >
              {EXERCISES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="form-mode">Analysis mode</label>
            <select
              id="form-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="input-field w-full"
            >
              {MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {progress && (
          <div className="flex items-center gap-3 text-sm text-accent">
            <Loader2 className="w-4 h-4 animate-spin" />
            {progress}
          </div>
        )}

        {error && (
          <div className="alert-danger flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button type="submit" className="btn-filled w-full flex items-center justify-center gap-2" disabled={loading || !file}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {loading ? "Analyzing…" : "Analyze Form"}
        </button>
      </form>

      {result && (
        <section className="card-surface mb-6" aria-live="polite">
          <h2 className="font-display text-lg font-semibold text-primary mb-4">Results</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-5">
            <div className="card-elevated text-center">
              <p className="text-xs text-tertiary uppercase tracking-wide">Exercise</p>
              <p className="font-mono text-xl font-bold text-primary mt-1">{result.exercise}</p>
            </div>
            <div className="card-elevated text-center">
              <p className="text-xs text-tertiary uppercase tracking-wide">Form accuracy</p>
              <p className="font-mono text-xl font-bold text-success mt-1">{accuracy}%</p>
            </div>
            <div className="card-elevated text-center">
              <p className="text-xs text-tertiary uppercase tracking-wide">Reps</p>
              <p className="font-mono text-xl font-bold text-primary mt-1">
                {result.correct_reps}/{totalReps} clean
              </p>
            </div>
          </div>

          {result.errors_detected && Object.keys(result.errors_detected).length > 0 && (
            <div>
              <h3 className="font-body text-sm font-semibold text-primary mb-2">Issues detected</h3>
              <div className="space-y-2">
                {Object.entries(result.errors_detected).map(([rep, issues]) => (
                  <div key={rep} className="rounded-lg border border-border bg-elevated px-4 py-3">
                    <p className="text-xs text-tertiary uppercase">{rep}</p>
                    <ul className="mt-1 space-y-1">
                      {(Array.isArray(issues) ? issues : [issues]).map((issue, i) => (
                        <li key={i} className="text-sm text-warning flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.output_video && (
            <p className="text-sm text-secondary mt-4">
              Annotated output video saved on server: {result.output_video}
            </p>
          )}
        </section>
      )}

      {history.length > 0 && (
        <section className="card-surface">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-accent" />
            <h2 className="font-display text-lg font-semibold text-primary">Recent analyses</h2>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((item) => (
              <div key={item._id} className="session-row">
                <div>
                  <p className="font-body text-sm font-medium text-primary">{item.exercise}</p>
                  <p className="font-body text-xs text-tertiary">
                    {item.correct_reps} clean · {item.incorrect_reps} flagged · {item.mode}
                  </p>
                </div>
                <span className="text-xs text-tertiary">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FormChecker;
