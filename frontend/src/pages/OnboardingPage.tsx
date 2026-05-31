import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { ArrowRight, Upload, MessageSquare, FileText } from 'lucide-react'

const steps = [
  {
    icon: '📤',
    title: 'Upload your PDF',
    desc: 'Upload your notes, slides, or textbook chapters. ParhLo processes them securely.',
    visual: <Upload size={40} className="text-brand-400" />,
  },
  {
    icon: '💬',
    title: 'Ask anything from it',
    desc: 'Ask questions in English, Urdu, or Roman Urdu. Get answers only from your material.',
    visual: <MessageSquare size={40} className="text-brand-400" />,
  },
  {
    icon: '📝',
    title: 'Generate Notes or Quiz',
    desc: 'Get exam-ready notes, MCQ quizzes, and Pakistani exam pattern questions instantly.',
    visual: <FileText size={40} className="text-brand-400" />,
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { setOnboardingComplete } = useStore()
  const [current, setCurrent] = useState(0)

  const finish = () => {
    setOnboardingComplete()
    navigate('/dashboard')
  }

  const next = () => {
    if (current < steps.length - 1) setCurrent(current + 1)
    else finish()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--surface-900)' }}>
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      {/* Progress dots */}
      <div className="flex gap-2 mb-12 relative z-10">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            animate={{ width: i === current ? 24 : 8, opacity: i <= current ? 1 : 0.3 }}
            className="h-2 rounded-full bg-brand-500"
          />
        ))}
      </div>

      {/* Step content */}
      <div className="relative z-10 w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-24 h-24 rounded-3xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">{steps[current].icon}</span>
            </div>
            <h1 className="font-display font-bold text-3xl mb-3" style={{ color: 'var(--text-primary)' }}>
              {steps[current].title}
            </h1>
            <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--text-secondary)' }}>
              {steps[current].desc}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 justify-center">
          <button onClick={finish} className="btn-ghost">
            Skip
          </button>
          <button onClick={next} className="btn-primary px-8">
            {current < steps.length - 1 ? 'Next' : "Let's go!"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <p className="relative z-10 mt-12 text-xs" style={{ color: 'var(--text-muted)' }}>
        Step {current + 1} of {steps.length}
      </p>
    </div>
  )
}
