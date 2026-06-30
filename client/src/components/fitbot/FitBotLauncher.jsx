import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X } from "lucide-react";
import { useFitBot } from "./FitBotContext";
import FitBotPanel from "./FitBotPanel";
import FitBotSidebar from "./FitBotSidebar";

const DESKTOP_BREAKPOINT = 1200;

/**
 * FitBotLauncher — the global entry point for FitBot.
 *
 * - On mobile (< 1200px): floating FAB bottom-right + slide-up panel.
 * - On desktop (≥ 1200px): floating FAB + persistent 380px sidebar.
 *
 * The FAB is not rendered while the desktop sidebar is open,
 * because the sidebar header has its own close button.
 */
export default function FitBotLauncher({ hasTabBar = false }) {
  const { isOpen, toggle } = useFitBot();
  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth >= DESKTOP_BREAKPOINT
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* Hide FAB on desktop when sidebar is open */
  const showFab = !(isDesktop && isOpen);

  return (
    <>
      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFab && (
          <motion.button
            className={`fitbot-launcher${hasTabBar ? "" : " fitbot-launcher--no-tab"}`}
            onClick={toggle}
            aria-label={isOpen ? "Close FitBot" : "Open FitBot"}
            aria-expanded={isOpen}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
          >
            {/* Pulse ring — only when closed */}
            {!isOpen && <span className="fitbot-pulse-ring" />}

            <motion.span
              key={isOpen ? "close" : "open"}
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {isOpen
                ? <X    size={22} color="#fff" strokeWidth={2.2} />
                : <Bot  size={22} color="#fff" strokeWidth={1.8} />
              }
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Surface ──────────────────────────────────────────────────────── */}
      {isDesktop ? <FitBotSidebar /> : <FitBotPanel />}
    </>
  );
}
