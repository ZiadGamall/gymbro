import { Sparkles, X } from "lucide-react";
import { MUSCLE_DATA, getVideoUrl, getYoutubeThumbnail } from "../../data/muscleData";

export default function WorkoutPanel({
  open,
  onClose,
  recommendedMuscles,
  workoutCards,
  recommendationVideos,
}) {
  return (
    <div
      className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className={`absolute right-0 top-0 h-full w-full sm:w-[560px] bg-[#0f1a24] border-l border-[#2b3e51] shadow-[0_24px_54px_rgba(0,0,0,0.45)] transition-all duration-400 ${
          open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <div className="h-full overflow-auto p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Recommendation</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                {recommendedMuscles.length > 0
                  ? `${recommendedMuscles.length} Muscle${recommendedMuscles.length > 1 ? "s" : ""} Selected`
                  : "Select muscles then click Recommend"}
              </h3>
            </div>
            <button
              type="button"
              className="w-10 h-10 rounded-xl border border-[#32475b] bg-[#152432] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={onClose}
              aria-label="Close workout recommendations"
            >
              <X className="w-5 h-5 mx-auto" />
            </button>
          </div>

          {recommendedMuscles.length > 0 ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {recommendedMuscles.map((muscle) => (
                  <span
                    key={muscle}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#3a1420] border border-[#7f1d35] text-[#fecdd3]"
                  >
                    {MUSCLE_DATA[muscle]?.name}
                  </span>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="text-sm uppercase tracking-wider text-[var(--text-secondary)] mb-3">Exercise Cards</h4>
                <div className="space-y-3">
                  {workoutCards.map((item, idx) => (
                    <article
                      key={`${item.muscle}_${item.name}_${idx}`}
                      className="rounded-2xl border border-[#32485d] bg-[#13212e] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[var(--text-primary)] text-sm font-semibold">{item.name}</p>
                        <span className="text-xs text-[var(--text-secondary)]">{MUSCLE_DATA[item.muscle]?.name}</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-2">{item.sets} sets · {item.reps} reps</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-[#32485d] bg-[#13212e] p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)] inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#e11d48]" />
                  Video Library
                </p>
                <div className="mt-3 space-y-3">
                  {recommendationVideos.map((video) => (
                    <a
                      key={`${video.youtubeId}_${video.muscle}`}
                      href={getVideoUrl(video)}
                      target="_blank"
                      rel="noreferrer"
                      className="group block rounded-2xl border border-[#2e4255] bg-[#101d29] overflow-hidden hover:border-[#fda4af] transition-all duration-300"
                    >
                      <div className="grid grid-cols-[120px_1fr]">
                        <img
                          src={getYoutubeThumbnail(video)}
                          alt={video.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <div className="p-3">
                          <p className="text-[var(--text-primary)] text-sm font-semibold leading-snug group-hover:text-[#fda4af] transition-colors">
                            {video.title}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {video.duration} · {MUSCLE_DATA[video.muscle]?.name}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="mt-6 text-[var(--text-secondary)]">Select one or more muscles, then click Recommend Workout.</p>
          )}
        </div>
      </div>
    </div>
  );
}
