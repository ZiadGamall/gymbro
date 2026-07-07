import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardCheck,
  Dumbbell,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings2,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import axios from "axios";
import { parseUserResponse } from "../lib/healthApi";

const navVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

const menuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [me, setMe] = useState(null);
  const navigate = useNavigate();
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
        setMe(parseUserResponse(res));
      } catch {
        setMe(null);
      }
    };

    fetchMe();
  }, [location]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setMe(null);
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/food-search", label: "Foods", icon: Search },
    ...(isLoggedIn
      ? [
          { path: "/dashboard", label: "Today", icon: LayoutDashboard },
          { path: "/workouts", label: "Log Workout", icon: Dumbbell },
          { path: "/muscle-lab", label: "FitBot", icon: Sparkles },
          { path: "/splits", label: "Splits", icon: Layers },
          { path: "/progress", label: "Progress", icon: TrendingUp },
          { path: "/profile", label: "Profile", icon: User },
          { path: "/form-check", label: "Form Check", icon: ClipboardCheck },
          { path: "/sleep", label: "Recovery", icon: Moon },
          { path: "/onboarding", label: "Setup", icon: Settings2 },
        ]
      : []),
  ];

  const identityLabel = me?.firstName || me?.username || "Athlete";

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={navVariants}
      className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(7,17,29,0.72)] shadow-[var(--shadow-soft)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link to="/" className="flex items-center gap-3 sm:gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-[0_14px_34px_rgba(255,107,44,0.28)]">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div className="flex min-w-0 flex-col justify-center leading-tight">
                <div className="font-display whitespace-nowrap text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                  GymBro Lab
                </div>
                <div className="hidden items-center gap-1.5 pt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)] xl:flex">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                  Precision fitness OS
                </div>
              </div>
            </Link>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--accent)] text-white shadow-[0_14px_28px_rgba(255,107,44,0.24)]"
                      : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            {isLoggedIn ? (
              <>
                <Link
                  to="/account-settings"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:bg-white/10"
                >
                  <User className="h-4 w-4" />
                  Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:bg-white/5 hover:text-[var(--error)]"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary px-5 py-2.5 text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary px-5 py-2.5 text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--text-primary)] transition-colors duration-200 hover:bg-white/10 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={menuVariants}
              className="overflow-hidden border-t border-white/10 lg:hidden"
            >
              <div className="space-y-4 px-4 py-4 sm:px-5">
                <div className="grid gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
                          isActive
                            ? "bg-[var(--accent)] text-white"
                            : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-3">
                  {isLoggedIn ? (
                    <div className="space-y-3">
                      <div className="px-2 text-sm text-[var(--text-secondary)]">
                        Signed in as <span className="font-semibold text-[var(--text-primary)]">{identityLabel}</span>
                      </div>
                      <Link
                        to="/account-settings"
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:bg-white/10"
                      >
                        <User className="h-4 w-4" />
                        Account Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:bg-white/10 hover:text-[var(--error)]"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <Link to="/login" className="btn-secondary w-full py-3 text-sm">
                        Sign In
                      </Link>
                      <Link to="/register" className="btn-primary w-full py-3 text-sm">
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
