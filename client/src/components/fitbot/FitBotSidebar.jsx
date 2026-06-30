import { AnimatePresence, motion } from "framer-motion";
import { X, PanelRightClose } from "lucide-react";
import { useFitBot } from "./FitBotContext";
import FitBotAvatar from "./FitBotAvatar";
import FitBotChat from "./FitBotChat";

/**
 * FitBotSidebar — desktop persistent right sidebar (≥ 1200px).
 * Slides in from the right when isOpen === true.
 */
export default function FitBotSidebar() {
  const { isOpen, close, avatarState } = useFitBot();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          className="fitbot-sidebar"
          role="complementary"
          aria-label="FitBot assistant"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 32, stiffness: 280 }}
        >
          {/* Header */}
          <div className="fitbot-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FitBotAvatar state={avatarState} size="md" showDot />
              <div>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                  }}
                >
                  FitBot
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    marginTop: 2,
                    textTransform: "capitalize",
                  }}
                >
                  {avatarState === "online" ? "● Online" : avatarState}
                </p>
              </div>
            </div>

            <button
              onClick={close}
              title="Close FitBot"
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 8,
                cursor: "pointer",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--elevated)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              aria-label="Close FitBot sidebar"
            >
              <PanelRightClose size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Chat body — fills remaining height */}
          <FitBotChat />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
