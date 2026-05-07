import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifySuccess from "./pages/VerifySuccess";
import FoodSearch from "./pages/FoodSearch";
import Dashboard from "./pages/Dashboard";
import AccountSettings from "./pages/AccountSettings";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResetToken from "./pages/ResetToken";
import DeleteAccount from "./pages/DeleteAccount";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import NutritionDiary from "./pages/NutritionDiary";
import WorkoutPlanner from "./pages/WorkoutPlanner";
import ProgressHub from "./pages/ProgressHub";
import MuscleLab from "./pages/MuscleLab";

function App() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-success" element={<VerifySuccess />} />
        <Route path="/food-search" element={<FoodSearch />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/nutrition" element={<NutritionDiary />} />
        <Route path="/workouts" element={<WorkoutPlanner />} />
        <Route path="/progress" element={<ProgressHub />} />
        <Route path="/muscle-lab" element={<MuscleLab />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-token/:token" element={<ResetToken />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
      </Routes>
    </div>
  );
}

export default App;
