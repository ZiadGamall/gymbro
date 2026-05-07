import { ExternalLink } from "lucide-react";

export default function ExercisePanel({ selectedMuscles, onRemoveGroup }) {
  if (!selectedMuscles || selectedMuscles.length === 0) {
    return (
      <aside className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Muscle Exercises</h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Select muscle groups manually above or click muscle regions on the 3D model to load targeted exercises.
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Selected Muscle Groups</h3>
      <p className="mt-1 text-xs uppercase tracking-wider text-[var(--text-secondary)]">Targeted Exercise Protocol</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {selectedMuscles.map((muscle) => (
          <button
            key={muscle.group}
            type="button"
            onClick={() => onRemoveGroup?.(muscle.group)}
            className="px-2.5 py-1.5 rounded-lg text-xs border bg-[var(--accent)]/20 border-[var(--accent)]/60 text-[var(--text-primary)]"
          >
            {muscle.name} x
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-5">
        {selectedMuscles.map((muscle) => (
          <section key={muscle.name}>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{muscle.name}</h4>
            <div className="space-y-3">
              {muscle.exercises.map((exercise) => (
                <article
                  key={`${muscle.name}_${exercise.name}`}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4"
                >
                  <h5 className="text-sm font-semibold text-[var(--text-primary)]">{exercise.name}</h5>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{exercise.description}</p>
                  <a
                    href={exercise.video}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:text-white transition-colors"
                  >
                    Video Reference
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
