import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Play, ChevronRight, Check, X, Trophy, RotateCcw, Loader2, AlertCircle } from 'lucide-react'
import { quizApi, type MCQ } from '../../services/api'

interface Props {
  pdfId: string
  disabled?: boolean
}

type QuizState = 'idle' | 'loading' | 'active' | 'finished' | 'error'

export default function QuizPanel({ pdfId, disabled }: Props) {
  const [state, setState] = useState<QuizState>('idle')
  const [questions, setQuestions] = useState<MCQ[]>([])
  const [quizId, setQuizId] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [answers, setAnswers] = useState<string[]>([])
  const [error, setError] = useState('')
  const [count, setCount] = useState(8)

  const startQuiz = async () => {
    if (disabled) return
    setState('loading')
    setError('')
    try {
      const data = await quizApi.generate(pdfId, count)
      setQuestions(data.questions)
      setQuizId(data.quiz_id)
      setCurrentIndex(0)
      setAnswers([])
      setSelectedAnswer(null)
      setShowFeedback(false)
      setState('active')
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz. Please try again.')
      setState('error')
    }
  }

  const selectAnswer = (letter: string) => {
    if (showFeedback) return
    setSelectedAnswer(letter)
    setShowFeedback(true)
    setAnswers(prev => [...prev, letter])
  }

  const nextQuestion = async () => {
    if (currentIndex + 1 >= questions.length) {
      // Submit score
      const finalScore = answers.filter((a, i) => a === questions[i].correct).length
      try { await quizApi.submitScore(quizId, finalScore) } catch {}
      setState('finished')
    } else {
      setCurrentIndex(i => i + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
    }
  }

  const getOptionLetter = (option: string) => option.charAt(0).toUpperCase()

  const currentQ = questions[currentIndex]
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0
  const finalScore = answers.filter((a, i) => a === questions[i].correct).length
  const percentage = questions.length > 0 ? Math.round((finalScore / questions.length) * 100) : 0

  const getScoreEmoji = () => {
    if (percentage >= 80) return '🎉'
    if (percentage >= 60) return '👍'
    if (percentage >= 40) return '📚'
    return '💪'
  }

  const getScoreMessage = () => {
    if (percentage >= 80) return 'Excellent! Bohat acha kiya!'
    if (percentage >= 60) return 'Good job! Keep practicing!'
    if (percentage >= 40) return 'Not bad! Thoda aur study karo.'
    return 'Keep studying! Aap kar sakte hain!'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)' }}>
        <Brain size={15} style={{ color: 'var(--brand)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
          Quiz Mode
        </span>
        {state === 'active' && (
          <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
            {currentIndex + 1} / {questions.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* Idle */}
          {state === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full gap-6 p-6 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Brain size={28} style={{ color: 'var(--brand)' }} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                  Quiz Mode
                </h3>
                <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
                  Auto-generated MCQs from your PDF. Test your knowledge with instant feedback!
                </p>
              </div>
              
              {/* Question count selector */}
              <div className="flex flex-col gap-3 w-full max-w-sm mt-4">
                {[
                  { n: 5, icon: '⚡', title: 'Quick Quiz', time: '~2 minutes' },
                  { n: 10, icon: '🎯', title: 'Standard Quiz', time: '~5 minutes' },
                  { n: 20, icon: '🏆', title: 'Challenge Quiz', time: '~10 minutes' }
                ].map(mode => (
                  <button key={mode.n} onClick={() => setCount(mode.n)}
                    className="flex items-center justify-between p-4 rounded-xl transition-all border glass-card text-left"
                    style={{
                      borderColor: count === mode.n ? 'rgba(79,70,229,0.5)' : 'var(--glass-border)',
                      backgroundColor: count === mode.n ? 'rgba(79,70,229,0.1)' : 'transparent',
                      boxShadow: count === mode.n ? '0 0 15px rgba(79,70,229,0.2)' : 'none'
                    }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{mode.icon}</span>
                      <div>
                        <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{mode.title}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{mode.n} Questions</div>
                      </div>
                    </div>
                    <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{mode.time}</div>
                  </button>
                ))}
              </div>

              <button onClick={startQuiz} disabled={disabled}
                className="btn-primary mt-2 w-full max-w-sm flex items-center justify-center gap-2">
                <Play size={16} />
                Start Quiz
              </button>
              {disabled && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Waiting for PDF processing...</p>}
            </motion.div>
          )}

          {/* Loading */}
          {state === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Generating Quiz...</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Creating questions from your PDF</p>
            </motion.div>
          )}

          {/* Error */}
          {state === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
              <AlertCircle size={32} style={{ color: error.startsWith('ERROR_') ? '#d97706' : '#ef4444' }} />
              <p className="text-sm max-w-sm" style={{ color: error.startsWith('ERROR_') ? '#d97706' : '#ef4444' }}>
                {error.replace(/ERROR_LIMIT:|ERROR_QUOTA:/, '')}
              </p>
              <button onClick={() => setState('idle')}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg"
                style={{ background: 'var(--surface-700)', color: 'var(--text-primary)' }}>
                <RotateCcw size={14} /> Try Again
              </button>
            </motion.div>
          )}

          {/* Active quiz */}
          {state === 'active' && currentQ && (
            <motion.div key={`q-${currentIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="p-4 flex flex-col gap-4">
              
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-700)' }}>
                <motion.div className="h-full rounded-full" style={{ background: 'var(--brand)' }}
                  initial={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
              </div>

              {/* Question */}
              <div className="rounded-xl p-4" style={{ background: 'var(--surface-800)', border: '1px solid var(--border)' }}>
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--brand)' }}>
                    Q{currentIndex + 1}
                  </span>
                  {currentQ.page && (
                    <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Page {currentQ.page}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text-primary)' }}>
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-2">
                {currentQ.options.map((option) => {
                  const letter = getOptionLetter(option)
                  const isSelected = selectedAnswer === letter
                  const isCorrect = letter === currentQ.correct
                  const showCorrect = showFeedback && isCorrect
                  const showWrong = showFeedback && isSelected && !isCorrect

                  return (
                    <motion.button key={option} onClick={() => selectAnswer(letter)}
                      disabled={showFeedback}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all disabled:cursor-default"
                      style={{
                        background: showCorrect
                          ? 'rgba(34,197,94,0.15)' : showWrong
                          ? 'rgba(239,68,68,0.12)' : isSelected
                          ? 'rgba(34,197,94,0.08)' : 'var(--surface-700)',
                        border: `1px solid ${showCorrect ? 'rgba(34,197,94,0.4)' : showWrong ? 'rgba(239,68,68,0.3)' : isSelected ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`,
                        color: showCorrect ? '#22c55e' : showWrong ? '#ef4444' : 'var(--text-primary)'
                      }}>
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: showCorrect ? '#22c55e' : showWrong ? '#ef4444' : 'var(--surface-600)',
                          color: (showCorrect || showWrong) ? '#fff' : 'var(--text-secondary)'
                        }}>
                        {showCorrect ? <Check size={12} /> : showWrong ? <X size={12} /> : letter}
                      </span>
                      <span>{option.substring(2).trim()}</span>
                    </motion.button>
                  )
                })}
              </div>

              {/* Feedback + Next */}
              <AnimatePresence>
                {showFeedback && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Explanation */}
                    {currentQ.explanation && (
                      <div className="rounded-xl p-3 mb-3 text-sm"
                        style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', color: 'var(--text-secondary)' }}>
                        <span className="font-medium" style={{ color: 'var(--brand)' }}>Explanation: </span>
                        {currentQ.explanation}
                      </div>
                    )}

                    <button onClick={nextQuestion}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all hover:opacity-90"
                      style={{ background: 'var(--brand)', color: '#fff' }}>
                      {currentIndex + 1 >= questions.length ? (
                        <><Trophy size={15} /> See Results</>
                      ) : (
                        <>Next Question <ChevronRight size={15} /></>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Results */}
          {state === 'finished' && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-5 p-6 text-center">
              <div className="text-5xl">{getScoreEmoji()}</div>
              <div>
                <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--brand)', fontFamily: 'Syne, sans-serif' }}>
                  {finalScore}/{questions.length}
                </h3>
                <p className="text-4xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
                  {percentage}%
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{getScoreMessage()}</p>
              </div>

              {/* Question review */}
              <div className="w-full rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {questions.map((q, i) => {
                  const userAns = answers[i]
                  const correct = userAns === q.correct
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 text-sm border-b last:border-b-0"
                      style={{ borderColor: 'var(--border)', background: correct ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }}>
                        {correct ? <Check size={10} style={{ color: '#22c55e' }} /> : <X size={10} style={{ color: '#ef4444' }} />}
                      </div>
                      <span className="text-xs text-left leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {q.question}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={startQuiz}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all hover:scale-105"
                  style={{ background: 'var(--brand)', color: '#fff' }}>
                  <RotateCcw size={14} /> Retake Quiz
                </button>
                <button onClick={() => setState('idle')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors hover:opacity-80"
                  style={{ background: 'var(--surface-700)', color: 'var(--text-primary)' }}>
                  New Quiz
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
