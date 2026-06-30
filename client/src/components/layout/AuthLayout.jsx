/**
 * AuthLayout — shared shell for every auth screen.
 *
 * Props:
 *   title    (string) — page heading
 *   subtitle (string) — optional subheading below title
 *   children — form content
 */

const GymBroMark = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Abstract geometric mark — four quadrant grid */}
    <rect x="3"  y="3"  width="9" height="9" rx="2.5" fill="#5B8AF0" opacity="0.9" />
    <rect x="16" y="3"  width="9" height="9" rx="2.5" fill="#5B8AF0" opacity="0.5" />
    <rect x="3"  y="16" width="9" height="9" rx="2.5" fill="#5B8AF0" opacity="0.5" />
    <rect x="16" y="16" width="9" height="9" rx="2.5" fill="#5B8AF0" opacity="0.25" />
  </svg>
);

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div
      style={{
        minHeight: "100dvh",
        backgroundColor: "var(--canvas)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Brand mark + heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {/* Icon mark */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: "rgba(91, 138, 240, 0.08)",
              border: "1px solid rgba(91, 138, 240, 0.2)",
              marginBottom: 20,
            }}
          >
            <GymBroMark />
          </div>

          {/* Wordmark */}
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: 12,
            }}
          >
            GymBro
          </div>

          {/* Page title */}
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              margin: "0 0 8px",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Surface card */}
        <div className="card-surface">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
