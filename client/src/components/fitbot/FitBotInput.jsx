import { useState, useRef, useCallback } from "react";
import { SendHorizonal } from "lucide-react";
import { useFitBot } from "./FitBotContext";

/**
 * FitBotInput — textarea + send button.
 * Submits on Enter (without Shift). Shift+Enter adds a newline.
 * Auto-grows up to 120px.
 */
export default function FitBotInput() {
  const { sendMessage, isTyping } = useFitBot();
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const canSend = value.trim().length > 0 && !isTyping;

  const submit = useCallback(() => {
    if (!canSend) return;
    sendMessage(value);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  }, [canSend, sendMessage, value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    /* Auto-grow */
    const el = textareaRef.current;
    if (el) {
      el.style.height = "40px";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="fitbot-input-bar">
      <textarea
        ref={textareaRef}
        className="fitbot-input"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask FitBot anything…"
        rows={1}
        disabled={isTyping}
        aria-label="Message FitBot"
      />
      <button
        className="fitbot-send-btn"
        onClick={submit}
        disabled={!canSend}
        aria-label="Send message"
        type="button"
      >
        <SendHorizonal size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
