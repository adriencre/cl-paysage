import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Realisations from './pages/Realisations'
import ProjectDetail from './pages/ProjectDetail'
import Services from './pages/Services'
import Contact from './pages/Contact'

import NotFound from './pages/NotFound'

// Admin
import Login from './admin/Login'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import ProjectForm from './admin/ProjectForm'
import Settings from './admin/Settings'
import Appearance from './admin/Appearance'

function isTokenExpired(token) {
  if (!token) return true
  if (token.startsWith('admin_session_') || token.startsWith('admin_')) {
    return false
  }
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return true
    }
    return false
  } catch {
    return false
  }
}

function AdminRoute({ children }) {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('admin_token')
    if (saved && isTokenExpired(saved)) {
      localStorage.removeItem('admin_token')
      return null
    }
    return saved
  })
  const [verifying, setVerifying] = useState(Boolean(token))

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
  }

  useEffect(() => {
    if (!token) {
      setVerifying(false)
      return
    }

    if (isTokenExpired(token)) {
      handleLogout()
      setVerifying(false)
      return
    }

    // Verify token with server
    let cancelled = false
    fetch('/api/admin/verify', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (cancelled) return
        if (res.status === 401 || res.status === 403) {
          handleLogout()
        }
      })
      .catch(() => {
        // Network error: don't log out immediately if offline, but client JWT isn't expired
      })
      .finally(() => {
        if (!cancelled) setVerifying(false)
      })

    const onAuthFailed = () => handleLogout()
    window.addEventListener('admin_auth_failed', onAuthFailed)

    return () => {
      cancelled = true
      window.removeEventListener('admin_auth_failed', onAuthFailed)
    }
  }, [token])

  if (!token) {
    return <Login onLogin={setToken} />
  }

  if (verifying) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#1a1f16',
        color: '#a0b090',
        fontFamily: 'Inter, sans-serif'
      }}>
        Vérification de la session…
      </div>
    )
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      {typeof children === 'function' ? children({ token }) : children}
    </AdminLayout>
  )
}

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <>
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      <main>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/realisations" element={<Realisations />} />
          <Route path="/realisations/:id" element={<ProjectDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />

          {/* Admin */}
          <Route path="/admin" element={
            <AdminRoute>{({ token }) => <Dashboard token={token} />}</AdminRoute>
          } />
          <Route path="/admin/nouveau" element={
            <AdminRoute>{({ token }) => <ProjectForm token={token} />}</AdminRoute>
          } />
          <Route path="/admin/editer/:id" element={
            <AdminRoute>{({ token }) => <ProjectForm token={token} isEdit />}</AdminRoute>
          } />
          <Route path="/admin/apparence" element={
            <AdminRoute>{({ token }) => <Appearance token={token} />}</AdminRoute>
          } />
          <Route path="/admin/parametres" element={
            <AdminRoute>{({ token }) => <Settings token={token} />}</AdminRoute>
          } />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </>
  )
}
