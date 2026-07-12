import axios from "axios";
import { getHealthState, saveHealthState } from "./healthStore";

const WORKOUT_SESSION_BASE = "/api/v1/workout-session";

/** Coalesce concurrent identical GET calls (e.g. Navbar + page mount). */
const inflight = new Map();

function dedupeInflight(key, fn) {
  if (inflight.has(key)) return inflight.get(key);
  const promise = fn().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

export const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Backend errors use `message`; legacy handlers may still send `msg`. */
export const getApiError = (err, fallback = "Request failed.") =>
  err?.response?.data?.message || err?.response?.data?.msg || fallback;

/** GET /users/me returns the user doc in `data`; login wraps it in `data.user`. */
export const parseUserResponse = (res) =>
  res?.data?.data?.user ?? res?.data?.data ?? null;

const normalizeSessionDate = (date) => {
  if (!date) return "";
  if (typeof date === "string") return date.slice(0, 10);
  return new Date(date).toISOString().slice(0, 10);
};

export const normalizeWorkoutSession = (session) => ({
  ...session,
  id: session._id || session.id,
  planName: session.workoutName || session.planName || "Workout",
  durationMin: session.duration ?? session.durationMin ?? 0,
  completed: true,
  intensity: session.intensity || "moderate",
  date: normalizeSessionDate(session.date),
});

const transformWorkoutPayload = (payload) => {
  if (payload.exercises?.length) {
    return {
      workoutId: payload.workoutId,
      workoutName: payload.workoutName || payload.planName,
      duration: payload.duration ?? payload.durationMin,
      date: payload.date,
      exercises: payload.exercises,
    };
  }

  return {
    workoutName: payload.planName || payload.workoutName || "Manual Workout",
    duration: Number(payload.durationMin ?? payload.duration ?? 30),
    date: payload.date,
    exercises: [
      {
        name: payload.planName || "General Training",
        sets: [{ setNumber: 1, weight: 0, reps: 1 }],
      },
    ],
  };
};

export async function loadOnboarding() {
  return dedupeInflight("onboarding", async () => {
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
  });
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

export async function searchFoodByName(name) {
  const res = await axios.post("/api/v1/food/search", { name });
  return res?.data?.data?.data || [];
}

export async function loadNutritionEntries(date) {
  const res = await axios.get("/api/v1/nutrition/entries", {
    params: { date },
    headers: authHeaders(),
  });
  const raw = res?.data?.data;
  const entries = Array.isArray(raw) ? raw : raw?.entries || [];
  return entries.map((entry) => ({
    ...entry,
    id: entry._id || entry.id,
  }));
}

export async function addNutritionEntryApi(payload) {
  const res = await axios.post("/api/v1/nutrition/entries", payload, {
    headers: authHeaders(),
  });
  const entry = res?.data?.data?.mealEntry || res?.data?.data?.entry;
  return entry ? { ...entry, id: entry._id || entry.id } : entry;
}

export async function deleteNutritionEntryApi(id) {
  await axios.delete(`/api/v1/nutrition/entries/${id}`, {
    headers: authHeaders(),
  });
}

export async function addCustomNutritionEntryApi(payload) {
  const res = await axios.post("/api/v1/nutrition/entries", payload, {
    headers: authHeaders(),
  });
  const entry = res?.data?.data?.mealEntry || res?.data?.data?.entry;
  return entry ? { ...entry, id: entry._id || entry.id } : entry;
}

export async function analyzeFoodImageApi(file) {
  const formData = new FormData();
  formData.append("image", file);
  const res = await axios.post("/api/v1/foodAnalysis/analyze-food", formData, {
    headers: {
      ...authHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res?.data?.data || null;
}

export async function loadNutritionSummary(date) {
  const res = await axios.get("/api/v1/nutrition/summary/today", {
    params: { date },
    headers: authHeaders(),
  });
  return (
    res?.data?.data?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export async function loadWorkoutSessions(date) {
  const res = await axios.get(`${WORKOUT_SESSION_BASE}/sessions`, {
    params: date ? { date } : {},
    headers: authHeaders(),
  });
  const raw = res?.data?.data;
  const sessions = Array.isArray(raw) ? raw : raw?.sessions || [];
  const normalized = sessions.map(normalizeWorkoutSession);
  if (date) {
    return normalized.filter((session) => session.date === date);
  }
  return normalized;
}

export async function addWorkoutSessionApi(payload) {
  const res = await axios.post(
    `${WORKOUT_SESSION_BASE}/sessions`,
    transformWorkoutPayload(payload),
    { headers: authHeaders() },
  );
  const session = res?.data?.data?.session;
  return session ? normalizeWorkoutSession(session) : session;
}

export async function deleteWorkoutSessionApi(id) {
  await axios.delete(`${WORKOUT_SESSION_BASE}/sessions/${id}`, {
    headers: authHeaders(),
  });
}

export async function loadWeeklyProgress() {
  const res = await axios.get(`${WORKOUT_SESSION_BASE}/progress/weekly`, {
    headers: authHeaders(),
  });
  return res?.data?.data?.progress || [];
}

/* ─── FitBot AI ───────────────────────────────────────────────────────────── */

/**
 * Send a chat message to the FitBot AI.
 * @param {string} message
 * @param {Array<{role:"user"|"assistant", content:string}>} history
 * @returns {Promise<{reply: string}>}
 */
export async function sendFitBotMessage(message, history = []) {
  const res = await axios.post(
    "/api/v1/fitbot/chat",
    { message, history },
    { headers: authHeaders() },
  );
  return { reply: res?.data?.reply || res?.data?.data?.reply || "" };
}

/**
 * Estimate calories burned via the ML calorie predictor service.
 * @param {{ weight: number, height: number, age: number, gender: string, duration: number, heart_rate?: number }} payload
 * @returns {Promise<{ caloriesBurned: number, unit?: string, notes?: string }>}
 */
export async function estimateCaloriesBurned(payload) {
  const heartRate = payload.heart_rate ?? payload.heartRate ?? 120;
  const res = await axios.post(
    "/api/v1/calories/predict",
    {
      gender: payload.gender,
      age: Number(payload.age),
      height: Number(payload.height),
      weight: Number(payload.weight),
      duration: Number(payload.duration),
      heart_rate: Number(heartRate),
    },
    { headers: authHeaders() },
  );
  const data = res?.data || {};
  return {
    caloriesBurned: data.calories_burned ?? data.caloriesBurned,
    unit: data.unit || "kcal",
    notes: `Estimated from ${payload.duration} min at ~${heartRate} bpm avg heart rate`,
  };
}

/* ─── Splits ──────────────────────────────────────────────────────────────── */

export async function loadAllSplits() {
  const res = await axios.get("/api/v1/split/");
  return res?.data?.data || [];
}

export async function loadSplitById(id) {
  const res = await axios.get(`/api/v1/split/${id}`);
  return res?.data?.data || null;
}

export async function loadSavedSplits() {
  const res = await axios.get("/api/v1/split/saved", {
    headers: authHeaders(),
  });
  return res?.data?.data?.savedSplits || [];
}

export async function saveSplitToProfile(id) {
  const res = await axios.post(`/api/v1/split/${id}/save`, null, {
    headers: authHeaders(),
  });
  return res?.data;
}

export async function setActiveSplit(splitId, startDayIndex = 0) {
  const res = await axios.post(
    "/api/v1/split/set-active",
    { splitId, startDayIndex },
    { headers: authHeaders() },
  );
  return res?.data;
}

export async function loadTodaySplitWorkout() {
  const res = await axios.get("/api/v1/split/today", {
    headers: authHeaders(),
  });
  const payload = res?.data?.data;
  return payload?.workout ? payload : null;
}

export async function advanceSplitDay() {
  const res = await axios.patch("/api/v1/split/advance-day", null, {
    headers: authHeaders(),
  });
  return res?.data;
}

/* ─── Workout templates ───────────────────────────────────────────────────── */

export async function loadMyWorkouts() {
  const res = await axios.get("/api/v1/workouts/my-workouts", {
    headers: authHeaders(),
  });
  return res?.data?.data?.workouts || [];
}

export async function createWorkoutTemplate(payload) {
  const res = await axios.post("/api/v1/workouts/create-workout", payload, {
    headers: authHeaders(),
  });
  return res?.data?.data?.workout;
}

/* ─── Exercises ───────────────────────────────────────────────────────────── */

export async function searchExercises(term) {
  const res = await axios.get("/api/v1/exercises/search", {
    params: { search: term },
    headers: authHeaders(),
  });
  return res?.data?.data?.exercises || [];
}

/* ─── Form check ──────────────────────────────────────────────────────────── */

export async function analyzeFormVideo(
  file,
  mode = "Beginner",
  exercise = "squats",
) {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("mode", mode);
  formData.append("exercise", exercise);
  const res = await axios.post("/api/v1/form-check/analyze", formData, {
    headers: {
      ...authHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res?.data?.data || null;
}

export async function loadFormCheckHistory() {
  const res = await axios.get("/api/v1/form-check/history", {
    headers: authHeaders(),
  });
  const raw = res?.data?.data;
  return Array.isArray(raw) ? raw : [];
}

export async function getFormCheckVideoUrl(recordId) {
  const res = await axios.get(`/api/v1/form-check/video-url/${recordId}`, {
    headers: authHeaders(),
  });
  return res?.data?.videoUrl || null;
}

/* ─── Recovery / sleep ────────────────────────────────────────────────────── */

export async function getRecoveryRecommendation(payload) {
  const res = await axios.post("/api/v1/status/daily-status", payload, {
    headers: authHeaders(),
  });
  return res?.data?.data || null;
}

/* ─── User profile ────────────────────────────────────────────────────────── */

export async function loadCurrentUser() {
  return dedupeInflight("users/me", async () => {
    const res = await axios.get("/api/v1/users/me", { headers: authHeaders() });
    return parseUserResponse(res);
  });
}

export async function updateUserAccount(formData) {
  const res = await axios.patch("/api/v1/users/update-account", formData, {
    headers: {
      ...authHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res?.data;
}
