import { useState, useEffect, useRef } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../services/supabase'
interface Props {
  pdfId: string
  pdfUrl: string
  highlightedPages: number[]
  onPageChange?: (page: number) => void
}

export default function PDFViewer({ pdfUrl, highlightedPages, onPageChange }: Props) {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Jump to highlighted page when source pages update
  useEffect(() => {
    if (highlightedPages.length > 0) {
      const page = highlightedPages[0]
      setCurrentPage(page)
      onPageChange?.(page)
    }
  }, [highlightedPages])

  const handleIframeLoad = () => {
    setLoading(false)
  }

  const handleIframeError = () => {
    setError('Could not load PDF preview. You can still use chat.')
    setLoading(false)
  }

  const [viewerUrl, setViewerUrl] = useState('')

  useEffect(() => {
    const fetchUrl = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      setViewerUrl(`${pdfUrl}?token=${token || ''}#page=${currentPage}`)
    }
    fetchUrl()
  }, [pdfUrl, currentPage])

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface-900)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-800)' }}>
        
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="p-1.5 rounded-lg transition-colors hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}>
            <ZoomOut size={14} />
          </button>
          <span className="text-xs w-10 text-center" style={{ color: 'var(--text-muted)' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.25))}
            className="p-1.5 rounded-lg transition-colors hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}>
            <ZoomIn size={14} />
          </button>
        </div>

        {/* Source page indicator */}
        <AnimatePresence>
          {highlightedPages.length > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--brand)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Source: {highlightedPages.length === 1 ? `Page ${highlightedPages[0]}` : `Pages ${highlightedPages.join(', ')}`}
            </motion.div>
          )}
        </AnimatePresence>

        <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-lg transition-colors hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}>
          <Maximize2 size={14} />
        </a>
      </div>

      {/* PDF Display */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: 'var(--surface-900)' }}>
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--brand)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading PDF...</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
            <div className="text-4xl">📄</div>
            <div>
              <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>PDF Preview Unavailable</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
            </div>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm px-4 py-2 rounded-lg transition-colors"
              style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--brand)' }}>
              Open PDF in new tab →
            </a>
          </div>
        ) : (
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', height: '100%', width: '100%' }}>
            {viewerUrl && (
              <iframe
                ref={iframeRef}
                src={viewerUrl}
                className="w-full h-full border-none"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title="PDF Viewer"
                style={{ minHeight: '100%' }}
              />
            )}
          </div>
        )}
      </div>

      {/* Page indicator with highlighted pages */}
      {highlightedPages.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t flex-shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-800)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Answer found on:</span>
          {highlightedPages.map(page => (
            <button key={page} onClick={() => { setCurrentPage(page); onPageChange?.(page) }}
              className="text-xs px-2 py-0.5 rounded-md font-medium transition-colors"
              style={{
                background: currentPage === page ? 'var(--brand)' : 'rgba(34,197,94,0.15)',
                color: currentPage === page ? '#000' : 'var(--brand)'
              }}>
              Page {page}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
