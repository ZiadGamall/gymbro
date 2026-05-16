const STORE_KEY = "gymbro.health.v1";

const defaultState = {
  onboarding: {
    completed: false,
    goal: "general_health",
    level: "beginner",
    activityDays: 3,
    dietPreference: "balanced",
    allergies: "",
    calorieTarget: 2200,
    proteinTarget: 120,
    carbsTarget: 250,
    fatTarget: 70,
  },
  nutrition: {
    entries: [],
  },
  workouts: {
    sessions: [],
  },
};

const nowIso = () => new Date().toISOString();
const todayDate = () => new Date().toISOString().slice(0, 10);

function parseOrDefault(raw) {
  if (!raw) return defaultState;
  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      onboarding: { ...defaultState.onboarding, ...(parsed.onboarding || {}) },
      nutrition: {
        ...defaultState.nutrition,
        ...(parsed.nutrition || {}),
        entries: Array.isArray(parsed?.nutrition?.entries)
          ? parsed.nutrition.entries
          : [],
      },
      workouts: {
        ...defaultState.workouts,
        ...(parsed.workouts || {}),
        sessions: Array.isArray(parsed?.workouts?.sessions)
          ? parsed.workouts.sessions
          : [],
      },
    };
  } catch {
    return defaultState;
  }
}

export function getHealthState() {
  return parseOrDefault(localStorage.getItem(STORE_KEY));
}

export function saveHealthState(nextState) {
  localStorage.setItem(STORE_KEY, JSON.stringify(nextState));
}

export function updateOnboarding(payload) {
  const state = getHealthState();
  const nextState = {
    ...state,
    onboarding: {
      ...state.onboarding,
      ...payload,
      completed: true,
      completedAt: nowIso(),
    },
  };
  saveHealthState(nextState);
  return nextState.onboarding;
}

export function addNutritionEntry(entry) {
  const state = getHealthState();
  const nextEntry = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    date: todayDate(),
    createdAt: nowIso(),
    mealType: entry.mealType || "snack",
    foodName: entry.foodName || "Unknown",
    calories: Number(entry.calories || 0),
    protein: Number(entry.protein || 0),
    carbs: Number(entry.carbs || 0),
    fat: Number(entry.fat || 0),
  };

  const nextState = {
    ...state,
    nutrition: {
      ...state.nutrition,
      entries: [nextEntry, ...state.nutrition.entries],
    },
  };

  saveHealthState(nextState);
  return nextEntry;
}

export function deleteNutritionEntry(id) {
  const state = getHealthState();
  const nextState = {
    ...state,
    nutrition: {
      ...state.nutrition,
      entries: state.nutrition.entries.filter((entry) => entry.id !== id),
    },
  };
  saveHealthState(nextState);
}

export function addWorkoutSession(session) {
  const state = getHealthState();
  const nextSession = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    date: todayDate(),
    createdAt: nowIso(),
    planName: session.planName || "General Session",
    durationMin: Number(session.durationMin || 30),
    intensity: session.intensity || "moderate",
    completed: Boolean(session.completed),
    notes: session.notes || "",
  };

  const nextState = {
    ...state,
    workouts: {
      ...state.workouts,
      sessions: [nextSession, ...state.workouts.sessions],
    },
  };

  saveHealthState(nextState);
  return nextSession;
}

export function toggleWorkoutCompleted(id) {
  const state = getHealthState();
  const nextState = {
    ...state,
    workouts: {
      ...state.workouts,
      sessions: state.workouts.sessions.map((session) =>
        session.id === id
          ? { ...session, completed: !session.completed }
          : session,
      ),
    },
  };
  saveHealthState(nextState);
}

export function deleteWorkoutSession(id) {
  const state = getHealthState();
  const nextState = {
    ...state,
    workouts: {
      ...state.workouts,
      sessions: state.workouts.sessions.filter((session) => session.id !== id),
    },
  };
  saveHealthState(nextState);
}

export function getTodayNutritionTotals() {
  const state = getHealthState();
  const date = todayDate();
  return state.nutrition.entries
    .filter((entry) => entry.date === date)
    .reduce(
      (acc, entry) => {
        acc.calories += Number(entry.calories || 0);
        acc.protein += Number(entry.protein || 0);
        acc.carbs += Number(entry.carbs || 0);
        acc.fat += Number(entry.fat || 0);
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
}

export function getWeeklyProgress() {
  const state = getHealthState();
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  return last7.map((date) => {
    const dayNutrition = state.nutrition.entries.filter((entry) => entry.date === date);
    const dayWorkouts = state.workouts.sessions.filter((session) => session.date === date);
    const calories = dayNutrition.reduce((sum, entry) => sum + Number(entry.calories || 0), 0);
    const completedWorkouts = dayWorkouts.filter((session) => session.completed).length;
    return { date, calories, workouts: completedWorkouts };
  });
}
