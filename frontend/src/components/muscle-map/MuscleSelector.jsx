import { useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { FRONT_PATHS, BACK_PATHS, MUSCLE_DATA } from "../../data/muscleData";
import MuscleDiagram from "./MuscleDiagram";
import WorkoutPanel from "./WorkoutPanel";

function toHighlightMap(paths, hoveredMuscle, selectedMuscles) {
  const selectedSet = new Set(selectedMuscles);
  const highlighted = {};

  for (const path of paths) {
    highlighted[path.id] = {
      isHovered: hoveredMuscle === path.group,
      isSelected: selectedSet.has(path.group),
    };
  }

  return highlighted;
}

export default function MuscleSelector({ className = "" }) {
  const [view, setView] = useState("front");
  const [hoveredMuscle, setHoveredMuscle] = useState(null);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [recommendedMuscles, setRecommendedMuscles] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, visible: false });

  const currentPaths = view === "front" ? FRONT_PATHS : BACK_PATHS;

  const highlighted = useMemo(
    () => toHighlightMap(currentPaths, hoveredMuscle, selectedMuscles),
    [currentPaths, hoveredMuscle, selectedMuscles],
  );

  const workoutCards = useMemo(() => {
    if (recommendedMuscles.length === 0) return [];

    return recommendedMuscles.flatMap((muscle) =>
      (MUSCLE_DATA[muscle]?.exercises || []).map((exercise) => ({
        muscle,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
      })),
    );
  }, [recommendedMuscles]);

  const recommendationVideos = useMemo(() => {
    const map = new Map();

    for (const muscle of recommendedMuscles) {
      const videos = MUSCLE_DATA[muscle]?.videos || [];
      for (const video of videos) {
        if (!map.has(video.youtubeId)) {
          map.set(video.youtubeId, { ...video, muscle });
        }
      }
    }

    return Array.from(map.values()).slice(0, 12);
  }, [recommendedMuscles]);

  const toggleMuscle = (muscle) => {
    console.log("Selected muscle group:", MUSCLE_DATA[muscle]?.name || muscle);

    setSelectedMuscles((prev) => {
      if (prev.includes(muscle)) {
        return prev.filter((item) => item !== muscle);
      }
      return [...prev, muscle];
    });
  };

  const clearSelection = () => {
    setSelectedMuscles([]);
    setRecommendedMuscles([]);
  };

  const recommendWorkouts = () => {
    if (selectedMuscles.length === 0) return;
    setRecommendedMuscles([...selectedMuscles]);
    setPanelOpen(true);
  };

  return (
    <section
      className={`relative rounded-3xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-[0_28px_56px_rgba(0,0,0,0.35)] overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_0%,rgba(33,196,93,0.1),transparent_32%),radial-gradient(circle_at_100%_10%,rgba(11,155,213,0.08),transparent_28%)]" />

      <div className="relative z-10 p-5 md:p-7 border-b border-[#243444]">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Interactive Muscle Diagram</h2>
        <p className="text-[var(--text-secondary)] mt-1 text-sm md:text-base max-w-3xl">
          Click muscles to select or deselect. Workouts are generated only when you click Recommend Workout.
        </p>
      </div>

      <div className="relative z-10 p-4 md:p-8 grid lg:grid-cols-[1fr_320px] gap-5">
        <MuscleDiagram
          view={view}
          onViewChange={setView}
          currentPaths={currentPaths}
          highlighted={highlighted}
          selectedMuscles={selectedMuscles}
          hoveredMuscle={hoveredMuscle}
          hoveredLabel={hoveredMuscle ? MUSCLE_DATA[hoveredMuscle]?.name : ""}
          tooltip={tooltip}
          onMuscleHover={(muscle, x, y) => {
            setHoveredMuscle(muscle);
            setTooltip({ x, y, visible: true });
          }}
          onMuscleLeave={() => {
            setHoveredMuscle(null);
            setTooltip((prev) => ({ ...prev, visible: false }));
          }}
          onMuscleToggle={toggleMuscle}
        />

        <aside className="rounded-2xl border border-[#2a3a4a] bg-[#111c26] p-4 md:p-5 h-fit lg:sticky lg:top-6">
          <h3 className="text-[var(--text-primary)] font-semibold">Selected Muscles</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{selectedMuscles.length} selected</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedMuscles.length === 0 && (
              <span className="text-sm text-[var(--text-secondary)]">No muscles selected yet.</span>
            )}

            {selectedMuscles.map((muscle) => (
              <span
                key={muscle}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#3a1420] text-[#fecdd3] border border-[#7f1d35] inline-flex items-center gap-2"
              >
                {MUSCLE_DATA[muscle]?.name}
                <button
                  type="button"
                  className="text-[#fda4af] hover:text-[#ffe4e8]"
                  onClick={() => toggleMuscle(muscle)}
                  aria-label={`Remove ${MUSCLE_DATA[muscle]?.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={clearSelection}
            className="mt-4 w-full rounded-xl border border-[#3b4f63] px-4 py-3 text-sm font-medium text-[#d7e3ef] bg-[#172633] hover:bg-[#1f3344] transition-colors"
            disabled={selectedMuscles.length === 0}
          >
            Clear All
          </button>

          <button
            type="button"
            disabled={selectedMuscles.length === 0}
            onClick={recommendWorkouts}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#e11d48] px-4 py-3 text-sm font-semibold text-white hover:bg-[#be123c] shadow-[0_10px_20px_rgba(225,29,72,0.35)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Recommend Workout
            <ChevronRight className="w-4 h-4" />
          </button>
        </aside>
      </div>

      <WorkoutPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        recommendedMuscles={recommendedMuscles}
        workoutCards={workoutCards}
        recommendationVideos={recommendationVideos}
      />
    </section>
  );
}
