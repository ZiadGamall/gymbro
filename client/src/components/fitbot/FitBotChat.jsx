import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Zap, Flame, BarChart2, MessageCircle, AlertCircle } from "lucide-react";
import { useFitBot } from "./FitBotContext";
import FitBotMessage from "./FitBotMessage";
import FitBotInput from "./FitBotInput";
import FitBotAvatar from "./FitBotAvatar";

/* ─── Quick actions ─────────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: "Workout Advice",  icon: Zap,         prompt: "Give me a workout recommendation for today based on my fitness level." },
  { label: "Meal Plan",       icon: Brain,       prompt: "Can you suggest a meal plan for today to hit my nutrition goals?" },
  { label: "Calories Burned", icon: Flame,       prompt: "Help me estimate how many calories I burned during my last workout." },
  { label: "Weekly Review",   icon: BarChart2,   prompt: "Give me a summary and review of my fitness progress this week." },
  { label: "Ask Anything",    icon: MessageCircle, prompt: "" },
];

/* ─── Memory chips (mock data, clearly marked) ───────────────────────────── */
const MEMORY_CHIPS = [
  "🎯 Goal: Build muscle",
  "🏋️ 4× / week",
  "🥗 2,200 kcal target",
  "💤 ~7h sleep",
  "📅 Day 14 streak",
];

/* ─── Typing indicator ────────────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <motion.div
      className="fitbot-msg-row"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
    >
      <div style={{ width: 28, flexShrink: 0 }}>
        <FitBotAvatar state="typing" size="sm" showDot={false} />
      </div>
      <div className="fitbot-typing">
        <span /><span /><span />
      </div>
    </motion.div>
  );
}

/* ─── Empty / welcome state ──────────────────────────────────────────────── */
function WelcomeState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "24px 16px",
        textAlign: "center",
      }}
    >
      <FitBotAvatar state="online" size="lg" showDot />
      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginTop: 6,
        }}
      >
        Hey, I&apos;m FitBot
      </p>
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          maxWidth: 240,
        }}
      >
        Your AI fitness coach. Ask me about workouts, nutrition, recovery, or anything fitness-related.
      </p>
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function FitBotChat() {
  const { messages, isTyping, avatarState, error, sendQuickAction } = useFitBot();
  const threadRef = useRef(null);

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  const handleQuickAction = (action) => {
    if (action.prompt) {
      sendQuickAction(action.prompt);
    }
  };

  /* Determine last bot message index for avatar placement */
  const lastBotIndex = messages.reduce(
    (last, m, i) => (m.role === "assistant" ? i : last),
    -1
  );

  return (
    <>
      {/* ── Memory strip ─────────────────────────────────────────────────── */}
      <div className="fitbot-memory" aria-label="FitBot memory context">
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            flexShrink: 0,
          }}
        >
          Memory
        </span>
        {MEMORY_CHIPS.map((chip) => (
          <span key={chip} className="fitbot-memory-chip">{chip}</span>
        ))}
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <div className="fitbot-quick-actions" aria-label="Quick actions">
        {QUICK_ACTIONS.map((qa) => {
          const Icon = qa.icon;
          return (
            <button
              key={qa.label}
              className="fitbot-qa-chip"
              onClick={() => handleQuickAction(qa)}
              type="button"
            >
              <Icon size={12} strokeWidth={2} style={{ display: "inline", marginRight: 4 }} />
              {qa.label}
            </button>
          );
        })}
      </div>

      {/* ── Thread ────────────────────────────────────────────────────────── */}
      <div className="fitbot-thread" ref={threadRef}>
        {messages.length === 0 && !isTyping ? (
          <WelcomeState />
        ) : (
          <>
            {messages.map((msg, i) => (
              <FitBotMessage
                key={msg.id}
                message={msg}
                isLast={msg.role === "assistant" && i === lastBotIndex}
                avatarState={avatarState}
              />
            ))}

            {/* Typing / thinking indicator */}
            <AnimatePresence>
              {isTyping && <TypingIndicator />}
            </AnimatePresence>
          </>
        )}

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 12px",
                background: "var(--danger-subtle, rgba(224,80,104,0.08))",
                border: "1px solid var(--danger-border, rgba(224,80,104,0.25))",
                borderRadius: 8,
                fontFamily: "'Inter', sans-serif",
                fontSize: 12.5,
                color: "var(--danger)",
              }}
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <FitBotInput />
    </>
  );
}
