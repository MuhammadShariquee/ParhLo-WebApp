import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, RefreshCw, Loader2, Sparkles, AlertCircle, Copy, Check } from 'lucide-react'
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
  const [copied, setCopied] = useState(false)

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
    const sections: { title: string, lines: string[] }[] = []
    let currentSection = { title: 'General', lines: [] as string[] }
    
    raw.split('\n').forEach(line => {
      if (line.startsWith('## ')) {
        if (currentSection.lines.length > 0 || currentSection.title !== 'General') {
          sections.push(currentSection)
        }
        currentSection = { title: line.replace('## ', ''), lines: [] }
      } else {
        currentSection.lines.push(line)
      }
    })
    if (currentSection.lines.length > 0) {
      sections.push(currentSection)
    }

    return (
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="glass-card p-6 transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-[#4F46E5] font-display">
              {section.title}
            </h3>
            <ul className="space-y-3 m-0 p-0 list-none">
              {section.lines.map((line, i) => {
                if (line.startsWith('- ') || line.startsWith('• ')) {
                  return (
                    <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#4F46E5] flex-shrink-0 shadow-[0_0_8px_rgba(79,70,229,0.8)]" />
                      <span>{line.replace(/^[-•]\s*/, '')}</span>
                    </li>
                  )
                }
                if (line.startsWith('  -') || line.startsWith('   -')) {
                  return (
                    <li key={i} className="flex items-start gap-3 text-sm leading-relaxed ml-6 mt-1" style={{ color: 'var(--text-secondary)' }}>
                      <span className="mt-2 w-1 h-1 rounded-full bg-slate-500 flex-shrink-0" />
                      <span>{line.replace(/^\s*-\s*/, '')}</span>
                    </li>
                  )
                }
                if (line.trim() === '') return null
                return (
                  <p key={i} className="text-[15px] leading-relaxed mb-2" style={{ color: 'var(--text-primary)' }}>
                    {line}
                  </p>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    )
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
            <div className="flex items-center gap-2 mr-2">
              <button onClick={() => {
                navigator.clipboard.writeText(notes)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--glass-bg-hover)]"
                style={{ backgroundColor: 'var(--bg-card-muted)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={downloadNotes}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--glass-bg-hover)]"
                style={{ backgroundColor: 'var(--bg-card-muted)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <Download size={12} />
                Export PDF
              </button>
            </div>
          )}
          <button onClick={generateNotes} disabled={loading || disabled}
            className="btn-primary px-4 py-2 text-xs">
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
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {renderNotes(notes)}
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
              className="btn-primary flex items-center justify-center gap-2">
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
