import { useState, useEffect } from 'react'
import FadeIn from '../components/FadeIn'
import defaultSettings from '../../data/settings.json'
import './Contact.css'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', type: '', message: '',
  })
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // In production, send to backend/API
    setSubmitted(true)
  }

  return (
    <>
      {/* Header */}
      <section className="page-header" id="contact-header">
        <div className="container">
          <FadeIn>
            <span className="section-label">Contact</span>
            <h1 className="section-title">Parlons de votre projet</h1>
            <p className="section-subtitle">
              Une idée, une envie, une question ?
              Contactez-nous pour échanger sur votre futur jardin.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Form + Info */}
      <section className="section" id="contact-form-section">
        <div className="container">
          <FadeIn>
            <div className="contact-layout">
              {/* Form */}
              <div>
                {submitted ? (
                  <div className="form-success" id="form-success">
                    <strong>Merci !</strong> Votre message a bien été envoyé.
                    Nous reviendrons vers vous dans les plus brefs délais.
                  </div>
                ) : (
                  <form className="contact-form" onSubmit={handleSubmit} id="contact-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="name">Nom complet</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Votre nom"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="votre@email.fr"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="phone">Téléphone</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="06 00 00 00 00"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="type">Type de projet</label>
                        <select
                          id="type"
                          name="type"
                          value={form.type}
                          onChange={handleChange}
                        >
                          <option value="">Sélectionner</option>
                          <option value="conception">Conception de jardin</option>
                          <option value="amenagement">Aménagement extérieur</option>
                          <option value="entretien">Entretien</option>
                          <option value="terrasse">Terrasse & allées</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="message">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        placeholder="Décrivez votre projet, vos envies, la superficie de votre terrain…"
                      />
                    </div>

                    <button type="submit" className="btn btn-primary form-submit" id="submit-btn">
                      Envoyer le message
                    </button>
                  </form>
                )}
              </div>

              {/* Info */}
              <div className="contact-info">
                <div className="contact-info-intro">
                  <p>
                    Nous intervenons dans toute la région.
                    N'hésitez pas à nous contacter par téléphone
                    ou via le formulaire pour un premier échange gratuit et sans engagement.
                  </p>
                </div>

                <div className="contact-details">
                  <div className="contact-detail">
                    <svg className="contact-detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                    <div>
                      <h4>Téléphone</h4>
                      <a href={`tel:${(settings.phone || '06 00 00 00 00').replace(/[^0-9+]/g, '')}`}>
                        {settings.phone || '06 00 00 00 00'}
                      </a>
                    </div>
                  </div>

                  <div className="contact-detail">
                    <svg className="contact-detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <div>
                      <h4>Email</h4>
                      <a href={`mailto:${settings.email || 'contact@clpaysage.fr'}`}>
                        {settings.email || 'contact@clpaysage.fr'}
                      </a>
                    </div>
                  </div>

                  <div className="contact-detail">
                    <svg className="contact-detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div>
                      <h4>Zone d'intervention</h4>
                      <p>{settings.address || 'Toute la région et alentours'}</p>
                    </div>
                  </div>

                  <div className="contact-detail">
                    <svg className="contact-detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                    <div>
                      <h4>Horaires</h4>
                      {(settings.hours || 'Lun – Ven : 8h – 18h\nSam : sur rendez-vous').split('\n').map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  )
}
