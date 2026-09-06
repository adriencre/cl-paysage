import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import defaultSettings from '../../data/settings.json'
import './Navbar.css'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/realisations', label: 'Réalisations' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [branding, setBranding] = useState(defaultSettings.branding || {
    brandName: 'CL',
    brandAccent: 'Paysage',
    brandSub: 'Paysagiste Concepteur',
    logoUrl: '/images/logo.png',
  })
  const location = useLocation()

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d && d.branding) setBranding(d.branding)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="main-nav">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <img src={branding.logoUrl || '/images/logo.png'} alt="Logo" className="navbar-logo-img" />
          <div className="navbar-brand-text">
            <span className="navbar-brand-name">{branding.brandName} <em>{branding.brandAccent}</em></span>
            <span className="navbar-brand-sub">{branding.brandSub}</span>
          </div>
        </Link>

        <button
          className={`navbar-toggle${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          id="menu-toggle"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`navbar-link${location.pathname === to ? ' active' : ''}`}
            >
              {label}
            </Link>
          ))}
          <Link to="/contact" className="navbar-btn-devis">
            <span>Demander un devis</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  )
}
