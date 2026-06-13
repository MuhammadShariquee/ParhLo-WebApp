import { useNavigate, useLocation } from 'react-router-dom'
import { MessageSquare, FileText, Brain, Trophy, Settings, LogOut, Sun, Moon, X } from 'lucide-react'
import { useStore } from '../../store/useStore'

interface SidebarProps {
  activePanel?: string
  setActivePanel?: (panel: any) => void
}

export default function Sidebar({ activePanel, setActivePanel }: SidebarProps) {
  const { theme, toggleTheme, signOut, activePdf, setIsSettingsOpen, isMobileMenuOpen, setIsMobileMenuOpen } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  const isDashboard = location.pathname === '/dashboard'

  const navItems = [
    { id: 'chat', icon: <MessageSquare size={18} />, label: 'AI Chat' },
    { id: 'notes', icon: <FileText size={18} />, label: 'Smart Notes' },
    { id: 'quiz', icon: <Brain size={18} />, label: 'MCQ Quiz' },
    { id: 'exam', icon: <Trophy size={18} />, label: 'Exam Mode' },
  ]

  const handleNavClick = (id: string) => {
    if (isDashboard) {
       if (activePdf) {
         navigate(`/study/${activePdf.id}`)
         // Assuming StudyRoomPage defaults to chat or we could pass via state, but default is fine.
       } else {
         alert("Please select a PDF first from your library to use study tools.")
       }
    } else {
       if (setActivePanel) setActivePanel(id)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed md:relative top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col shrink-0 border-r border-[var(--glass-border)]`} 
        style={{ backgroundColor: 'var(--bg-sidebar)' }}
      >
        <div className="h-20 flex items-center px-6 gap-3 justify-between shrink-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-500/5 border border-brand-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.15)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]">
              <span className="text-xl">📚</span>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>ParhLo</span>
          </div>
          {/* Close button on mobile */}
          <button className="md:hidden p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-bold mb-4 px-2 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Study Tools</div>
        {navItems.map(item => {
          const isActive = activePanel === item.id && !isDashboard
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                isActive 
                  ? 'border border-[var(--glass-border)] -translate-y-0.5'
                  : 'hover:-translate-y-0.5'
              }`}
              style={{
                backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 0 20px rgba(79,70,229,0.2)' : 'none'
              }}
            >
              <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="px-4 py-6 border-t border-[var(--glass-border)] space-y-2">
        <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-[var(--glass-bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
          <Settings size={18} style={{ color: 'var(--text-muted)' }} />
          Settings
        </button>
        <div className="flex items-center gap-2 mt-2 px-2 pt-2">
          <button onClick={toggleTheme} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-colors hover:bg-[var(--glass-bg-hover)]" style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={signOut} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-colors hover:bg-red-400/10 hover:text-red-500" style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}>
            <LogOut size={14} />
          </button>
        </div>
        <div className="mt-4 pt-2 text-center">
          <p className="text-[10px] leading-relaxed opacity-60" style={{ color: 'var(--text-muted)' }}>
            ParhLo is currently free and powered by free-tier AI APIs. Occasional delays during peak usage are expected! 🚀
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
