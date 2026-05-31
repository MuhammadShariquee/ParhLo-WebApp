import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useStore } from '../store/useStore'

const features = [
  {
    icon: '🧠',
    title: 'RAG-Powered Answers',
    desc: 'Answers strictly from your uploaded PDF — never from external sources',
  },
  {
    icon: '🎯',
    title: 'Exam Mode',
    desc: 'Short, long, and important questions in Pakistani exam pattern',
  },
  {
    icon: '📝',
    title: 'Smart Notes',
    desc: 'Auto-generated bullet-point notes you can download as PDF',
  },
  {
    icon: '🧩',
    title: 'MCQ Quiz',
    desc: 'Test yourself with instant feedback and score tracking',
  },
  {
    icon: '🌐',
    title: 'Urdu / Roman Urdu',
    desc: 'Ask in English, Urdu, or Roman Urdu — get answers in your language',
  },
  {
    icon: '💡',
    title: '3 Detail Levels',
    desc: 'Simple, medium, or detailed — choose your explanation depth',
  },
]

export default function LandingPage() {
  const { user } = useStore()

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--surface-900)' }}>
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <span className="text-lg">📚</span>
          </div>
          <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            ParhLo
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Link to="/login" className="btn-ghost text-sm">
            Login
          </Link>
          <Link to={user ? '/dashboard' : '/login'} className="btn-primary text-sm">
            Start Studying
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium mb-8"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Pakistan ka apna AI Study Assistant
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display font-extrabold text-5xl md:text-7xl leading-tight mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          Stop Scrolling,
          <br />
          <span className="text-brand-400">ParhLo!</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl mb-10 max-w-2xl mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Upload your study material, ask questions in English, Urdu or Roman Urdu,
          and get exam-focused answers — strictly from your own notes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            to={user ? '/dashboard' : '/login'}
            className="btn-primary text-base px-8 py-3.5 rounded-2xl"
          >
            Start Studying — It's Free
            <ArrowRight size={18} />
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-5 text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          No credit card required · Free forever for students
        </motion.p>
      </div>

      {/* Features grid */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display font-bold text-2xl text-center mb-10"
          style={{ color: 'var(--text-primary)' }}
        >
          Everything you need to study smarter
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass-card p-5 hover:border-brand-500/20 transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-display font-semibold text-base mb-1.5" style={{ color: 'var(--text-primary)' }}>
                {f.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-10 text-xs" style={{ color: 'var(--text-muted)' }}>
        Built with ❤️ for Pakistani students · ParhLo v1.0
      </div>
    </div>
  )
}
