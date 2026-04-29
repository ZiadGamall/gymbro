import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Dumbbell,
  Search,
  Users,
  TrendingUp,
  ArrowRight,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";
import axios from "axios";

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [me, setMe] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (!token) {
      setMe(null);
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await axios.get("/api/v1/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMe(res?.data?.data?.user || null);
      } catch {
        setMe(null);
        setIsLoggedIn(false);
      }
    };

    fetchMe();
  }, [location]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-[var(--accent)] rounded-2xl flex items-center justify-center">
                <Dumbbell className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
              Transform Your
              <span className="block text-[var(--accent)]">
                Fitness Journey
              </span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto leading-relaxed">
              {isLoggedIn
                ? `Welcome back${me?.firstName ? `, ${me.firstName}` : ""}. Keep building momentum with your dashboard and tracking tools.`
                : "Track workouts, monitor nutrition, and achieve your health goals with powerful analytics and personalized insights."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/dashboard"
                    className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/food-search"
                    className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center"
                  >
                    Track Nutrition
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/login"
                    className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
              Everything You Need to
              <span className="text-[var(--accent)]"> Succeed</span>
            </h2>
            <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
              Comprehensive tools designed for fitness enthusiasts at every
              level
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-8 group hover:border-[var(--accent)]/50 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-center w-16 h-16 bg-[var(--accent)] rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Smart Food Search
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Access nutritional database with thousands of foods. Track
                calories, macros, and make informed dietary choices.
              </p>
              <Link
                to="/food-search"
                className="inline-flex items-center text-[var(--accent)] font-medium hover:text-[var(--accent-hover)] transition-colors duration-200"
              >
                {isLoggedIn ? "Track nutrition" : "Try Food Search"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-8 group hover:border-[var(--accent)]/50 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-center w-16 h-16 bg-[var(--accent)] rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                User Management
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Secure profile management with photo uploads, progress tracking,
                and personalized settings.
              </p>
              <Link
                to={isLoggedIn ? "/account-settings" : "/login"}
                className="inline-flex items-center text-[var(--accent)] font-medium hover:text-[var(--accent-hover)] transition-colors duration-200"
              >
                {isLoggedIn ? "Manage Account" : "Sign in to manage account"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-8 group hover:border-[var(--accent)]/50 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-center w-16 h-16 bg-[var(--accent)] rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Progress Analytics
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                Visualize your fitness journey with detailed analytics, charts,
                and achievement tracking.
              </p>
              <Link
                to={isLoggedIn ? "/dashboard" : "/login"}
                className="inline-flex items-center text-[var(--accent)] font-medium hover:text-[var(--accent-hover)] transition-colors duration-200"
              >
                {isLoggedIn ? "View Dashboard" : "Sign in to view dashboard"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
              Join the
              <span className="text-[var(--accent)]"> Fitness Community</span>
            </h2>
            <p className="text-xl text-[var(--text-secondary)]">
              Trusted by thousands of fitness enthusiasts worldwide
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-[var(--accent)] mb-2">
                50K+
              </div>
              <div className="text-[var(--text-secondary)] font-medium">
                Active Users
              </div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[var(--accent)] mb-2">
                1M+
              </div>
              <div className="text-[var(--text-secondary)] font-medium">
                Foods Tracked
              </div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[var(--accent)] mb-2">
                100K+
              </div>
              <div className="text-[var(--text-secondary)] font-medium">
                Workouts Logged
              </div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[var(--accent)] mb-2">
                4.9★
              </div>
              <div className="text-[var(--text-secondary)] font-medium">
                User Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--card-bg)] border border-[var(--border)] p-12 text-center relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] to-[#141414] opacity-50"></div>
            <div className="relative">
              <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
                {isLoggedIn ? (
                  <>
                    Keep Your
                    <span className="text-[var(--accent)]"> Streak Alive</span>
                  </>
                ) : (
                  <>
                    Ready to Transform Your
                    <span className="text-[var(--accent)]"> Fitness?</span>
                  </>
                )}
              </h2>
              <p className="text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                {isLoggedIn
                  ? "Jump back in—review your progress, update your goals, and keep tracking nutrition."
                  : "Start your journey today with powerful tools designed for results"}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center"
                    >
                      Open Dashboard
                      <Zap className="w-5 h-5 ml-2" />
                    </Link>
                    <Link
                      to="/account-settings"
                      className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center"
                    >
                      Account Settings
                      <Target className="w-5 h-5 ml-2" />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center"
                    >
                      Start Free Trial
                      <Zap className="w-5 h-5 ml-2" />
                    </Link>
                    <Link
                      to="/food-search"
                      className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center"
                    >
                      Explore Features
                      <Search className="w-5 h-5 ml-2" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--bg-primary)] border-t border-[var(--border)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center mr-3">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[var(--text-primary)]">
                GymBro
              </span>
            </div>
            <div className="text-[var(--text-secondary)] text-sm">
              © 2026 GymBro. Transform your fitness journey.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
