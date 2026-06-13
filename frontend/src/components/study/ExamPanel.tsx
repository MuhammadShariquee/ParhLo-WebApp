import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, AlignLeft, BookOpen, Loader2, RefreshCw, AlertCircle, Lightbulb } from 'lucide-react'
import { examApi } from '../../services/api'
import { useStore } from '../../store/useStore'

interface Props {
  pdfId: string
  disabled?: boolean
}

type Tab = 'important' | 'short' | 'long'

interface TabConfig {
  id: Tab
  label: string
  icon: typeof Star
  desc: string
  marks: string
}

const TABS: TabConfig[] = [
  { id: 'important', label: 'Important', icon: Star, desc: 'Most likely exam questions', marks: 'High priority' },
  { id: 'short', label: 'Short Qs', icon: AlignLeft, desc: '2-3 mark questions', marks: '2-3 marks' },
  { id: 'long', label: 'Long Qs', icon: BookOpen, desc: '5-10 mark questions', marks: '5-10 marks' },
]

export default function ExamPanel({ pdfId, disabled }: Props) {
  const { language } = useStore()
  const [activeTab, setActiveTab] = useState<Tab>('important')
  const [content, setContent] = useState<Record<Tab, string>>({ important: '', short: '', long: '' })
  const [loading, setLoading] = useState<Record<Tab, boolean>>({ important: false, short: false, long: false })
  const [error, setError] = useState<Record<Tab, string>>({ important: '', short: '', long: '' })

  const generate = async (tab: Tab) => {
    if (disabled || loading[tab]) return
    setLoading(prev => ({ ...prev, [tab]: true }))
    setError(prev => ({ ...prev, [tab]: '' }))
    try {
      const data = await examApi.generate(pdfId, tab, language)
      setContent(prev => ({ ...prev, [tab]: data.questions }))
    } catch (err: any) {
      setError(prev => ({ ...prev, [tab]: err.message || 'Failed to generate questions.' }))
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }))
    }
  }

  const renderContent = (raw: string) => {
    return raw.split('\n').map((line, i) => {
      // Numbered question lines
      if (/^\d+\./.test(line.trim())) {
        const parts = line.match(/^(\d+)\.\s*(.+)/)
        if (parts) {
          return (
            <div key={i} className="flex gap-3 p-3 rounded-xl mb-2"
              style={{ backgroundColor: 'var(--bg-card-muted)', border: '1px solid var(--border)' }}>
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--brand)' }}>
                {parts[1]}
              </span>
              <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-primary)' }}>
                {parts[2]}
              </p>
            </div>
          )
        }
      }
      // Marks indicators
      if (line.includes('[') && line.includes('Marks]')) {
        return (
          <div key={i} className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--brand)', border: '1px solid rgba(34,197,94,0.2)' }}>
              {line.trim()}
            </span>
          </div>
        )
      }
      if (line.trim() === '') return <div key={i} className="h-1" />
      return (
        <p key={i} className="text-sm leading-relaxed mb-1" style={{ color: 'var(--text-secondary)' }}>
          {line}
        </p>
      )
    })
  }

  const tab = TABS.find(t => t.id === activeTab)!
  const TabIcon = tab.icon

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={15} style={{ color: 'var(--brand)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
            Exam Mode
          </span>
          <span className="text-xs ml-auto px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(34,197,94,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            Based on uploaded material
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map(t => {
            const Icon = t.icon
            const isActive = activeTab === t.id
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex-1 flex flex-col items-center py-2 px-2 rounded-xl transition-all text-center"
                style={{
                  backgroundColor: isActive ? 'rgba(34,197,94,0.12)' : 'var(--bg-card-muted)',
                  border: `1px solid ${isActive ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                  color: isActive ? 'var(--brand)' : 'var(--text-secondary)'
                }}>
                <Icon size={13} className="mb-0.5" />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            
            {/* Tab header with generate button */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TabIcon size={14} style={{ color: 'var(--brand)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                    {tab.label} Questions
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {tab.desc} · {tab.marks}
                </p>
              </div>
              <button onClick={() => generate(activeTab)} disabled={loading[activeTab] || disabled}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--brand)', border: '1px solid rgba(34,197,94,0.25)' }}>
                {loading[activeTab] ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                {content[activeTab] ? 'Regenerate' : 'Generate'}
              </button>
            </div>

            {/* Error */}
            {error[activeTab] && (
              <div className="flex items-start gap-2 p-3 rounded-xl mb-4 text-sm"
                style={
                  error[activeTab].startsWith('ERROR_')
                    ? { background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.2)' }
                    : { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }
                }>
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                {error[activeTab].replace(/ERROR_LIMIT:|ERROR_QUOTA:/, '')}
              </div>
            )}

            {/* Loading */}
            {loading[activeTab] && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 size={28} className="animate-spin" style={{ color: 'var(--brand)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Generating exam questions...</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Following Pakistani exam patterns</p>
              </div>
            )}

            {/* Questions content */}
            {!loading[activeTab] && content[activeTab] && (
              <div>
                {renderContent(content[activeTab])}
              </div>
            )}

            {/* Empty state */}
            {!loading[activeTab] && !content[activeTab] && !error[activeTab] && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-card-muted)', border: '1px solid var(--border)' }}>
                  <TabIcon size={24} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                    No {tab.label} questions yet
                  </p>
                  <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>
                    Generate {tab.desc.toLowerCase()} following Pakistani exam patterns.
                  </p>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl text-left max-w-xs w-full"
                  style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <Lightbulb size={13} style={{ color: 'var(--brand)' }} className="mt-0.5 flex-shrink-0" />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {activeTab === 'important' && 'These are the most likely topics that will appear in your exam.'}
                    {activeTab === 'short' && 'Short questions require 2-3 sentence answers. Good for quick revision.'}
                    {activeTab === 'long' && 'Detailed questions need paragraphs. Practice writing complete answers.'}
                  </p>
                </div>

                <button onClick={() => generate(activeTab)} disabled={disabled}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: 'var(--brand)', color: '#fff' }}>
                  <TabIcon size={14} />
                  Generate {tab.label} Questions
                </button>
                {disabled && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PDF still processing...</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
