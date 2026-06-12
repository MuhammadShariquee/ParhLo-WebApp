import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PDF } from '../services/api'
import { supabase } from '../services/supabase'

interface User {
  id: string
  email: string
  name: string
}

interface AppState {
  // Auth
  user: User | null
  setUser: (user: User | null) => void

  // Theme & Settings
  theme: 'dark' | 'light'
  toggleTheme: () => void
  isSettingsOpen: boolean
  setIsSettingsOpen: (isOpen: boolean) => void

  // Language
  language: string
  setLanguage: (lang: string) => void

  // PDFs
  pdfs: PDF[]
  setPdfs: (pdfs: PDF[]) => void
  addPdf: (pdf: PDF) => void
  updatePdf: (id: string, updates: Partial<PDF>) => void
  removePdf: (id: string) => void

  // Active PDF
  activePdf: PDF | null
  setActivePdf: (pdf: PDF | null) => void

  // Chat
  chatMessages: { [pdfId: string]: LocalChatMessage[] }
  addChatMessage: (pdfId: string, message: LocalChatMessage) => void
  setChatMessages: (pdfId: string, messages: LocalChatMessage[]) => void
  clearChat: (pdfId: string) => void

  // Detail level
  detailLevel: 'simple' | 'medium' | 'detailed'
  setDetailLevel: (level: 'simple' | 'medium' | 'detailed') => void

  // Active page highlight
  highlightedPages: number[]
  setHighlightedPages: (pages: number[]) => void
  currentPdfPage: number
  setCurrentPdfPage: (page: number) => void

  // Onboarding
  hasCompletedOnboarding: boolean
  setOnboardingComplete: () => void

  // Auth actions
  signOut: () => Promise<void>
}

export interface LocalChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  source_pages?: number[]
  used_context?: boolean
  timestamp: Date
  isLoading?: boolean
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Theme & Settings
      theme: 'dark',
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: newTheme })
        if (newTheme === 'light') {
          document.documentElement.classList.add('light')
          document.documentElement.classList.remove('dark')
        } else {
          document.documentElement.classList.remove('light')
          document.documentElement.classList.add('dark')
        }
      },
      isSettingsOpen: false,
      setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),

      // Language
      language: 'english',
      setLanguage: (lang) => set({ language: lang }),

      // PDFs
      pdfs: [],
      setPdfs: (pdfs) => set({ pdfs }),
      addPdf: (pdf) => set((state) => ({ pdfs: [pdf, ...state.pdfs] })),
      updatePdf: (id, updates) =>
        set((state) => ({
          pdfs: state.pdfs.map((p) => (p.id === id ? { ...p, ...updates } : p)),
          activePdf:
            state.activePdf?.id === id
              ? { ...state.activePdf, ...updates }
              : state.activePdf,
        })),
      removePdf: (id) =>
        set((state) => ({
          pdfs: state.pdfs.filter((p) => p.id !== id),
          activePdf: state.activePdf?.id === id ? null : state.activePdf,
        })),

      // Active PDF
      activePdf: null,
      setActivePdf: (pdf) => set({ activePdf: pdf, highlightedPages: [], currentPdfPage: 1 }),

      // Chat
      chatMessages: {},
      addChatMessage: (pdfId, message) =>
        set((state) => ({
          chatMessages: {
            ...state.chatMessages,
            [pdfId]: [...(state.chatMessages[pdfId] || []), message],
          },
        })),
      setChatMessages: (pdfId, messages) =>
        set((state) => ({
          chatMessages: { ...state.chatMessages, [pdfId]: messages },
        })),
      clearChat: (pdfId) =>
        set((state) => ({
          chatMessages: { ...state.chatMessages, [pdfId]: [] },
        })),

      // Detail level
      detailLevel: 'medium',
      setDetailLevel: (level) => set({ detailLevel: level }),

      // Page highlights
      highlightedPages: [],
      setHighlightedPages: (pages) => set({ highlightedPages: pages }),
      currentPdfPage: 1,
      setCurrentPdfPage: (page) => set({ currentPdfPage: page }),

      // Onboarding
      hasCompletedOnboarding: false,
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

      // Auth actions
      signOut: async () => {
        await supabase.auth.signOut()
        set({
          user: null,
          pdfs: [],
          activePdf: null,
          chatMessages: {},
        })
      },
    }),
    {
      name: 'parhlo-store',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        detailLevel: state.detailLevel,
      }),
    }
  )
)
