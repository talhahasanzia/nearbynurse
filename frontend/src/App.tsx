import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { api } from './lib/api'
import { useState } from 'react';

// Public Home Page
function HomePage() {
  const { isAuthenticated, login, user } = useAuth();

  return (
    <div>
      <h1>🏥 NearbyNurse - Home</h1>
      <p>Welcome to NearbyNurse application</p>

      {!isAuthenticated ? (
        <div>
          <p>Please log in to access protected features.</p>
          <button onClick={login}>Login with Keycloak</button>
        </div>
      ) : (
        <div>
          <p>Welcome back, <strong>{user?.username}</strong>!</p>
          <Link to="/dashboard">Go to Dashboard</Link>
        </div>
      )}
    </div>
  );
}

// Protected Dashboard
function Dashboard() {
  const { user, logout, hasRole } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await api.get('/me');
      setProfileData(data);
    } catch (e: any) {
      setProfileError(e.message || 'Failed to fetch /me');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div>
      <h1>📊 Dashboard</h1>
      <p>This is a protected page. Only authenticated users can see this.</p>

      <div style={{
        background: '#f5f5f5',
        padding: '1rem',
        borderRadius: '8px',
        marginTop: '1rem'
      }}>
        <h3>User Information</h3>
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>First Name:</strong> {user?.firstName || 'N/A'}</p>
        <p><strong>Last Name:</strong> {user?.lastName || 'N/A'}</p>

        <h4>Roles:</h4>
        <ul>
          {user?.roles.map((role) => (
            <li key={role}>{role}</li>
          ))}
        </ul>

        {hasRole('admin') && (
          <div style={{
            background: '#ffeb3b',
            padding: '0.5rem',
            borderRadius: '4px',
            marginTop: '1rem'
          }}>
            👑 You have admin privileges!
            <br />
            <Link to="/admin">Go to Admin Panel</Link>
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <button onClick={fetchProfile} disabled={profileLoading} style={{
            background: '#1976d2',
            color: 'white',
            border: 'none',
            padding: '0.5rem 0.85rem',
            borderRadius: 4,
            cursor: 'pointer'
          }}>
            {profileLoading ? 'Loading /me...' : 'Call /me endpoint'}
          </button>
        </div>

        {profileError && (
          <p style={{ color: 'red', marginTop: '0.5rem' }}>{profileError}</p>
        )}

        {profileData && (
          <div style={{
            background: 'white',
            marginTop: '1rem',
            padding: '0.75rem',
            border: '1px solid #ccc',
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: '0.85rem'
          }}>
            <strong>/me response:</strong>
            <pre style={{ margin: 0 }}>{JSON.stringify(profileData, null, 2)}</pre>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Link to="/">Home</Link> | <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

// Admin-Only Page
function AdminPage() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>👑 Admin Panel</h1>
      <p>This page requires the 'admin' role.</p>

      <div style={{
        background: '#e8f5e9',
        padding: '1rem',
        borderRadius: '8px',
        marginTop: '1rem'
      }}>
        <h3>Admin Tools</h3>
        <p>Welcome, Administrator <strong>{user?.username}</strong></p>
        <p>Here you can manage users, settings, and system configuration.</p>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Link to="/dashboard">Dashboard</Link> |
        <Link to="/">Home</Link> |
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const { isLoading, isAuthenticated, user, login, logout, register } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading authentication...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav style={{
        background: '#1976d2',
        color: 'white',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
              🏥 NearbyNurse
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" style={{ color: 'white' }}>Dashboard</Link>
                <span style={{ color: 'white' }}>{user?.username}</span>
                <button onClick={logout} style={{
                  background: 'white',
                  color: '#1976d2',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{
                  background: 'white',
                  color: '#1976d2',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px'
                }}>Login</Link>
                <Link to="/register" style={{
                  background: 'transparent',
                  color: 'white',
                  border: '1px solid white',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px'
                }}>Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
