import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Save } from 'lucide-react'
import axios from 'axios'
import { getApiError } from '../lib/healthApi'

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    passwordConfirm: ''
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) navigate('/login')
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!formData.currentPassword || !formData.newPassword || !formData.passwordConfirm) {
      setError('Please fill all password fields.')
      setLoading(false)
      return
    }

    if (formData.newPassword !== formData.passwordConfirm) {
      setError('New password and confirmation do not match.')
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await axios.patch(
        '/api/v1/users/update-password',
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          passwordConfirm: formData.passwordConfirm
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const nextToken = res?.data?.token
      if (nextToken) localStorage.setItem('token', nextToken)

      setSuccess('Password updated successfully!')
      setFormData({
        currentPassword: '',
        newPassword: '',
        passwordConfirm: ''
      })
    } catch (err) {
      setError(getApiError(err, 'Failed to update password.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="page-content max-w-2xl">
        <div className="mb-8">
          <h1 className="page-title">Change Password</h1>
          <p className="page-subtitle">Update your password securely.</p>
        </div>

        {error && <div className="alert-danger mb-6">{error}</div>}
        {success && <div className="alert-success mb-6">{success}</div>}

        <div className="card-surface p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[var(--text-primary)] font-medium mb-2">
                Current password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  name="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="input-field-with-icon-right w-full"
                  placeholder="Enter current password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[var(--text-primary)] font-medium mb-2">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  name="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="input-field-with-icon-right w-full"
                  placeholder="Enter new password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[var(--text-primary)] font-medium mb-2">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  name="passwordConfirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className="input-field-with-icon-right w-full"
                  placeholder="Confirm new password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/account-settings')}
                className="btn-secondary inline-flex items-center justify-center"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Update password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword
