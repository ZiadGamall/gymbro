import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const ResetToken = () => {
  const { token } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const exchangeToken = async () => {
      if (!token) {
        navigate('/forgot-password')
        return
      }

      try {
        await axios.post('/api/v1/users/exchange-reset-token', { token })
        navigate('/reset-password')
      } catch (error) {
        console.error('Token exchange failed:', error)
        navigate('/forgot-password', { 
          state: { error: 'Invalid or expired reset link' }
        })
      }
    }

    exchangeToken()
  }, [token, navigate])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Validating reset link...</p>
      </div>
    </div>
  )
}

export default ResetToken
