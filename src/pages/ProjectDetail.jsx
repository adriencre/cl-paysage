import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import defaultProjects from '../../data/projects.json'
import FadeIn from '../components/FadeIn'
import Lightbox from '../components/Lightbox'
import './ProjectDetail.css'

const CATEGORY_LABELS = {
  amenagement: 'Aménagement',
  jardin: 'Jardin',
  terrasse: 'Terrasse & Allées',
  entretien: 'Entretien',
  autre: 'Autre',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month] = dateStr.split('-')
  const months = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  return `${months[parseInt(month)] || ''} ${year}`
}

const SOCIAL_ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  ),
  pinterest: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 21c1-3 1.5-5.5 2-7.5.5-2-.5-3.5 1-5s4-1 4.5 1-.5 4-1.5 6c-1 2 0 3.5 2 3.5s4-3 4-7.5C20 7 16 4 12 4S5 7.5 5.5 12c0 1.5.5 2.5 1 3" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" />
    </svg>
  ),
}

export default function ProjectDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/projects/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(d => setData(d))
      .catch(() => {
        const found = defaultProjects.find(p => p.id === id)
        if (found) {
          const enriched = {
            ...found,
            photos: found.photos.map(ph => ({ ...ph, url: ph.isStatic ? `/images/${ph.filename}` : `/uploads/${ph.filename}` })),
          }
          const idx = defaultProjects.findIndex(p => p.id === id)
          const prev = idx > 0 ? { id: defaultProjects[idx - 1].id, title: defaultProjects[idx - 1].title } : null
          const next = idx < defaultProjects.length - 1 ? { id: defaultProjects[idx + 1].id, title: defaultProjects[idx + 1].title } : null
          setData({ project: enriched, prev, next })
        } else {
          setData(null)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ paddingTop: 'calc(var(--nav-height) + 4rem)', textAlign: 'center', color: 'var(--c-gray)' }}>
        Chargement…
      </div>
    )
  }

  if (!data || !data.project) {
    return (
      <div style={{ paddingTop: 'calc(var(--nav-height) + 4rem)', textAlign: 'center' }}>
        <h2>Projet non trouvé</h2>
        <Link to="/realisations" className="btn-text" style={{ marginTop: '1rem', display: 'inline-block' }}>
          ← Retour aux réalisations
        </Link>
      </div>
    )
  }

  const { project, prev, next } = data
  const mainPhoto = project.photos.find(p => p.isMain) || project.photos[0]
  const otherPhotos = project.photos.filter(p => p !== mainPhoto)
  const socialEntries = Object.entries(project.socialLinks || {}).filter(([, url]) => url)
  const lightboxImages = project.photos.map(p => ({ src: p.url, alt: project.title }))

  return (
    <>
      {/* Hero */}
      {mainPhoto && (
        <section className="detail-hero" id="detail-hero">
          <img
            src={mainPhoto.url}
            alt={project.title}
            className="detail-hero-img"
          />
        </section>
      )}

      {/* Content */}
      <section className="detail-content" id="detail-content">
        <div className="container">
          <Link to="/realisations" className="detail-back">← Toutes les réalisations</Link>

          <FadeIn>
            <div className="detail-header">
              <div className="detail-category">
                {CATEGORY_LABELS[project.category] || project.category}
              </div>
              <h1>{project.title}</h1>
              <div className="detail-meta">
                {project.location && (
                  <span className="detail-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {project.location}
                  </span>
                )}
                {project.date && (
                  <span className="detail-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(project.date)}
                  </span>
                )}
              </div>
            </div>
          </FadeIn>

          {project.description && (
            <FadeIn>
              <p className="detail-description">{project.description}</p>
            </FadeIn>
          )}

          {/* Social links */}
          {socialEntries.length > 0 && (
            <FadeIn>
              <div className="detail-social">
                {socialEntries.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-social-link"
                  >
                    {SOCIAL_ICONS[platform]}
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </a>
                ))}
              </div>
            </FadeIn>
          )}

          {/* Gallery */}
          {otherPhotos.length > 0 && (
            <FadeIn>
              <div className="detail-gallery">
                <h3 className="detail-gallery-title">
                  Galerie — {project.photos.length} photos
                </h3>
                <div className="detail-gallery-grid">
                  {project.photos.map((photo, i) => (
                    <div
                      key={i}
                      className="detail-gallery-item"
                      onClick={() => setLightboxIndex(i)}
                    >
                      <img src={photo.url} alt={`${project.title} — Photo ${i + 1}`} loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

          {/* Prev / Next nav */}
          {(prev || next) && (
            <FadeIn>
              <div className="detail-nav">
                {prev ? (
                  <Link to={`/realisations/${prev.id}`} className="detail-nav-link prev">
                    <span className="detail-nav-label">← Précédent</span>
                    <span className="detail-nav-title">{prev.title}</span>
                  </Link>
                ) : <div />}
                {next ? (
                  <Link to={`/realisations/${next.id}`} className="detail-nav-link next">
                    <span className="detail-nav-label">Suivant →</span>
                    <span className="detail-nav-title">{next.title}</span>
                  </Link>
                ) : <div />}
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  )
}
