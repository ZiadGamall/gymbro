import { motion } from "framer-motion";
import FitBotAvatar from "../fitbot/FitBotAvatar";

export function CoachNavBar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="coach-nav-bar"
    >
      <div className="flex items-center gap-3">
        <FitBotAvatar state="online" size="sm" showDot />
        <div>
          <div className="font-display text-base font-bold text-primary leading-tight tracking-tight">
            FitBot
          </div>
          <div className="font-body text-[11.5px] text-secondary font-medium">
            AI Coach
          </div>
        </div>
      </div>

      <span className="coach-nav-badge">Profile-aware</span>
    </motion.nav>
  );
}
