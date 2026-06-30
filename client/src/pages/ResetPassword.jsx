import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import axios from "axios";
import { getApiError } from "../lib/healthApi";
import AuthLayout from "../components/layout/AuthLayout";
import AnimatedInput from "../components/ui/AnimatedInput";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.patch("/api/v1/users/reset-password", {
        password,
        passwordConfirm,
      });

      if (res?.data?.status === "success" && res?.data?.token) {
        localStorage.setItem("token", res.data.token);
      }

      setSuccess("Password reset successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      setError(getApiError(err, "Failed to reset password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Create a new password for your account"
    >
      {error   && <div className="alert-danger"  style={{ marginBottom: 20 }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: 20 }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <AnimatedInput
          label="New password"
          id="rp-password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter a new password"
          autoComplete="new-password"
          required
          disabled={loading}
          icon={<Lock size={16} />}
          iconRight={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          onIconRightClick={() => setShowPassword(!showPassword)}
          iconRightLabel={showPassword ? "Hide password" : "Show password"}
        />

        <AnimatedInput
          label="Confirm password"
          id="rp-confirm"
          type={showConfirm ? "text" : "password"}
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="Confirm your new password"
          autoComplete="new-password"
          required
          disabled={loading}
          icon={<Lock size={16} />}
          iconRight={showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          onIconRightClick={() => setShowConfirm(!showConfirm)}
          iconRightLabel={showConfirm ? "Hide confirm password" : "Show confirm password"}
        />

        <button
          type="submit"
          disabled={loading || !password || !passwordConfirm}
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
              Reset password
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
        Back to{" "}
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

export default ResetPassword;
