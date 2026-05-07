import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Target, Calendar, BarChart3, Plus, ClipboardCheck, Salad, Activity } from 'lucide-react'
import axios from 'axios'
import { getPhase2State } from '../lib/phase2Store'
import { loadNutritionSummary, loadOnboarding, loadWorkoutSessions } from '../lib/phase2Api'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [phase2, setPhase2] = useState(getPhase2State())
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [completedToday, setCompletedToday] = useState(0)
  const navigate = useNavigate()

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
            Authorization: `Bearer ${token}`
          }
        })

        if (response.data.status === 'success') {
          setUser(response.data.data.user)
        } else {
          navigate('/login')
        }
      } catch (err) {
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
        const [onboarding, todayTotals, todayWorkouts] = await Promise.all([
          loadOnboarding(),
          loadNutritionSummary(today),
          loadWorkoutSessions(today),
        ])

        setTotals(todayTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 })
        setCompletedToday(
          (todayWorkouts || []).filter((session) => Boolean(session.completed)).length,
        )

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
      }
    }

    fetchPhase2()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const onboardingDone = Boolean(phase2.onboarding.completed)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--text-secondary)]">Onboarding</span>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{onboardingDone ? 'Done' : 'Pending'}</div>
            <div className="text-sm text-[var(--text-secondary)]">Health baseline setup</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--text-secondary)]">Calories Today</span>
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{Math.round(totals.calories)}</div>
            <div className="text-sm text-[var(--text-secondary)]">target {phase2.onboarding.calorieTarget} kcal</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--text-secondary)]">Protein Today</span>
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{Math.round(totals.protein)}g</div>
            <div className="text-sm text-[var(--text-secondary)]">target {phase2.onboarding.proteinTarget}g</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--text-secondary)]">Workouts Today</span>
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">{completedToday}</div>
            <div className="text-sm text-[var(--text-secondary)]">completed sessions</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/onboarding"
            className="card group hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Plan Setup</h3>
              <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">Set goals, level, and daily macro targets</p>
          </Link>

          <Link
            to="/nutrition"
            className="card group hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Nutrition Diary</h3>
              <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Salad className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">Log meals and monitor calorie/macros</p>
          </Link>

          <Link
            to="/workouts"
            className="card group hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Workout Planner</h3>
              <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">Track sessions and mark completions</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Phase 2 Focus</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Complete onboarding</p>
                  <p className="text-sm text-[var(--text-secondary)]">This defines your base targets and level</p>
                </div>
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Step 1</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Salad className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Log nutrition daily</p>
                  <p className="text-sm text-[var(--text-secondary)]">Keep calories and macros near target</p>
                </div>
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Step 2</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Review progress weekly</p>
                  <p className="text-sm text-[var(--text-secondary)]">Use charts to adjust habits</p>
                </div>
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Step 3</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/progress"
              className="btn-primary inline-flex items-center"
            >
              Open Progress Hub
              <TrendingUp className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
