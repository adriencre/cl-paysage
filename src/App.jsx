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

// Admin
import Login from './admin/Login'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import ProjectForm from './admin/ProjectForm'
import Settings from './admin/Settings'
import Appearance from './admin/Appearance'

function AdminRoute({ children }) {
  const [token, setToken] = useState(localStorage.getItem('admin_token'))

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
  }

  if (!token) {
    return <Login onLogin={setToken} />
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
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </>
  )
}
