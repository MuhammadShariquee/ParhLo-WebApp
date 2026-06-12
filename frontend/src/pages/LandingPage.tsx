import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Play, CheckCircle2, BookOpen, BrainCircuit, ShieldCheck, UploadCloud, Cpu, MessageCircle, GraduationCap, Star, Menu, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useEffect, useState, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'

const FAQItem = ({ question, answer, index }: { question: string, answer: string, index: number }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="glass-card overflow-hidden transition-all duration-300"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
      >
        <span className="font-bold text-white text-[16px]">{question}</span>
        <span className="text-brand-400 text-2xl leading-none font-light ml-4">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-5 text-slate-400 font-medium leading-relaxed"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const DashboardMockup = () => {
  return (
    <div className="relative z-10 w-full aspect-[16/9] md:aspect-[21/9] bg-[#09090b] rounded-2xl border border-white/10 overflow-hidden flex font-body text-left shadow-2xl">
      {/* Left Panel: Sidebar */}
      <div className="hidden md:flex w-[20%] border-r border-white/10 flex-col bg-[#09090b]">
        <div className="h-14 border-b border-white/10 flex items-center px-4 gap-2 bg-white/[0.02]">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <span className="text-sm">📚</span>
          </div>
          <span className="font-bold text-white tracking-tight">ParhLo</span>
        </div>
        <div className="flex-1 p-3 space-y-1">
           <div className="text-[10px] font-bold text-slate-500 mb-2 px-2 tracking-widest uppercase mt-2">Tools</div>
           <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] border border-white/10">
              <MessageCircle size={14} />
              <span className="text-xs font-bold">AI Chat</span>
           </div>
           <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400">
              <BookOpen size={14} className="text-brand-400" />
              <span className="text-xs font-semibold">Smart Notes</span>
           </div>
           <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400">
              <BrainCircuit size={14} className="text-brand-400" />
              <span className="text-xs font-semibold">MCQ Quiz</span>
           </div>
           <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400">
              <GraduationCap size={14} className="text-brand-400" />
              <span className="text-xs font-semibold">Exam Mode</span>
           </div>
        </div>
      </div>

      {/* Center Panel: Main Workspace (AI Chat) */}
      <div className="w-full md:w-[45%] border-r border-white/10 flex flex-col bg-[#09090b] relative">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-20" />
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-white/[0.02] relative z-10">
          <div className="flex items-center gap-2">
             <MessageCircle size={16} className="text-brand-400" />
             <span className="text-sm font-bold text-white">AI Chat</span>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-500/15 border border-brand-500/30 text-brand-400">Detailed</span>
          </div>
        </div>
        <div className="flex-1 p-4 md:p-6 space-y-5 overflow-hidden relative z-10">
           <div className="w-full h-full glass-card border-white/10 rounded-xl overflow-hidden flex flex-col bg-[#09090b]/50 shadow-2xl p-4">
             <div className="flex justify-end mb-4">
               <div className="bg-brand-500 text-white text-[11px] md:text-xs px-3 py-2 rounded-xl rounded-tr-sm max-w-[85%] shadow-md font-medium">
                 Newton ka 2nd law kya hai aur iski equation kya hai?
               </div>
             </div>
             <div className="flex justify-start">
               <div className="bg-white/[0.04] border border-white/10 text-slate-200 text-[11px] md:text-xs px-3 py-3 rounded-xl rounded-tl-sm max-w-[95%] leading-relaxed shadow-inner">
                 Newton ka dusra qanoon yeh kehta hai ke jab kisi jism par external force lagti hai, toh usme acceleration paida hoti hai jo force ke directly proportional aur mass ke inversely proportional hoti hai.
                 <br/><br/>
                 Iski equation hai: <span className="font-mono bg-white/10 px-1 rounded text-white font-bold">F = ma</span>
                 <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2 flex-wrap">
                   <span className="px-1.5 py-0.5 rounded border border-white/5 bg-white/5 text-slate-300 text-[9px] flex items-center gap-1">
                     📄 Pg 42
                   </span>
                   <div className="ml-auto flex items-center gap-1 text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded border border-green-400/20">
                      <ShieldCheck size={10} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Verified Source</span>
                   </div>
                 </div>
               </div>
             </div>
             <div className="mt-auto pt-2">
               <div className="h-8 rounded-lg bg-white/5 border border-white/10 flex items-center px-3 justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">Ask a question...</span>
                  <div className="w-4 h-4 rounded bg-brand-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-brand-400 rounded-sm" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
                  </div>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Right Panel: Context Panel (PDF) */}
      <div className="hidden md:flex w-[35%] flex-col bg-[#09090b]">
        <div className="h-14 border-b border-white/10 flex items-center gap-2 px-5 bg-white/[0.02]">
           <BookOpen size={16} className="text-brand-400" />
           <span className="text-sm font-semibold text-slate-200 truncate">Physics_Ch3_Dynamics.pdf</span>
        </div>
        <div className="flex-1 p-5 overflow-hidden relative">
          <div className="w-full h-full glass-card border-white/10 rounded-xl overflow-hidden p-4">
            <div className="h-4 w-3/4 bg-white/10 rounded mb-4" />
            <div className="space-y-2 mb-4">
              <div className="h-2 w-full bg-white/5 rounded" />
              <div className="h-2 w-[90%] bg-white/5 rounded" />
              <div className="h-2 w-[95%] bg-white/5 rounded" />
            </div>
            <div className="h-20 w-full bg-white/5 rounded-lg mt-3 flex flex-col items-center justify-center border border-white/10">
               <span className="text-white/20 font-mono text-xs mb-1.5">F = ma</span>
               <div className="flex items-center gap-1.5">
                 <div className="w-3 h-3 bg-brand-500/30 rounded-sm" />
                 <div className="w-6 h-0.5 bg-white/10" />
                 <div className="w-3 h-3 bg-white/10 rounded-full" />
               </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-2 w-[95%] bg-brand-500/20 rounded" />
              <div className="h-2 w-[85%] bg-brand-500/20 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TypingEffect = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let timeout: NodeJS.Timeout
    const startTyping = () => {
      let i = 0
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1))
        i++
        if (i >= text.length) clearInterval(interval)
      }, 40)
      return () => clearInterval(interval)
    }
    timeout = setTimeout(startTyping, delay)
    return () => clearTimeout(timeout)
  }, [text, delay])

  return (
    <span className="relative">
      {displayedText}
      <span className="inline-block ml-[2px] w-[2px] h-[1em] bg-white align-middle animate-[pulse_1s_ease-in-out_infinite]" />
    </span>
  )
}

const features = [
  {
    icon: '🧠',
    title: 'RAG-Powered Answers',
    desc: 'Answers strictly from your uploaded PDF — never from external sources',
  },
  {
    icon: '🎯',
    title: 'Exam Mode',
    desc: 'Short, long, and important questions in Pakistani exam pattern',
  },
  {
    icon: '📝',
    title: 'Smart Notes',
    desc: 'Auto-generated bullet-point notes you can download as PDF',
  },
  {
    icon: '🧩',
    title: 'MCQ Quiz',
    desc: 'Test yourself with instant feedback and score tracking',
  },
  {
    icon: '🌐',
    title: 'Urdu / Roman Urdu',
    desc: 'Ask in English, Urdu, or Roman Urdu — get answers in your language',
  },
  {
    icon: '💡',
    title: '3 Detail Levels',
    desc: 'Simple, medium, or detailed — choose your explanation depth',
  },
]

export default function LandingPage() {
  const { user } = useStore()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const [quizScore, setQuizScore] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Features', id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Testimonials', id: 'testimonials' },
    { label: 'FAQ', id: 'faq' },
  ]

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 80 // offset for fixed navbar
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setSelectedOption(1)
      setQuizScore(1)
    }, 4500)
    return () => clearTimeout(timer1)
  }, [])

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden bg-[#09090b] selection:bg-brand-500/30 font-body">
      
      {/* Background System */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 mix-blend-screen"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(79, 70, 229, 0.08), transparent 40%)`
        }}
      />
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none z-0 mix-blend-overlay" />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/15 rounded-full blur-[140px] pointer-events-none animate-blob z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-secondary-500/15 rounded-full blur-[140px] pointer-events-none animate-blob animation-delay-2000 z-0" />
      <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-highlight-500/15 rounded-full blur-[140px] pointer-events-none animate-blob animation-delay-4000 z-0" />

      {/* Particle System */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden hidden md:block">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20 animate-float"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 10 + 10 + 's'
            }}
          />
        ))}
      </div>

      {/* Premium Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-500/5 border border-brand-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.15)] group-hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-shadow duration-300">
            <span className="text-sm">📚</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-brand-100 transition-colors">
            ParhLo
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:flex items-center gap-8"
        >
          {navItems.map(item => (
            <a key={item.id} href={`#${item.id}`} onClick={(e) => scrollToSection(e, item.id)} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors relative group">
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-brand-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors hidden sm:block">
            Login
          </Link>
          <a href="#cta" onClick={(e) => scrollToSection(e, 'cta')} className="hidden sm:inline-flex relative items-center justify-center px-5 py-2 text-sm font-bold text-white transition-all duration-200 bg-brand-500 border border-transparent rounded-xl hover:bg-brand-400 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]">
            Get Started
          </a>
          <button className="md:hidden text-white ml-2 p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </motion.div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[#09090b]/95 backdrop-blur-xl pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-center">
              {navItems.map(item => (
                <a key={item.id} href={`#${item.id}`} onClick={(e) => scrollToSection(e, item.id)} className="text-xl font-bold text-white">
                  {item.label}
                </a>
              ))}
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold text-slate-400 mt-4">
                Login
              </Link>
              <a href="#cta" onClick={(e) => scrollToSection(e, 'cta')} className="inline-flex justify-center items-center px-8 py-4 mt-2 text-lg font-bold text-white bg-brand-500 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                Get Started
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-4 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 shadow-xl cursor-pointer hover:bg-white/[0.06] transition-colors duration-300"
        >
          <span className="text-brand-400 animate-pulse">✨</span>
          <span className="text-sm font-semibold text-slate-200">Pakistan's AI-Powered Study Assistant</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-extrabold leading-[0.9] tracking-[-0.06em] text-white mb-6 relative"
          style={{ fontSize: 'clamp(56px, 8vw, 120px)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] bg-brand-500/15 blur-[120px] rounded-full -z-10 animate-pulse-slow hidden md:block" />
          Stop Scrolling,<br />
          <span className="bg-gradient-to-r from-white via-brand-200 to-slate-400 text-transparent bg-clip-text">ParhLo!</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-[18px] md:text-[22px] text-slate-400 max-w-[700px] mb-8 font-medium leading-[1.6]"
        >
          Upload your notes, slides, or textbooks and turn them into instant answers, smart notes, MCQs, and exam prep — all powered by AI and grounded in your own syllabus.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full sm:w-auto"
        >
          <Link
            to={user ? '/dashboard' : '/login'}
            className="group relative inline-flex justify-center items-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white bg-brand-500 hover:bg-brand-400 transition-all duration-300 hover:-translate-y-1 shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_10px_40px_rgba(79,70,229,0.6)] border border-white/10"
          >
            Start Studying Free
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="glass-card group inline-flex justify-center items-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white hover:bg-white/[0.08] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white/20">
            <Play size={20} className="text-brand-400 group-hover:scale-110 transition-transform" />
            Watch Demo
          </button>
        </motion.div>
      </div>

      {/* Hero Interactive Cards - Pulled Up! */}
      <div className="relative z-30 max-w-7xl mx-auto px-6 pb-20 md:pb-32 mt-4 h-auto md:h-[500px]">
        {/* Mobile View Demo Cards */}
        <div className="flex flex-col gap-6 md:hidden">
          <div className="glass-card p-6 shadow-2xl border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(79,70,229,0.8)] animate-pulse" />
              <h3 className="font-display font-extrabold text-lg text-white tracking-wide">AI Chat</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="chat-bubble-user bg-brand-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] text-[14px] font-medium shadow-md">
                  Explain Newton's Second Law in Urdu
                </div>
              </div>
              <div className="flex justify-start">
                <div className="chat-bubble-ai bg-white/[0.04] border border-white/10 text-slate-200 rounded-2xl rounded-tl-sm px-4 py-4 max-w-[95%] text-[14px] leading-[1.6] shadow-inner">
                  نیوٹن کا دوسرا قانون کہتا ہے کہ کسی جسم پر لگنے والی قوت اس کی کمیت اور تعجیل کے حاصل ضرب کے برابر ہوتی ہے۔
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="inline-flex flex-wrap items-center gap-2 bg-white/[0.05] border border-white/10 px-2 py-1.5 rounded-lg">
                      <span className="text-slate-400 text-xs font-semibold">📄 Physics Ch 3</span>
                      <ShieldCheck size={12} className="text-green-400" />
                      <span className="text-green-400 text-[10px] font-bold">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop View Demo Cards */}
        <div className="hidden md:flex absolute inset-0 justify-center items-start pt-10">
          
          {/* Left Floating Card: Smart Notes (Scale 0.9, lower opacity) */}
          <motion.div 
            className="absolute left-[5%] xl:left-[10%] top-20 w-[300px] glass-card p-6 shadow-2xl z-10 animate-float opacity-70 hover:opacity-100 hover:-translate-y-2 transition-all duration-500"
            style={{ scale: 0.9, transformOrigin: 'center right' }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 0.7, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-secondary-500/20 flex items-center justify-center text-secondary-400">
                <BookOpen size={20} />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Smart Notes</h3>
            </div>
            <ul className="space-y-4">
              {['Key Concepts', 'Important Definitions', 'Exam Highlights', 'Quick Revision Notes'].map((item, i) => (
                <motion.li 
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.4 }}
                  className="flex items-center gap-3 text-[15px] text-slate-300 font-medium"
                >
                  <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right Floating Card: MCQ Quiz (Scale 0.9, lower opacity) */}
          <motion.div 
            className="absolute right-[5%] xl:right-[10%] top-10 w-[320px] glass-card p-6 shadow-2xl z-10 animate-float-delayed opacity-70 hover:opacity-100 hover:-translate-y-2 transition-all duration-500"
            style={{ scale: 0.9, transformOrigin: 'center left' }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 0.7, x: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-highlight-500/20 flex items-center justify-center text-highlight-400">
                  <BrainCircuit size={20} />
                </div>
                <h3 className="font-display font-bold text-lg text-white">MCQ Quiz</h3>
              </div>
              <div className={`text-sm font-bold px-2 py-1 rounded-lg transition-colors duration-300 ${quizScore > 0 ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                Score: {quizScore}/1
              </div>
            </div>
            <div className="mb-4 text-[15px] font-semibold text-slate-200">
              What is Newton's Second Law?
            </div>
            <div className="space-y-3 text-[15px]">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium">F = ma²</div>
              <div className={`p-3.5 rounded-xl border transition-all duration-500 ${selectedOption === 1 ? 'bg-green-500/10 border-green-500/50 text-white shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 'bg-white/5 border-white/10 text-slate-400'} font-medium`}>
                <div className="flex justify-between items-center">
                  <span>F = ma</span>
                  {selectedOption === 1 && <CheckCircle2 size={18} className="text-green-400" />}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium">F = mc²</div>
            </div>
          </motion.div>

          {/* Center Main Card: AI Chat (STAR OF THE PAGE) */}
          <motion.div 
            className="relative z-40 w-full max-w-[1120px] glass-card p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8),0_0_80px_rgba(79,70,229,0.2)] border-white/30 hover:border-white/40 transition-colors duration-500"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="w-4 h-4 rounded-full bg-brand-500 shadow-[0_0_15px_rgba(79,70,229,0.9)] animate-pulse" />
              <h3 className="font-display font-extrabold text-2xl text-white tracking-wide">AI Chat</h3>
            </div>
            
            <div className="space-y-8">
              <div className="flex justify-end">
                <div className="bg-brand-500 text-white rounded-2xl rounded-tr-sm px-6 py-4 max-w-[85%] text-[16px] font-medium shadow-lg">
                  Explain Newton's Second Law in Urdu
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="bg-white/[0.06] border border-white/10 text-slate-100 rounded-2xl rounded-tl-sm px-8 py-6 max-w-[95%] text-[18px] leading-[1.8] shadow-inner font-medium">
                  <TypingEffect text="نیوٹن کا دوسرا قانون کہتا ہے کہ کسی جسم پر لگنے والی قوت اس کی کمیت اور تعجیل کے حاصل ضرب کے برابر ہوتی ہے۔" delay={1500} />
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 4.5, duration: 0.5 }}
                    className="mt-6 pt-5 border-t border-white/10"
                  >
                    <div className="inline-flex items-center gap-3 bg-white/[0.08] border border-white/10 px-4 py-2 rounded-xl">
                      <span className="text-slate-300 text-sm font-semibold">📄 Physics Chapter 3</span>
                      <div className="w-px h-4 bg-white/20 mx-1" />
                      <ShieldCheck size={16} className="text-green-400" />
                      <span className="text-green-400 text-sm font-bold tracking-wide uppercase">Verified Source</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Social Proof Stats */}
      <div className="relative z-20 border-t border-b border-white/5 bg-white/[0.01] py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="p-6">
            <h4 className="text-4xl font-display font-extrabold text-white mb-2">10,000+</h4>
            <p className="text-slate-400 font-medium">Questions Answered</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="p-6">
            <h4 className="text-4xl font-display font-extrabold text-white mb-2">500+</h4>
            <p className="text-slate-400 font-medium">Notes Generated</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="p-6">
            <h4 className="text-4xl font-display font-extrabold text-brand-400 mb-2">100%</h4>
            <p className="text-slate-400 font-medium">Built for Pakistani Students</p>
          </motion.div>
        </div>
      </div>

      {/* Product Screenshot Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-6 tracking-tight">
            See ParhLo <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-secondary-400">in Action</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">
            A premium, distraction-free environment engineered to help you achieve your best grades.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl p-2 bg-white/5 border border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.15)] backdrop-blur-3xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-3xl" />
          <DashboardMockup />
        </motion.div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="relative z-10 border-t border-white/5 bg-[#09090b] py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-6 tracking-tight">
              How It Works
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-brand-500/0 via-brand-500/30 to-brand-500/0" />
            
            {[
              { icon: <UploadCloud />, title: 'Upload Notes', desc: 'PDFs, Slides, Books' },
              { icon: <Cpu />, title: 'AI Understands', desc: 'Indexes your material' },
              { icon: <MessageCircle />, title: 'Ask Questions', desc: 'English, Urdu, Roman Urdu' },
              { icon: <GraduationCap />, title: 'Get Exam Ready', desc: 'MCQs, Summaries, Answers' }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 rounded-3xl glass-card flex items-center justify-center text-brand-400 mb-6 group-hover:-translate-y-2 group-hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all duration-300">
                  <div className="scale-[1.5]">{step.icon}</div>
                </div>
                <h4 className="font-display font-bold text-xl text-white mb-2">Step {i + 1}: {step.title}</h4>
                <p className="text-slate-400 font-medium">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 pb-32 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-5 tracking-tight">
            Study smarter, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-highlight-400">not harder.</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium">
            Designed specifically for Pakistani students and exam patterns.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 hover:bg-white/[0.06] hover:border-brand-500/50 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 group cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:bg-brand-500/10 group-hover:border-brand-500/30 transition-all duration-300">
                {f.icon}
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-3">
                {f.title}
              </h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="relative z-10 border-t border-white/5 bg-[#09090b] py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-6 tracking-tight">
              Why Students Trust ParhLo
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { text: "It accurately pulls answers from my extremely dense medical PDFs without hallucinating. The MCQ mode saved me before finals.", author: "Ayesha K.", role: "Medical Student" },
              { text: "Being able to ask complex engineering concepts in Roman Urdu and getting a simplified breakdown strictly from my syllabus is game-changing.", author: "Bilal M.", role: "Engineering Student" },
              { text: "The smart notes feature alone is worth it. It instantly turned my 60-slide lectures into bulleted revision sheets.", author: "Zainab R.", role: "Business Major" }
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass-card p-8 flex flex-col justify-between hover:border-white/20 transition-colors duration-300"
              >
                <div>
                  <div className="flex gap-1 mb-6 text-brand-400">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                  <p className="text-slate-300 font-medium leading-relaxed mb-8">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-secondary-500 flex items-center justify-center font-bold text-white shadow-lg">
                    {t.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{t.author}</h4>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="relative z-10 border-t border-white/5 bg-[#09090b] py-32">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-6 tracking-tight">
              Frequently Asked Questions
            </h2>
          </motion.div>
          
          <div className="space-y-4">
            {[
              { q: 'What is ParhLo?', a: 'ParhLo is an AI-powered study assistant built specifically for Pakistani students. It allows you to upload your own syllabus and get instant answers, smart notes, and MCQs.' },
              { q: 'How does ParhLo work?', a: 'Simply upload your PDF notes, slides, or books. Our AI reads the document and allows you to chat with it, generate summaries, and take quizzes based strictly on your uploaded material.' },
              { q: 'Can I upload my own PDFs?', a: 'Yes! You can upload any PDF document up to 50MB in size. We support lecture slides, textbooks, and handwritten notes (if scanned as text-searchable PDFs).' },
              { q: 'Does ParhLo support Urdu?', a: 'Yes! You can ask questions in English, Urdu, or Roman Urdu, and ParhLo will respond in your preferred language while fetching facts from your document.' },
              { q: 'Are answers generated from my uploaded material?', a: 'Absolutely. ParhLo uses Retrieval-Augmented Generation (RAG) to ensure that all answers are strictly extracted from the document you uploaded, preventing AI hallucinations.' },
              { q: 'Is ParhLo free?', a: 'ParhLo offers a generous free tier for students to get started. Premium features with higher usage limits are available for heavy users.' }
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div id="cta" className="relative z-10 border-t border-white/5 py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-16 rounded-[40px] border-brand-500/20 shadow-[0_0_100px_rgba(79,70,229,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-brand-500/20 blur-[100px] rounded-full -z-10" />
            <h2 className="font-display font-extrabold text-5xl text-white mb-6 tracking-tight">
              Ready to Study Smarter?
            </h2>
            <p className="text-xl text-slate-400 mb-10 font-medium max-w-2xl mx-auto">
              Join thousands of students using AI to prepare for exams, quizzes, and assignments.
            </p>
            <Link
              to={user ? '/dashboard' : '/login'}
              className="inline-flex justify-center items-center gap-2 px-10 py-5 rounded-2xl font-bold text-lg text-white bg-brand-500 hover:bg-brand-400 transition-all duration-300 hover:-translate-y-1 shadow-[0_0_40px_rgba(79,70,229,0.4)] border border-white/10"
            >
              Start Studying Free
              <ArrowRight size={24} />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Premium Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#09090b] pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center">
                  <span className="text-sm">📚</span>
                </div>
                <span className="font-display font-bold text-xl text-white">ParhLo</span>
              </div>
              <p className="text-slate-400 font-medium max-w-sm mb-6">
                The AI-powered study assistant built specifically for Pakistani students. Turn your syllabus into an interactive knowledge base.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6">Product</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Features</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Exam Mode</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Pricing</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Changelog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">About Us</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Contact</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6">Connect</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Twitter</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">LinkedIn</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Instagram</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors font-medium">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 font-medium text-sm">© 2026 ParhLo. All rights reserved.</p>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
              Built with ❤️ in Pakistan
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
