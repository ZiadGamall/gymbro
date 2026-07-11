import { useState, useEffect } from "react";
import { Search, Activity, Target, Dumbbell, Play, X, ShieldAlert, Loader2 } from "lucide-react";
import axios from "axios";
import { getApiError, authHeaders } from "../lib/healthApi";

const ExerciseSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(null);
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchExercises = async (query = "", pageNum = 1) => {
    try {
      const response = await axios.get(
        `/api/v1/exercises/search?search=${encodeURIComponent(query)}&page=${pageNum}&limit=${limit}`,
        { headers: authHeaders() }
      );
      
      const data = response.data;
      if (data.status === "success") {
        const exercises = data.data.exercises || [];
        setResults(exercises);
        if (exercises.length > 0) {
            setSelectedExercise(exercises[0]);
        } else {
            setSelectedExercise(null);
        }
        setTotal(data.total || 0);
      }
    } catch (err) {
      setError(getApiError(err, "Failed to load exercises. Please try again."));
      setResults([]);
      setSelectedExercise(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      setError("");
      await fetchExercises("", 1);
      setInitialLoading(false);
    };
    init();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPage(1);
    await fetchExercises(searchQuery, 1);
    setLoading(false);
  };

  const totalPages = Math.ceil(total / limit);

  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setLoadingMore(true);
    setPage(newPage);
    await fetchExercises(searchQuery, newPage);
    setLoadingMore(false);
    
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayedLoading = initialLoading || loading;

  return (
    <div className="page-shell">
      <div className="page-content max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="page-title">Exercise Database</h1>
          <p className="page-subtitle">
            Search our library of movements with detailed instructions and animations.
          </p>
        </div>

        <div className="py-2">
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
                  placeholder="Search for exercises (e.g., squat, chest, bench)..."
                  disabled={displayedLoading}
                />
                <button
                  type="submit"
                  disabled={loading || (!searchQuery.trim() && searchQuery !== "")}
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
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center flex items-center justify-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Results Area */}
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Left Pane: List (Wider now) */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {searchQuery.trim() ? "Search Results" : "Browse Exercises"}
                </h3>
                <div className="text-sm text-[var(--text-secondary)]">
                  Showing {results.length} of {total}
                </div>
              </div>

              {displayedLoading && (
                <div className="card p-6">
                  <div className="text-center py-8">
                    <div className="inline-flex items-center space-x-3">
                      <div className="w-6 h-6 border-2 border-[var(--neon-blue)] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[var(--text-secondary)]">
                        {initialLoading ? "Loading library..." : "Searching exercises..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!displayedLoading && results.length === 0 && (
                <div className="card p-6">
                  <div className="text-center py-10 text-[var(--text-secondary)]">
                    <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    {searchQuery.trim() ? (
                      <>
                        <p>No exercises found for "{searchQuery}"</p>
                        <p className="text-sm mt-2">
                          Try searching for a muscle group or standard equipment.
                        </p>
                      </>
                    ) : (
                      <p>No exercises available.</p>
                    )}
                  </div>
                </div>
              )}

              {!displayedLoading && results.length > 0 && (
                <div className="space-y-3 pb-8">
                  {/* Single column layout for list */}
                  <div className="grid grid-cols-1 gap-3">
                    {results.map((ex, index) => (
                      <div
                        key={ex.id || index}
                        onClick={() => setSelectedExercise(ex)}
                        className={`card p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                          selectedExercise?.id === ex.id
                            ? "border-[var(--neon-blue)] bg-[var(--neon-blue)]/5"
                            : "hover:border-[var(--neon-blue)]/50"
                        }`}
                      >
                        <h4 className="font-semibold text-[var(--text-primary)] text-md mb-2 capitalize truncate" title={ex.name}>
                          {ex.name}
                        </h4>
                        <div className="flex flex-col gap-1.5 text-xs text-[var(--text-secondary)]">
                          <span className="flex items-center capitalize">
                            <Activity className="w-3.5 h-3.5 mr-1.5 text-[var(--neon-blue)] flex-shrink-0" />
                            <span className="truncate">{ex.bodyPart}</span>
                          </span>
                          <span className="flex items-center capitalize">
                            <Target className="w-3.5 h-3.5 mr-1.5 text-[var(--neon-green)] flex-shrink-0" />
                            <span className="truncate">{ex.target}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="pt-4 flex items-center justify-center gap-4">
                      <button 
                        onClick={() => handlePageChange(page - 1)} 
                        disabled={loadingMore || page === 1}
                        className="btn-secondary px-4 py-2 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="text-sm text-[var(--text-secondary)]">
                        Page {page} of {totalPages}
                      </span>
                      <button 
                        onClick={() => handlePageChange(page + 1)} 
                        disabled={loadingMore || page === totalPages}
                        className="btn-secondary px-4 py-2 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Pane: Details (Narrower now) */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <div className="card p-5 lg:sticky top-24">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] capitalize">
                      {selectedExercise?.name || "Select an exercise"}
                    </h3>
                  </div>
                  {selectedExercise && (
                    <button
                      type="button"
                      onClick={() => setSelectedExercise(null)}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-tertiary)] p-1.5 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {!selectedExercise && (
                  <div className="text-[var(--text-secondary)] text-sm flex flex-col items-center justify-center py-16 border-2 border-dashed border-[var(--border)] rounded-xl">
                    <Play className="w-10 h-10 mb-4 opacity-40" />
                    <p className="text-center px-4">Click any exercise to view its animation and instructions.</p>
                  </div>
                )}

                {selectedExercise && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    
                    {/* Visualizer */}
                    {selectedExercise.gifUrl && (
                      <div className="w-full bg-white rounded-xl overflow-hidden shadow-inner border border-[var(--border)] relative aspect-square sm:aspect-video lg:aspect-square flex items-center justify-center p-2">
                        <img 
                          src={selectedExercise.gifUrl} 
                          alt={selectedExercise.name} 
                          className="w-full h-full object-contain mix-blend-multiply" 
                        />
                      </div>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] text-[11px] font-semibold uppercase tracking-wider border border-[var(--neon-blue)]/20">
                        {selectedExercise.target}
                      </span>
                      <span className="px-2.5 py-1 rounded bg-[var(--neon-green)]/10 text-[var(--neon-green)] text-[11px] font-semibold uppercase tracking-wider border border-[var(--neon-green)]/20">
                        {selectedExercise.bodyPart}
                      </span>
                      <span className="px-2.5 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)] text-[11px] font-semibold uppercase tracking-wider border border-[var(--accent)]/20">
                        {selectedExercise.equipment}
                      </span>
                    </div>

                    {/* Instructions */}
                    {selectedExercise.instructionSteps && selectedExercise.instructionSteps.length > 0 && (
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                        <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2 text-sm">
                          <Dumbbell className="w-3.5 h-3.5 text-[var(--neon-blue)]" /> 
                          Execution
                        </h4>
                        <ol className="space-y-2.5">
                          {selectedExercise.instructionSteps.map((step, idx) => (
                            <li key={idx} className="flex gap-2.5 text-[var(--text-secondary)] text-xs sm:text-sm">
                              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium text-[10px] border border-[var(--border)]">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {selectedExercise.secondaryMuscles && selectedExercise.secondaryMuscles.length > 0 && (
                      <div className="text-xs text-[var(--text-tertiary)] px-1">
                        <span className="font-medium text-[var(--text-secondary)]">Secondary: </span> 
                        {selectedExercise.secondaryMuscles.join(", ")}
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSearch;
