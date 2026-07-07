import { createContext, useContext, useReducer, useCallback } from "react";
import { sendFitBotMessage, getApiError } from "../../lib/healthApi";

const STORAGE_KEY = "gymbro.fitbot.history.v1";

const loadStoredMessages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const initialState = {
  isOpen: false,
  messages: loadStoredMessages(),
  isTyping: false,
  isThinking: false,
  error: null,
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
    case "ADD_MESSAGE": {
      const messages = [...state.messages, action.payload];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
      return { ...state, messages };
    }
    case "SET_TYPING":
      return {
        ...state,
        isTyping: action.payload,
        avatarState: action.payload ? "typing" : "online",
      };
    case "SET_THINKING":
      return {
        ...state,
        isThinking: action.payload,
        avatarState: action.payload ? "thinking" : state.isTyping ? "typing" : "online",
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, isTyping: false, isThinking: false, avatarState: "online" };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "CLEAR_MESSAGES":
      localStorage.removeItem(STORAGE_KEY);
      return { ...state, messages: [], error: null };
    default:
      return state;
  }
}

const FitBotContext = createContext(null);

export function FitBotProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const open = useCallback(() => dispatch({ type: "OPEN" }), []);
  const close = useCallback(() => dispatch({ type: "CLOSE" }), []);
  const toggle = useCallback(() => dispatch({ type: "TOGGLE" }), []);
  const clearMessages = useCallback(() => dispatch({ type: "CLEAR_MESSAGES" }), []);
  const dismissError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim()) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      ts: Date.now(),
    };
    dispatch({ type: "ADD_MESSAGE", payload: userMsg });
    dispatch({ type: "SET_THINKING", payload: true });
    dispatch({ type: "CLEAR_ERROR" });

    const history = state.messages
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    try {
      const data = await sendFitBotMessage(text.trim(), history);
      const reply = data?.reply || data?.message || "I'm here to help!";

      dispatch({ type: "SET_THINKING", payload: false });
      dispatch({ type: "SET_TYPING", payload: true });

      await new Promise((r) => setTimeout(r, 500));

      dispatch({ type: "SET_TYPING", payload: false });
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: `b-${Date.now()}`,
          role: "assistant",
          content: reply,
          ts: Date.now(),
        },
      });
    } catch (err) {
      dispatch({ type: "SET_THINKING", payload: false });
      dispatch({
        type: "SET_ERROR",
        payload: getApiError(err, "FitBot is unavailable right now."),
      });
    }
  }, [state.messages]);

  const sendQuickAction = useCallback(
    (prompt) => sendMessage(prompt),
    [sendMessage],
  );

  return (
    <FitBotContext.Provider
      value={{
        ...state,
        open,
        close,
        toggle,
        sendMessage,
        sendQuickAction,
        clearMessages,
        dismissError,
      }}
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
