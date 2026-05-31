-- ParhLo Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════
-- USERS TABLE
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Student',
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    preferred_language TEXT DEFAULT 'english',
    theme_preference TEXT DEFAULT 'dark'
);

-- ══════════════════════════════════════
-- PDFS TABLE
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.pdfs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    chunk_status TEXT DEFAULT 'pending' CHECK (chunk_status IN ('pending', 'processing', 'ready', 'failed'))
);

-- ══════════════════════════════════════
-- CHATS TABLE
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pdf_id UUID NOT NULL REFERENCES public.pdfs(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    source_pages INTEGER[] DEFAULT '{}',
    language TEXT DEFAULT 'english',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════
-- NOTES TABLE
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pdf_id UUID NOT NULL REFERENCES public.pdfs(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, pdf_id)
);

-- ══════════════════════════════════════
-- QUIZZES TABLE
-- ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pdf_id UUID NOT NULL REFERENCES public.pdfs(id) ON DELETE CASCADE,
    questions JSONB NOT NULL DEFAULT '[]',
    score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- PDFs policies
CREATE POLICY "Users can view own PDFs"
    ON public.pdfs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PDFs"
    ON public.pdfs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PDFs"
    ON public.pdfs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own PDFs"
    ON public.pdfs FOR DELETE
    USING (auth.uid() = user_id);

-- Chats policies
CREATE POLICY "Users can view own chats"
    ON public.chats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats"
    ON public.chats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can manage own notes"
    ON public.notes FOR ALL
    USING (auth.uid() = user_id);

-- Quizzes policies
CREATE POLICY "Users can manage own quizzes"
    ON public.quizzes FOR ALL
    USING (auth.uid() = user_id);

-- ══════════════════════════════════════
-- SERVICE ROLE BYPASS (for backend)
-- ══════════════════════════════════════
-- The backend uses service_role key which bypasses RLS
-- This is intentional and secure as the backend validates user ownership

-- ══════════════════════════════════════
-- INDEXES for performance
-- ══════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_pdfs_user_id ON public.pdfs(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_pdf_id ON public.chats(pdf_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_pdf_id ON public.notes(pdf_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_pdf_id ON public.quizzes(pdf_id);

-- ══════════════════════════════════════
-- SUPABASE STORAGE BUCKET
-- ══════════════════════════════════════
-- Run in Supabase Dashboard > Storage > Create Bucket: "pdfs"
-- Set to private (not public)
-- RLS policy: users can only access their own folder

-- INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', false);
