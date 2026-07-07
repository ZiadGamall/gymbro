import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronRight, Layers, Loader2, Star } from "lucide-react";
import {
  getApiError,
  loadAllSplits,
  loadSavedSplits,
  loadSplitById,
  saveSplitToProfile,
  setActiveSplit,
} from "../lib/healthApi";

const SplitsHub = () => {
  const navigate = useNavigate();
  const [splits, setSplits] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [compareId, setCompareId] = useState("");
  const [compareSplit, setCompareSplit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refresh = async () => {
    const [all, saved] = await Promise.all([
      loadAllSplits(),
      loadSavedSplits().catch(() => []),
    ]);
    setSplits(all);
    setSavedIds(new Set(saved.map((s) => s._id)));
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    refresh()
      .catch(() => setError("Failed to load splits."))
      .finally(() => setLoading(false));
  }, [navigate]);

  const openDetail = async (id) => {
    setError("");
    try {
      const detail = await loadSplitById(id);
      setSelected(detail);
    } catch (err) {
      setError(getApiError(err, "Could not load split details."));
    }
  };

  const handleSave = async (id) => {
    setActionLoading(id);
    setError("");
    setSuccess("");
    try {
      await saveSplitToProfile(id);
      await refresh();
      setSuccess("Split saved to your profile.");
    } catch (err) {
      setError(getApiError(err, "Failed to save split."));
    } finally {
      setActionLoading("");
    }
  };

  const handleActivate = async (id) => {
    setActionLoading(`active-${id}`);
    setError("");
    try {
      await setActiveSplit(id, 0);
      setSuccess("Split set as your active program.");
    } catch (err) {
      setError(getApiError(err, "Save the split first, then activate it."));
    } finally {
      setActionLoading("");
    }
  };

  const loadCompare = async (id) => {
    setCompareId(id);
    if (!id) {
      setCompareSplit(null);
      return;
    }
    try {
      setCompareSplit(await loadSplitById(id));
    } catch {
      setCompareSplit(null);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-shell px-4 py-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <p className="section-title">Training Programs</p>
        <h1 className="font-display text-2xl font-bold text-primary">Choose a Split</h1>
        <p className="font-body text-sm text-secondary mt-1">
          Browse programs, compare options, save to your profile, and set your active split.
        </p>
      </header>

      {error && <div className="alert-danger mb-4">{error}</div>}
      {success && <div className="alert-success mb-4">{success}</div>}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {splits.map((split) => {
            const isSaved = savedIds.has(split._id);
            const isActive = selected?._id === split._id;
            return (
              <button
                key={split._id}
                type="button"
                onClick={() => openDetail(split._id)}
                className={`w-full text-left card-surface transition-all hover:border-accent/40 ${
                  isActive ? "border-accent ring-1 ring-accent/30" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold text-primary">{split.program}</p>
                    <p className="font-body text-xs text-tertiary mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {split.days?.length || 0} training days
                    </p>
                  </div>
                  {isSaved && (
                    <span className="text-xs text-success flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Saved
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selected ? (
            <div className="card-surface">
              <h2 className="font-display text-xl font-bold text-primary">{selected.program}</h2>
              <p className="text-sm text-secondary mt-1 mb-4">
                {selected.days?.length} day rotation · tap a day to preview
              </p>

              <div className="space-y-2 mb-5">
                {(selected.days || []).map((day, i) => (
                  <div key={day._id || i} className="session-row">
                    <Layers className="w-4 h-4 text-accent flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-body text-sm font-medium text-primary">
                        Day {i + 1}: {day.name}
                      </p>
                      <p className="text-xs text-tertiary">
                        {day.numberOfExercises || day.exercises?.length || 0} exercises
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-tertiary" />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-filled"
                  disabled={actionLoading === selected._id}
                  onClick={() => handleSave(selected._id)}
                >
                  {actionLoading === selected._id ? "Saving…" : savedIds.has(selected._id) ? "Saved" : "Save to profile"}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={!savedIds.has(selected._id) || actionLoading === `active-${selected._id}`}
                  onClick={() => handleActivate(selected._id)}
                >
                  {actionLoading === `active-${selected._id}` ? "Activating…" : "Set active"}
                </button>
              </div>
            </div>
          ) : (
            <div className="card-surface empty-state">
              <Layers className="empty-state-icon" />
              <p className="empty-state-title">Select a split</p>
              <p className="empty-state-body">Choose a program from the list to view details and save it.</p>
            </div>
          )}

          <div className="card-surface">
            <h3 className="font-display text-sm font-semibold text-primary mb-3">Compare programs</h3>
            <select
              className="input-field w-full mb-3"
              value={compareId}
              onChange={(e) => loadCompare(e.target.value)}
            >
              <option value="">Select another split…</option>
              {splits.filter((s) => s._id !== selected?._id).map((s) => (
                <option key={s._id} value={s._id}>{s.program}</option>
              ))}
            </select>
            {compareSplit && (
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="card-elevated">
                  <p className="text-tertiary text-xs uppercase">Selected</p>
                  <p className="font-medium text-primary">{selected?.program || "—"}</p>
                  <p className="text-tertiary">{selected?.days?.length || 0} days</p>
                </div>
                <div className="card-elevated">
                  <p className="text-tertiary text-xs uppercase">Compare</p>
                  <p className="font-medium text-primary">{compareSplit.program}</p>
                  <p className="text-tertiary">{compareSplit.days?.length || 0} days</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitsHub;
