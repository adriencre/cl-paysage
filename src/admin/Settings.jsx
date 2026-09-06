import { useState, useEffect } from 'react'
import './Settings.css'

export default function Settings({ token }) {
  const [form, setForm] = useState({
    phone: '',
    email: '',
    address: '',
    hours: '',
    siteDescription: '',
    socialLinks: { instagram: '', facebook: '', pinterest: '', tiktok: '' },
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setForm(prev => ({ ...prev, ...data })))
  }, [])

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const updateSocial = (platform, value) => {
    setForm(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-form" id="admin-settings">
      <div className="admin-page-header">
        <h1>
          Paramètres
          {saved && <span className="settings-saved">✓ Enregistré</span>}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3 className="form-section-title">Coordonnées</h3>

          <div className="form-field">
            <label htmlFor="s-phone">Téléphone</label>
            <input
              id="s-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="06 00 00 00 00"
            />
          </div>

          <div className="form-field">
            <label htmlFor="s-email">Email</label>
            <input
              id="s-email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="contact@clpaysage.fr"
            />
          </div>

          <div className="form-field">
            <label htmlFor="s-address">Zone d'intervention</label>
            <input
              id="s-address"
              type="text"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Lyon et sa région"
            />
          </div>

          <div className="form-field">
            <label htmlFor="s-hours">Horaires</label>
            <textarea
              id="s-hours"
              value={form.hours}
              onChange={(e) => updateField('hours', e.target.value)}
              placeholder="Lun – Ven : 8h – 18h&#10;Sam : sur rendez-vous"
              style={{ minHeight: '80px' }}
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Description du site</h3>
          <div className="form-field">
            <label htmlFor="s-desc">Texte de présentation</label>
            <textarea
              id="s-desc"
              value={form.siteDescription}
              onChange={(e) => updateField('siteDescription', e.target.value)}
              placeholder="Courte description de votre activité..."
            />
            <p className="form-field-hint">Affiché dans le pied de page et la meta description du site.</p>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Réseaux sociaux de l'entreprise</h3>
          <p className="form-field-hint" style={{ marginBottom: '1rem' }}>
            Ces liens apparaîtront dans le pied de page du site.
          </p>

          <div className="social-field">
            <span className="social-label">Instagram</span>
            <input
              type="url"
              value={form.socialLinks?.instagram || ''}
              onChange={(e) => updateSocial('instagram', e.target.value)}
              placeholder="https://instagram.com/clpaysage"
            />
          </div>
          <div className="social-field">
            <span className="social-label">Facebook</span>
            <input
              type="url"
              value={form.socialLinks?.facebook || ''}
              onChange={(e) => updateSocial('facebook', e.target.value)}
              placeholder="https://facebook.com/clpaysage"
            />
          </div>
          <div className="social-field">
            <span className="social-label">Pinterest</span>
            <input
              type="url"
              value={form.socialLinks?.pinterest || ''}
              onChange={(e) => updateSocial('pinterest', e.target.value)}
              placeholder="https://pinterest.com/clpaysage"
            />
          </div>
          <div className="social-field">
            <span className="social-label">TikTok</span>
            <input
              type="url"
              value={form.socialLinks?.tiktok || ''}
              onChange={(e) => updateSocial('tiktok', e.target.value)}
              placeholder="https://tiktok.com/@clpaysage"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
