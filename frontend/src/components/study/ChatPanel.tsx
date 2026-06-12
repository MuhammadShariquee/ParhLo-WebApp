import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore, type LocalChatMessage } from '../../store/useStore'
import { chatApi } from '../../services/api'
import {
  Send, Copy, RotateCcw, Lightbulb, Minimize2, Hash,
  AlertCircle, CheckCheck, Bot, User, ShieldCheck
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface ChatPanelProps {
  pdfId: string
  onPageJump?: (page: number) => void
}

const TypingEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 3))
      i += 3
      if (i >= text.length) {
        setDisplayedText(text)
        clearInterval(interval)
      }
    }, 10)
    return () => clearInterval(interval)
  }, [text])

  return (
    <span className="relative">
      {displayedText}
      {displayedText.length < text.length && (
        <span className="inline-block ml-[2px] w-[2px] h-[1em] bg-white align-middle animate-[pulse_0.5s_ease-in-out_infinite]" />
      )}
    </span>
  )
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function ChatBubble({ msg, onCopy, onRegenerate, onQuickAction, onPageJump }: {
  msg: LocalChatMessage
  onCopy: (text: string) => void
  onRegenerate?: (question: string) => void
  onQuickAction?: (action: string, originalQuestion: string, answer: string) => void
  onPageJump?: (page: number) => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (msg.isLoading) {
    return (
      <div className="flex gap-3 items-start">
        <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0 mt-1">
          <Bot size={14} className="text-brand-400" />
        </div>
        <div className="chat-bubble-ai flex flex-col gap-2 min-w-[150px]">
          <div className="w-3/4 h-3 rounded bg-white/10 animate-pulse" />
          <div className="w-1/2 h-3 rounded bg-white/10 animate-pulse" />
        </div>
      </div>
    )
  }

  if (msg.type === 'user') {
    return (
      <div className="flex gap-3 items-start justify-end">
        <div className="chat-bubble-user">
          <p className="whitespace-pre-wrap">{msg.content}</p>
          <p className="text-xs mt-1 opacity-50 text-right">{formatTime(msg.timestamp)}</p>
        </div>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ backgroundColor: 'var(--bg-card-muted)' }}>
          <User size={14} style={{ color: 'var(--text-secondary)' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0 mt-1">
        <Bot size={14} className="text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="chat-bubble-ai glass-card">
          <div className="prose-chat whitespace-pre-wrap"><TypingEffect text={msg.content} /></div>

          {/* Source pages */}
          {msg.source_pages && msg.source_pages.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="inline-flex items-center gap-2 border px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-card-muted)', borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>📄 Document</span>
                {msg.source_pages.map(page => (
                  <button
                    key={page}
                    onClick={() => onPageJump?.(page)}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Pg {page}
                  </button>
                ))}
                <div className="w-px h-3 mx-1" style={{ backgroundColor: 'var(--border)' }} />
                <ShieldCheck size={14} className="text-green-400" />
                <span className="text-green-400 text-xs font-bold tracking-wide uppercase">Verified Source</span>
              </div>
            </div>
          )}

          {/* No context warning */}
          {msg.used_context === false && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-400">
              <AlertCircle size={12} />
              Not found in uploaded material
            </div>
          )}

          <p className="text-xs mt-2 opacity-40">{formatTime(msg.timestamp)}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <button onClick={handleCopy} className="btn-ghost text-xs px-2 py-1">
            {copied ? <CheckCheck size={12} className="text-brand-400" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {onRegenerate && (
            <button onClick={() => onRegenerate(msg.content)} className="btn-ghost text-xs px-2 py-1">
              <RotateCcw size={12} /> Regenerate
            </button>
          )}
          {onQuickAction && (
            <>
              <button onClick={() => onQuickAction('explain_simply', '', msg.content)} className="btn-ghost text-xs px-2 py-1">
                <Lightbulb size={12} /> Explain Simply
              </button>
              <button onClick={() => onQuickAction('make_shorter', '', msg.content)} className="btn-ghost text-xs px-2 py-1">
                <Minimize2 size={12} /> Make Shorter
              </button>
              <button onClick={() => onQuickAction('generate_mcqs', '', msg.content)} className="btn-ghost text-xs px-2 py-1">
                <Hash size={12} /> MCQs
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const DETAIL_LEVELS = [
  { value: 'simple', label: 'Simple' },
  { value: 'medium', label: 'Medium' },
  { value: 'detailed', label: 'Detailed' },
] as const

const LANGUAGES = [
  { value: 'english', label: 'EN' },
  { value: 'urdu', label: 'اردو' },
  { value: 'roman_urdu', label: 'RU' },
] as const

export default function ChatPanel({ pdfId, onPageJump }: ChatPanelProps) {
  const { chatMessages, addChatMessage, language, setLanguage, detailLevel, setDetailLevel } = useStore()
  const [input, setInput] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messages = chatMessages[pdfId] || []
  const lastUserMessage = messages.filter(m => m.type === 'user').slice(-1)[0]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (question: string) => {
    if (!question.trim() || isAsking) return

    const userMsg: LocalChatMessage = {
      id: uuidv4(),
      type: 'user',
      content: question.trim(),
      timestamp: new Date(),
    }

    const loadingMsg: LocalChatMessage = {
      id: uuidv4(),
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    addChatMessage(pdfId, userMsg)
    addChatMessage(pdfId, loadingMsg)
    setInput('')
    setIsAsking(true)

    try {
      const result = await chatApi.ask({
        pdf_id: pdfId,
        question: question.trim(),
        detail_level: detailLevel,
        language: language,
      })

      // Replace loading message
      const aiMsg: LocalChatMessage = {
        id: loadingMsg.id,
        type: 'ai',
        content: result.answer,
        source_pages: result.source_pages,
        used_context: result.used_context,
        timestamp: new Date(),
      }

      useStore.setState(state => ({
        chatMessages: {
          ...state.chatMessages,
          [pdfId]: state.chatMessages[pdfId].map(m => m.id === loadingMsg.id ? aiMsg : m)
        }
      }))

    } catch (err: any) {
      const errorMsg: LocalChatMessage = {
        id: loadingMsg.id,
        type: 'ai',
        content: `Something went wrong: ${err.message || 'Please try again'}`,
        timestamp: new Date(),
        used_context: false,
      }
      useStore.setState(state => ({
        chatMessages: {
          ...state.chatMessages,
          [pdfId]: state.chatMessages[pdfId].map(m => m.id === loadingMsg.id ? errorMsg : m)
        }
      }))
    } finally {
      setIsAsking(false)
    }
  }

  const handleQuickAction = async (action: string, _originalQuestion: string, currentAnswer: string) => {
    if (isAsking) return

    const actionLabels: Record<string, string> = {
      explain_simply: '💡 Explain Simply',
      make_shorter: '✂️ Make Shorter',
      generate_mcqs: '🧩 Generate MCQs',
    }

    const loadingMsg: LocalChatMessage = {
      id: uuidv4(),
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    addChatMessage(pdfId, {
      id: uuidv4(),
      type: 'user',
      content: actionLabels[action] || action,
      timestamp: new Date(),
    })
    addChatMessage(pdfId, loadingMsg)
    setIsAsking(true)

    try {
      const result = await chatApi.quickAction({
        pdf_id: pdfId,
        action,
        original_question: lastUserMessage?.content || '',
        current_answer: currentAnswer,
      })

      const aiMsg: LocalChatMessage = {
        id: loadingMsg.id,
        type: 'ai',
        content: result.answer,
        timestamp: new Date(),
      }

      useStore.setState(state => ({
        chatMessages: {
          ...state.chatMessages,
          [pdfId]: state.chatMessages[pdfId].map(m => m.id === loadingMsg.id ? aiMsg : m)
        }
      }))
    } catch (err: any) {
      useStore.setState(state => ({
        chatMessages: {
          ...state.chatMessages,
          [pdfId]: state.chatMessages[pdfId].map(m =>
            m.id === loadingMsg.id
              ? { ...m, content: 'Action failed. Please try again.', isLoading: false }
              : m
          )
        }
      }))
    } finally {
      setIsAsking(false)
    }
  }

  const handleRegenerate = () => {
    if (lastUserMessage) sendMessage(lastUserMessage.content)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-card-muted)' }}>
          {DETAIL_LEVELS.map(l => (
            <button
              key={l.value}
              onClick={() => setDetailLevel(l.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                detailLevel === l.value
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'hover:opacity-70'
              }`}
              style={{ color: detailLevel !== l.value ? 'var(--text-secondary)' : undefined }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 p-1 rounded-lg ml-auto" style={{ backgroundColor: 'var(--bg-card-muted)' }}>
          {LANGUAGES.map(l => (
            <button
              key={l.value}
              onClick={() => setLanguage(l.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                language === l.value
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'hover:opacity-70'
              }`}
              style={{ color: language !== l.value ? 'var(--text-secondary)' : undefined }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
            <div className="flex items-center justify-center transition-colors border w-16 h-16"
                 style={{ backgroundColor: 'var(--empty-icon-bg)', borderColor: 'var(--empty-icon-border)', borderRadius: 'var(--empty-icon-radius)' }}>
              <Bot size={28} style={{ color: 'var(--empty-icon-color)' }} />
            </div>
            <div className="text-center">
              <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Ask anything</p>
              <p className="text-sm max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                I'll answer strictly from your uploaded PDF
              </p>
            </div>
            {/* Suggested questions */}
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {['Summarize this', 'What are key concepts?', 'Important definitions?'].map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ChatBubble
              msg={msg}
              onCopy={copyToClipboard}
              onRegenerate={msg.type === 'ai' && !msg.isLoading ? handleRegenerate : undefined}
              onQuickAction={msg.type === 'ai' && !msg.isLoading ? handleQuickAction : undefined}
              onPageJump={onPageJump}
            />
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-2 items-end p-3 rounded-2xl border focus-within:border-brand-500/50 transition-colors"
          style={{ backgroundColor: 'var(--bg-card-muted)', borderColor: 'var(--border)' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask from your PDF... (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-sm py-0.5 max-h-32"
            style={{ color: 'var(--text-primary)' }}
            disabled={isAsking}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isAsking}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-brand-500 hover:bg-brand-600 active:scale-95"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Answers strictly from your uploaded PDF
        </p>
      </div>
    </div>
  )
}
