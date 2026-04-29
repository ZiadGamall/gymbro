import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp, Target, Calendar, BarChart3, Plus } from 'lucide-react'
import axios from 'axios'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--text-secondary)]">Total Workouts</span>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">24</div>
            <div className="text-sm text-[var(--text-secondary)]">+3 this week</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--text-secondary)]">Calories Burned</span>
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">8,450</div>
            <div className="text-sm text-[var(--text-secondary)]">kcal this month</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--text-secondary)]">Goals Met</span>
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">18</div>
            <div className="text-sm text-[var(--text-secondary)]">out of 20</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--text-secondary)]">Current Streak</span>
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[var(--text-primary)]">7</div>
            <div className="text-sm text-[var(--text-secondary)]">days</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            to="/food-search"
            className="card group hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Food Search</h3>
              <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">Track nutrition and calories</p>
          </Link>

          <div className="card opacity-75 cursor-not-allowed">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Workout Plans</h3>
              <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">Coming soon</p>
          </div>

          <div className="card opacity-75 cursor-not-allowed">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Exercise Library</h3>
              <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">Coming soon</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Food Search</p>
                  <p className="text-sm text-[var(--text-secondary)]">Searched for "chicken breast"</p>
                </div>
              </div>
              <span className="text-sm text-[var(--text-secondary)]">2 hours ago</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Goal Completed</p>
                  <p className="text-sm text-[var(--text-secondary)]">7-day workout streak</p>
                </div>
              </div>
              <span className="text-sm text-[var(--text-secondary)]">1 day ago</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Profile Updated</p>
                  <p className="text-sm text-[var(--text-secondary)]">Added height and weight</p>
                </div>
              </div>
              <span className="text-sm text-[var(--text-secondary)]">3 days ago</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/food-search"
              className="btn-primary inline-flex items-center"
            >
              Start Tracking
              <TrendingUp className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
