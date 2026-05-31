import { supabase } from './supabase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }

  return res.json()
}

// ── PDF API ──────────────────────────────────────────────────────
export const pdfApi = {
  upload: async (file: File) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE}/pdf/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
      throw new Error(err.detail)
    }
    return res.json()
  },

  list: () => request<{ pdfs: PDF[] }>('/pdf/list'),

  get: (pdfId: string) => request<PDF>(`/pdf/${pdfId}`),

  getStatus: (pdfId: string) =>
    request<{ status: string; chunk_count: number }>(`/pdf/${pdfId}/status`),

  rename: (pdfId: string, newName: string) =>
    request(`/pdf/${pdfId}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ new_name: newName }),
    }),

  delete: (pdfId: string) =>
    request(`/pdf/${pdfId}`, { method: 'DELETE' }),

  getServeUrl: (pdfId: string) => `${API_BASE}/pdf/${pdfId}/serve`,
}

// ── Chat API ──────────────────────────────────────────────────────
export const chatApi = {
  ask: (params: {
    pdf_id: string
    question: string
    detail_level?: string
    language?: string
  }) =>
    request<ChatResponse>('/chat/ask', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  quickAction: (params: {
    pdf_id: string
    action: string
    original_question: string
    current_answer: string
  }) =>
    request<{ answer: string; action: string }>('/chat/quick-action', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  history: (pdfId: string) =>
    request<{ history: ChatMessage[] }>(`/chat/history/${pdfId}`),
}

// ── Notes API ──────────────────────────────────────────────────────
export const notesApi = {
  generate: (pdfId: string, language = 'english') =>
    request<{ notes: string; cached: boolean }>('/notes/generate', {
      method: 'POST',
      body: JSON.stringify({ pdf_id: pdfId, language }),
    }),

  get: (pdfId: string) =>
    request<{ notes: string | null }>(`/notes/${pdfId}`),
}

// ── Quiz API ──────────────────────────────────────────────────────
export const quizApi = {
  generate: (pdfId: string, count = 5) =>
    request<{ quiz_id: string; questions: MCQ[]; total: number }>('/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({ pdf_id: pdfId, count }),
    }),

  submitScore: (quizId: string, score: number) =>
    request('/quiz/score', {
      method: 'POST',
      body: JSON.stringify({ quiz_id: quizId, score }),
    }),

  history: (pdfId: string) =>
    request<{ quizzes: Quiz[] }>(`/quiz/history/${pdfId}`),
}

// ── Exam API ──────────────────────────────────────────────────────
export const examApi = {
  generate: (pdfId: string, questionType: string, language = 'english') =>
    request<{ questions: string; question_type: string }>('/exam/generate', {
      method: 'POST',
      body: JSON.stringify({ pdf_id: pdfId, question_type: questionType, language }),
    }),
}

// ── Auth API ──────────────────────────────────────────────────────
export const authApi = {
  sync: (name: string, email: string) =>
    request('/auth/sync', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    }),

  me: () => request('/auth/me'),
}

// ── Types ──────────────────────────────────────────────────────────
export interface PDF {
  id: string
  user_id: string
  file_name: string
  file_url: string
  uploaded_at: string
  chunk_status: 'pending' | 'processing' | 'ready' | 'failed'
}

export interface ChatMessage {
  id: string
  question: string
  answer: string
  source_pages: number[]
  language: string
  created_at: string
}

export interface ChatResponse {
  answer: string
  source_pages: number[]
  used_context: boolean
  question: string
  detail_level?: string
  language?: string
  chat_id?: string
}

export interface MCQ {
  question: string
  options: string[]
  correct: string
  explanation: string
  page?: number
}

export interface Quiz {
  id: string
  pdf_id: string
  questions: MCQ[]
  score: number | null
  created_at: string
}
