import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Camera, Eye, EyeOff, KeyRound, Lock, Mail, Ruler, Save, User } from 'lucide-react'
import axios from 'axios'
import { getApiError, parseUserResponse } from '../lib/healthApi'

const WeightScaleIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />
    <path d="M7 9a5 5 0 0 1 10 0" />
    <path d="M12 9v3" />
    <path d="M9 14h6" />
  </svg>
)

const toDateInputValue = (value) => {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

const AccountSettings = () => {
  const [meLoading, setMeLoading] = useState(true)
  const [me, setMe] = useState(null)
  const [formData, setFormData] = useState({
    currentPassword: '',
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    dateOfBirth: '',
    height: '',
    weight: ''
  })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const fetchMe = async () => {
      setMeLoading(true)
      setError('')
      try {
        const res = await axios.get('/api/v1/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const user = parseUserResponse(res)
        setMe(user)

        setFormData((prev) => ({
          ...prev,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          username: user?.username || '',
          email: user?.email || '',
          dateOfBirth: toDateInputValue(user?.dateOfBirth),
          height: user?.height ?? '',
          weight: user?.weight ?? ''
        }))
      } catch (err) {
        setError(err.response?.data?.message || err.response?.data?.msg || 'Failed to load your account data.')
      } finally {
        setMeLoading(false)
      }
    }

    fetchMe()
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!formData.currentPassword) {
      setError('Current password is required for any changes')
      setLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('currentPassword', formData.currentPassword)

      const appendIfChanged = (key, value) => {
        const nextVal = value === null || value === undefined ? '' : String(value)
        const prevVal = me?.[key] === null || me?.[key] === undefined ? '' : String(me?.[key])
        if (nextVal !== prevVal) formDataToSend.append(key, value)
      }

      appendIfChanged('firstName', formData.firstName)
      appendIfChanged('lastName', formData.lastName)
      appendIfChanged('username', formData.username)
      appendIfChanged('email', formData.email)
      appendIfChanged('dateOfBirth', formData.dateOfBirth)
      appendIfChanged('height', formData.height)
      appendIfChanged('weight', formData.weight)

      if (photo) {
        formDataToSend.append('photo', photo)
      }

      const token = localStorage.getItem('token')
      const response = await axios.patch('/api/v1/users/update-account', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })

      const updatedUser = response?.data?.data?.user
      const msg = response?.data?.data?.message
      setSuccess(msg || 'Account updated successfully!')
      if (updatedUser) setMe(updatedUser)

      // Reset password + photo inputs
      setFormData({
        currentPassword: '',
        firstName: updatedUser?.firstName || formData.firstName,
        lastName: updatedUser?.lastName || formData.lastName,
        username: updatedUser?.username || formData.username,
        email: updatedUser?.email || formData.email,
        dateOfBirth: updatedUser?.dateOfBirth ? toDateInputValue(updatedUser.dateOfBirth) : formData.dateOfBirth,
        height: updatedUser?.height ?? formData.height,
        weight: updatedUser?.weight ?? formData.weight
      })
      setPhoto(null)
      setPhotoPreview('')
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || 'Update failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Account Settings</h1>
              <p className="text-[var(--text-secondary)]">Update your profile details and photo.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {(error || success) && (
            <div
              className={`rounded-2xl border px-4 py-3 ${
                error
                  ? 'bg-red-500/10 border-red-500/30 text-red-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}
            >
              {error || success}
            </div>
          )}

          <div className="card p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] overflow-hidden flex items-center justify-center">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-[var(--text-secondary)]" />
                      )}
                    </div>
                    <label
                      htmlFor="photo"
                      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center cursor-pointer hover:bg-[var(--accent-hover)] transition-colors"
                      title="Change photo"
                    >
                      <Camera className="w-5 h-5" />
                      <input
                        id="photo"
                        name="photo"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <div className="text-[var(--text-primary)] font-semibold">Profile photo</div>
                    <div className="text-sm text-[var(--text-secondary)]">PNG/JPG up to a few MB</div>
                  </div>
                </div>

                <div className="sm:ml-auto text-sm text-[var(--text-secondary)]">
                  {meLoading ? 'Loading your account…' : me?.email ? `Signed in as ${me.email}` : ''}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[var(--text-primary)] font-medium mb-2">First name</label>
                  <input
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="First name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-primary)] font-medium mb-2">Last name</label>
                  <input
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="Last name"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-primary)] font-medium mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                    <input
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      className="input-field-with-icon w-full"
                      placeholder="Username"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-primary)] font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field-with-icon w-full"
                      placeholder="Email"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-primary)] font-medium mb-2">Date of birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                    <input
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="input-field-with-icon w-full"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[var(--text-primary)] font-medium mb-2">Height (cm)</label>
                    <div className="relative">
                      <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                      <input
                        name="height"
                        type="number"
                        value={formData.height}
                        onChange={handleChange}
                        className="input-field-with-icon w-full"
                        placeholder="170"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--text-primary)] font-medium mb-2">Weight (kg)</label>
                    <div className="relative">
                      <WeightScaleIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                      <input
                        name="weight"
                        type="number"
                        value={formData.weight}
                        onChange={handleChange}
                        className="input-field-with-icon w-full"
                        placeholder="70"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-6">
                <label className="block text-[var(--text-primary)] font-medium mb-2">
                  Current password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                  <input
                    name="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="input-field-with-icon-right w-full"
                    placeholder="Enter current password to save changes"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Required for any account changes.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/change-password')}
                  className="btn-secondary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <KeyRound className="w-5 h-5" />
                  Change password
                </button>
                <button
                  type="submit"
                  disabled={loading || meLoading}
                  className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountSettings
