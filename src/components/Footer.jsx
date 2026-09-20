import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import defaultSettings from '../../data/settings.json'
import { fetchPublicSettings } from '../lib/dataSync'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) setSettings(prev => ({ ...prev, ...e.detail }))
    }
    window.addEventListener('cl_settings_updated', handleUpdate)

    fetchPublicSettings()
      .then(d => {
        if (d && typeof d === 'object' && !d.error) setSettings(prev => ({ ...prev, ...d }))
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
              <Link to="/services">Services &amp; Jardinage</Link>
              <Link to="/realisations">Nos Réalisations</Link>
              <Link to="/contact">Devis Gratuit</Link>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Secteurs couverts</h4>
            <div className="footer-links" style={{ fontSize: '0.86rem', color: 'var(--c-gray-light)', lineHeight: 1.6 }}>
              <p>• Villeneuve d'Ascq (59650)</p>
              <p>• Croix &amp; Hem</p>
              <p>• Marcq-en-Barœul</p>
              <p>• Wasquehal &amp; Mouvaux</p>
              <p>• Lille &amp; Métropole (MEL)</p>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Contact direct</h4>
            <div className="footer-links">
              <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`}>{phone}</a>
              <a href={`mailto:${email}`}>{email}</a>
              <span style={{ fontSize: '0.84rem', color: 'var(--c-gray)' }}>Villeneuve d'Ascq &amp; environs</span>
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
