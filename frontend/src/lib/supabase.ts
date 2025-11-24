import { createClient } from '@supabase/supabase-js'
import type { Session, User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Minimal interface to satisfy TypeScript in other modules that consume `supabase`.
interface MinimalSupabase {
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
  from: (table: string) => { select: () => Promise<{ data: any; error: any }> }
}

// Helper function to check if Supabase credentials are valid (not placeholders)
function isValidSupabaseConfig(url?: string, key?: string): boolean {
  if (!url || !key) return false
  // Check if values are placeholders
  if (url.includes('placeholder') || key.includes('placeholder')) return false
  if (url.includes('your-project-id') || key.includes('your-supabase-anon-key')) return false
  // Check if URL looks like a valid Supabase URL
  if (!url.startsWith('https://') || !url.includes('supabase.co')) return false
  return true
}

let supabase: MinimalSupabase

if (isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
  // create the real client when env vars are present
  // We cast to `any` here and then provide a typed wrapper for the parts we use.
  const real = createClient(supabaseUrl, supabaseAnonKey) as any
  supabase = {
    auth: {
      getSession: () => real.auth.getSession(),
      getUser: () => real.auth.getUser(),
      signInWithPassword: (creds: { email: string; password: string }) => real.auth.signInWithPassword(creds),
      signUp: (creds: { email: string; password: string }) => real.auth.signUp(creds),
      signOut: () => real.auth.signOut(),
      onAuthStateChange: (cb: (event: string, session: Session | null) => void) => real.auth.onAuthStateChange(cb),
    },
    from: (table: string) => ({ select: () => real.from(table).select() }),
  }
} else {
  // Do NOT throw here — when building inside Docker without env vars the app will crash during module eval
  // Provide a safe stub so the UI doesn't remain blank; warn the developer instead.
  // eslint-disable-next-line no-console
  console.warn(
    '⚠️  Supabase not configured properly!\n' +
    'Either VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are missing or contain placeholder values.\n' +
    'Please update frontend/.env with your actual Supabase credentials from https://app.supabase.com/project/_/settings/api\n' +
    'Current values: URL=' + supabaseUrl + ', Key=' + (supabaseAnonKey ? '[SET]' : '[MISSING]')
  )

  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null }),
      // prefix with underscore to avoid 'declared but never used' errors
      onAuthStateChange: (_cb: (event: string, session: Session | null) => void) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({ select: async () => ({ data: null, error: null }) }),
  }
}

export { supabase }
export const isSupabaseConfigured = isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)
