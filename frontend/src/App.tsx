// import { useEffect } from 'react'
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// import { AuthProvider, useAuth } from './hooks/useAuth'
// import { useStore } from './store/useStore'
// import LandingPage from './pages/LandingPage'
// import LoginPage from './pages/LoginPage'
// import OnboardingPage from './pages/OnboardingPage'
// import DashboardPage from './pages/DashboardPage'
// import StudyRoomPage from './pages/StudyRoomPage'
// import './styles/globals.css'

// function ProtectedRoute({ children }: { children: React.ReactNode }) {
//   const { loading } = useAuth()
//   const { user } = useStore()

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-900)' }}>
//         <div className="flex flex-col items-center gap-4">
//           <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
//             <span className="text-2xl">📚</span>
//           </div>
//           <div className="flex gap-1">
//             {[0,1,2].map(i => (
//               <div key={i} className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
//                 style={{ animationDelay: `${i * 0.15}s` }} />
//             ))}
//           </div>
//         </div>
//       </div>
//     )
//   }

//   if (!user) return <Navigate to="/login" replace />
//   return <>{children}</>
// }

// function OnboardingGuard({ children }: { children: React.ReactNode }) {
//   const { hasCompletedOnboarding } = useStore()
//   if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />
//   return <>{children}</>
// }

// function ThemeEffect() {
//   const { theme } = useStore()
//   useEffect(() => {
//     if (theme === 'light') {
//       document.documentElement.classList.add('light')
//       document.documentElement.classList.remove('dark')
//     } else {
//       document.documentElement.classList.remove('light')
//       document.documentElement.classList.add('dark')
//     }
//   }, [theme])
//   return null
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <ThemeEffect />
//         <Routes>
//           <Route path="/" element={<LandingPage />} />
//           <Route path="/login" element={<LoginPage />} />
//           <Route
//             path="/onboarding"
//             element={
//               <ProtectedRoute>
//                 <OnboardingPage />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/dashboard"
//             element={
//               <ProtectedRoute>
//                 <OnboardingGuard>
//                   <DashboardPage />
//                 </OnboardingGuard>
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/study/:pdfId"
//             element={
//               <ProtectedRoute>
//                 <OnboardingGuard>
//                   <StudyRoomPage />
//                 </OnboardingGuard>
//               </ProtectedRoute>
//             }
//           />
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </BrowserRouter>
//     </AuthProvider>
//   )
// }

import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useStore } from './store/useStore'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import StudyRoomPage from './pages/StudyRoomPage'
import './styles/globals.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()
  const { user } = useStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-900)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <span className="text-2xl">📚</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { hasCompletedOnboarding } = useStore()
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function ThemeEffect() {
  const { theme } = useStore()

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    }
  }, [theme])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeEffect />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <DashboardPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/study/:pdfId"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <StudyRoomPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}