import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, RefreshCw, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { notesApi } from '../../services/api'
import { useStore } from '../../store/useStore'

interface Props {
  pdfId: string
  pdfName?: string
  disabled?: boolean
}

export default function NotesPanel({ pdfId, pdfName, disabled }: Props) {
  const { language } = useStore()
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    loadExistingNotes()
  }, [pdfId])

  const loadExistingNotes = async () => {
    try {
      const data = await notesApi.get(pdfId)
      if (data.notes) {
        setNotes(data.notes)
        setHasLoaded(true)
      }
    } catch {}
  }

  const generateNotes = async () => {
    if (disabled) return
    setLoading(true)
    setError('')
    try {
      const data = await notesApi.generate(pdfId, language)
      setNotes(data.notes)
      setHasLoaded(true)
    } catch (err: any) {
      setError(err.message || 'Failed to generate notes. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const downloadNotes = () => {
    if (!notes) return
    const blob = new Blob([`ParhLo Study Notes\n${pdfName || 'Untitled'}\n\n${notes}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(pdfName || 'notes').replace('.pdf', '')}_notes.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderNotes = (raw: string) => {
    // Convert markdown-ish to styled HTML
    return raw
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="text-base font-semibold mt-4 mb-2 first:mt-0"
              style={{ color: 'var(--brand)', fontFamily: 'Syne, sans-serif' }}>
              {line.replace('## ', '')}
            </h3>
          )
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed mb-1"
              style={{ color: 'var(--text-primary)' }}>
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--brand)' }} />
              <span>{line.replace(/^[-•]\s*/, '')}</span>
            </li>
          )
        }
        if (line.startsWith('  -') || line.startsWith('   -')) {
          return (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed mb-1 ml-4"
              style={{ color: 'var(--text-secondary)' }}>
              <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--text-muted)' }} />
              <span>{line.replace(/^\s*-\s*/, '')}</span>
            </li>
          )
        }
        if (line.trim() === '') return <div key={i} className="h-2" />
        return (
          <p key={i} className="text-sm leading-relaxed mb-1" style={{ color: 'var(--text-primary)' }}>
            {line}
          </p>
        )
      })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <FileText size={15} style={{ color: 'var(--brand)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
            Smart Notes
          </span>
        </div>
        <div className="flex items-center gap-2">
          {notes && (
            <button onClick={downloadNotes}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface-700)' }}>
              <Download size={12} />
              Download
            </button>
          )}
          <button onClick={generateNotes} disabled={loading || disabled}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--brand)', border: '1px solid rgba(34,197,94,0.25)' }}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {hasLoaded ? 'Regenerate' : 'Generate Notes'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl mb-4 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Sparkles size={20} style={{ color: 'var(--brand)' }} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: 'var(--surface-800)' }}>
                <Loader2 size={10} className="animate-spin" style={{ color: 'var(--brand)' }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Generating Notes...</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Reading your PDF carefully</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--brand)', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : notes ? (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4" style={{ background: 'var(--surface-800)', border: '1px solid var(--border)' }}>
              <ul className="list-none m-0 p-0">
                {renderNotes(notes)}
              </ul>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--surface-700)', border: '1px solid var(--border)' }}>
              <FileText size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                No notes yet
              </p>
              <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
                Click "Generate Notes" to create bullet-point study notes from your PDF.
              </p>
            </div>
            <button onClick={generateNotes} disabled={disabled}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'var(--brand)', color: '#000' }}>
              <Sparkles size={15} />
              Generate Smart Notes
            </button>
            {disabled && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Waiting for PDF to finish processing...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
