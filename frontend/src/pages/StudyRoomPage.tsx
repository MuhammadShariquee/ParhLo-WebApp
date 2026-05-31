import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BookOpen, MessageSquare, FileText, Brain, Trophy,
  Sun, Moon, Globe, ChevronDown, Loader2, AlertCircle
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { pdfApi, type PDF } from '../services/api'
import ChatPanel from '../components/study/ChatPanel'
import QuizPanel from '../components/study/QuizPanel'
import NotesPanel from '../components/study/NotesPanel'
import ExamPanel from '../components/study/ExamPanel'
import PDFViewer from '../components/study/PDFViewer'

type ActivePanel = 'chat' | 'quiz' | 'notes' | 'exam'
type MobileView = 'pdf' | 'panel'

export default function StudyRoomPage() {
  const { pdfId } = useParams<{ pdfId: string }>()
  const navigate = useNavigate()
  const {
    activePdf, setActivePdf, theme, toggleTheme, language, setLanguage,
    detailLevel, setDetailLevel, highlightedPages, setHighlightedPages, setCurrentPdfPage
  } = useStore()

  const [pdf, setPdf] = useState<PDF | null>(activePdf)
  const [activePanel, setActivePanel] = useState<ActivePanel>('chat')
  const [mobileView, setMobileView] = useState<MobileView>('panel')
  const [pdfStatus, setPdfStatus] = useState<string>('ready')
  const [statusError, setStatusError] = useState('')
  const [langDropdown, setLangDropdown] = useState(false)
  const [detailDropdown, setDetailDropdown] = useState(false)
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!pdfId) { navigate('/dashboard'); return }
    loadPdf()
    return () => { if (statusPollRef.current) clearInterval(statusPollRef.current) }
  }, [pdfId])

  const loadPdf = async () => {
    try {
      if (activePdf && activePdf.id === pdfId) {
        setPdf(activePdf)
        checkAndPollStatus(activePdf.chunk_status)
        return
      }
      const data = await pdfApi.get(pdfId!)
      setPdf(data)
      setActivePdf(data)
      checkAndPollStatus(data.chunk_status)
    } catch {
      setStatusError('Could not load PDF. Please go back and try again.')
    }
  }

  const checkAndPollStatus = (status: string) => {
    setPdfStatus(status)
    if (status === 'pending' || status === 'processing') {
      statusPollRef.current = setInterval(async () => {
        try {
          const s = await pdfApi.getStatus(pdfId!)
          setPdfStatus(s.status)
          if (s.status === 'ready' || s.status === 'failed') {
            if (statusPollRef.current) clearInterval(statusPollRef.current)
          }
        } catch {}
      }, 3000)
    }
  }

  const LANGUAGES = [
    { id: 'english', label: 'English', flag: '🇬🇧' },
    { id: 'urdu', label: 'اردو', flag: '🇵🇰' },
    { id: 'roman_urdu', label: 'Roman Urdu', flag: '🇵🇰' },
  ]

  const DETAIL_LEVELS = [
    { id: 'simple', label: 'Simple', desc: 'Easy explanation' },
    { id: 'medium', label: 'Medium', desc: 'Balanced answer' },
    { id: 'detailed', label: 'Detailed', desc: 'Full explanation' },
  ]

  const PANELS = [
    { id: 'chat' as ActivePanel, icon: MessageSquare, label: 'Chat' },
    { id: 'notes' as ActivePanel, icon: FileText, label: 'Notes' },
    { id: 'quiz' as ActivePanel, icon: Brain, label: 'Quiz' },
    { id: 'exam' as ActivePanel, icon: Trophy, label: 'Exam' },
  ]

  const isProcessing = pdfStatus === 'pending' || pdfStatus === 'processing'
  const isFailed = pdfStatus === 'failed'
  const currentLang = LANGUAGES.find(l => l.id === language) || LANGUAGES[0]
  const currentDetail = DETAIL_LEVELS.find(d => d.id === detailLevel) || DETAIL_LEVELS[1]

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--surface-900)' }}>
      {/* ── Top Bar ── */}
      <header className="flex items-center gap-3 px-4 h-14 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-800)' }}>
        
        {/* Back */}
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} />
          <span className="hidden sm:block">Dashboard</span>
        </button>

        <div className="w-px h-5" style={{ background: 'var(--border)' }} />

        {/* PDF name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <BookOpen size={14} style={{ color: 'var(--brand)' }} className="flex-shrink-0" />
          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {pdf?.file_name || 'Loading...'}
          </span>
          {isProcessing && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
              <Loader2 size={10} className="animate-spin" />
              Processing...
            </span>
          )}
          {pdfStatus === 'ready' && (
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
              Ready
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Language selector */}
          <div className="relative">
            <button onClick={() => { setLangDropdown(!langDropdown); setDetailDropdown(false) }}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface-700)' }}>
              <Globe size={12} />
              <span className="hidden sm:block">{currentLang.label}</span>
              <ChevronDown size={10} />
            </button>
            <AnimatePresence>
              {langDropdown && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-xl z-50 overflow-hidden"
                  style={{ background: 'var(--surface-700)', borderColor: 'var(--border)' }}>
                  {LANGUAGES.map(l => (
                    <button key={l.id} onClick={() => { setLanguage(l.id); setLangDropdown(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors hover:opacity-80"
                      style={{ color: language === l.id ? 'var(--brand)' : 'var(--text-primary)', background: language === l.id ? 'rgba(34,197,94,0.08)' : '' }}>
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                      {language === l.id && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Detail level */}
          <div className="relative">
            <button onClick={() => { setDetailDropdown(!detailDropdown); setLangDropdown(false) }}
              className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface-700)' }}>
              <span>{currentDetail.label}</span>
              <ChevronDown size={10} />
            </button>
            <AnimatePresence>
              {detailDropdown && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 w-48 rounded-xl border shadow-xl z-50 overflow-hidden"
                  style={{ background: 'var(--surface-700)', borderColor: 'var(--border)' }}>
                  {DETAIL_LEVELS.map(d => (
                    <button key={d.id} onClick={() => { setDetailLevel(d.id as any); setDetailDropdown(false) }}
                      className="w-full flex flex-col px-3 py-2.5 text-left transition-colors hover:opacity-80"
                      style={{ background: detailLevel === d.id ? 'rgba(34,197,94,0.08)' : '' }}>
                      <span className="text-sm font-medium" style={{ color: detailLevel === d.id ? 'var(--brand)' : 'var(--text-primary)' }}>{d.label}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.desc}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="p-1.5 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface-700)' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      {/* ── Processing / Error Banner ── */}
      <AnimatePresence>
        {(isProcessing || isFailed || statusError) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm"
            style={{
              background: isFailed || statusError ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
              color: isFailed || statusError ? '#ef4444' : '#fbbf24',
              borderBottom: `1px solid ${isFailed || statusError ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.2)'}`
            }}>
            {isProcessing ? (
              <><Loader2 size={14} className="animate-spin flex-shrink-0" /> Processing your PDF... This may take a minute. Chat will be available once ready.</>
            ) : (
              <><AlertCircle size={14} className="flex-shrink-0" /> {statusError || 'PDF processing failed. Please try re-uploading the file.'}</>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile View Toggle */}
        <div className="flex md:hidden items-center gap-0 border-b flex-shrink-0 absolute bottom-20 left-1/2 -translate-x-1/2 z-30 rounded-full overflow-hidden shadow-xl"
          style={{ background: 'var(--surface-700)', border: '1px solid var(--border)' }}>
          <button onClick={() => setMobileView('pdf')}
            className="px-4 py-2 text-xs font-medium transition-colors"
            style={{ background: mobileView === 'pdf' ? 'var(--brand)' : '', color: mobileView === 'pdf' ? '#000' : 'var(--text-secondary)' }}>
            📄 PDF
          </button>
          <button onClick={() => setMobileView('panel')}
            className="px-4 py-2 text-xs font-medium transition-colors"
            style={{ background: mobileView === 'panel' ? 'var(--brand)' : '', color: mobileView === 'panel' ? '#000' : 'var(--text-secondary)' }}>
            💬 Chat
          </button>
        </div>

        {/* ── PDF Viewer (Left) ── */}
        <div className={`${mobileView === 'pdf' ? 'flex' : 'hidden'} md:flex flex-col border-r`}
          style={{ width: 'clamp(300px, 45%, 600px)', borderColor: 'var(--border)', minWidth: '0' }}>
          {pdf ? (
            <PDFViewer
              pdfId={pdf.id}
              pdfUrl={pdfApi.getServeUrl(pdf.id)}
              highlightedPages={highlightedPages}
              onPageChange={setCurrentPdfPage}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          )}
        </div>

        {/* ── Right Panel ── */}
        <div className={`${mobileView === 'panel' ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0`}>
          {/* Panel Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b flex-shrink-0"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-800)' }}>
            {PANELS.map(panel => {
              const Icon = panel.icon
              const isActive = activePanel === panel.id
              return (
                <button key={panel.id} onClick={() => setActivePanel(panel.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: isActive ? 'rgba(34,197,94,0.15)' : 'transparent',
                    color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
                    border: isActive ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent'
                  }}>
                  <Icon size={13} />
                  <span>{panel.label}</span>
                </button>
              )
            })}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activePanel === 'chat' && pdf && (
                <motion.div key="chat" className="h-full"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <ChatPanel pdfId={pdf.id} onPageJump={(page) => { setHighlightedPages([page]); setCurrentPdfPage(page) }} />
                </motion.div>
              )}
              {activePanel === 'notes' && pdf && (
                <motion.div key="notes" className="h-full"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <NotesPanel pdfId={pdf.id} pdfName={pdf.file_name} disabled={isProcessing} />
                </motion.div>
              )}
              {activePanel === 'quiz' && pdf && (
                <motion.div key="quiz" className="h-full"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <QuizPanel pdfId={pdf.id} disabled={isProcessing} />
                </motion.div>
              )}
              {activePanel === 'exam' && pdf && (
                <motion.div key="exam" className="h-full"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <ExamPanel pdfId={pdf.id} disabled={isProcessing} />
                </motion.div>
              )}
              {!pdf && (
                <div key="loading" className="h-full flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Click-away handlers */}
      {(langDropdown || detailDropdown) && (
        <div className="fixed inset-0 z-40" onClick={() => { setLangDropdown(false); setDetailDropdown(false) }} />
      )}
    </div>
  )
}
