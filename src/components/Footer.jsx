import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import defaultSettings from '../../data/settings.json'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('cl_settings')
    if (saved) {
      try { return { ...defaultSettings, ...JSON.parse(saved) } } catch {}
    }
    return defaultSettings
  })

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) setSettings(prev => ({ ...prev, ...e.detail }))
    }
    window.addEventListener('cl_settings_updated', handleUpdate)

    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d && typeof d === 'object') setSettings(prev => ({ ...prev, ...d }))
      })
      .catch(() => {})

    return () => window.removeEventListener('cl_settings_updated', handleUpdate)
  }, [])

  const branding = settings.branding || defaultSettings.branding
  const phone = settings.phone || defaultSettings.phone || '06 00 00 00 00'
  const email = settings.email || defaultSettings.email || 'contact@clpaysage.fr'
  const desc = settings.siteDescription || defaultSettings.siteDescription

  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-brand-header">
              <img src={branding.logoUrl || '/images/logo.png'} alt="CL Paysage" className="footer-logo-img" />
              <div className="footer-brand-name">
                {branding.brandName || 'CL'} <span>{branding.brandAccent || 'Paysage'}</span>
              </div>
            </div>
            <p>
              {desc}
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Navigation</h4>
            <div className="footer-links">
              <Link to="/">Accueil</Link>
              <Link to="/realisations">Réalisations</Link>
              <Link to="/services">Services</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Contact</h4>
            <div className="footer-links">
              <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`}>{phone}</a>
              <a href={`mailto:${email}`}>{email}</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {year} {branding.brandName || 'CL'} {branding.brandAccent || 'Paysage'}. Tous droits réservés.</p>
          <p>Site réalisé avec passion</p>
        </div>
      </div>
    </footer>
  )
}
