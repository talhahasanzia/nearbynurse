import { useState } from 'react'
import './App.css'
import { useAuth } from './contexts/AuthContext'
import { api } from './lib/api'
import { isSupabaseConfigured } from './lib/supabase'

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

      {!isSupabaseConfigured && (
        <div className="setup-banner">
          <h3>⚠️ Supabase Not Configured</h3>
          <p>To enable authentication, you need to set up Supabase:</p>
          <ol style={{ textAlign: 'left', margin: '1rem auto', maxWidth: '500px' }}>
            <li>Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">app.supabase.com</a></li>
            <li>Create a new project (takes 2-3 minutes)</li>
            <li>Go to Settings → API</li>
            <li>Copy your Project URL and anon public key</li>
            <li>Update <code>/Users/talhazia/WebstormProjects/nearbynurse/.env</code></li>
            <li>Run: <code>docker-compose up -d --build frontend</code></li>
          </ol>
          <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
            📖 See <strong>SUPABASE-SETUP.md</strong> for detailed instructions
          </p>
        </div>
      )}

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
