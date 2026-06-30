/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    relative: true,
    files: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  },
  theme: {
    extend: {
      // ── Space Observatory color palette ─────────────────────────────────
      // Values reference CSS custom properties defined in index.css.
      // Opacity modifiers (bg-canvas/50) require RGB channel variables —
      // add those in a future pass if needed.
      colors: {
        canvas:    "var(--canvas)",
        surface:   "var(--surface)",
        elevated:  "var(--elevated)",
        border:    "var(--border)",

        accent:    "var(--accent)",
        success:   "var(--success)",
        warning:   "var(--warning)",
        danger:    "var(--danger)",

        // Text palette — "primary" / "secondary" / "tertiary" are not
        // reserved Tailwind names, so text-primary / text-secondary etc.
        // generate correct color utilities.
        primary:   "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary:  "var(--text-tertiary)",
      },

      // ── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body:    ["Inter", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },

      // ── Safe-area aware bottom spacing for the fixed tab bar ─────────────
      spacing: {
        "tab-bar": "72px",
      },
    },
  },
  plugins: [],
};
