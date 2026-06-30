import { createContext, useContext, useReducer, useCallback } from "react";
import { sendFitBotMessage, getApiError } from "../../lib/healthApi";

/* ─── Shape ─────────────────────────────────────────────────────────────────
   message: { id, role: "user"|"assistant", content, ts }
   avatarState: "idle" | "thinking" | "typing" | "online"
────────────────────────────────────────────────────────────────────────────── */

const initialState = {
  isOpen:      false,
  messages:    [],
  isTyping:    false,
  error:       null,
  avatarState: "online",
};

function reducer(state, action) {
  switch (action.type) {
    case "OPEN":
      return { ...state, isOpen: true };
    case "CLOSE":
      return { ...state, isOpen: false };
    case "TOGGLE":
      return { ...state, isOpen: !state.isOpen };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "SET_TYPING":
      return {
        ...state,
        isTyping:    action.payload,
        avatarState: action.payload ? "typing" : "online",
      };
    case "SET_THINKING":
      return {
        ...state,
        isTyping:    action.payload,
        avatarState: action.payload ? "thinking" : "online",
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, isTyping: false, avatarState: "online" };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "CLEAR_MESSAGES":
      return { ...state, messages: [], error: null };
    default:
      return state;
  }
}

const FitBotContext = createContext(null);

export function FitBotProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const open    = useCallback(() => dispatch({ type: "OPEN" }),    []);
  const close   = useCallback(() => dispatch({ type: "CLOSE" }),   []);
  const toggle  = useCallback(() => dispatch({ type: "TOGGLE" }),  []);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim()) return;

    const userMsg = {
      id:      `u-${Date.now()}`,
      role:    "user",
      content: text.trim(),
      ts:      Date.now(),
    };
    dispatch({ type: "ADD_MESSAGE", payload: userMsg });
    dispatch({ type: "SET_THINKING", payload: true });
    dispatch({ type: "CLEAR_ERROR" });

    /* Build history array for the API (last 10 turns to keep payload small) */
    const history = state.messages
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    try {
      const data = await sendFitBotMessage(text.trim(), history);
      const reply = data?.reply || data?.message || "I'm here to help!";

      dispatch({ type: "SET_THINKING", payload: false });
      dispatch({ type: "SET_TYPING",   payload: true  });

      /* Simulate brief typing delay so the animation is visible */
      await new Promise((r) => setTimeout(r, 600));

      dispatch({ type: "SET_TYPING", payload: false });
      dispatch({
        type:    "ADD_MESSAGE",
        payload: {
          id:      `b-${Date.now()}`,
          role:    "assistant",
          content: reply,
          ts:      Date.now(),
        },
      });
    } catch (err) {
      dispatch({ type: "SET_THINKING", payload: false });
      dispatch({
        type:    "SET_ERROR",
        payload: getApiError(err, "FitBot is unavailable right now."),
      });
    }
  }, [state.messages]);

  /* Inject a quick-action prompt as if the user typed it */
  const sendQuickAction = useCallback(
    (prompt) => sendMessage(prompt),
    [sendMessage]
  );

  return (
    <FitBotContext.Provider
      value={{ ...state, open, close, toggle, sendMessage, sendQuickAction }}
    >
      {children}
    </FitBotContext.Provider>
  );
}

export function useFitBot() {
  const ctx = useContext(FitBotContext);
  if (!ctx) throw new Error("useFitBot must be used inside <FitBotProvider>");
  return ctx;
}
