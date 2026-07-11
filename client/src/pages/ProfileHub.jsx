import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Target,
  Dumbbell,
  Layers,
  Utensils,
  ClipboardList,
  Loader2,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  loadCurrentUser,
  loadMyWorkouts,
  loadOnboarding,
  loadNutritionEntries,
  loadSavedSplits,
  loadWorkoutSessions,
} from "../lib/healthApi";

const GOAL_LABELS = {
  general_health: "General health",
  weight_loss: "Weight loss",
  muscle_gain: "Build muscle",
  muscle_tone: "Muscle tone",
  endurance: "Endurance",
};

const ExerciseFoldable = ({ ex, isLog }) => {
  const [expanded, setExpanded] = useState(false);
  const details = ex.exerciseId?.instructionSteps ? ex.exerciseId : ex.exercise;
  const name = ex.exerciseId?.name || ex.exercise?.name || ex.exerciseName || ex.name || 'Exercise';

  return (
    <li className="text-[13px] text-secondary flex flex-col gap-1">
      <div 
        className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
        <span className="font-medium text-primary flex-1">{name}</span>
        {details && (
          <span className="text-tertiary hover:text-primary transition-colors p-1 rounded-md hover:bg-glass-bg">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </div>

      {expanded && details && (
        <div className="ml-3.5 pl-3 mt-1 mb-2 border-l border-[var(--accent)]/30 space-y-3 text-xs">
          <div className="flex flex-wrap gap-2">
            {details.bodyPart && <span className="px-2 py-0.5 bg-glass-bg rounded-md text-tertiary capitalize">Muscle: {details.bodyPart}</span>}
            {details.target && <span className="px-2 py-0.5 bg-glass-bg rounded-md text-tertiary capitalize">Target: {details.target}</span>}
            {details.equipment && <span className="px-2 py-0.5 bg-glass-bg rounded-md text-tertiary capitalize">Equipment: {details.equipment}</span>}
          </div>
          {details.gifUrl && (
            <div className="mt-2 mb-2 w-full max-w-[200px] overflow-hidden rounded-xl border border-glass-border">
              <img src={details.gifUrl} alt={name} className="w-full h-auto object-cover" loading="lazy" />
            </div>
          )}
          {details.instructionSteps && details.instructionSteps.length > 0 && (
            <ol className="list-decimal list-outside ml-4 space-y-1.5 text-tertiary leading-relaxed">
              {details.instructionSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Rendering Sets */}
      {!isLog && ex.sets && (
        <div className="ml-3.5 pl-2 border-l border-glass-border space-y-0.5 text-xs text-tertiary">
          {ex.sets} sets × {ex.repsPerSet || 0} reps
        </div>
      )}
      
      {isLog && ex.sets && ex.sets.length > 0 && (
        <div className="ml-3.5 pl-2 border-l border-glass-border space-y-0.5">
          {ex.sets.map((set, setIdx) => (
            <div key={setIdx} className="text-xs text-tertiary">
              Set {set.setNumber || setIdx + 1}: {set.reps || 0} reps {set.weight ? `@ ${set.weight}kg` : ''}
            </div>
          ))}
        </div>
      )}
    </li>
  );
};

const ProfileHub = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [splits, setSplits] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [meals, setMeals] = useState([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    Promise.all([
      loadCurrentUser(),
      loadOnboarding(),
      loadSavedSplits().catch(() => []),
      loadMyWorkouts().catch(() => []),
      loadWorkoutSessions().catch(() => []),
      loadNutritionEntries(today).catch(() => []),
    ])
      .then(([u, ob, sp, wo, se, me]) => {
        setUser(u);
        setOnboarding(ob);
        setSplits(sp);
        setWorkouts(wo);
        setSessions(se.slice(0, 20));
        setMeals(me);
      })
      .finally(() => setLoading(false));
  }, [navigate, today]);

  const tabs = [
    { id: "overview", label: "Overview", icon: Target },
    { id: "splits", label: "Splits", icon: Layers },
    { id: "workouts", label: "Workouts", icon: Dumbbell },
    { id: "logs", label: "Workout logs", icon: ClipboardList },
    { id: "meals", label: "Meals", icon: Utensils },
  ];

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-shell px-4 py-8 max-w-5xl mx-auto">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="section-title">Your fitness profile</p>
          <h1 className="font-display text-2xl font-bold text-primary">
            {user?.firstName || user?.username || "Athlete"}
          </h1>
          <p className="font-body text-sm text-secondary mt-1">{user?.email}</p>
        </div>
        <Link to="/account-settings" className="btn-ghost flex items-center gap-2">
          <Pencil className="w-4 h-4" /> Edit account
        </Link>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === id ? "bg-accent text-canvas" : "bg-elevated text-secondary hover:text-primary"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card-surface">
            <h2 className="font-display font-semibold text-primary mb-3">Goals & targets</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-tertiary">Overall goal</dt><dd className="text-primary capitalize">{GOAL_LABELS[onboarding?.goal] || (onboarding?.goal ? onboarding.goal.replace(/_/g, " ") : "—")}</dd></div>
              <div className="flex justify-between"><dt className="text-tertiary">Level</dt><dd className="text-primary capitalize">{onboarding?.level || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-tertiary">Calorie goal</dt><dd className="font-mono text-primary">{onboarding?.calorieTarget || "—"} kcal</dd></div>
              <div className="flex justify-between"><dt className="text-tertiary">Protein goal</dt><dd className="font-mono text-primary">{onboarding?.proteinTarget || "—"} g</dd></div>
              <div className="flex justify-between"><dt className="text-tertiary">Fat goal</dt><dd className="font-mono text-primary">{onboarding?.fatTarget || "—"} g</dd></div>
              <div className="flex justify-between"><dt className="text-tertiary">Limitations</dt><dd className="text-primary text-right max-w-[60%]">{onboarding?.limitations || "None"}</dd></div>
            </dl>
            <Link to="/onboarding" className="btn-ghost mt-4 inline-flex">Update onboarding →</Link>
          </div>
          <div className="card-surface">
            <h2 className="font-display font-semibold text-primary mb-3">Body metrics</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-tertiary">Height</dt><dd className="font-mono text-primary">{user?.height ? `${user.height} cm` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-tertiary">Weight</dt><dd className="font-mono text-primary">{user?.weight ? `${user.weight} kg` : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-tertiary">Gender</dt><dd className="text-primary capitalize">{user?.gender || "—"}</dd></div>
            </dl>
          </div>
        </div>
      )}

      {tab === "splits" && (
        <div className="space-y-3">
          {splits.length === 0 ? (
            <div className="card-surface empty-state">
              <Layers className="empty-state-icon" />
              <p className="empty-state-title">No saved splits</p>
              <Link to="/splits" className="btn-filled mt-3">Browse splits</Link>
            </div>
          ) : (
            splits.map((split) => (
              <Link key={split._id} to={`/splits?view=${split._id}`} className="session-row block hover:border-accent/40 transition-colors">
                <p className="font-medium text-primary">{split.program}</p>
                <p className="text-xs text-tertiary">{split.days?.length || 0} days</p>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "workouts" && (
        <div className="space-y-3">
          {workouts.length === 0 ? (
            <div className="card-surface empty-state">
              <Dumbbell className="empty-state-icon" />
              <p className="empty-state-title">No saved workouts</p>
              <Link to="/workouts/build" className="btn-filled mt-3">Build a workout</Link>
            </div>
          ) : (
            workouts.map((wo) => (
              <div key={wo._id} className="card-surface">
                <p className="font-medium text-primary">{wo.name}</p>
                <p className="text-xs text-tertiary mt-1 mb-2">
                  {wo.exercises?.length || wo.numberOfExercises || 0} exercises
                </p>
                {wo.exercises && wo.exercises.length > 0 && (
                  <ul className="mt-2 space-y-2 border-t border-glass-border pt-3">
                    {wo.exercises.map((ex, i) => (
                      <ExerciseFoldable key={i} ex={ex} isLog={false} />
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "logs" && (
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="card-surface empty-state">
              <ClipboardList className="empty-state-icon" />
              <p className="empty-state-title">No workout logs yet</p>
              <Link to="/workouts" className="btn-filled mt-3">Log a workout</Link>
            </div>
          ) : (
            sessions.map((s) => (
              <div key={s.id || s._id} className="session-row flex-col items-start gap-2">
                <div>
                  <p className="font-medium text-primary">{s.planName}</p>
                  <p className="text-xs text-tertiary">{s.date} · {s.durationMin} min</p>
                </div>
                {s.exercises && s.exercises.length > 0 && (
                  <ul className="w-full mt-2 space-y-2 border-t border-glass-border pt-3">
                    {s.exercises.map((ex, i) => (
                      <ExerciseFoldable key={i} ex={ex} isLog={true} />
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "meals" && (
        <div className="space-y-2">
          {meals.length === 0 ? (
            <div className="card-surface empty-state">
              <Utensils className="empty-state-icon" />
              <p className="empty-state-title">No meals logged today</p>
              <Link to="/nutrition" className="btn-filled mt-3">Log nutrition</Link>
            </div>
          ) : (
            meals.map((m) => (
              <div key={m.id || m._id} className="session-row">
                <div>
                  <p className="font-medium text-primary">{m.foodName}</p>
                  <p className="text-xs text-tertiary capitalize">{m.mealType}</p>
                </div>
                <span className="font-mono text-sm text-primary">{m.calories} kcal</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileHub;
