import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import AuthLayout from "../components/layout/AuthLayout";

const VerifySuccess = () => {
  return (
    <AuthLayout
      title="Account verified"
      subtitle="Your email has been verified and your account is now active."
    >
      {/* Success callout */}
      <div className="alert-success" style={{ marginBottom: 24, textAlign: "center" }}>
        <CheckCircle
          style={{
            display: "inline-block",
            width: 22,
            height: 22,
            marginBottom: 8,
            opacity: 0.9,
          }}
        />
        <p style={{ margin: 0, fontSize: 13.5 }}>
          You can now log in and access all features of GymBro.
        </p>
      </div>

      {/* CTA */}
      <Link
        to="/login"
        className="btn-filled"
        style={{
          display: "flex",
          width: "100%",
          fontSize: 15,
          padding: "13px 20px",
          textDecoration: "none",
          justifyContent: "center",
        }}
      >
        Continue to Login
        <ArrowRight style={{ width: 16, height: 16 }} />
      </Link>

      {/* Footer */}
      <p
        style={{
          marginTop: 22,
          textAlign: "center",
          fontFamily: "'Inter', sans-serif",
          fontSize: 13.5,
          color: "var(--text-secondary)",
        }}
      >
        Not ready yet?{" "}
        <Link
          to="/"
          style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
        >
          Back to Home
        </Link>
      </p>
    </AuthLayout>
  );
};

export default VerifySuccess;
