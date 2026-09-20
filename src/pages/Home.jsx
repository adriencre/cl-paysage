import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import defaultProjects from '../../data/projects.json'
import defaultSettings from '../../data/settings.json'
import { fetchPublicSettings, fetchPublicProjects } from '../lib/dataSync'
import FadeIn from '../components/FadeIn'
import { usePageSeo } from '../hooks/usePageSeo'
import './Home.css'

export default function Home() {
  usePageSeo({
    title: "CL Paysage — Paysagiste & Jardinier à Villeneuve d'Ascq (59) | Entretien & Aménagement",
    description: "CL Paysage, artisan paysagiste à Villeneuve d'Ascq et métropole lilloise (Hem, Croix, Marcq-en-Barœul...). Jardinage, entretien de jardin, tonte, taille de haies & aménagements d'exception. Devis gratuit.",
    canonical: "https://cl-paysage.com/"
  })

  const [projects, setProjects] = useState(() => {
    return defaultProjects.map(p => ({
      ...p,
      photos: (p.photos || []).map(ph => ({ ...ph, url: ph.isStatic ? `/images/${ph.filename}` : `/uploads/${ph.filename}` }))
    })).slice(0, 3)
  })

  // Récupère immédiatement l'URL personnalisée en cache pour un affichage instantané
  const getInitialHeroBg = () => {
    try {
      return localStorage.getItem('cl_hero_bg') || sessionStorage.getItem('cl_hero_bg') || defaultSettings.hero.bgImage
    } catch {
      return defaultSettings.hero.bgImage
    }
  }

  const [settings, setSettings] = useState(() => ({
    ...defaultSettings,
    hero: {
      ...defaultSettings.hero,
      bgImage: getInitialHeroBg(),
    }
  }))

  useEffect(() => {
    // 1. Projets publics (depuis Supabase Cloud en priorité)
    fetchPublicProjects().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setProjects(data.slice(0, 3))
      }
    })

    // 2. Paramètres publics (depuis Supabase Cloud en direct)
    fetchPublicSettings().then(d => {
      if (d && d.hero) {
        setSettings(prev => ({ ...prev, ...d, hero: { ...prev.hero, ...(d.hero || {}) } }))
        if (d.hero.bgImage) {
          try {
            localStorage.setItem('cl_hero_bg', d.hero.bgImage)
            sessionStorage.setItem('cl_hero_bg', d.hero.bgImage)
          } catch {}
        }
      }
    })

    const handleUpdate = (e) => {
      if (e.detail) {
        setSettings(prev => ({
          ...prev,
          ...e.detail,
          hero: { ...prev.hero, ...(e.detail.hero || {}) },
        }))
        if (e.detail.hero?.bgImage) {
          try {
            localStorage.setItem('cl_hero_bg', e.detail.hero.bgImage)
            sessionStorage.setItem('cl_hero_bg', e.detail.hero.bgImage)
          } catch {}
        }
      }
    }
    window.addEventListener('cl_settings_updated', handleUpdate)

    return () => window.removeEventListener('cl_settings_updated', handleUpdate)
  }, [])

  const hero = settings.hero || defaultSettings.hero

  return (
    <>
      {/* Hero */}
      <section className="hero" id="hero">
        <div className="hero-bg">
          <img
            src={hero.bgImage || '/images/hero.jpg'}
            alt="CL Paysage — Paysagiste et aménagement de jardin à Villeneuve d'Ascq"
          />
        </div>
        <div className="hero-overlay" />

        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-tagline">{hero.tagline}</span>

            <h1 className="hero-title">
              {hero.titleLine1} <br />
              <em>{hero.titleLine2}</em>
            </h1>

            <p className="hero-desc">
              {hero.description}
            </p>

            <div className="hero-actions">
              <Link to="/realisations" className="hero-btn">
                <span>{hero.buttonText}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="section approach" id="approach">
        <div className="container">
          <FadeIn>
            <span className="section-label">Notre approche</span>
            <h2 className="section-title">Un savoir-faire à chaque étape</h2>
          </FadeIn>
          <div className="approach-grid">
            <FadeIn delay={0}>
              <div className="approach-item">
                <svg className="approach-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="24" cy="24" r="20" />
                  <path d="M24 14v10l7 7" />
                  <path d="M16 8l2 4M32 8l-2 4" />
                </svg>
                <h3>Conception</h3>
                <p>
                  Étude personnalisée de votre terrain, de vos envies
                  et de votre mode de vie pour imaginer un jardin qui vous ressemble.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={150}>
              <div className="approach-item">
                <svg className="approach-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 42h36" />
                  <path d="M14 42V26l10-16 10 16v16" />
                  <path d="M20 42v-8h8v8" />
                  <circle cx="24" cy="22" r="3" />
                </svg>
                <h3>Réalisation</h3>
                <p>
                  Mise en œuvre soignée avec des matériaux nobles et des végétaux
                  sélectionnés pour un résultat durable et harmonieux.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={300}>
              <div className="approach-item">
                <svg className="approach-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M24 6c-6 8-14 13-14 22a14 14 0 0028 0C38 19 30 14 24 6z" />
                  <path d="M20 30c0-4 4-8 4-8s4 4 4 8a4 4 0 01-8 0z" />
                </svg>
                <h3>Entretien</h3>
                <p>
                  Suivi régulier et attentif pour que votre jardin conserve
                  son éclat saison après saison.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="section" id="preview">
        <div className="container">
          <FadeIn>
            <span className="section-label">Réalisations</span>
            <h2 className="section-title">Nos dernières créations</h2>
          </FadeIn>
          <FadeIn>
            <div className="preview-grid">
              {projects.map((project) => {
                const photos = project.photos || []
                const mainPhoto = photos.find(p => p.isMain) || photos[0]
                return (
                  <Link to={`/realisations/${project.id}`} key={project.id} className="preview-item">
                    {mainPhoto && <img src={mainPhoto.url} alt={`${project.title} — Paysagiste Villeneuve d'Ascq`} loading="lazy" />}
                  </Link>
                )
              })}
            </div>
          </FadeIn>
          <FadeIn>
            <Link to="/realisations" className="btn-text">
              Voir toutes nos réalisations →
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner" id="cta">
        <div className="container">
          <div className="cta-inner">
            <h2>Votre projet commence ici</h2>
            <Link to="/contact" className="btn btn-outline">
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
