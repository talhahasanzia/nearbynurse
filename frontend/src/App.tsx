import { useState } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext'
import { api } from './lib/api'

function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [protectedData, setProtectedData] = useState<any>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isSignUp) {
        await signUp(email, password)
        alert('Check your email to confirm your account!')
      } else {
        await signIn(email, password)
      }
      setEmail('')
      setPassword('')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    }
  }

  const testProtectedEndpoint = async () => {
    try {
      const data = await api.get('/me')
      setProtectedData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch protected data')
    }
  }

  if (loading) {
    return <div className="container">Loading...</div>
  }

  return (
    <div className="container">
      <h1>🏥 NearbyNurse Auth Demo</h1>

      {!user ? (
        <div className="auth-form">
          <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="submit">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          {error && <p className="error">{error}</p>}

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="toggle-btn"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      ) : (
        <div className="user-info">
          <h2>Welcome! 👋</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>

          <div className="actions">
            <button onClick={testProtectedEndpoint}>
              Test Protected Endpoint (/me)
            </button>
            <button onClick={signOut} className="signout-btn">
              Sign Out
            </button>
          </div>

          {protectedData && (
            <div className="protected-data">
              <h3>Protected Data:</h3>
              <pre>{JSON.stringify(protectedData, null, 2)}</pre>
            </div>
          )}

          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  )
}

export default App
