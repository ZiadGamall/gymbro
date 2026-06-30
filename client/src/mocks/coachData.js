// ─── GymBro AI Coach — Mock Data & Design Tokens ────────────────────────────

export const C = {
  void:          '#0A0A0F',
  surface:       '#111118',
  elevated:      '#1A1A24',
  border:        '#242432',
  accent:        '#5B8AF0',
  success:       '#34C97A',
  warning:       '#F0A030',
  danger:        '#E05068',
  textPrimary:   '#F0F0F8',
  textSecondary: '#8888A8',
  textTertiary:  '#44445A',
};

export const mockUser = {
  name: 'Alex',
  streak: 14,
};

export const mockContextSnapshots = [
  {
    id: 'workout',
    icon: 'dumbbell',
    label: "Today's Workout",
    value: 'Pull Day · 8 exercises · ~55 min',
  },
  {
    id: 'calories',
    icon: 'flame',
    label: 'Calories Remaining',
    value: '620 kcal left today',
  },
  {
    id: 'protein',
    icon: 'zap',
    label: 'Protein Remaining',
    value: '42g protein to hit target',
  },
  {
    id: 'streak',
    icon: 'trending-up',
    label: '14-Day Streak',
    value: 'Personal best — keep going',
  },
];

export const mockDailyBrief = {
  greeting: 'Good evening, Alex.',
  focus: 'Pull Day — Back & Biceps',
  coachNote:
    'Your HRV is up 12% from yesterday. Your lats are primed for high-volume work. Sleep quality was solid at 87%.',
  recommendation:
    'Add one extra set to Romanian deadlifts today — your recovery capacity supports it.',
  timestamp: 'Updated 4 minutes ago',
};

export const mockFitnessScore = {
  composite: 74,
  delta: 3,
  trend: 'up',
  label: 'Building',
  summary: 'Strongest week in 6 weeks. Training consistency is the driver.',
  subscores: [
    { id: 'training',  label: 'Training',  value: 82, color: C.accent },
    { id: 'nutrition', label: 'Nutrition', value: 68, color: C.warning },
    { id: 'recovery',  label: 'Recovery',  value: 72, color: C.success },
  ],
};

export const mockInsight = {
  category: 'Nutrition Pattern',
  verdict: "You're under-protein on every rest day.",
  evidence:
    'Rest day average: 97g vs your 165g target. Training days average 162g — solid.',
  action:
    'Add a high-protein snack (30g) on rest days before 8 pm. Greek yogurt or cottage cheese works.',
};

export const mockQuickActions = [
  { id: 'review-workout',    label: 'Review Workout',    icon: 'dumbbell' },
  { id: 'fix-diet',          label: 'Fix Diet',          icon: 'utensils' },
  { id: 'analyze-progress',  label: 'Analyze Progress',  icon: 'trending-up' },
  { id: 'ask-fitbot',        label: 'Ask FitBot',        icon: 'message-circle', highlight: true },
];
