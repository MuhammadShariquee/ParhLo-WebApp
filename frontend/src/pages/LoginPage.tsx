import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { Mail, Lock, Eye, EyeOff, Chrome } from 'lucide-react'
import { useStore } from '../store/useStore'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const navigate = useNavigate()
  const { hasCompletedOnboarding } = useStore()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        setSuccess('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate(hasCompletedOnboarding ? '/dashboard' : '/onboarding')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--surface-900)' }}>
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-500/5 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <span className="text-xl">📚</span>
            </div>
            <span className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
              ParhLo
            </span>
          </Link>
          <h1 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
            {mode === 'login' ? 'Welcome back!' : 'Create account'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'login' ? 'Log in to your study space' : 'Start your learning journey'}
          </p>
        </div>

        <div className="glass-card p-6">
          {/* Google button */}
          <button
            onClick={handleGoogle}
            className="btn-secondary w-full justify-center mb-4 py-3"
          >
            <Chrome size={16} />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-base"
              />
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-base pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-base pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? (
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              ) : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
              className="text-brand-400 font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
