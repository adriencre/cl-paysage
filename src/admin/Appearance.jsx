import { useState, useEffect, useRef } from 'react'
import { compressImage } from '../lib/imageCompressor'
import { fetchAdminSettings, saveAdminSettings } from '../lib/dataSync'
import { isSupabaseConfigured, uploadPhotoToSupabase } from '../lib/supabase'
import './Appearance.css'

export default function Appearance({ token }) {
  const [form, setForm] = useState({
    branding: {
      brandName: 'CL',
      brandAccent: 'Paysage',
      brandSub: 'Paysagiste Concepteur',
      logoUrl: '/images/logo.png',
    },
    hero: {
      bgImage: '/images/hero.jpg',
      tagline: 'Atelier de paysage · Conception & Réalisation',
      titleLine1: "L'art de façonner",
      titleLine2: 'vos espaces extérieurs',
      description: "Conception sur-mesure, aménagement végétal et harmonie des matières. Nous donnons vie à des jardins d'exception, pensés pour durer et évoluer au fil des saisons.",
      buttonText: 'Regarder les réalisations',
    },
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [toast, setToast] = useState('')

  const heroInputRef = useRef(null)
  const logoInputRef = useRef(null)

  useEffect(() => {
    fetchAdminSettings(token)
      .then(data => {
        if (data) {
          setForm(prev => ({
            ...prev,
            branding: { ...prev.branding, ...(data.branding || {}) },
            hero: { ...prev.hero, ...(data.hero || {}) },
          }))
        }
      })
      .catch(err => console.error('Error loading settings:', err))
      .finally(() => setLoading(false))
  }, [token])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const updateHero = (field, val) => {
    setForm(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: val },
    }))
  }

  const updateBranding = (field, val) => {
    setForm(prev => ({
      ...prev,
      branding: { ...prev.branding, [field]: val },
    }))
  }

  // Upload file helper with mobile client-side compression
  const handleUpload = async (file, type) => {
    if (!file) return
    const isHero = type === 'hero'
    if (isHero) setUploadingHero(true)
    else setUploadingLogo(true)
    showToast('Optimisation de la photo…')

    let compressedFile = file
    let localDataUrl = null

    try {
      const comp = await compressImage(file, isHero ? 1920 : 600, isHero ? 1200 : 600, 0.85)
      compressedFile = comp.file
      localDataUrl = comp.dataUrl

      let uploadedUrl = null

      // 1. Try Supabase Storage CDN first if configured
      if (isSupabaseConfigured) {
        try {
          uploadedUrl = await uploadPhotoToSupabase(compressedFile)
        } catch (err) {
          console.warn('[Appearance] Supabase upload fallback to server:', err)
        }
      }

      // 2. Fallback to server upload if Supabase is not configured or failed
      if (!uploadedUrl) {
        try {
          const formData = new FormData()
          formData.append('photos', compressedFile)

          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          })

          if (res.ok) {
            const uploaded = await res.json()
            if (uploaded && uploaded[0] && uploaded[0].url) {
              uploadedUrl = uploaded[0].url
            }
          }
        } catch {
          // Serveur inaccessible
        }
      }

      // 3. Fallback ultime : stockage direct en Base64 compressé dans la BDD (survit aux pushs Netlify)
      if (!uploadedUrl && localDataUrl) {
        uploadedUrl = localDataUrl
      }

      if (uploadedUrl) {
        const url = uploadedUrl
        let updatedForm
        if (isHero) {
          updatedForm = {
            ...form,
            hero: { ...form.hero, bgImage: url }
          }
          setForm(updatedForm)
        } else {
          updatedForm = {
            ...form,
            branding: { ...form.branding, logoUrl: url }
          }
          setForm(updatedForm)
        }

        // Immediately persist settings
        const saveRes = await saveAdminSettings(updatedForm, token)
        if (saveRes.serverSuccess) {
          showToast(isHero ? 'Nouvelle photo de fond enregistrée !' : 'Nouveau logo enregistré !')
        } else if (saveRes.isAuthError) {
          showToast('⚠ Session expirée — veuillez vous reconnecter')
        } else {
          showToast('⚠ Erreur lors de l\'enregistrement')
        }
        return
      }

      showToast('Erreur lors du téléversement de l\'image')
    } catch {
      showToast('Erreur lors du traitement du fichier')
    } finally {
      if (isHero) setUploadingHero(false)
      else setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const result = await saveAdminSettings(form, token)
      if (result.success) {
        if (result.serverSuccess) {
          showToast('Apparence enregistrée sur le serveur avec succès !')
        } else if (result.isAuthError) {
          showToast('⚠ Session expirée — veuillez vous reconnecter')
        } else {
          showToast('⚠ Erreur lors de l\'enregistrement sur le serveur')
        }
      } else {
        showToast('Erreur lors de la sauvegarde')
      }
    } catch {
      showToast('Erreur de connexion au serveur')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', color: '#71717a' }}>Chargement…</div>
  }

  return (
    <div className="appearance-page">
      <div className="admin-page-header">
        <div>
          <h1>Apparence & Hero Section</h1>
          <p className="admin-page-desc">
            Personnalisez la photo de fond de la page d'accueil, les textes d'introduction et le logo.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="admin-btn admin-btn-primary"
          disabled={saving}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="appearance-form">
        {/* HERO SECTION */}
        <div className="appearance-section">
          <div className="appearance-section-header">
            <h2>Hero Section (Accueil)</h2>
            <p>L'espace principal d'accroche visible dès l'arrivée des visiteurs sur votre site.</p>
          </div>

          {/* Background image */}
          <div className="form-field">
            <label>Photo de fond de la Hero</label>
            <div className="hero-preview-box">
              <img
                src={form.hero.bgImage}
                alt="Aperçu Hero"
                className="hero-preview-img"
              />
              <div className="hero-preview-overlay">
                <input
                  type="file"
                  ref={heroInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files[0], 'hero')}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => heroInputRef.current?.click()}
                  disabled={uploadingHero}
                >
                  {uploadingHero ? 'Téléversement en cours…' : '📷 Remplacer la photo de fond'}
                </button>
                <span className="hero-preview-hint">Formats recommandés : JPG ou WebP haute définition (1920x1080)</span>
              </div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="hero-tagline">Ligne d'accroche (au-dessus du titre)</label>
            <input
              type="text"
              id="hero-tagline"
              value={form.hero.tagline}
              onChange={(e) => updateHero('tagline', e.target.value)}
              placeholder="Atelier de paysage · Conception & Réalisation"
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="hero-t1">Titre principal (Ligne 1)</label>
              <input
                type="text"
                id="hero-t1"
                value={form.hero.titleLine1}
                onChange={(e) => updateHero('titleLine1', e.target.value)}
                placeholder="L'art de façonner"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="hero-t2">Titre principal (Ligne 2 - En italique)</label>
              <input
                type="text"
                id="hero-t2"
                value={form.hero.titleLine2}
                onChange={(e) => updateHero('titleLine2', e.target.value)}
                placeholder="vos espaces extérieurs"
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="hero-desc">Texte d'introduction / Description</label>
            <textarea
              id="hero-desc"
              rows={3}
              value={form.hero.description}
              onChange={(e) => updateHero('description', e.target.value)}
              placeholder="Présentation en 1 ou 2 phrases percutantes..."
            />
          </div>

          <div className="form-field" style={{ maxWidth: '400px' }}>
            <label htmlFor="hero-btn-text">Texte du bouton</label>
            <input
              type="text"
              id="hero-btn-text"
              value={form.hero.buttonText}
              onChange={(e) => updateHero('buttonText', e.target.value)}
              placeholder="Regarder les réalisations"
            />
          </div>
        </div>

        {/* LOGO & BRANDING */}
        <div className="appearance-section">
          <div className="appearance-section-header">
            <h2>Logo & Identité Visuelle</h2>
            <p>Personnalisez le logo et le nom de l'entreprise affiché dans la barre de navigation et le footer.</p>
          </div>

          <div className="form-field">
            <label>Logo de l'entreprise</label>
            <div className="logo-preview-box">
              <div className="logo-preview-circle">
                <img
                  src={form.branding.logoUrl}
                  alt="Logo"
                  className="logo-preview-img"
                />
              </div>
              <div className="logo-preview-controls">
                <input
                  type="file"
                  ref={logoInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => handleUpload(e.target.files[0], 'logo')}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? 'Chargement…' : 'Changer le logo'}
                </button>
                <span className="form-field-hint">Format PNG ou JPG avec fond blanc ou transparent</span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="brand-name">Initiales / Préfixe</label>
              <input
                type="text"
                id="brand-name"
                value={form.branding.brandName}
                onChange={(e) => updateBranding('brandName', e.target.value)}
                placeholder="CL"
              />
            </div>
            <div className="form-field">
              <label htmlFor="brand-accent">Nom principal</label>
              <input
                type="text"
                id="brand-accent"
                value={form.branding.brandAccent}
                onChange={(e) => updateBranding('brandAccent', e.target.value)}
                placeholder="Paysage"
              />
            </div>
            <div className="form-field">
              <label htmlFor="brand-sub">Sous-titre (Métier)</label>
              <input
                type="text"
                id="brand-sub"
                value={form.branding.brandSub}
                onChange={(e) => updateBranding('brandSub', e.target.value)}
                placeholder="Paysagiste Concepteur"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM SAVE BAR */}
        <div className="appearance-actions">
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={saving}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer toutes les modifications'}
          </button>
        </div>
      </form>

      {toast && <div className="form-toast">{toast}</div>}
    </div>
  )
}
