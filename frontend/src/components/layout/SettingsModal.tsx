import { motion, AnimatePresence } from 'framer-motion'
import { X, Moon, Sun, Globe, User } from 'lucide-react'
import { useStore } from '../../store/useStore'

export default function SettingsModal() {
  const { 
    isSettingsOpen, setIsSettingsOpen, 
    theme, toggleTheme, 
    language, setLanguage,
    user 
  } = useStore()

  if (!isSettingsOpen) return null

  const LANGUAGES = [
    { id: 'english', label: 'English', flag: '🇬🇧' },
    { id: 'urdu', label: 'اردو', flag: '🇵🇰' },
    { id: 'roman_urdu', label: 'Roman Urdu', flag: '🇵🇰' },
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setIsSettingsOpen(false)}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg glass-card overflow-hidden flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)] bg-[var(--glass-bg)]">
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)]">Settings</h2>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
            
            {/* Account Section */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase flex items-center gap-2">
                <User size={14} /> Account Information
              </h3>
              <div className="p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
                <p className="font-semibold text-sm text-[var(--text-primary)] mb-1">
                  {user?.name || 'Student'}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {user?.email || 'Not signed in'}
                </p>
              </div>
            </section>

            {/* Theme Section */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase flex items-center gap-2">
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />} Theme
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { if (theme !== 'dark') toggleTheme() }}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 ${
                    theme === 'dark' 
                      ? 'bg-brand-500/10 border-brand-500/50 text-brand-500 font-semibold'
                      : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Moon size={16} /> Dark
                </button>
                <button
                  onClick={() => { if (theme !== 'light') toggleTheme() }}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-200 ${
                    theme === 'light' 
                      ? 'bg-brand-500/10 border-brand-500/50 text-brand-500 font-semibold'
                      : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Sun size={16} /> Light
                </button>
              </div>
            </section>

            {/* Language Section */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-[var(--text-muted)] tracking-widest uppercase flex items-center gap-2">
                <Globe size={14} /> Language
              </h3>
              <div className="flex flex-col gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                      language === lang.id
                        ? 'bg-brand-500/10 border-brand-500/50 text-brand-500 font-semibold'
                        : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                    {language === lang.id && <span className="text-brand-500 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            </section>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
