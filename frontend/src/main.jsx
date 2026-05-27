// main.jsx - Complete updated version

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import App          from './App'
import Login        from './pages/Login'
import Register     from './pages/Register'
import Verify       from './pages/Verify'
import LandingPage  from './pages/LandingPage'
import IntroScreen from './components/Introscreen'
import './App.css'

// ── Import your intro screen ──
// import IntroScreen from './pages/IntroScreen'  
// Uncomment above after you share the file

// ── Protected Route ────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a2020"
      }}>
        <div style={{
          textAlign: "center",
          color: "#0e9898"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎓</div>
          <div style={{ fontSize: "14px", letterSpacing: "0.2em" }}>
            ACADENCE
          </div>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/landing" />
}

// ── App with Intro Flow ────────────────────────────────────
function AppWithIntro() {
  const [showIntro,   setShowIntro]   = useState(true)
  const [introsDone,  setIntrosDone]  = useState(false)
  const { user, loading }             = useAuth()

  // Check if intro was shown this session
  useEffect(() => {
    const seen = sessionStorage.getItem('intro_seen')
    if (seen) {
      setShowIntro(false)
      setIntrosDone(true)
    }
  }, [])

  const handleIntroDone = () => {
    sessionStorage.setItem('intro_seen', 'true')
    setShowIntro(false)
    setIntrosDone(true)
  }

  // Show intro on first visit
   if (showIntro && !introsDone) {
    return <IntroScreen onDone={handleIntroDone} />
  }

  // After intro - show routes
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/landing"  element={<LandingPage />} />

      {/* Auth routes */}
      <Route path="/login"    element={<Login />}    />
      <Route path="/register" element={<Register />} />
      <Route path="/verify"   element={<Verify />}   />

      {/* Protected dashboard */}
      <Route path="/" element={
        <ProtectedRoute>
          <App />
        </ProtectedRoute>
      } />

      {/* Catch all → landing */}
      <Route path="*" element={<Navigate to="/landing" />} />
    </Routes>
  )
}

// ── Temporary Intro (replace with yours) ──────────────────


// ── Root Render ────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppWithIntro />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)