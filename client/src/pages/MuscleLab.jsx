import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MuscleMap from "../components/muscle-map/MuscleMap";

export default function MuscleLab() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8 md:px-6 md:py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">2D Muscle Intelligence Lab</h1>
          <p className="text-[var(--text-secondary)] mt-2 max-w-3xl">
            Interactive front/back muscle mapping for precise click-to-select planning and workout recommendations.
          </p>
        </div>

        <MuscleMap />
      </div>
    </div>
  );
}
