import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { getApiError } from "../lib/healthApi";

const DeleteAccount = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmed) {
      setError("Please confirm that you understand this action cannot be undone.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      await axios.delete("/api/v1/users/delete-account", {
        headers: { Authorization: `Bearer ${token}` },
        data: formData,
      });
      setSuccess("Account deleted successfully. Redirecting…");
      localStorage.removeItem("token");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(getApiError(err, "Failed to delete account. Please check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-content max-w-md">
        <div className="card-surface p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--danger)]/15 border border-[var(--danger)]/25 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />
            </div>
            <div>
              <h1 className="page-title text-xl">Delete Account</h1>
              <p className="page-subtitle text-xs">This action is permanent</p>
            </div>
          </div>

          <div className="alert-danger mb-6">
            <p className="font-semibold text-sm mb-2">Warning: This cannot be undone</p>
            <p className="text-sm opacity-90 mb-2">
              Deleting your account permanently removes:
            </p>
            <ul className="text-sm opacity-90 list-disc list-inside space-y-1">
              <li>Profile and settings</li>
              <li>Workout history</li>
              <li>Nutrition logs</li>
              <li>Saved plans and splits</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="alert-danger">{error}</div>}
            {success && <div className="alert-success">{success}</div>}

            <div>
              <label htmlFor="email" className="field-label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field w-full mt-1.5"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field w-full pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="confirmed"
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[var(--border)] accent-[var(--danger)]"
              />
              <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
                I understand this action is permanent and I want to delete my account
              </span>
            </label>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/account-settings")}
                className="btn-ghost px-5 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !confirmed}
                className="btn-danger inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
