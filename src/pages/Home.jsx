import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import defaultProjects from '../../data/projects.json'
import FadeIn from '../components/FadeIn'
import './Home.css'

export default function Home() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetch('/api/projects')
      .then(r => {
        if (!r.ok) throw new Error('API offline')
        return r.json()
      })
      .then(data => setProjects(data.slice(0, 3)))
      .catch(() => {
        const formatted = defaultProjects.map(p => ({
          ...p,
          photos: p.photos.map(ph => ({ ...ph, url: ph.isStatic ? `/images/${ph.filename}` : `/uploads/${ph.filename}` }))
        }))
        setProjects(formatted.slice(0, 3))
      })
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="hero" id="hero">
        <div className="hero-bg">
          <img src="/images/hero.jpg" alt="Jardin paysager d'exception" />
        </div>
        <div className="hero-overlay" />

        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-tagline">Atelier de paysage · Conception & Réalisation</span>

            <h1 className="hero-title">
              L'art de façonner <br />
              <em>vos espaces extérieurs</em>
            </h1>

            <p className="hero-desc">
              Conception sur-mesure, aménagement végétal et harmonie des matières.
              Nous donnons vie à des jardins d'exception, pensés pour durer et évoluer au fil des saisons.
            </p>

            <div className="hero-actions">
              <Link to="/realisations" className="hero-btn">
                <span>Regarder les réalisations</span>
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
                const mainPhoto = project.photos.find(p => p.isMain) || project.photos[0]
                return (
                  <Link to={`/realisations/${project.id}`} key={project.id} className="preview-item">
                    {mainPhoto && <img src={mainPhoto.url} alt={project.title} loading="lazy" />}
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
