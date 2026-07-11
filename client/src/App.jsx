import { Routes, Route, useLocation } from "react-router-dom";

// ── Existing components / pages (untouched) ──────────────────────────────────
import Navbar           from "./components/Navbar";
import AICoach          from "./pages/AICoach";
import Login            from "./pages/Login";
import Register         from "./pages/Register";
import VerifySuccess    from "./pages/VerifySuccess";
import FoodSearch       from "./pages/FoodSearch";
import Dashboard        from "./pages/Dashboard";
import AccountSettings  from "./pages/AccountSettings";
import ChangePassword   from "./pages/ChangePassword";
import ForgotPassword   from "./pages/ForgotPassword";
import ResetPassword    from "./pages/ResetPassword";
import ResetToken       from "./pages/ResetToken";
import DeleteAccount    from "./pages/DeleteAccount";
import Home             from "./pages/Home";
import Onboarding       from "./pages/Onboarding";
import NutritionDiary   from "./pages/NutritionDiary";
import ProgressHub      from "./pages/ProgressHub";
import FormChecker      from "./pages/FormChecker";
import SplitsHub        from "./pages/SplitsHub";
import SleepRecovery    from "./pages/SleepRecovery";
import WorkoutLogger    from "./pages/WorkoutLogger";
import WorkoutBuilder   from "./pages/WorkoutBuilder";
import ProfileHub       from "./pages/ProfileHub";
import MuscleLab        from "./pages/MuscleLab";
import ExerciseSearch   from "./pages/ExerciseSearch";

// ── Day 2: new shell ──────────────────────────────────────────────────────────
import BottomTabBar from "./components/navigation/BottomTabBar";
import Today        from "./pages/Today";
import Train        from "./pages/Train";
import Eat          from "./pages/Eat";

// ── FitBot global assistant ───────────────────────────────────────────────────
import { FitBotProvider, FitBotLauncher } from "./components/fitbot/index";

// ── Route sets ───────────────────────────────────────────────────────────────

// New shell routes: show BottomTabBar, hide old Navbar.
const SHELL_ROUTES = new Set(["/today", "/train", "/eat", "/coach", "/progress"]);

// Routes where the old Navbar should be hidden.
const NAVBAR_HIDDEN_ROUTES = new Set([
  "/today", "/train", "/eat", "/coach", "/progress",
]);

// Auth routes — FitBot launcher not shown here.
const AUTH_ROUTES = new Set([
  "/login", "/register", "/verify-success",
  "/forgot-password", "/reset-password",
]);

function AppShell() {
  const { pathname } = useLocation();

  const isShell    = SHELL_ROUTES.has(pathname);
  const hideNavbar = NAVBAR_HIDDEN_ROUTES.has(pathname);
  const isAuth     = AUTH_ROUTES.has(pathname) || pathname.startsWith("/reset-token");

  return (
    <div
      className={["min-h-screen bg-canvas"].join(" ")}
    >
      {/* Legacy top nav — hidden on all new shell routes */}
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* ── Auth ─────────────────────────────────────────────────────── */}
        <Route path="/login"              element={<Login />}          />
        <Route path="/register"           element={<Register />}        />
        <Route path="/verify-success"     element={<VerifySuccess />}   />
        <Route path="/forgot-password"    element={<ForgotPassword />}  />
        <Route path="/reset-password"     element={<ResetPassword />}   />
        <Route path="/reset-token/:token" element={<ResetToken />}      />

        {/* ── Public ───────────────────────────────────────────────────── */}
        <Route path="/" element={<Home />} />

        {/* ── New shell routes ──────────────────────────────────────────── */}
        <Route path="/today"   element={<Today />}   />
        <Route path="/train"   element={<Train />}   />
        <Route path="/eat"     element={<Eat />}     />

        {/* ── FitBot Hub ────────────────────────────────────────────────── */}
        <Route path="/coach"   element={<AICoach />} />

        {/* ── Legacy routes ─────────────────────────────────────────────── */}
        <Route path="/dashboard"         element={<Dashboard />}       />
        <Route path="/workouts"          element={<WorkoutLogger />}   />
        <Route path="/workouts/build"    element={<WorkoutBuilder />}  />
        <Route path="/splits"            element={<SplitsHub />}       />
        <Route path="/form-check"        element={<FormChecker />}     />
        <Route path="/sleep"             element={<SleepRecovery />}   />
        <Route path="/profile"           element={<ProfileHub />}      />
        <Route path="/nutrition"         element={<NutritionDiary />}  />
        <Route path="/progress"          element={<ProgressHub />}     />
        <Route path="/muscle-lab"        element={<MuscleLab />}       />
        <Route path="/food-search"       element={<FoodSearch />}      />
        <Route path="/exercise-search"   element={<ExerciseSearch />}  />
        <Route path="/onboarding"        element={<Onboarding />}      />
        <Route path="/account-settings"  element={<AccountSettings />} />
        <Route path="/change-password"   element={<ChangePassword />}  />
        <Route path="/delete-account"    element={<DeleteAccount />}   />
      </Routes>

      {/* ── BottomTabBar — shell routes only ─────────────────────────── */}
      {isShell && <BottomTabBar />}

      {/* ── FitBot global launcher — hidden on auth pages ────────────── */}
      {!isAuth && <FitBotLauncher hasTabBar={isShell} />}
    </div>
  );
}

function App() {
  return (
    <FitBotProvider>
      <AppShell />
    </FitBotProvider>
  );
}

export default App;
