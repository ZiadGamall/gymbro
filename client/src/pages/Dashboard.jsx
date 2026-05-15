import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  Calendar,
  ClipboardCheck,
  Dumbbell,
  Flame,
  Salad,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import axios from 'axios'
import { getPhase2State, getWeeklyProgress } from '../lib/phase2Store'
import {
  loadNutritionSummary,
  loadOnboarding,
  loadWorkoutSessions,
  loadWeeklyProgress,
} from '../lib/phase2Api'

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
}

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value))

const getDayLabel = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [phase2, setPhase2] = useState(getPhase2State())
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [completedToday, setCompletedToday] = useState(0)
  const [weeklyData, setWeeklyData] = useState([])
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login')
          return
        }

        const response = await axios.get('/api/v1/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.data.status === 'success') {
          setUser(response.data.data.user)
        } else {
          navigate('/login')
        }
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [navigate])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const fetchPhase2 = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const [onboarding, todayTotals, todayWorkouts, weeklyProgress] = await Promise.all([
          loadOnboarding(),
          loadNutritionSummary(today),
          loadWorkoutSessions(today),
          loadWeeklyProgress(),
        ])

        setTotals(todayTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 })
        setCompletedToday(
          (todayWorkouts || []).filter((session) => Boolean(session.completed)).length,
        )

        const normalizedWeekly = Array.isArray(weeklyProgress)
          ? weeklyProgress.map((item) => ({
              date: item.date,
              calories: Number(item.calories || item.totalCalories || 0),
              workouts: Number(item.workouts || item.completedWorkouts || 0),
            }))
          : []

        setWeeklyData(normalizedWeekly.length ? normalizedWeekly : getWeeklyProgress())

        if (onboarding) {
          setPhase2((prev) => ({
            ...prev,
            onboarding: {
              ...prev.onboarding,
              ...onboarding,
              completed: true,
            },
          }))
        }
      } catch {
        setPhase2(getPhase2State())
        setWeeklyData(getWeeklyProgress())
      }
    }

    fetchPhase2()
  }, [])

  const onboardingDone = Boolean(phase2.onboarding.completed)
  const calorieTarget = Number(phase2.onboarding.calorieTarget || 1)
  const proteinTarget = Number(phase2.onboarding.proteinTarget || 1)
  const caloriesPercent = clamp(Math.round((Number(totals.calories || 0) / calorieTarget) * 100))
  const proteinPercent = clamp(Math.round((Number(totals.protein || 0) / proteinTarget) * 100))
  const workoutPercent = clamp(
    Math.round((completedToday / Math.max(phase2.onboarding.activityDays || 1, 1)) * 100),
  )
  const readinessScore = clamp(Math.round((caloriesPercent + proteinPercent + workoutPercent) / 3))

  const streak = useMemo(() => {
    if (!Array.isArray(weeklyData) || weeklyData.length === 0) return 0
    let count = 0
    for (let i = weeklyData.length - 1; i >= 0; i -= 1) {
      if (Number(weeklyData[i].workouts || 0) > 0) count += 1
      else break
    }
    return count
  }, [weeklyData])

  const maxCaloriesInWeek = useMemo(() => {
    if (!weeklyData.length) return 1
    return Math.max(...weeklyData.map((item) => Number(item.calories || 0)), 1)
  }, [weeklyData])

  const dashboardCards = [
    {
      title: 'Readiness Score',
      value: `${readinessScore}%`,
      hint: 'AI based daily readiness',
      icon: Brain,
      tone: 'text-[var(--neon-blue)]',
    },
    {
      title: 'Calories Today',
      value: `${Math.round(totals.calories)}`,
      hint: `Target ${calorieTarget} kcal`,
      icon: Flame,
      tone: 'text-orange-400',
    },
    {
      title: 'Protein Today',
      value: `${Math.round(totals.protein)}g`,
      hint: `Target ${proteinTarget}g`,
      icon: Target,
      tone: 'text-[var(--neon-green)]',
    },
    {
      title: 'Current Streak',
      value: `${streak}d`,
      hint: 'Consecutive active days',
      icon: Trophy,
      tone: 'text-yellow-400',
    },
  ]

  const quickActions = [
    {
      title: 'Plan Setup',
      desc: 'Refine goals, split, and macro targets.',
      href: '/onboarding',
      icon: ClipboardCheck,
      accent: 'from-[var(--neon-blue)] to-[#3b82f6]',
    },
    {
      title: 'Nutrition Diary',
      desc: 'Track meals and macro timing precisely.',
      href: '/nutrition',
      icon: Salad,
      accent: 'from-[var(--neon-green)] to-[#22c55e]',
    },
    {
      title: 'Workout Planner',
      desc: 'Schedule sessions and mark execution.',
      href: '/workouts',
      icon: Activity,
      accent: 'from-orange-400 to-red-400',
    },
  ]

  const recommendations = [
    {
      title: onboardingDone ? 'Onboarding profile calibrated' : 'Complete onboarding calibration',
      detail: onboardingDone
        ? 'Your baseline is active and daily targets are synchronized.'
        : 'Set your goal, level, and constraints to unlock better AI guidance.',
      done: onboardingDone,
    },
    {
      title: caloriesPercent >= 80 ? 'Calorie adherence on pace' : 'Increase calorie intake to target',
      detail: `Current adherence is ${caloriesPercent}%. Aim for 90-105% range.`,
      done: caloriesPercent >= 80,
    },
    {
      title: completedToday > 0 ? 'Workout execution confirmed' : 'No completed workout detected',
      detail:
        completedToday > 0
          ? `${completedToday} session(s) completed today.`
          : 'Start one focused session to preserve your streak momentum.',
      done: completedToday > 0,
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading command center...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-cinematic-grid opacity-25" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-cinematic-noise opacity-35" aria-hidden="true" />

      <motion.div
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.section variants={fadeUp} className="card-glass-premium rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] sm:text-sm">
                <Sparkles className="h-4 w-4 text-[var(--neon-blue)]" />
                AI Command Center
              </div>
              <h1 className="mt-5 font-display text-4xl font-bold text-white sm:text-5xl">
                Welcome back, {user.firstName || user.username || 'Athlete'}
              </h1>
              <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
                Your training, nutrition, and progress loops are consolidated into one high-clarity dashboard.
              </p>
            </div>

            <div className="card-neon flex items-center gap-6 rounded-[1.4rem] p-5">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Daily readiness</div>
                <div className="mt-2 text-4xl font-bold text-white">{readinessScore}%</div>
              </div>
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(var(--neon-blue) ${readinessScore}%, rgba(255,255,255,0.12) ${readinessScore}% 100%)`,
                }}
                aria-label={`Daily readiness ${readinessScore} percent`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#091422] text-sm font-semibold text-white">
                  {readinessScore}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section variants={stagger} className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {dashboardCards.map((card) => {
            const Icon = card.icon
            return (
              <motion.article key={card.title} variants={fadeUp} className="card-neon rounded-[1.5rem] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{card.title}</span>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <Icon className={`h-5 w-5 ${card.tone}`} />
                  </div>
                </div>
                <div className="mt-4 text-4xl font-bold text-white">{card.value}</div>
                <div className="mt-2 text-sm text-[var(--text-tertiary)]">{card.hint}</div>
              </motion.article>
            )
          })}
        </motion.section>

        <motion.section variants={stagger} className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.article variants={fadeUp} className="card-glass-premium rounded-[1.8rem] p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-white">Weekly Performance</h2>
              <Link to="/progress" className="inline-flex items-center text-sm font-semibold text-[var(--neon-blue)]">
                Open Progress Hub
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-3" role="img" aria-label="Weekly calorie and workout chart">
              {weeklyData.map((day) => {
                const caloriesHeight = Math.max(8, Math.round((Number(day.calories || 0) / maxCaloriesInWeek) * 120))
                const workoutHeight = Math.max(8, Number(day.workouts || 0) * 22)
                return (
                  <div key={`${day.date}_${day.calories}`} className="flex flex-col items-center gap-2">
                    <div className="flex h-40 w-full items-end justify-center gap-1 rounded-xl border border-white/10 bg-white/5 p-2">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: reduceMotion ? caloriesHeight : caloriesHeight }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="w-2.5 rounded-full bg-gradient-to-t from-[var(--neon-blue)] to-[#89f4ff]"
                        title={`Calories ${Math.round(day.calories || 0)}`}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: reduceMotion ? workoutHeight : workoutHeight }}
                        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.08 }}
                        className="w-2.5 rounded-full bg-gradient-to-t from-[var(--neon-green)] to-[#90ffcf]"
                        title={`Workouts ${Math.round(day.workouts || 0)}`}
                      />
                    </div>
                    <span className="text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">{getDayLabel(day.date)}</span>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex items-center gap-5 text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--neon-blue)]" />
                Calories
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--neon-green)]" />
                Workouts
              </span>
            </div>
          </motion.article>

          <motion.article variants={fadeUp} className="card-neon rounded-[1.8rem] p-6 sm:p-7">
            <h2 className="font-display text-2xl font-semibold text-white">AI Recommendations</h2>
            <div className="mt-5 space-y-4">
              {recommendations.map((item) => (
                <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{item.title}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs uppercase tracking-[0.1em] ${
                        item.done
                          ? 'border border-[var(--neon-green)]/30 bg-[var(--neon-green)]/10 text-[var(--neon-green)]'
                          : 'border border-orange-400/30 bg-orange-500/10 text-orange-300'
                      }`}
                    >
                      {item.done ? 'On track' : 'Action'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.detail}</p>
                </div>
              ))}
            </div>

            <Link to="/workouts" className="btn-neon-primary mt-6 w-full py-3.5">
              Run AI Workout Flow
              <Zap className="ml-2 h-4 w-4" />
            </Link>
          </motion.article>
        </motion.section>

        <motion.section variants={stagger} className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <motion.article variants={fadeUp} className="card-glass-premium rounded-[1.8rem] p-6 sm:p-7">
            <h2 className="font-display text-2xl font-semibold text-white">Quick Actions</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:scale-[1.02] hover:border-[var(--neon-blue)]/40"
                  >
                    <div className={`inline-flex rounded-xl bg-gradient-to-br ${action.accent} p-2.5 text-[#041524]`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold text-white">{action.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{action.desc}</p>
                    <span className="mt-4 inline-flex items-center text-xs uppercase tracking-[0.1em] text-[var(--neon-blue)]">
                      Open
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </motion.article>

          <motion.article variants={fadeUp} className="card-neon rounded-[1.8rem] p-6">
            <h2 className="font-display text-xl font-semibold text-white">Macro Pulse</h2>
            <div className="mt-4 space-y-4">
              {[
                { label: 'Calories', value: caloriesPercent, icon: Flame, color: 'var(--neon-blue)' },
                { label: 'Protein', value: proteinPercent, icon: Dumbbell, color: 'var(--neon-green)' },
                { label: 'Workouts', value: workoutPercent, icon: Calendar, color: '#f97316' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                    <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <span className="font-semibold text-white">{item.value}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-2 rounded-full"
                        style={{ background: item.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.article>
        </motion.section>

        <motion.section variants={fadeUp} className="mt-8 card-glass-premium rounded-[1.8rem] p-6 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-white">Execution Roadmap</h2>
            <Link to="/progress" className="btn-neon-ghost px-5 py-2.5 text-sm">
              Review Analytics
              <BarChart3 className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                step: 'Step 1',
                title: 'Profile Calibration',
                desc: 'Refine baseline and constraints for better AI outputs.',
                done: onboardingDone,
              },
              {
                step: 'Step 2',
                title: 'Daily Nutrition Control',
                desc: 'Keep macros within range and monitor intake drift.',
                done: caloriesPercent >= 80 && proteinPercent >= 70,
              },
              {
                step: 'Step 3',
                title: 'Workout Consistency Loop',
                desc: 'Complete at least one focused session every active day.',
                done: completedToday > 0,
              },
            ].map((stepCard) => (
              <article key={stepCard.step} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{stepCard.step}</div>
                <h3 className="mt-3 text-lg font-semibold text-white">{stepCard.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{stepCard.desc}</p>
                <div
                  className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-xs uppercase tracking-[0.1em] ${
                    stepCard.done
                      ? 'border border-[var(--neon-green)]/30 bg-[var(--neon-green)]/10 text-[var(--neon-green)]'
                      : 'border border-orange-400/30 bg-orange-500/10 text-orange-300'
                  }`}
                >
                  {stepCard.done ? 'Completed' : 'In progress'}
                </div>
              </article>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}

export default Dashboard
