import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { pdfApi, type PDF } from '../services/api'
import {
  Trash2, Pencil, BookOpen, Clock, CheckCircle, XCircle, Loader, MoreVertical, ArrowRight
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'

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
  const { user, pdfs, setPdfs, addPdf, updatePdf, removePdf } = useStore()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

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
    <div className="h-screen flex overflow-hidden font-body" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-20" />
      <Sidebar />

      <main className="flex-1 overflow-y-auto relative z-10 p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
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
            className="glass-card p-4 mb-6 flex items-center gap-4 cursor-pointer transition-colors"
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
          className="glass-card p-10 mb-8 text-center border-dashed transition-all cursor-pointer relative overflow-hidden group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
          <div className="w-16 h-16 rounded-2xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            {uploading ? (
              <Loader size={28} className="text-brand-400 animate-spin" />
            ) : (
              <span className="text-3xl">📚</span>
            )}
          </div>
          <h2 className="font-display font-bold text-2xl mb-3" style={{ color: 'var(--text-primary)' }}>
            {uploading ? 'Processing Study Material...' : 'Upload Study Material'}
          </h2>
          <p className="text-base mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {uploading ? 'Extracting text and generating embeddings...' : 'Upload PDFs, Notes, Slides, Books, and Handouts'}
          </p>
          {!uploading && (
             <div className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-[#4F46E5] text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all group-hover:-translate-y-0.5 group-hover:bg-[#4338ca]">
               Upload PDF
             </div>
          )}
          <p className="text-xs mt-6 font-medium" style={{ color: 'var(--text-muted)' }}>
            Supported: PDF files up to 50MB
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
          <div className="text-center py-16 glass-card border-dashed">
            <div className="text-5xl mb-4">📚</div>
            <p className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Your Study Library is Empty</p>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Upload your first PDF to start chatting, generating notes, and creating MCQs.</p>
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
                className={`glass-card p-4 flex items-center gap-4 group ${openMenuId === pdf.id ? 'relative z-50' : 'relative z-10'}`}
              >
                <div className="flex-1 min-w-0 py-2">
                  {renamingId === pdf.id ? (
                    <div className="flex gap-2">
                      <input
                        ref={renameInputRef}
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
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">📄</span>
                        <p className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>{pdf.file_name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Status:</span>
                        <StatusBadge status={pdf.chunk_status} />
                        <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                          {new Date(pdf.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                      {pdf.chunk_status === 'ready' && (
                        <div className="glass-card flex flex-wrap items-center gap-4 mt-4 text-sm rounded-xl p-3 w-fit">
                          <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--accent)' }}>✓ Ready for Chat</span>
                          <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--accent)' }}>✓ Ready for Notes</span>
                          <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--accent)' }}>✓ Ready for MCQs</span>
                        </div>
                      )}
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
                            onClick={(e) => { e.stopPropagation(); setRenamingId(pdf.id); setRenameValue(pdf.file_name); setOpenMenuId(null); }}
                            className="btn-ghost w-full justify-start text-xs px-3 py-2"
                          >
                            <Pencil size={12} /> Rename
                          </button>
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenuId(null); 
                              setTimeout(() => handleDelete(pdf.id), 10);
                            }}
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
        </div>
      </main>

      {/* Close menus on outside click */}
      {openMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  )
}
