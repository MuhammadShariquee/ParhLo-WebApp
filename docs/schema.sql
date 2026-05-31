-- ============================================================
-- ParhLo — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY,  -- matches Supabase auth.users.id
    name        TEXT NOT NULL DEFAULT '',
    email       TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    preferred_language  TEXT DEFAULT 'english',
    theme_preference    TEXT DEFAULT 'dark'
);

-- ── PDFs Table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pdfs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    file_url        TEXT NOT NULL,
    uploaded_at     TIMESTAMPTZ DEFAULT NOW(),
    chunk_status    TEXT DEFAULT 'pending'
        CHECK (chunk_status IN ('pending', 'processing', 'ready', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_pdfs_user_id ON pdfs(user_id);
CREATE INDEX IF NOT EXISTS idx_pdfs_uploaded_at ON pdfs(uploaded_at DESC);

-- ── Chats Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chats (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pdf_id          UUID NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
    question        TEXT NOT NULL,
    answer          TEXT NOT NULL,
    source_pages    INTEGER[] DEFAULT '{}',
    language        TEXT DEFAULT 'english',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_user_pdf ON chats(user_id, pdf_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);

-- ── Notes Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pdf_id      UUID NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, pdf_id)  -- one notes record per user per PDF
);

CREATE INDEX IF NOT EXISTS idx_notes_user_pdf ON notes(user_id, pdf_id);

-- ── Quizzes Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pdf_id      UUID NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
    questions   JSONB NOT NULL DEFAULT '[]',
    score       INTEGER,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_user_pdf ON quizzes(user_id, pdf_id);

-- ============================================================
-- Row Level Security (RLS) — users only see their own data
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Users: can read/update own profile
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

-- PDFs: full CRUD on own PDFs
CREATE POLICY "pdfs_select_own" ON pdfs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "pdfs_insert_own" ON pdfs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pdfs_update_own" ON pdfs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "pdfs_delete_own" ON pdfs
    FOR DELETE USING (auth.uid() = user_id);

-- Chats
CREATE POLICY "chats_select_own" ON chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chats_insert_own" ON chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chats_delete_own" ON chats
    FOR DELETE USING (auth.uid() = user_id);

-- Notes
CREATE POLICY "notes_select_own" ON notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notes_insert_own" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notes_update_own" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

-- Quizzes
CREATE POLICY "quizzes_select_own" ON quizzes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quizzes_insert_own" ON quizzes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quizzes_update_own" ON quizzes
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- Supabase Storage — create bucket for PDFs
-- ============================================================
-- Run this in Supabase Storage settings or via SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policy
CREATE POLICY "Users can upload own PDFs" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own PDFs" ON storage.objects
    FOR SELECT USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own PDFs" ON storage.objects
    FOR DELETE USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Service role bypass (for backend API with service key)
-- ============================================================
-- The backend uses the SERVICE_KEY which bypasses RLS automatically.
-- No additional policies needed for service role.
