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
    <div className="page-shell">
      <div className="page-content max-w-7xl">
        <div className="mb-6">
          <h1 className="page-title">2D Muscle Intelligence Lab</h1>
          <p className="page-subtitle max-w-3xl">
            Interactive front/back muscle mapping for precise click-to-select planning and workout recommendations.
          </p>
        </div>

        <MuscleMap />
      </div>
    </div>
  );
}
