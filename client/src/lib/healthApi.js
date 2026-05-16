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
