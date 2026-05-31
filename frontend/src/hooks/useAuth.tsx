import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { authApi } from '../services/api'
import { useStore } from '../store/useStore'

interface AuthContextType {
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const { setUser } = useStore()

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
        }
        setUser(user)
        // Sync with backend
        authApi.sync(user.name, user.email).catch(() => {})
      }
      setLoading(false)
    })

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const user = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
          }
          setUser(user)
          if (event === 'SIGNED_IN') {
            authApi.sync(user.name, user.email).catch(() => {})
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useStore()
  const { loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
