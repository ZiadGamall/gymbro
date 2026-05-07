import { useEffect, useMemo, useState } from "react";
import AnatomyModelViewer from "./AnatomyModelViewer";
import ExercisePanel from "./ExercisePanel";
import {
  MUSCLE_EXERCISE_MAP,
  MUSCLE_GROUP_OPTIONS,
  normalizeMeshName,
} from "../../data/anatomyExerciseMap";

const MODEL_URL = "/models/human-muscular-system.glb";
const ALIAS_STORAGE_KEY = "gymbro.anatomy.aliases.v1";

export default function AnatomyFitnessSystem() {
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [clickedMeshName, setClickedMeshName] = useState(null);
  const [clickedMeshTargetGroup, setClickedMeshTargetGroup] = useState("");
  const [isModelAvailable, setIsModelAvailable] = useState(true);
  const [modelCheckDone, setModelCheckDone] = useState(false);
  const [modelStats, setModelStats] = useState(null);
  const [customAliases, setCustomAliases] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(ALIAS_STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    let active = true;

    const checkModel = async () => {
      try {
        const response = await fetch(MODEL_URL, { method: "HEAD" });
        if (!active) return;
        setIsModelAvailable(response.ok);
      } catch {
        if (!active) return;
        setIsModelAvailable(false);
      } finally {
        if (active) setModelCheckDone(true);
      }
    };

    checkModel();

    return () => {
      active = false;
    };
  }, []);

  const selectedMuscles = useMemo(
    () =>
      selectedGroups
        .map((group) => {
          const muscle = MUSCLE_EXERCISE_MAP[group];
          if (!muscle) return null;
          return { group, ...muscle };
        })
        .filter(Boolean),
    [selectedGroups],
  );

  const unmatchedNames = modelStats?.unmatchedNames || [];

  const setAlias = (meshName, group) => {
    const normalized = normalizeMeshName(meshName);
    const next = {
      ...customAliases,
    };
    if (group) {
      next[normalized] = group;
    } else {
      delete next[normalized];
    }
    setCustomAliases(next);
    localStorage.setItem(ALIAS_STORAGE_KEY, JSON.stringify(next));
  };

  const clearAliases = () => {
    setCustomAliases({});
    localStorage.removeItem(ALIAS_STORAGE_KEY);
  };

  const toggleSelectedGroup = (group) => {
    if (!group) return;
    setSelectedGroups((prev) => {
      if (prev.includes(group)) {
        return prev.filter((item) => item !== group);
      }
      return [...prev, group];
    });
    setSelectedGroup(group);
  };

  const handleBodyArtClick = (payload) => {
    if (!payload) return;

    if (typeof payload === "string") {
      toggleSelectedGroup(payload);
      return;
    }

    if (payload.muscleGroup) {
      toggleSelectedGroup(payload.muscleGroup);
      return;
    }

    if (payload.meshName) {
      const normalized = normalizeMeshName(payload.meshName);
      const suggested = customAliases[normalized] || "";
      setClickedMeshName(payload.meshName);
      setClickedMeshTargetGroup(suggested);
    }
  };

  const mapClickedMeshAndSelect = () => {
    if (!clickedMeshName || !clickedMeshTargetGroup) return;
    setAlias(clickedMeshName, clickedMeshTargetGroup);
    toggleSelectedGroup(clickedMeshTargetGroup);
  };

  const clearSelectedGroups = () => {
    setSelectedGroups([]);
    setSelectedGroup(null);
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 md:p-5">
        <p className="text-sm text-[var(--text-secondary)]">
          3D anatomy viewer uses mesh-level interaction. Hover a muscle region to preview highlight, click to load targeted exercise recommendations.
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-2">
          Model source path: {MODEL_URL}
        </p>
        {modelCheckDone && !isModelAvailable && (
          <p className="mt-2 text-sm text-[#ffb1b1]">
            Missing model file. Add human-muscular-system.glb at frontend/public/models/human-muscular-system.glb.
          </p>
        )}
        {modelStats && modelStats.mappedMeshes === 0 && (
          <p className="mt-2 text-sm text-[#ffd8a8]">
            Model loaded but no anatomical mesh names were matched. Rename meshes with anatomy keywords (chest, deltoid, biceps, triceps, lat, trapezius, glute, quadriceps, hamstring, calf).
          </p>
        )}
        {unmatchedNames.length > 0 && (
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                Mesh Alias Mapper ({unmatchedNames.length} unmatched)
              </p>
              <button
                type="button"
                onClick={clearAliases}
                className="text-xs text-[var(--text-secondary)] hover:text-white"
              >
                Clear aliases
              </button>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {unmatchedNames.slice(0, 12).map((meshName) => {
                const key = normalizeMeshName(meshName);
                const value = customAliases[key] || "";
                return (
                  <label key={meshName} className="block">
                    <span className="block text-xs text-[var(--text-secondary)] truncate" title={meshName}>
                      {meshName}
                    </span>
                    <select
                      value={value}
                      onChange={(event) => setAlias(meshName, event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
                    >
                      <option value="">Map to muscle group...</option>
                      {MUSCLE_GROUP_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          </div>
        )}
        {hoveredGroup && (
          <p className="mt-2 text-sm text-[var(--text-primary)]">
            Hovering: {MUSCLE_EXERCISE_MAP[hoveredGroup]?.name || hoveredGroup}
          </p>
        )}

        {clickedMeshName && (
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3">
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Clicked body region</p>
            <p className="mt-1 text-sm text-[var(--text-primary)] truncate" title={clickedMeshName}>
              {clickedMeshName}
            </p>
            <div className="mt-2 flex flex-col md:flex-row gap-2">
              <select
                value={clickedMeshTargetGroup}
                onChange={(event) => setClickedMeshTargetGroup(event.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
              >
                <option value="">Choose muscle group for this clicked region...</option>
                {MUSCLE_GROUP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={mapClickedMeshAndSelect}
                disabled={!clickedMeshTargetGroup}
                className="px-3 py-1.5 rounded-lg text-xs border border-[var(--accent)]/60 bg-[var(--accent)]/20 text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Map and select
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Body Click Selection ({selectedGroups.length} selected)
            </p>
            <button
              type="button"
              onClick={clearSelectedGroups}
              className="text-xs text-[var(--text-secondary)] hover:text-white"
              disabled={selectedGroups.length === 0}
            >
              Clear selection
            </button>
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Select muscles by clicking directly on the body model. If a clicked area is unmapped,
            use the clicked region mapper above.
          </p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        {isModelAvailable ? (
          <AnatomyModelViewer
            modelUrl={MODEL_URL}
            hoveredGroup={hoveredGroup}
            selectedGroup={selectedGroup}
            onHover={setHoveredGroup}
            onLeave={() => setHoveredGroup(null)}
            onSelect={handleBodyArtClick}
            onModelReady={setModelStats}
            customAliases={customAliases}
          />
        ) : (
          <div className="h-[700px] rounded-2xl border border-[var(--border)] bg-[linear-gradient(165deg,#0f181f,#0a1116)] p-6 text-[var(--text-secondary)]">
            <p className="text-base text-[var(--text-primary)] font-semibold">3D anatomical model not found</p>
            <p className="mt-3 text-sm">Add the model file to enable the viewer:</p>
            <p className="mt-1 text-sm">frontend/public/models/human-muscular-system.glb</p>
          </div>
        )}

        <ExercisePanel selectedMuscles={selectedMuscles} onRemoveGroup={toggleSelectedGroup} />
      </div>
    </section>
  );
}
