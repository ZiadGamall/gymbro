import { useEffect, useRef } from "react";

/*
  Geometry (fixed):
    Outer ring (calories) → radius 52, strokeWidth 8, circumference ≈ 327
    Inner ring (protein)  → radius 36, strokeWidth 7, circumference ≈ 226
    SVG viewport: 128 × 128, center: (64, 64)

  CSS classes in index.css own stroke-dasharray and stroke color.
  Only --ring-offset is dynamic and set via CSS custom property.
*/

const OUTER_R = 52;
const INNER_R = 36;
const OUTER_C = 2 * Math.PI * OUTER_R; // ≈ 326.73
const INNER_C = 2 * Math.PI * INNER_R; // ≈ 226.19
const SIZE    = 128;
const CX      = 64;
const CY      = 64;

const MacroRing = ({
  currentCalories = 0,
  targetCalories  = 2200,
  currentProtein  = 0,
  targetProtein   = 120,
}) => {
  const calArcRef  = useRef(null);
  const protArcRef = useRef(null);

  const calPercent  = Math.min(currentCalories / Math.max(targetCalories, 1), 1);
  const protPercent = Math.min(currentProtein  / Math.max(targetProtein,  1), 1);

  // Animate from 0 on mount
  useEffect(() => {
    const calOffset  = OUTER_C * (1 - calPercent);
    const protOffset = INNER_C * (1 - protPercent);

    // Start at full offset (no fill), then transition to actual value
    if (calArcRef.current) {
      calArcRef.current.style.setProperty("--ring-offset", String(OUTER_C));
      requestAnimationFrame(() => {
        calArcRef.current?.style.setProperty("--ring-offset", String(calOffset));
      });
    }
    if (protArcRef.current) {
      protArcRef.current.style.setProperty("--ring-offset", String(INNER_C));
      requestAnimationFrame(() => {
        protArcRef.current?.style.setProperty("--ring-offset", String(protOffset));
      });
    }
  }, [calPercent, protPercent]);

  const calRemaining  = Math.max(targetCalories  - currentCalories,  0);
  const protRemaining = Math.max(targetProtein   - currentProtein,   0);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG rings */}
      <div className="relative">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-label={`Calories: ${currentCalories} of ${targetCalories}. Protein: ${currentProtein}g of ${targetProtein}g.`}
          role="img"
        >
          <g transform={`rotate(-90 ${CX} ${CY})`}>
            {/* Outer track (calories background) */}
            <circle
              cx={CX} cy={CY} r={OUTER_R}
              className="macroring-track macroring-track-outer"
            />
            {/* Outer arc (calories progress) */}
            <circle
              ref={calArcRef}
              cx={CX} cy={CY} r={OUTER_R}
              className="macroring-arc macroring-arc-calories"
            />

            {/* Inner track (protein background) */}
            <circle
              cx={CX} cy={CY} r={INNER_R}
              className="macroring-track macroring-track-inner"
            />
            {/* Inner arc (protein progress) */}
            <circle
              ref={protArcRef}
              cx={CX} cy={CY} r={INNER_R}
              className="macroring-arc macroring-arc-protein"
            />
          </g>
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-mono text-[22px] font-bold text-primary leading-none">
            {currentCalories.toLocaleString()}
          </span>
          <span className="font-body text-[10px] text-tertiary mt-[2px] uppercase tracking-wider">
            kcal
          </span>
        </div>
      </div>

      {/* Macro stats row */}
      <div className="flex gap-6 justify-center">
        {/* Calories */}
        <div className="flex flex-col items-center gap-[2px]">
          <div className="flex items-center gap-[5px]">
            <span className="w-[8px] h-[8px] rounded-full bg-accent flex-shrink-0" />
            <span className="font-body text-[11px] text-secondary">Calories</span>
          </div>
          <span className="font-mono text-[13px] font-semibold text-primary">
            {calRemaining.toLocaleString()}
            <span className="font-body text-[10px] text-tertiary font-normal"> left</span>
          </span>
        </div>

        {/* Protein */}
        <div className="flex flex-col items-center gap-[2px]">
          <div className="flex items-center gap-[5px]">
            <span className="w-[8px] h-[8px] rounded-full bg-success flex-shrink-0" />
            <span className="font-body text-[11px] text-secondary">Protein</span>
          </div>
          <span className="font-mono text-[13px] font-semibold text-primary">
            {protRemaining}
            <span className="font-body text-[10px] text-tertiary font-normal">g left</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MacroRing;
