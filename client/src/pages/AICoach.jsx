import { Link } from "react-router-dom";
import { Activity, Layers, Moon, ScanLine, User } from "lucide-react";
import { CoachNavBar } from "../components/coach/CoachNavBar";
import { CoachContextBar } from "../components/coach/CoachContextBar";
import CaloriesBurnedCard from "../components/fitbot/CaloriesBurnedCard";
import { useFitBot } from "../components/fitbot/FitBotContext";

const TOOLS = [
  { to: "/form-check", label: "Form Checker", icon: ScanLine, desc: "AI video analysis" },
  { to: "/splits", label: "Training Splits", icon: Layers, desc: "Browse & save programs" },
  { to: "/sleep", label: "Sleep & Recovery", icon: Moon, desc: "Wearable sync & readiness" },
  { to: "/profile", label: "My Profile", icon: User, desc: "Goals, logs & saved plans" },
];

export default function AICoach() {
  const { open, sendQuickAction } = useFitBot();

  return (
    <div className="page-shell">
      <CoachNavBar />
      <CoachContextBar />

      <div className="page-content max-w-5xl !pt-4 !pb-6">
        <p className="section-title mb-1">AI Coach</p>
        <h1 className="page-title mb-6">FitBot Hub</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card-surface sm:col-span-2">
            <p className="font-body text-sm text-secondary mb-3">
              Chat with FitBot for personalized workout, nutrition, and recovery guidance.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-filled" onClick={open}>Open FitBot Chat</button>
              <button type="button" className="btn-ghost" onClick={() => { open(); sendQuickAction("Give me today's workout recommendation."); }}>
                Today&apos;s workout
              </button>
              <button type="button" className="btn-ghost" onClick={() => { open(); sendQuickAction("Review my nutrition targets and suggest meals."); }}>
                Meal guidance
              </button>
            </div>
          </div>

          <CaloriesBurnedCard />

          {TOOLS.map(({ to, label, icon: Icon, desc }) => (
            <Link key={to} to={to} className="card-surface hover:border-accent/40 transition-colors group">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-elevated text-accent group-hover:bg-accent/10 shrink-0 transition-colors">
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="font-display font-semibold text-primary">{label}</p>
                  <p className="font-body text-xs text-secondary mt-0.5">{desc}</p>
                </div>
              </div>
            </Link>
          ))}

          <Link to="/workouts" className="card-surface hover:border-accent/40 transition-colors group">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-elevated text-accent group-hover:bg-accent/10 shrink-0 transition-colors">
                <Activity className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="font-display font-semibold text-primary">Log a workout session</p>
                <p className="font-body text-xs text-secondary mt-0.5">Track sets, reps, weight, and finish your session</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
