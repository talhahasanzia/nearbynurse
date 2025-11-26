// Mock authentication types to replace Supabase types
export interface User {
  id: string
  email?: string
  user_metadata?: {
    [key: string]: any
  }
  created_at?: string
}

export interface Session {
  access_token: string
  refresh_token: string
  expires_at?: number
  user: User
}

// Mock authentication client to replace Supabase
interface MockAuthClient {
  auth: {
    getSession: () => Promise<{ data: { session: Session | null }; error: any }>
    getUser: () => Promise<{ data: { user: User | null }; error: any }>
    signInWithPassword: (creds: { email: string; password: string }) => Promise<{ data: any; error: any }>
    signUp: (creds: { email: string; password: string }) => Promise<{ data: any; error: any }>
    signOut: () => Promise<{ error: any }>
    onAuthStateChange: (
      cb: (event: string, session: Session | null) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } }
  }
}

// Mock localStorage-based session management
const MOCK_SESSION_KEY = 'mock-auth-session'

function getMockSession(): Session | null {
  try {
    const stored = localStorage.getItem(MOCK_SESSION_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function setMockSession(session: Session | null): void {
  if (session) {
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(MOCK_SESSION_KEY)
  }
}

// Create mock session
function createMockSession(email: string): Session {
  return {
    access_token: `mock-token-${Date.now()}`,
    refresh_token: `mock-refresh-${Date.now()}`,
    expires_at: Date.now() + 3600000, // 1 hour
    user: {
      id: `mock-user-${email.replace('@', '-').replace('.', '-')}`,
      email,
      user_metadata: { email },
      created_at: new Date().toISOString(),
    }
  }
}

// Auth state change listeners
const authListeners: Array<(event: string, session: Session | null) => void> = []

function notifyAuthListeners(event: string, session: Session | null) {
  authListeners.forEach(listener => {
    try {
      listener(event, session)
    } catch (error) {
      console.error('Auth listener error:', error)
    }
  })
}

// Mock authentication implementation
export const supabase: MockAuthClient = {
  auth: {
    async getSession() {
      const session = getMockSession()
      return { data: { session }, error: null }
    },

    async getUser() {
      const session = getMockSession()
      return { data: { user: session?.user || null }, error: null }
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      // Simple mock validation
      if (!email || !password) {
        return { data: null, error: new Error('Email and password are required') }
      }

      if (password.length < 6) {
        return { data: null, error: new Error('Password must be at least 6 characters') }
      }

      // Create mock session
      const session = createMockSession(email)
      setMockSession(session)

      // Notify listeners
      setTimeout(() => notifyAuthListeners('SIGNED_IN', session), 0)

      console.info('🔒 Mock sign-in successful for:', email)
      return { data: { user: session.user, session }, error: null }
    },

    async signUp({ email, password }: { email: string; password: string }) {
      // Simple mock validation
      if (!email || !password) {
        return { data: null, error: new Error('Email and password are required') }
      }

      if (password.length < 6) {
        return { data: null, error: new Error('Password must be at least 6 characters') }
      }

      // Create mock session (simulating auto sign-in after sign-up)
      const session = createMockSession(email)
      setMockSession(session)

      // Notify listeners
      setTimeout(() => notifyAuthListeners('SIGNED_UP', session), 0)

      console.info('🔒 Mock sign-up successful for:', email)
      return { data: { user: session.user, session }, error: null }
    },

    async signOut() {
      setMockSession(null)

      // Notify listeners
      setTimeout(() => notifyAuthListeners('SIGNED_OUT', null), 0)

      console.info('🔒 Mock sign-out successful')
      return { error: null }
    },

    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
      authListeners.push(callback)

      // Immediately call with current session
      const currentSession = getMockSession()
      setTimeout(() => callback('INITIAL_SESSION', currentSession), 0)

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const index = authListeners.indexOf(callback)
              if (index > -1) {
                authListeners.splice(index, 1)
              }
            }
          }
        }
      }
    }
  }
}

// Always configured in mock mode
export const isSupabaseConfigured = true

console.info('🔒 Using mock authentication system (Supabase removed)')
