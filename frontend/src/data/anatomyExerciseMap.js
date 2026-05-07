export const MUSCLE_EXERCISE_MAP = {
  pectoralis_major: {
    name: "Pectoralis Major",
    exercises: [
      {
        name: "Barbell Bench Press",
        description: "Primary horizontal press for chest strength and mass.",
        video: "https://www.youtube.com/watch?v=SCVCLChPQFY",
      },
      {
        name: "Incline Dumbbell Press",
        description: "Upper-chest biased press with improved range of motion.",
        video: "https://www.youtube.com/watch?v=8iPEnn-ltC8",
      },
      {
        name: "Cable Fly",
        description: "Isolation movement for chest adduction and control.",
        video: "https://www.youtube.com/watch?v=eozdVDA78K0",
      },
    ],
  },
  deltoids: {
    name: "Deltoids",
    exercises: [
      {
        name: "Overhead Press",
        description: "Compound shoulder press targeting anterior and lateral delts.",
        video: "https://www.youtube.com/watch?v=2yjwXTZQDDI",
      },
      {
        name: "Lateral Raise",
        description: "Isolation movement for lateral deltoid width.",
        video: "https://www.youtube.com/watch?v=3VcKaXpzqRo",
      },
      {
        name: "Face Pull",
        description: "Rear-delt and scapular health movement.",
        video: "https://www.youtube.com/watch?v=eIq5CB9JfKE",
      },
    ],
  },
  biceps_brachii: {
    name: "Biceps Brachii",
    exercises: [
      {
        name: "Barbell Curl",
        description: "Primary elbow flexion movement for biceps hypertrophy.",
        video: "https://www.youtube.com/watch?v=kwG2ipFRgfo",
      },
      {
        name: "Incline Dumbbell Curl",
        description: "Lengthened biceps position emphasizing long-head tension.",
        video: "https://www.youtube.com/watch?v=soxrZlIl35U",
      },
      {
        name: "Hammer Curl",
        description: "Neutral-grip curl engaging brachialis and forearm flexors.",
        video: "https://www.youtube.com/watch?v=zC3nLlEvin4",
      },
    ],
  },
  triceps_brachii: {
    name: "Triceps Brachii",
    exercises: [
      {
        name: "Triceps Pushdown",
        description: "Cable extension for direct triceps overload.",
        video: "https://www.youtube.com/watch?v=2-LAMcpzODU",
      },
      {
        name: "Skull Crusher",
        description: "Lying extension for long-head triceps development.",
        video: "https://www.youtube.com/watch?v=d_KZxkY_0cM",
      },
      {
        name: "Close-Grip Bench Press",
        description: "Compound press emphasizing triceps lockout strength.",
        video: "https://www.youtube.com/watch?v=nEF0bv2FW94",
      },
    ],
  },
  forearms: {
    name: "Forearms",
    exercises: [
      {
        name: "Wrist Curl",
        description: "Flexor-focused forearm isolation exercise.",
        video: "https://www.youtube.com/watch?v=Ej4WzltO1DA",
      },
      {
        name: "Reverse Curl",
        description: "Targets brachioradialis and wrist extensors.",
        video: "https://www.youtube.com/watch?v=8dM5D2t2I3w",
      },
      {
        name: "Farmer Carry",
        description: "Grip endurance and loaded forearm strengthening.",
        video: "https://www.youtube.com/watch?v=Fkzk_RqlYig",
      },
    ],
  },
  rectus_abdominis: {
    name: "Rectus Abdominis",
    exercises: [
      {
        name: "Cable Crunch",
        description: "Weighted trunk flexion for abdominal hypertrophy.",
        video: "https://www.youtube.com/watch?v=AV5PmZJIrrw",
      },
      {
        name: "Reverse Crunch",
        description: "Lower-ab emphasis through controlled pelvic roll.",
        video: "https://www.youtube.com/watch?v=JB2oyawG9KI",
      },
      {
        name: "Hollow Hold",
        description: "Isometric core stability with full anterior-chain tension.",
        video: "https://www.youtube.com/watch?v=VhN4zLJf1VQ",
      },
    ],
  },
  obliques: {
    name: "External Obliques",
    exercises: [
      {
        name: "Cable Wood Chop",
        description: "Rotational core work for oblique strength.",
        video: "https://www.youtube.com/watch?v=Y6h6qkNf5HE",
      },
      {
        name: "Side Plank",
        description: "Anti-lateral-flexion core stability movement.",
        video: "https://www.youtube.com/watch?v=K2VljzCC16g",
      },
      {
        name: "Landmine Rotation",
        description: "Dynamic anti-rotation and transverse plane control.",
        video: "https://www.youtube.com/watch?v=0fKBhvDjuy0",
      },
    ],
  },
  latissimus_dorsi: {
    name: "Latissimus Dorsi",
    exercises: [
      {
        name: "Lat Pulldown",
        description: "Vertical pull targeting lat width and control.",
        video: "https://www.youtube.com/watch?v=CAwf7n6Luuc",
      },
      {
        name: "Pull-Up",
        description: "Bodyweight vertical pull for lats and upper back.",
        video: "https://www.youtube.com/watch?v=eGo4IYlbE5g",
      },
      {
        name: "Single-Arm Cable Row",
        description: "Unilateral pull emphasizing lat contraction.",
        video: "https://www.youtube.com/watch?v=4R6g5gd0f4Q",
      },
    ],
  },
  trapezius: {
    name: "Trapezius",
    exercises: [
      {
        name: "Barbell Shrug",
        description: "Upper-trap overload for scapular elevation strength.",
        video: "https://www.youtube.com/watch?v=Y6m6A6X3Gf0",
      },
      {
        name: "Face Pull",
        description: "Mid/upper trap and posterior shoulder control.",
        video: "https://www.youtube.com/watch?v=eIq5CB9JfKE",
      },
      {
        name: "Trap-3 Raise",
        description: "Lower-trap activation and shoulder stability.",
        video: "https://www.youtube.com/watch?v=3MXMMBfQ8G0",
      },
    ],
  },
  erector_spinae: {
    name: "Erector Spinae",
    exercises: [
      {
        name: "Romanian Deadlift",
        description: "Posterior-chain hinge for spinal erectors and hamstrings.",
        video: "https://www.youtube.com/watch?v=jEy_czb3RKA",
      },
      {
        name: "Back Extension",
        description: "Trunk extension focused lower-back training.",
        video: "https://www.youtube.com/watch?v=ph3pddpKzzw",
      },
      {
        name: "Good Morning",
        description: "Hip hinge and lumbar endurance strengthening.",
        video: "https://www.youtube.com/watch?v=vKPGe8zb2S4",
      },
    ],
  },
  gluteus_maximus: {
    name: "Gluteus Maximus",
    exercises: [
      {
        name: "Barbell Hip Thrust",
        description: "Top-tier glute hypertrophy exercise with high peak tension.",
        video: "https://www.youtube.com/watch?v=LM8XHLYJoYs",
      },
      {
        name: "Bulgarian Split Squat",
        description: "Unilateral lower-body movement with strong glute loading.",
        video: "https://www.youtube.com/watch?v=2C-uNgKwPLE",
      },
      {
        name: "Glute Bridge",
        description: "Hip extension pattern for glute activation and control.",
        video: "https://www.youtube.com/watch?v=wPM8icPu6H8",
      },
    ],
  },
  quadriceps: {
    name: "Quadriceps",
    exercises: [
      {
        name: "Back Squat",
        description: "Primary squat pattern for quad strength and hypertrophy.",
        video: "https://www.youtube.com/watch?v=ultWZbUMPL8",
      },
      {
        name: "Leg Press",
        description: "Machine-based knee extension dominant compound.",
        video: "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
      },
      {
        name: "Walking Lunge",
        description: "Dynamic unilateral leg movement with quad emphasis.",
        video: "https://www.youtube.com/watch?v=wrwwXE_x-pQ",
      },
    ],
  },
  hamstrings: {
    name: "Hamstrings",
    exercises: [
      {
        name: "Romanian Deadlift",
        description: "Hip hinge movement for hamstring lengthened loading.",
        video: "https://www.youtube.com/watch?v=jEy_czb3RKA",
      },
      {
        name: "Seated Leg Curl",
        description: "Isolated knee flexion targeting hamstring fibers.",
        video: "https://www.youtube.com/watch?v=1Tq3QdYUuHs",
      },
      {
        name: "Nordic Curl",
        description: "Eccentric-focused hamstring strength exercise.",
        video: "https://www.youtube.com/watch?v=Qpghu4_P4fQ",
      },
    ],
  },
  gastrocnemius: {
    name: "Gastrocnemius / Calves",
    exercises: [
      {
        name: "Standing Calf Raise",
        description: "Primary calf hypertrophy movement with full stretch.",
        video: "https://www.youtube.com/watch?v=YMmgqO8Jo-k",
      },
      {
        name: "Seated Calf Raise",
        description: "Soleus-biased calf training variation.",
        video: "https://www.youtube.com/watch?v=JbyjNymZOt0",
      },
      {
        name: "Single-Leg Calf Raise",
        description: "Unilateral calf strength and balance training.",
        video: "https://www.youtube.com/watch?v=Yj3Q9w_7Rk4",
      },
    ],
  },
};

export const MUSCLE_KEYWORDS = {
  pectoralis_major: ["pectoral", "chest", "pec"],
  deltoids: ["deltoid", "shoulder"],
  biceps_brachii: ["bicep", "biceps"],
  triceps_brachii: ["tricep", "triceps"],
  forearms: ["forearm", "brachioradialis", "wrist"],
  rectus_abdominis: ["rectus", "abs", "abdom", "abdominal"],
  obliques: ["oblique"],
  latissimus_dorsi: ["lat", "latissimus"],
  trapezius: ["trap", "trapezius"],
  erector_spinae: ["erector", "spinae", "lowerback", "lumbar"],
  gluteus_maximus: ["glute", "gluteus"],
  quadriceps: ["quad", "quadriceps"],
  hamstrings: ["hamstring", "bicepsfemoris", "semitendinosus"],
  gastrocnemius: ["calf", "gastrocnemius", "soleus"],
};

export const MUSCLE_GROUP_OPTIONS = Object.entries(MUSCLE_EXERCISE_MAP).map(([value, item]) => ({
  value,
  label: item.name,
}));

export function normalizeMeshName(meshName) {
  return String(meshName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function detectMuscleGroup(meshName, customAliases = {}) {
  const normalized = normalizeMeshName(meshName);

  if (customAliases[normalized]) {
    return customAliases[normalized];
  }

  const entries = Object.entries(MUSCLE_KEYWORDS);

  for (const [group, keywords] of entries) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return group;
    }
  }

  return null;
}
