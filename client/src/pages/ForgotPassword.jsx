import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
import axios from "axios";
import AuthLayout from "../components/layout/AuthLayout";
import AnimatedInput from "../components/ui/AnimatedInput";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.post("/api/v1/users/forgot-password", { email });
      if (res?.data?.status === "success") {
        setSuccess("If an account exists for this email, a reset link has been sent.");
      } else {
        setSuccess("If an account exists for this email, a reset link has been sent.");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link"
    >
      {error   && <div className="alert-danger"  style={{ marginBottom: 20 }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: 20 }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <AnimatedInput
          label="Email address"
          id="fp-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={loading}
          icon={<Mail size={16} />}
        />

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="btn-filled"
          style={{
            width: "100%",
            fontSize: 15,
            padding: "13px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <span className="spinner" />
          ) : (
            <>
              Send reset link
              <ArrowRight size={16} strokeWidth={2} />
            </>
          )}
        </button>
      </form>

      <p
        style={{
          marginTop: 22,
          textAlign: "center",
          fontFamily: "'Inter', sans-serif",
          fontSize: 13.5,
          color: "var(--text-secondary)",
        }}
      >
        Remembered your password?{" "}
        <Link
          to="/login"
          style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
