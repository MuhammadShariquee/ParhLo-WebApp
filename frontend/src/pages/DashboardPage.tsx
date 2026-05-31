import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { pdfApi, type PDF } from '../services/api'
import {
  Upload, Trash2, Pencil, Sun, Moon, LogOut, BookOpen,
  Clock, CheckCircle, XCircle, Loader, MoreVertical, ArrowRight
} from 'lucide-react'

function StatusBadge({ status }: { status: PDF['chunk_status'] }) {
  const map = {
    pending: { icon: <Clock size={12} />, label: 'Pending', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
    processing: { icon: <Loader size={12} className="animate-spin" />, label: 'Processing', color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
    ready: { icon: <CheckCircle size={12} />, label: 'Ready', color: 'text-brand-400 border-brand-500/30 bg-brand-500/10' },
    failed: { icon: <XCircle size={12} />, label: 'Failed', color: 'text-red-400 border-red-400/30 bg-red-400/10' },
  }
  const m = map[status] || map.pending
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${m.color}`}>
      {m.icon} {m.label}
    </span>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, pdfs, setPdfs, addPdf, updatePdf, removePdf, theme, toggleTheme, signOut } = useStore()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPdfs()
  }, [])

  // Poll processing PDFs
  useEffect(() => {
    const processingPdfs = pdfs.filter(p => p.chunk_status === 'pending' || p.chunk_status === 'processing')
    if (processingPdfs.length === 0) return

    const interval = setInterval(async () => {
      for (const pdf of processingPdfs) {
        try {
          const status = await pdfApi.getStatus(pdf.id)
          if (status.status !== pdf.chunk_status) {
            updatePdf(pdf.id, { chunk_status: status.status as PDF['chunk_status'] })
          }
        } catch {}
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [pdfs])

  const loadPdfs = async () => {
    try {
      const data = await pdfApi.list()
      setPdfs(data.pdfs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.pdf')) {
      setUploadError('Only PDF files are allowed')
      return
    }

    setUploading(true)
    setUploadError('')
    try {
      const result = await pdfApi.upload(file)
      addPdf(result.pdf)
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return
    try {
      await pdfApi.rename(id, renameValue.trim())
      updatePdf(id, { file_name: renameValue.trim() })
      setRenamingId(null)
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this PDF? This cannot be undone.')) return
    try {
      await pdfApi.delete(id)
      removePdf(id)
    } catch {}
  }

  const openStudy = (pdf: PDF) => {
    if (pdf.chunk_status !== 'ready') return
    navigate(`/study/${pdf.id}`)
  }

  const lastPdf = pdfs.find(p => p.chunk_status === 'ready')

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-900)' }}>
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <span>📚</span>
          </div>
          <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>ParhLo</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="btn-ghost p-2">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={signOut} className="btn-ghost p-2">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display font-bold text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
            Assalam o Alaikum, {user?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Ready to study smarter today?</p>
        </motion.div>

        {/* Continue last session */}
        {lastPdf && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 mb-6 flex items-center gap-4 cursor-pointer hover:border-brand-500/30 transition-colors"
            onClick={() => openStudy(lastPdf)}
          >
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Continue last session</p>
              <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{lastPdf.file_name}</p>
            </div>
            <ArrowRight size={16} className="text-brand-400 shrink-0" />
          </motion.div>
        )}

        {/* Upload area */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6 mb-8 text-center border-dashed hover:border-brand-500/30 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
          <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center mx-auto mb-3">
            {uploading ? (
              <Loader size={24} className="text-brand-400 animate-spin" />
            ) : (
              <Upload size={24} className="text-brand-400" />
            )}
          </div>
          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {uploading ? 'Processing your file...' : 'Click to browse or drag & drop · Max 50MB'}
          </p>
          {uploadError && (
            <p className="text-sm text-red-400 mt-2">{uploadError}</p>
          )}
        </motion.div>

        {/* PDF list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="glass-card p-4 h-16 shimmer-bg" />
            ))}
          </div>
        ) : pdfs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📚</div>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No PDFs yet</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Upload your first PDF to start studying</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-display font-semibold text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              YOUR UPLOADS ({pdfs.length})
            </h2>
            {pdfs.map((pdf, i) => (
              <motion.div
                key={pdf.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <span className="text-xl">📄</span>
                </div>

                <div className="flex-1 min-w-0">
                  {renamingId === pdf.id ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(pdf.id)
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        className="input-base py-1 px-2 text-sm flex-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button onClick={() => handleRename(pdf.id)} className="btn-primary px-3 py-1 text-xs">Save</button>
                      <button onClick={() => setRenamingId(null)} className="btn-ghost px-2 py-1 text-xs">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{pdf.file_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={pdf.chunk_status} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(pdf.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {pdf.chunk_status === 'ready' && (
                    <button
                      onClick={() => openStudy(pdf)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Study <ArrowRight size={12} />
                    </button>
                  )}

                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === pdf.id ? null : pdf.id) }}
                      className="btn-ghost p-2"
                    >
                      <MoreVertical size={14} />
                    </button>

                    <AnimatePresence>
                      {openMenuId === pdf.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -8 }}
                          className="absolute right-0 top-full mt-1 w-36 glass-card p-1 z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => { setRenamingId(pdf.id); setRenameValue(pdf.file_name); setOpenMenuId(null) }}
                            className="btn-ghost w-full justify-start text-xs px-3 py-2"
                          >
                            <Pencil size={12} /> Rename
                          </button>
                          <button
                            onClick={() => { handleDelete(pdf.id); setOpenMenuId(null) }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Close menus on outside click */}
      {openMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  )
}
