import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";

const VerifySuccess = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--accent)] rounded-2xl mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            Account Verified Successfully
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Your email has been verified and your account is now active.
          </p>
        </div>

        <div className="card">
          <div className="text-center space-y-6">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-green-400 text-sm">
                You can now log in and access all features of GymBro.
              </p>
            </div>

            <Link
              to="/login"
              className="btn-primary w-full text-lg flex items-center justify-center"
            >
              Continue to Login
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <div className="text-center">
              <p className="text-[var(--text-secondary)] text-sm">
                Not ready yet?{" "}
                <Link
                  to="/"
                  className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
                >
                  Back to Home
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifySuccess;
