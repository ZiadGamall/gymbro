const viewButtonBase =
  "px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200";

const selectionPalette = [
  { fill: "#21c45d", stroke: "#179247" },
  { fill: "#0ea5e9", stroke: "#0b7bab" },
  { fill: "#f59e0b", stroke: "#b97709" },
  { fill: "#8b5cf6", stroke: "#6942bf" },
  { fill: "#ef4444", stroke: "#b63131" },
  { fill: "#14b8a6", stroke: "#0f8779" },
  { fill: "#ec4899", stroke: "#b93576" },
  { fill: "#84cc16", stroke: "#5f9511" },
];

const defaultMuscleFill = "#aeb9c6";
const defaultMuscleStroke = "#5f6f80";
const hoverMuscleFill = "#d3dbe5";
const hoverMuscleStroke = "#7b8c9f";

export default function MuscleDiagram({
  view,
  onViewChange,
  currentPaths,
  highlighted,
  selectedMuscles,
  hoveredMuscle,
  hoveredLabel,
  tooltip,
  onMuscleHover,
  onMuscleLeave,
  onMuscleToggle,
}) {
  return (
    <div className="relative rounded-2xl border border-[#2a3b4c] bg-[#111c26] p-4 md:p-6 min-h-[560px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Muscle Anatomy</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Front and back view with SVG muscle selection</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#304355] bg-[#162432] p-1.5">
          <button
            type="button"
            onClick={() => onViewChange("front")}
            className={`${viewButtonBase} ${
              view === "front"
                ? "bg-[#e11d48] text-white border-[#e11d48]"
                : "bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[#1d3041]"
            }`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => onViewChange("back")}
            className={`${viewButtonBase} ${
              view === "back"
                ? "bg-[#e11d48] text-white border-[#e11d48]"
                : "bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[#1d3041]"
            }`}
          >
            Back
          </button>
        </div>
      </div>

      <div className="relative flex items-center justify-center rounded-xl border border-[#304355] bg-[linear-gradient(180deg,#1a2b39_0%,#132330_100%)] p-2 md:p-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_42%)]" />
        <svg
          viewBox="0 0 660.46 1206.46"
          className="relative z-10 w-full max-w-[430px] h-auto"
          role="img"
          aria-label="Interactive muscle diagram"
          onMouseLeave={onMuscleLeave}
        >
          <rect x="0" y="0" width="660.46" height="1206.46" fill="none" />

          {currentPaths.map((musclePath) => {
            const state = highlighted[musclePath.id];
            const isHovered = Boolean(state?.isHovered);
            const isSelected = Boolean(state?.isSelected);
            const selectionIndex = selectedMuscles.indexOf(musclePath.group);
            const selectedColor = selectionIndex >= 0
              ? selectionPalette[selectionIndex % selectionPalette.length]
              : null;

            const fillColor = isSelected
              ? selectedColor.fill
              : isHovered
                ? hoverMuscleFill
                : defaultMuscleFill;
            const strokeColor = isSelected
              ? selectedColor.stroke
              : isHovered
                ? hoverMuscleStroke
                : defaultMuscleStroke;

            return (
              <path
                key={musclePath.id}
                d={musclePath.d}
                fill={fillColor}
                fillOpacity={isSelected ? 0.92 : isHovered ? 0.9 : 0.88}
                stroke={strokeColor}
                strokeWidth={1.5}
                strokeOpacity={0.95}
                className="cursor-pointer transition-all duration-200"
                onMouseMove={(event) => onMuscleHover(musclePath.group, event.clientX, event.clientY)}
                onMouseEnter={(event) => onMuscleHover(musclePath.group, event.clientX, event.clientY)}
                onClick={() => onMuscleToggle(musclePath.group)}
              />
            );
          })}
        </svg>
      </div>

      {tooltip.visible && hoveredMuscle && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg border border-[#4b5f73] bg-[#0f1822] text-xs text-[#f2f7fc] shadow-lg pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          {hoveredLabel}
        </div>
      )}
    </div>
  );
}
