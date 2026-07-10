import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ClipboardCheck,
  Dumbbell,
  Home,
  Layers,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Search,
  Settings2,
  Sparkles,
  TrendingUp,
  User,
  Utensils,
  LayoutDashboard,
  X,
} from "lucide-react";
import { loadCurrentUser } from "../lib/healthApi";

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

const PRIMARY_NAV = [
  { path: "/", label: "Home", icon: Home, exact: true },
  { path: "/today", label: "Today", icon: LayoutDashboard },
  { path: "/train", label: "Train", icon: Dumbbell },
  { path: "/eat", label: "Eat", icon: Utensils },
  { path: "/progress", label: "Progress", icon: TrendingUp },
  { path: "/coach", label: "FitBot", icon: Sparkles, matchPrefix: "/coach" },
];

const MORE_NAV = [
  { path: "/splits", label: "Splits", icon: Layers },
  { path: "/workouts", label: "Log Workout", icon: Dumbbell, matchPrefix: "/workouts" },
  { path: "/form-check", label: "Form Check", icon: ClipboardCheck },
  { path: "/sleep", label: "Recovery", icon: Moon },
  { path: "/food-search", label: "Foods", icon: Search },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/onboarding", label: "Setup", icon: Settings2 },
];

const PUBLIC_NAV = [{ path: "/food-search", label: "Foods", icon: Search }];

function isActive(pathname, item) {
  if (item.exact || item.path === "/") return pathname === item.path;
  const base = item.matchPrefix || item.path;
  return pathname === base || pathname.startsWith(`${base}/`);
}

const navLinkClass = (active) =>
  [
    "relative inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold",
    "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(7,17,29,0.9)]",
    active
      ? "bg-[var(--accent)] text-white shadow-[0_14px_28px_rgba(255,107,44,0.24)]"
      : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]",
  ].join(" ");

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [me, setMe] = useState(null);
  const moreRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (!token) {
      setMe(null);
      return;
    }

    loadCurrentUser()
      .then(setMe)
      .catch(() => setMe(null));
  }, [location]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMoreOpen) return undefined;

    const onPointerDown = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsMoreOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMoreOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setMe(null);
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const identityLabel = me?.firstName || me?.username || "Athlete";
  const moreIsActive = MORE_NAV.some((item) => isActive(location.pathname, item));

  const renderNavLink = (item, onNavigate, fullWidth = false) => {
    const Icon = item.icon;
    const active = isActive(location.pathname, item);

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onNavigate}
        className={`${navLinkClass(active)} ${fullWidth ? "w-full" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="whitespace-nowrap">{item.label}</span>
      </Link>
    );
  };

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={navVariants}
      className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl rounded-[28px] border border-white/10 bg-[rgba(7,17,29,0.72)] shadow-[var(--shadow-soft)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-6">
          <Link
            to="/"
            className="flex min-w-0 shrink-0 items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-[0_14px_34px_rgba(255,107,44,0.28)]">
              <Dumbbell className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="hidden min-w-0 flex-col justify-center leading-tight sm:flex">
              <div className="font-display whitespace-nowrap text-lg font-bold text-[var(--text-primary)] sm:text-xl">
                GymBro Lab
              </div>
              <div className="hidden items-center gap-1.5 pt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)] xl:flex">
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                Precision fitness OS
              </div>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {isLoggedIn ? (
                <>
                  {PRIMARY_NAV.map((item) => renderNavLink(item))}
                  <div className="relative" ref={moreRef}>
                    <button
                      type="button"
                      onClick={() => setIsMoreOpen((open) => !open)}
                      className={navLinkClass(moreIsActive || isMoreOpen)}
                      aria-expanded={isMoreOpen}
                      aria-haspopup="menu"
                    >
                      <MoreHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
                      More
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isMoreOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>

                    <AnimatePresence>
                      {isMoreOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.18 }}
                          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[220px] rounded-2xl border border-white/10 bg-[rgba(10,20,34,0.96)] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                          role="menu"
                        >
                          {MORE_NAV.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(location.pathname, item);
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                role="menuitem"
                                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                                  active
                                    ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                                    : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                                }`}
                              >
                                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                {item.label}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                PUBLIC_NAV.map((item) => renderNavLink(item))
              )}
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            {isLoggedIn ? (
              <>
                <Link
                  to="/account-settings"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  Account
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:bg-white/5 hover:text-[var(--error)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary min-h-11 px-5 py-2.5 text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary min-h-11 px-5 py-2.5 text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--text-primary)] transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] lg:hidden"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
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
              <div className="max-h-[min(70vh,560px)] space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
                {isLoggedIn ? (
                  <>
                    <div>
                      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                        Main
                      </p>
                      <div className="grid gap-2">
                        {PRIMARY_NAV.map((item) => renderNavLink(item, undefined, true))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                        Tools
                      </p>
                      <div className="grid gap-2">
                        {MORE_NAV.map((item) => renderNavLink(item, undefined, true))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid gap-2">
                    <Link to="/" className={navLinkClass(location.pathname === "/")}>
                      <Home className="h-4 w-4" />
                      Home
                    </Link>
                    {PUBLIC_NAV.map((item) => renderNavLink(item))}
                  </div>
                )}

                <div className="rounded-[24px] border border-white/10 bg-white/5 p-3">
                  {isLoggedIn ? (
                    <div className="space-y-2">
                      <div className="px-2 py-1 text-sm text-[var(--text-secondary)]">
                        Signed in as{" "}
                        <span className="font-semibold text-[var(--text-primary)]">{identityLabel}</span>
                      </div>
                      <Link
                        to="/account-settings"
                        className="flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:bg-white/10"
                      >
                        <User className="h-4 w-4" />
                        Account Settings
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:bg-white/10 hover:text-[var(--error)]"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <Link to="/login" className="btn-secondary min-h-11 w-full py-3 text-sm">
                        Sign In
                      </Link>
                      <Link to="/register" className="btn-primary min-h-11 w-full py-3 text-sm">
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
