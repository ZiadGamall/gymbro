import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { getApiError } from "../lib/healthApi";
import AuthLayout from "../components/layout/AuthLayout";
import AnimatedInput from "../components/ui/AnimatedInput";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    gender: "male",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (formData.password !== formData.passwordConfirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) formDataToSend.append(key, formData[key]);
    });

    try {
      const response = await axios.post("/api/v1/users/register", formDataToSend);
      if (response.data.status === "success") {
        setSuccess("Registration successful! Please check your email to verify your account.");
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (err) {
      setError(getApiError(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start your fitness journey with GymBro"
    >
      {error   && <div className="alert-danger"  style={{ marginBottom: 20 }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: 20 }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Name row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <AnimatedInput
            label="First name"
            name="firstName"
            id="reg-firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First"
            required
            disabled={loading}
          />
          <AnimatedInput
            label="Last name"
            name="lastName"
            id="reg-lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last"
            required
            disabled={loading}
          />
        </div>

        <AnimatedInput
          label="Username"
          name="username"
          id="reg-username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Choose a username"
          autoComplete="username"
          required
          disabled={loading}
          icon={<User size={16} />}
        />

        <AnimatedInput
          label="Email"
          name="email"
          id="reg-email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={loading}
          icon={<Mail size={16} />}
        />

        <div>
          <label
            htmlFor="reg-gender"
            style={{
              display: "block",
              fontFamily: "'Inter', sans-serif",
              fontSize: 12.5,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            Gender
          </label>
          <select
            id="reg-gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="input-field w-full"
            required
            disabled={loading}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <AnimatedInput
          label="Password"
          name="password"
          id="reg-password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
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
          name="passwordConfirm"
          id="reg-confirm"
          type={showConfirmPassword ? "text" : "password"}
          value={formData.passwordConfirm}
          onChange={handleChange}
          placeholder="Repeat your password"
          autoComplete="new-password"
          required
          disabled={loading}
          icon={<Lock size={16} />}
          iconRight={showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          onIconRightClick={() => setShowConfirmPassword(!showConfirmPassword)}
          iconRightLabel={showConfirmPassword ? "Hide password" : "Show password"}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-filled"
          style={{ width: "100%", marginTop: 4, fontSize: 15, padding: "13px 20px" }}
        >
          {loading ? <span className="spinner" /> : "Create Account"}
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
        Already have an account?{" "}
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

export default Register;
