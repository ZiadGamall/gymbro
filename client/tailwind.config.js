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
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        elevated: "var(--elevated)",
        border: "var(--border)",

        accent: "var(--accent)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",

        // Glass abstraction for light/dark theming
        "glass-bg": "var(--glass-bg)",
        "glass-border": "var(--glass-border)",

        // Text palette
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        inverse: "var(--text-inverse)",
      },

      // ── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      // ── Safe-area aware bottom spacing for the fixed tab bar ─────────────
      spacing: {
        "tab-bar": "72px",
      },

      // ── Override max-width to reduce gutters on large screens ────────────
      maxWidth: {
        "7xl": "1300px",
      },
    },
  },
  plugins: [],
};
