import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

/**
 * AnimatedInput — SmoothUI-style floating label input.
 *
 * The label starts centered inside the input (placeholder-like).
 * On focus or when a value is present it floats UP and sits ON the top
 * border of the input, just like a Material / SmoothUI outlined input.
 * The label has a background that matches the card surface so it visually
 * cuts through the border line.
 *
 * Props:
 *   label           string      — floating label text (required)
 *   type            string      — "text" | "email" | "password" … (default "text")
 *   name            string      — form field name
 *   id              string      — input id (auto-generated if omitted)
 *   value           string      — controlled value
 *   defaultValue    string      — uncontrolled default
 *   onChange        fn(event)   — full SyntheticEvent (compatible with handleChange)
 *   placeholder     string      — shown only when label is floating
 *   disabled        boolean
 *   required        boolean
 *   autoComplete    string
 *   icon            ReactNode   — 16px leading icon
 *   iconRight       ReactNode   — 16px trailing icon (show/hide password, etc.)
 *   onIconRightClick fn()
 *   iconRightLabel  string      — aria-label for trailing button
 *   cardBg          string      — CSS colour of the card the input sits on.
 *                                 Used as the floating-label background so it
 *                                 "cuts through" the input border.
 *                                 Defaults to "var(--surface)" (AuthLayout card).
 */

const LABEL_TRANSITION = {
  duration: 0.24,
  ease: [0.4, 0, 0.2, 1],
};

export default function AnimatedInput({
  label,
  type = "text",
  name,
  id,
  value,
  defaultValue = "",
  onChange,
  placeholder = "",
  disabled = false,
  required = false,
  autoComplete,
  icon,
  iconRight,
  onIconRightClick,
  iconRightLabel = "Toggle",
  cardBg = "var(--surface)",
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const val = isControlled ? value : internalValue;

  const inputRef = useRef(null);
  /* Generate a stable ID once — Math.random() in render would change on every re-render */
  const stableId = useRef(id || `ainput-${Math.random().toString(36).substring(2, 9)}`);
  const inputId  = stableId.current;

  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const isFloating = !!val || isFocused;

  const paddingLeft  = icon      ? 42 : 14;
  const paddingRight = iconRight ? 42 : 14;

  /* Border colour priority: focus > hover > rest */
  const borderColor = isFocused
    ? "var(--accent)"
    : isHovered
    ? "var(--text-tertiary)"
    : "var(--border)";

  /*
   * y = -24 moves the label from vertical-centre of the input (~50%)
   * up to sit on the top border edge.  scale + transformOrigin: "left"
   * shrinks rightward so it doesn't slide under the leading icon.
   */
  const labelFloatAnim = {
    y:     isFloating ? -24   : 0,
    scale: isFloating ? 0.82  : 1,
    color: isFloating
      ? (isFocused ? "var(--accent)" : "var(--text-secondary)")
      : "var(--text-tertiary)",
  };

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Leading icon */}
      {icon && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: isFocused ? "var(--accent)" : "var(--text-tertiary)",
            transition: "color 0.2s ease",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            zIndex: 3,
          }}
        >
          {icon}
        </span>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type={type}
        value={isControlled ? val : undefined}
        defaultValue={!isControlled ? defaultValue : undefined}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        aria-label={label}
        /* Placeholder only appears once the label has floated out of the way */
        placeholder={isFloating ? placeholder : ""}
        onFocus={() => setIsFocused(true)}
        onBlur={()  => setIsFocused(false)}
        onChange={(e) => {
          if (!isControlled) setInternalValue(e.target.value);
          onChange?.(e);
        }}
        style={{
          width: "100%",
          background: "var(--elevated)",
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          padding: `12px ${paddingRight}px 12px ${paddingLeft}px`,
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          color: "var(--text-primary)",
          outline: "none",
          transition: "border-color 0.18s ease",
          appearance: "none",
          WebkitAppearance: "none",
          display: "block",
        }}
      />

      {/* Floating label
          - starts at vertical centre of the input (top:50%, translateY(-50%))
          - Framer Motion adds y:-24 to push it onto the top border
          - background matches the card so it "cuts through" the border line
          - px: 4px padding so the background has a little breathing room
      */}
      <motion.label
        htmlFor={inputId}
        animate={shouldReduceMotion ? {} : labelFloatAnim}
        transition={LABEL_TRANSITION}
        style={{
          position: "absolute",
          left: paddingLeft,
          top: "50%",
          /* Base position: vertically centred. Framer Motion y stacks on top. */
          transform: "translateY(-50%)",
          transformOrigin: "left center",
          pointerEvents: "none",
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          lineHeight: 1,
          color: "var(--text-tertiary)",
          /* The background and padding are what make the label "cut" the border */
          background: cardBg,
          padding: "0 4px",
          borderRadius: 3,
          zIndex: 2,
          userSelect: "none",
          whiteSpace: "nowrap",
          /* Fallback for reduced-motion users */
          ...(shouldReduceMotion
            ? isFloating
              ? {
                  transform: "translateY(calc(-50% - 24px)) scale(0.82)",
                  color: isFocused ? "var(--accent)" : "var(--text-secondary)",
                }
              : {}
            : {}),
        }}
      >
        {label}
      </motion.label>

      {/* Trailing icon button (show/hide password, clear, etc.) */}
      {iconRight && (
        <button
          type="button"
          onClick={onIconRightClick}
          aria-label={iconRightLabel}
          tabIndex={-1}
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: isFocused ? "var(--text-secondary)" : "var(--text-tertiary)",
            display: "flex",
            alignItems: "center",
            padding: 0,
            zIndex: 3,
            transition: "color 0.15s ease",
          }}
        >
          {iconRight}
        </button>
      )}
    </div>
  );
}
