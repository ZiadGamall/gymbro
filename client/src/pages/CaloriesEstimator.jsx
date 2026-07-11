import { CoachNavBar } from "../components/coach/CoachNavBar";
import { CoachContextBar } from "../components/coach/CoachContextBar";
import CaloriesBurnedCard from "../components/fitbot/CaloriesBurnedCard";

export default function CaloriesEstimator() {
  return (
    <div className="page-shell">
      <CoachNavBar />
      <CoachContextBar />

      <div className="page-content max-w-5xl !pt-4 !pb-6">
        <p className="section-title mb-1">AI Tools</p>
        <h1 className="page-title mb-6">Calories Burned Estimator</h1>
        
        <div className="max-w-xl">
          <CaloriesBurnedCard />
        </div>
      </div>
    </div>
  );
}
