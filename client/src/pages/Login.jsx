import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { getApiError } from "../lib/healthApi";
import AuthLayout from "../components/layout/AuthLayout";
import AnimatedInput from "../components/ui/AnimatedInput";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await axios.post("/api/v1/users/login", formData);
      if (response.data.status === "success") {
        localStorage.setItem("token", response.data.token);
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err) {
      setError(getApiError(err, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your GymBro account"
    >
      {error   && <div className="alert-danger"  style={{ marginBottom: 20 }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: 20 }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <AnimatedInput
          label="Username"
          name="username"
          id="login-username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          placeholder="Enter your username"
          autoComplete="username"
          required
          disabled={loading}
          icon={<User size={16} />}
        />

        <AnimatedInput
          label="Password"
          name="password"
          id="login-password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          disabled={loading}
          icon={<Lock size={16} />}
          iconRight={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          onIconRightClick={() => setShowPassword(!showPassword)}
          iconRightLabel={showPassword ? "Hide password" : "Show password"}
        />

        {/* Forgot password link */}
        <div style={{ textAlign: "right", marginTop: -6 }}>
          <Link
            to="/forgot-password"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12.5,
              color: "var(--text-secondary)",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.target.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.target.style.color = "var(--text-secondary)")}
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-filled"
          style={{ width: "100%", marginTop: 4, fontSize: 15, padding: "13px 20px" }}
        >
          {loading ? <span className="spinner" /> : "Sign In"}
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
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
