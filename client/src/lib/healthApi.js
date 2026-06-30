import axios from "axios";
import { getHealthState, saveHealthState } from "./healthStore";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export async function loadOnboarding() {
  try {
    const res = await axios.get("/api/v1/onboarding", {
      headers: authHeaders(),
    });
    const onboarding = res?.data?.data?.onboarding;
    if (onboarding) {
      const local = getHealthState();
      saveHealthState({
        ...local,
        onboarding: {
          ...local.onboarding,
          ...onboarding,
          completed: true,
        },
      });
    }
    return onboarding || null;
  } catch {
    const local = getHealthState();
    return local.onboarding?.completed ? local.onboarding : null;
  }
}

export async function saveOnboarding(form) {
  const res = await axios.put("/api/v1/onboarding", form, {
    headers: authHeaders(),
  });
  const onboarding = res?.data?.data?.onboarding;
  const local = getHealthState();
  saveHealthState({
    ...local,
    onboarding: {
      ...local.onboarding,
      ...form,
      ...(onboarding || {}),
      completed: true,
    },
  });
  return onboarding;
}

export async function loadNutritionEntries(date) {
  const res = await axios.get("/api/v1/nutrition/entries", {
    params: { date },
    headers: authHeaders(),
  });
  return res?.data?.data?.entries || [];
}

export async function addNutritionEntryApi(payload) {
  const res = await axios.post("/api/v1/nutrition/entries", payload, {
    headers: authHeaders(),
  });
  return res?.data?.data?.entry;
}

export async function deleteNutritionEntryApi(id) {
  await axios.delete(`/api/v1/nutrition/entries/${id}`, {
    headers: authHeaders(),
  });
}

export async function loadNutritionSummary(date) {
  const res = await axios.get("/api/v1/nutrition/summary/today", {
    params: { date },
    headers: authHeaders(),
  });
  return res?.data?.data?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export async function loadWorkoutSessions(date) {
  const res = await axios.get("/api/v1/workouts/sessions", {
    params: { date },
    headers: authHeaders(),
  });
  return res?.data?.data?.sessions || [];
}

export async function addWorkoutSessionApi(payload) {
  const res = await axios.post("/api/v1/workouts/sessions", payload, {
    headers: authHeaders(),
  });
  return res?.data?.data?.session;
}

export async function toggleWorkoutSessionApi(id) {
  const res = await axios.patch(`/api/v1/workouts/sessions/${id}/toggle`, null, {
    headers: authHeaders(),
  });
  return res?.data?.data?.session;
}

export async function deleteWorkoutSessionApi(id) {
  await axios.delete(`/api/v1/workouts/sessions/${id}`, {
    headers: authHeaders(),
  });
}

export async function loadWeeklyProgress() {
  const res = await axios.get("/api/v1/workouts/progress/weekly", {
    headers: authHeaders(),
  });
  return res?.data?.data?.progress || [];
}

/* ─── FitBot AI ───────────────────────────────────────────────────────────── */

/**
 * Send a chat message to the FitBot AI.
 * @param {string} message - The user's message text.
 * @param {Array<{role:"user"|"assistant", content:string}>} history - Prior turns.
 * @returns {Promise<{reply: string}>}
 */
export async function sendFitBotMessage(message, history = []) {
  const res = await axios.post(
    "/api/v1/fitbot/chat",
    { message, history },
    { headers: authHeaders() }
  );
  return res?.data?.data || { reply: res?.data?.reply || "" };
}

/**
 * Estimate calories burned for a given activity.
 * All calculation logic lives on the backend.
 * @param {{ weight: number, height: number, age: number, gender: string, activity: string, duration: number }} payload
 * @returns {Promise<{ caloriesBurned: number, met: number, notes: string }>}
 */
export async function estimateCaloriesBurned(payload) {
  const res = await axios.post(
    "/api/v1/fitbot/calories",
    payload,
    { headers: authHeaders() }
  );
  return res?.data?.data || {};
}
