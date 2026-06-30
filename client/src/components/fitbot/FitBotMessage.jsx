import { motion } from "framer-motion";
import FitBotAvatar from "./FitBotAvatar";

/**
 * FitBotMessage — a single chat bubble.
 *
 * Props:
 *   message  — { id, role: "user"|"assistant", content, ts }
 *   isLast   — boolean, used to show avatar only on last bot message in a run
 *   avatarState — passed to FitBotAvatar for the bot
 */

const enterVariants = {
  hidden:  { opacity: 0, y: 8  },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
};

function Timestamp({ ts }) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return (
    <span
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 10,
        color: "var(--text-tertiary)",
        marginTop: 3,
        display: "block",
        textAlign: "inherit",
      }}
    >
      {hh}:{mm}
    </span>
  );
}

export default function FitBotMessage({ message, isLast = false, avatarState = "online" }) {
  const isBot = message.role === "assistant";

  if (isBot) {
    return (
      <motion.div
        className="fitbot-msg-row"
        variants={enterVariants}
        initial="hidden"
        animate="visible"
        layout
      >
        {/* Avatar — only visible on last consecutive bot message */}
        <div style={{ width: 28, flexShrink: 0 }}>
          {isLast && (
            <FitBotAvatar state={avatarState} size="sm" showDot={false} />
          )}
        </div>

        <div style={{ maxWidth: "82%" }}>
          <div className="fitbot-bubble fitbot-bubble--bot">
            {message.content}
          </div>
          <Timestamp ts={message.ts} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fitbot-msg-row fitbot-msg-row--user"
      variants={enterVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      <div style={{ maxWidth: "82%", textAlign: "right" }}>
        <div className="fitbot-bubble fitbot-bubble--user">
          {message.content}
        </div>
        <Timestamp ts={message.ts} />
      </div>
    </motion.div>
  );
}
