import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchAdminProjects, saveAdminProject, fileToBase64 } from '../lib/dataSync'
import './ProjectForm.css'

const CATEGORIES = [
  { value: 'amenagement', label: 'Aménagement' },
  { value: 'jardin', label: 'Jardin' },
  { value: 'terrasse', label: 'Terrasse & Allées' },
  { value: 'entretien', label: 'Entretien' },
  { value: 'autre', label: 'Autre' },
]

export default function ProjectForm({ token, isEdit = false }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'amenagement',
    location: '',
    date: '',
    photos: [],
    socialLinks: { instagram: '', facebook: '', pinterest: '', tiktok: '' },
    published: false,
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (isEdit && id) {
      fetchAdminProjects(token).then(projects => {
        const p = projects.find(proj => proj.id === id)
        if (p) {
          setForm({
            title: p.title,
            description: p.description,
            category: p.category,
            location: p.location,
            date: p.date,
            photos: p.photos || [],
            socialLinks: p.socialLinks || { instagram: '', facebook: '', pinterest: '', tiktok: '' },
            published: p.published,
          })
        }
      })
    }
  }, [isEdit, id, token])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const updateSocial = (platform, value) => {
    setForm(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }))
  }

  // Photo upload
  const uploadFiles = async (files) => {
    if (!files.length) return
    setUploading(true)

    try {
      const formData = new FormData()
      Array.from(files).forEach(f => formData.append('photos', f))

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (res.ok) {
        const uploaded = await res.json()
        if (Array.isArray(uploaded) && uploaded.length > 0) {
          setForm(prev => ({
            ...prev,
            photos: [
              ...prev.photos,
              ...uploaded.map((u, i) => ({
                ...u,
                isMain: prev.photos.length === 0 && i === 0,
              })),
            ],
          }))
          showToast(`${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} ajoutée${uploaded.length > 1 ? 's' : ''}`)
          setUploading(false)
          return
        }
      }
    } catch {}

    // Fallback: convert to base64 Data URL (immune to server outages)
    try {
      const b64List = []
      for (const file of Array.from(files)) {
        const b64 = await fileToBase64(file)
        b64List.push({
          filename: file.name,
          url: b64,
          isMain: form.photos.length === 0 && b64List.length === 0,
          isStatic: false,
        })
      }
      setForm(prev => ({
        ...prev,
        photos: [...prev.photos, ...b64List],
      }))
      showToast(`${b64List.length} photo${b64List.length > 1 ? 's' : ''} ajoutée${b64List.length > 1 ? 's' : ''}`)
    } catch (err) {
      showToast('Erreur lors de la lecture des photos')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    uploadFiles(e.dataTransfer.files)
  }

  const removePhoto = (idx) => {
    const photo = form.photos[idx]
    setForm(prev => {
      const updated = prev.photos.filter((_, i) => i !== idx)
      // If removed photo was main, make the first one main
      if (photo.isMain && updated.length > 0) {
        updated[0] = { ...updated[0], isMain: true }
      }
      return { ...prev, photos: updated }
    })
    // Delete from server if uploaded (not static)
    if (!photo.isStatic) {
      fetch(`/api/admin/upload/${photo.filename}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  }

  const setMainPhoto = (idx) => {
    setForm(prev => ({
      ...prev,
      photos: prev.photos.map((p, i) => ({ ...p, isMain: i === idx })),
    }))
  }

  // Save
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      showToast('Le titre est obligatoire')
      return
    }
    setSaving(true)

    try {
      const saved = await saveAdminProject(form, token, isEdit, id)
      if (saved) {
        showToast(isEdit ? 'Projet modifié avec succès !' : 'Projet créé avec succès !')
        setTimeout(() => navigate('/admin'), 500)
      } else {
        showToast('Erreur lors de la sauvegarde')
      }
    } catch (err) {
      showToast('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="project-form-container" id="project-form">
      <div className="admin-page-header">
        <h1>{isEdit ? 'Modifier le projet' : 'Nouveau projet'}</h1>
        <button className="admin-btn" onClick={() => navigate('/admin')}>
          ← Retour
        </button>
      </div>

      <form className="project-form" onSubmit={handleSubmit}>
        {/* General info */}
        <div className="form-section">
          <h3 className="form-section-title">Informations générales</h3>

          <div className="form-field">
            <label htmlFor="pf-title">Titre du projet</label>
            <input
              id="pf-title"
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Ex : Jardin méditerranéen à Lyon"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="pf-desc">Description</label>
            <textarea
              id="pf-desc"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Décrivez le projet, les matériaux utilisés, les végétaux plantés…"
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="pf-category">Catégorie</label>
              <select
                id="pf-category"
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="pf-location">Lieu</label>
              <input
                id="pf-location"
                type="text"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="Ex : Lyon, Rhône"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="pf-date">Date de réalisation</label>
              <input
                id="pf-date"
                type="month"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Statut</label>
              <div className="form-toggle" style={{ marginTop: '0.4rem' }}>
                <button
                  type="button"
                  className={`toggle-switch${form.published ? ' active' : ''}`}
                  onClick={() => updateField('published', !form.published)}
                />
                <span className="toggle-label">
                  {form.published ? 'Publié (visible sur le site)' : 'Brouillon (non visible)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="form-section">
          <h3 className="form-section-title">Photos</h3>

          <div
            className={`photo-dropzone${dragging ? ' dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <svg className="photo-dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p><strong>Cliquez</strong> ou glissez vos photos ici</p>
            <p className="photo-dropzone-hint">JPG, PNG ou WebP — 15 Mo max par fichier</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => uploadFiles(e.target.files)}
          />

          {uploading && (
            <div className="photo-uploading">
              <span>⏳</span> Upload en cours…
            </div>
          )}

          {form.photos.length > 0 && (
            <>
              <p className="form-field-hint" style={{ marginTop: '0.75rem' }}>
                Cliquez sur une photo pour la définir comme photo principale.
              </p>
              <div className="photo-grid">
                {form.photos.map((photo, i) => (
                  <div
                    key={i}
                    className={`photo-card${photo.isMain ? ' main' : ''}`}
                    onClick={() => setMainPhoto(i)}
                  >
                    <img src={photo.url} alt={`Photo ${i + 1}`} />
                    <div className="photo-card-overlay">
                      <button
                        type="button"
                        className="photo-card-remove"
                        onClick={(e) => { e.stopPropagation(); removePhoto(i) }}
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </div>
                    {photo.isMain && (
                      <div className="photo-card-main-badge">Principale</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Social links */}
        <div className="form-section">
          <h3 className="form-section-title">Réseaux sociaux</h3>
          <p className="form-field-hint" style={{ marginBottom: '1rem' }}>
            Ajoutez les liens vers les publications de ce projet sur les réseaux sociaux (optionnel).
          </p>

          <div className="social-field">
            <span className="social-label">Instagram</span>
            <input
              type="url"
              value={form.socialLinks.instagram}
              onChange={(e) => updateSocial('instagram', e.target.value)}
              placeholder="https://instagram.com/p/..."
            />
          </div>
          <div className="social-field">
            <span className="social-label">Facebook</span>
            <input
              type="url"
              value={form.socialLinks.facebook}
              onChange={(e) => updateSocial('facebook', e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div className="social-field">
            <span className="social-label">Pinterest</span>
            <input
              type="url"
              value={form.socialLinks.pinterest}
              onChange={(e) => updateSocial('pinterest', e.target.value)}
              placeholder="https://pinterest.com/pin/..."
            />
          </div>
          <div className="social-field">
            <span className="social-label">TikTok</span>
            <input
              type="url"
              value={form.socialLinks.tiktok}
              onChange={(e) => updateSocial('tiktok', e.target.value)}
              placeholder="https://tiktok.com/..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={saving}
          >
            {saving ? 'Enregistrement…' : (isEdit ? 'Enregistrer les modifications' : 'Créer le projet')}
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={() => navigate('/admin')}
          >
            Annuler
          </button>
        </div>
      </form>

      {toast && <div className="form-toast">{toast}</div>}
    </div>
  )
}
