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
import Sidebar from '../components/layout/Sidebar'

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
    { id: 'chat' as ActivePanel, icon: '💬', label: 'AI Chat' },
    { id: 'notes' as ActivePanel, icon: '📝', label: 'Smart Notes' },
    { id: 'quiz' as ActivePanel, icon: '🧩', label: 'MCQ Quiz' },
    { id: 'exam' as ActivePanel, icon: '🎯', label: 'Exam Mode' },
  ]

  const isProcessing = pdfStatus === 'pending' || pdfStatus === 'processing'
  const isFailed = pdfStatus === 'failed'
  const currentLang = LANGUAGES.find(l => l.id === language) || LANGUAGES[0]
  const currentDetail = DETAIL_LEVELS.find(d => d.id === detailLevel) || DETAIL_LEVELS[1]

  return (
    <div className="h-screen flex overflow-hidden font-body" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <Sidebar activePanel={activePanel} setActivePanel={setActivePanel as any} />

      {/* ── Main Workspace ── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--glass-border)] relative">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-20" />
        
        {/* Workspace Header */}
        <header className={`h-20 flex items-center justify-between px-6 border-b border-[var(--glass-border)] shrink-0 relative ${(langDropdown || detailDropdown) ? 'z-50' : 'z-10'}`} style={{ backgroundColor: 'var(--bg-navbar)' }}>
        
          <div className="flex items-center gap-3">
            <span className="text-xl">{PANELS.find(p => p.id === activePanel)?.icon}</span>
            <span className="font-display font-bold text-xl text-[var(--text-primary)] tracking-wide">
              {PANELS.find(p => p.id === activePanel)?.label}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
          {/* Language selector */}
          <div className="relative">
              <button onClick={() => { setLangDropdown(!langDropdown); setDetailDropdown(false) }}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] transition-colors text-[var(--text-secondary)]">
                <Globe size={14} />
                <span className="hidden sm:block">{currentLang.label}</span>
                <ChevronDown size={12} />
              </button>
            <AnimatePresence>
              {langDropdown && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--glass-border)] shadow-2xl z-50 overflow-hidden bg-surface-900 p-1">
                  {LANGUAGES.map(l => (
                    <button key={l.id} onClick={(e) => { e.stopPropagation(); setLanguage(l.id); setLangDropdown(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors rounded-lg hover:bg-[var(--glass-bg-hover)]"
                      style={{ color: language === l.id ? 'var(--brand)' : 'var(--text-primary)', background: language === l.id ? 'rgba(79,70,229,0.1)' : '' }}>
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                      {language === l.id && <span className="ml-auto text-xs font-bold text-brand-500">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Detail level */}
          <div className="relative">
              <button onClick={() => { setDetailDropdown(!detailDropdown); setLangDropdown(false) }}
                className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 transition-colors text-brand-400">
                <span>{currentDetail.label} Detail</span>
                <ChevronDown size={12} />
              </button>
            <AnimatePresence>
              {detailDropdown && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--glass-border)] shadow-2xl z-50 overflow-hidden bg-surface-900 p-1">
                  {DETAIL_LEVELS.map(d => (
                    <button key={d.id} onClick={(e) => { e.stopPropagation(); setDetailLevel(d.id as any); setDetailDropdown(false); }}
                      className="w-full flex flex-col px-3 py-2.5 text-left transition-colors rounded-lg hover:bg-[var(--glass-bg-hover)]"
                      style={{ background: detailLevel === d.id ? 'rgba(79,70,229,0.1)' : '' }}>
                      <span className="text-sm font-medium flex items-center justify-between w-full" style={{ color: detailLevel === d.id ? 'var(--brand)' : 'var(--text-primary)' }}>
                        {d.label}
                        {detailLevel === d.id && <span className="text-xs font-bold text-brand-500">✓</span>}
                      </span>
                      <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{d.desc}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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

      {/* Mobile View Toggle */}
      <div className="flex lg:hidden items-center gap-0 border flex-shrink-0 absolute bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--glass-border)' }}>
        <button onClick={() => setMobileView('panel')}
          className={`px-6 py-3 text-sm font-bold transition-colors ${mobileView === 'panel' ? 'bg-brand-500 text-white' : 'text-[var(--text-secondary)]'}`}>
          💬 Workspace
        </button>
        <button onClick={() => setMobileView('pdf')}
          className={`px-6 py-3 text-sm font-bold transition-colors ${mobileView === 'pdf' ? 'bg-brand-500 text-white' : 'text-[var(--text-secondary)]'}`}>
          📄 PDF
        </button>
      </div>

      {/* ── Active Panel Container ── */}
      <div className={`${mobileView === 'panel' ? 'flex' : 'hidden'} lg:flex flex-1 overflow-hidden p-6 relative z-10`}>
        <div className="w-full h-full glass-card rounded-2xl overflow-hidden flex flex-col relative">
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

    {/* ── Right Context Panel (PDF) ── */}
    <div className={`${mobileView === 'pdf' ? 'flex fixed inset-0 z-40 pt-0' : 'hidden'} lg:flex lg:w-[35%] min-w-[350px] flex-col relative z-10`} style={{ backgroundColor: 'var(--bg-page)' }}>
      <div className="h-20 border-b border-[var(--glass-border)] flex items-center justify-between px-6 shrink-0" style={{ backgroundColor: 'var(--bg-navbar)' }}>
         <div className="flex items-center gap-3 min-w-0">
           <BookOpen size={18} className="text-brand-400 shrink-0" />
           <span className="text-sm font-bold text-[var(--text-primary)] truncate">{pdf?.file_name || 'Loading...'}</span>
         </div>
         {pdfStatus === 'ready' && (
           <span className="text-[10px] font-bold px-2 py-1 rounded bg-green-500/20 text-green-500 uppercase tracking-wider shrink-0 ml-3">
             Ready
           </span>
         )}
      </div>
      <div className="flex-1 overflow-hidden p-6 pb-24 lg:pb-6">
        <div className="w-full h-full glass-card rounded-2xl overflow-hidden shadow-2xl relative border" style={{ borderColor: 'var(--border)' }}>
          {pdf ? (
            <PDFViewer
              pdfId={pdf.id}
              pdfUrl={pdfApi.getServeUrl(pdf.id)}
              highlightedPages={highlightedPages}
              onPageChange={setCurrentPdfPage}
            />
          ) : (
            <div className="flex-1 h-full flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-slate-500" />
            </div>
          )}
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
