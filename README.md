# 📚 ParhLo — Pakistan ka Apna AI Study Assistant

> **"Stop Scrolling, ParhLo!"**

ParhLo is a production-ready AI-powered study assistant for Pakistani students. Upload any PDF — lecture slides, notes, books — and get exam-focused answers, smart notes, and quizzes **strictly from your own material** using RAG (Retrieval-Augmented Generation).

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Auth** | Email + Google login via Supabase |
| 📄 **PDF Chat** | Ask questions in English, Urdu, or Roman Urdu |
| 🎯 **RAG System** | Answers ONLY from uploaded PDF — never external knowledge |
| 📑 **Source Highlighting** | Every answer shows which page it came from |
| 📝 **Smart Notes** | One-click bullet-point notes generation |
| 🧠 **Quiz Mode** | Auto-generated MCQs with instant feedback |
| 🏆 **Exam Mode** | Important / Short / Long questions in Pakistani exam style |
| 💾 **Auto-save** | Chat, notes, quiz history all saved automatically |
| 🌙 **Dark Mode** | Default dark theme with light mode toggle |
| 📱 **Mobile Responsive** | Fully functional on phone |

---

## 🏗️ Architecture

```
Frontend (React + Tailwind + Framer Motion)
    ↓  REST API
FastAPI Backend
    ├── Supabase (Auth + PostgreSQL + Storage)
    ├── ChromaDB (Vector Search / RAG)
    ├── PyMuPDF (PDF text extraction)
    ├── Gemini API (AI answers — switchable to OpenAI)
    ├── SentenceTransformers (local embeddings)
    └── FastAPI BackgroundTasks (async PDF processing)
```

### RAG Flow
```
PDF Uploaded → Background Task → PyMuPDF extracts text
    → Split into chunks → Embed via SentenceTransformers
    → Store in ChromaDB
    
Student asks question → Query embedding → ChromaDB retrieval
    → Top-K relevant chunks → Gemini generates answer from chunks only
    → Source pages highlighted in PDF viewer
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- A [Supabase](https://supabase.com) account (free)
- A [Google AI Studio](https://aistudio.google.com) account (free Gemini API key)

---

### 1. Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `docs/schema.sql`
3. In **Authentication → Providers**, enable **Google** (optional)
4. Copy your project URL, anon key, and service role key

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
# OR: venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials:
#   SUPABASE_URL=https://xxx.supabase.co
#   SUPABASE_ANON_KEY=eyJ...
#   SUPABASE_SERVICE_KEY=eyJ...
#   GEMINI_API_KEY=AIza...

# Run the server
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`
API docs: `http://localhost:8000/api/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local:
#   VITE_SUPABASE_URL=https://xxx.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyJ...
#   VITE_API_URL=http://localhost:8000/api

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🌍 Deployment

### Frontend → Vercel (Free)

```bash
cd frontend
npm run build

# Deploy to Vercel
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`  
- `VITE_API_URL` (your Railway/Render backend URL)

### Backend → Railway (Free)

1. Push code to GitHub
2. Connect repo to [Railway](https://railway.app)
3. Set environment variables in Railway dashboard
4. Railway auto-detects `main.py` and deploys

**Or use Render:**
1. Connect GitHub repo to [Render](https://render.com)
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 🔧 Configuration

### Backend `.env`

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI (Gemini is default — free tier)
GEMINI_API_KEY=AIzaSy...
AI_PROVIDER=gemini

# To switch to OpenAI:
# OPENAI_API_KEY=sk-...
# AI_PROVIDER=openai

# App
SECRET_KEY=your-random-secret-key-32-chars-min
ENVIRONMENT=production
ALLOWED_ORIGINS=https://your-app.vercel.app

# Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50

# RAG
TOP_K_CHUNKS=5
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

### Frontend `.env.local`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=https://your-backend.railway.app/api
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/sync` | Sync user after Supabase login |
| `GET` | `/api/auth/me` | Get current user profile |
| `POST` | `/api/pdf/upload` | Upload a PDF (background processing) |
| `GET` | `/api/pdf/list` | List user's PDFs |
| `GET` | `/api/pdf/{id}/status` | Get PDF processing status |
| `PUT` | `/api/pdf/{id}/rename` | Rename a PDF |
| `DELETE` | `/api/pdf/{id}` | Delete a PDF |
| `GET` | `/api/pdf/{id}/serve` | Serve PDF file for viewer |
| `POST` | `/api/chat/ask` | Ask a question (RAG) |
| `GET` | `/api/chat/history/{pdf_id}` | Get chat history |
| `POST` | `/api/chat/quick-action` | Apply quick action to answer |
| `POST` | `/api/notes/generate` | Generate study notes |
| `GET` | `/api/notes/{pdf_id}` | Get saved notes |
| `POST` | `/api/quiz/generate` | Generate MCQ quiz |
| `POST` | `/api/quiz/score` | Submit quiz score |
| `GET` | `/api/quiz/history/{pdf_id}` | Get quiz history |
| `POST` | `/api/exam/generate` | Generate exam questions |
| `GET` | `/api/health` | Health check |

---

## 🧠 Switching AI Providers

The AI layer is fully abstracted. To switch from Gemini to OpenAI:

```env
# In .env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

That's it. No code changes needed.

---

## 📁 Project Structure

```
parhlo/
├── backend/
│   ├── main.py                     # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── api/
│       │   └── endpoints/
│       │       ├── auth.py         # Auth sync endpoints
│       │       ├── pdf.py          # PDF management
│       │       ├── chat.py         # RAG chat
│       │       ├── notes.py        # Notes generation
│       │       ├── quiz.py         # Quiz generation
│       │       └── exam.py         # Exam mode
│       ├── core/
│       │   ├── config.py           # Settings (pydantic)
│       │   ├── auth.py             # JWT verification
│       │   └── database.py         # Supabase DB layer
│       └── services/
│           ├── ai_service.py       # AI wrapper (Gemini/OpenAI)
│           ├── pdf_service.py      # PDF extraction + chunking
│           ├── vector_store.py     # ChromaDB abstraction
│           └── cache_service.py    # In-memory cache
│
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   └── src/
│       ├── App.tsx                 # Routes + auth guard
│       ├── pages/
│       │   ├── LandingPage.tsx     # Marketing page
│       │   ├── LoginPage.tsx       # Auth page
│       │   ├── OnboardingPage.tsx  # 3-step onboarding
│       │   ├── DashboardPage.tsx   # File management
│       │   └── StudyRoomPage.tsx   # Core study interface
│       ├── components/study/
│       │   ├── ChatPanel.tsx       # RAG chat interface
│       │   ├── PDFViewer.tsx       # PDF with page highlighting
│       │   ├── NotesPanel.tsx      # Notes generation
│       │   ├── QuizPanel.tsx       # MCQ quiz
│       │   └── ExamPanel.tsx       # Exam mode (3 tabs)
│       ├── services/
│       │   ├── api.ts              # All API calls
│       │   └── supabase.ts         # Supabase client
│       ├── store/
│       │   └── useStore.ts         # Zustand global state
│       └── hooks/
│           └── useAuth.tsx         # Auth hook
│
└── docs/
    ├── schema.sql                  # Supabase DB schema
    └── README.md                   # This file
```

---

## 💰 Cost Breakdown

| Service | Plan | Cost |
|---|---|---|
| Vercel | Hobby | **Free** |
| Railway / Render | Free tier | **Free** |
| Supabase | Free tier | **Free** |
| Gemini API | Free tier (15 RPM) | **Free** |
| ChromaDB | Local / self-hosted | **Free** |
| **Total** | — | **Rs. 0 🎉** |

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m 'Add your feature'`
4. Push and open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with  for Pakistani students. Stop scrolling, ParhLo!*

Currently live app is not wroking because the backend which i deployed on Railway has ended and its asking for subscription so for now im not doing that and I'm looking forward to solve this as soon as possible Thanks!

C\UNDER MAINTINENCE!!!
