import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Zap, Flame, BarChart2, MessageCircle, AlertCircle, RotateCcw, X } from "lucide-react";
import { useFitBot } from "./FitBotContext";
import FitBotMessage from "./FitBotMessage";
import FitBotInput from "./FitBotInput";
import FitBotAvatar from "./FitBotAvatar";
import useFitBotMemory from "./useFitBotMemory";

const QUICK_ACTIONS = [
  { label: "Workout Advice", icon: Zap, prompt: "Give me a workout recommendation for today based on my fitness level." },
  { label: "Meal Plan", icon: Brain, prompt: "Can you suggest a meal plan for today to hit my nutrition goals?" },
  { label: "Calories Burned", icon: Flame, prompt: "Help me estimate how many calories I burned during my last workout." },
  { label: "Weekly Review", icon: BarChart2, prompt: "Give me a summary and review of my fitness progress this week." },
  { label: "Ask Anything", icon: MessageCircle, prompt: "What should I focus on today to reach my goals?" },
];

function TypingIndicator({ label = "FitBot is typing" }) {
  return (
    <motion.div
      className="fitbot-msg-row"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
      aria-live="polite"
      aria-label={label}
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

function ThinkingIndicator() {
  return (
    <motion.div
      className="fitbot-msg-row"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      aria-live="polite"
      aria-label="FitBot is thinking"
    >
      <div style={{ width: 28, flexShrink: 0 }}>
        <FitBotAvatar state="thinking" size="sm" showDot={false} />
      </div>
      <div className="fitbot-thinking">Analyzing your request…</div>
    </motion.div>
  );
}

function WelcomeState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fitbot-welcome"
    >
      <FitBotAvatar state="online" size="lg" showDot />
      <p className="fitbot-welcome-title">Hey, I&apos;m FitBot</p>
      <p className="fitbot-welcome-body">
        Your AI fitness coach. Ask about workouts, nutrition, splits, recovery, or form tips.
      </p>
    </motion.div>
  );
}

export default function FitBotChat() {
  const {
    messages,
    isTyping,
    isThinking,
    avatarState,
    error,
    sendQuickAction,
    clearMessages,
    dismissError,
  } = useFitBot();
  const { chips } = useFitBotMemory();
  const threadRef = useRef(null);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping, isThinking, error]);

  const lastBotIndex = messages.reduce(
    (last, m, i) => (m.role === "assistant" ? i : last),
    -1,
  );

  return (
    <>
      <div className="fitbot-memory" aria-label="FitBot context from your profile">
        <span className="fitbot-memory-label">Profile</span>
        {chips.length > 0 ? (
          chips.map((chip) => (
            <span key={chip} className="fitbot-memory-chip">{chip}</span>
          ))
        ) : (
          <span className="fitbot-memory-chip fitbot-memory-chip--muted">Complete onboarding for personalized context</span>
        )}
        {messages.length > 0 && (
          <button type="button" className="fitbot-clear-btn" onClick={clearMessages} aria-label="Clear conversation">
            <RotateCcw size={12} />
            Clear
          </button>
        )}
      </div>

      <div className="fitbot-quick-actions" aria-label="Quick actions">
        {QUICK_ACTIONS.map((qa) => {
          const Icon = qa.icon;
          return (
            <button
              key={qa.label}
              className="fitbot-qa-chip"
              onClick={() => qa.prompt && sendQuickAction(qa.prompt)}
              type="button"
            >
              <Icon size={12} strokeWidth={2} style={{ display: "inline", marginRight: 4 }} />
              {qa.label}
            </button>
          );
        })}
      </div>

      <div className="fitbot-thread" ref={threadRef}>
        {messages.length === 0 && !isTyping && !isThinking ? (
          <WelcomeState />
        ) : (
          <>
            {messages.map((msg, i) => (
              <FitBotMessage
                key={msg.id}
                message={msg}
                isLast={msg.role === "assistant" && i === lastBotIndex && !isTyping}
                avatarState={avatarState}
              />
            ))}

            <AnimatePresence>
              {isThinking && <ThinkingIndicator />}
              {isTyping && !isThinking && <TypingIndicator />}
            </AnimatePresence>
          </>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              className="fitbot-error-banner"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
            >
              <AlertCircle size={14} />
              <span style={{ flex: 1 }}>{error}</span>
              <button type="button" onClick={dismissError} aria-label="Dismiss error">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FitBotInput />
    </>
  );
}
