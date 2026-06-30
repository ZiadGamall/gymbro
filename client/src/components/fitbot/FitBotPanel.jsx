import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useFitBot } from "./FitBotContext";
import FitBotAvatar from "./FitBotAvatar";
import FitBotChat from "./FitBotChat";

/**
 * FitBotPanel — mobile slide-up overlay.
 * Rendered when viewport < 1200px and isOpen === true.
 */
export default function FitBotPanel() {
  const { isOpen, close, avatarState } = useFitBot();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fitbot-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            className="fitbot-panel"
            role="dialog"
            aria-label="FitBot assistant"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Drag handle */}
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "var(--border)",
                margin: "10px auto 0",
                flexShrink: 0,
              }}
            />

            {/* Header */}
            <div className="fitbot-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FitBotAvatar state={avatarState} size="sm" showDot />
                <div>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      lineHeight: 1.2,
                    }}
                  >
                    FitBot
                  </p>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 11,
                      color: "var(--text-tertiary)",
                      marginTop: 1,
                      textTransform: "capitalize",
                    }}
                  >
                    {avatarState}
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                  borderRadius: 6,
                }}
                aria-label="Close FitBot"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Chat body */}
            <FitBotChat />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
