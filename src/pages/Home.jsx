import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import defaultProjects from '../../data/projects.json'
import defaultSettings from '../../data/settings.json'
import { fetchPublicSettings, fetchPublicProjects } from '../lib/dataSync'
import FadeIn from '../components/FadeIn'
import { usePageSeo } from '../hooks/usePageSeo'
import './Home.css'

const CITIES = [
  { name: "Villeneuve d'Ascq", primary: true },
  { name: "Hem", primary: false },
  { name: "Croix", primary: false },
  { name: "Marcq-en-Barœul", primary: false },
  { name: "Wasquehal", primary: false },
  { name: "Lille", primary: false },
  { name: "Mouvaux", primary: false },
  { name: "Roubaix", primary: false },
  { name: "Lezennes", primary: false },
  { name: "Ronchin", primary: false },
  { name: "Sainghin-en-Mélantois", primary: false },
  { name: "Chéreng", primary: false },
  { name: "Forest-sur-Marque", primary: false },
  { name: "Sailly-lez-Lannoy", primary: false },
  { name: "Cysoing", primary: false },
  { name: "Baisieux", primary: false },
  { name: "Toufflers", primary: false }
]

const FAQ_DATA = [
  {
    q: "Quelles prestations de jardinage et d'entretien proposez-vous à Villeneuve d'Ascq ?",
    a: "CL Paysage assure l'entretien complet de vos espaces verts : tonte de pelouse régulière, taille de haies (thuyas, lauriers, charmilles...), taille des arbustes et rosiers, débroussaillage, ramassage des feuilles mortes, désherbage et remise en état complète de votre jardin au printemps ou à l'automne."
  },
  {
    q: "Proposez-vous des contrats d'entretien de jardin annuel ou des interventions ponctuelles ?",
    a: "Nous proposons les deux formules selon vos besoins ! Vous pouvez opter pour un contrat annuel d'entretien pour profiter d'un extérieur impeccable tout au long de l'année, ou faire appel à nous pour une intervention ponctuelle (taille de haie saisonnière, grand nettoyage, etc.)."
  },
  {
    q: "Quelles sont les villes desservies autour de Villeneuve d'Ascq ?",
    a: "Basés à Villeneuve d'Ascq (59650), nous intervenons dans toute la métropole lilloise et ses environs : Hem, Croix, Marcq-en-Barœul, Wasquehal, Mouvaux, Lille, Roubaix, Lezennes, Ronchin, Sainghin-en-Mélantois, Chéreng, Cysoing et la Pévèle."
  },
  {
    q: "Comment obtenir un devis pour un projet paysager ou de jardinage ?",
    a: "Il vous suffit de nous contacter via notre formulaire en ligne ou par téléphone. Nous nous déplaçons gratuitement sur votre terrain à Villeneuve d'Ascq ou aux alentours pour analyser votre extérieur, échanger sur vos envies et vous transmettre un devis détaillé sous 48h."
  },
  {
    q: "Réalisez-vous également la création de terrasses et clôtures ?",
    a: "Oui, en tant que paysagiste concepteur et aménageur, nous concevons et posons vos terrasses en bois naturel ou dalles sur plots, ainsi que vos allées pavées, clôtures rigides avec brise-vue et massifs de plantations."
  }
]

export default function Home() {
  usePageSeo({
    title: "CL Paysage — Paysagiste & Jardinier à Villeneuve d'Ascq (59) | Entretien & Aménagement",
    description: "CL Paysage, artisan paysagiste à Villeneuve d'Ascq et métropole lilloise (Hem, Croix, Marcq-en-Barœul...). Jardinage, tonte, taille de haies, aménagement extérieur & terrasses. Devis gratuit.",
    canonical: "https://clpaysage.fr/"
  })

  const [projects, setProjects] = useState(() => {
    return defaultProjects.map(p => ({
      ...p,
      photos: (p.photos || []).map(ph => ({ ...ph, url: ph.isStatic ? `/images/${ph.filename}` : `/uploads/${ph.filename}` }))
    })).slice(0, 3)
  })

  const [openFaq, setOpenFaq] = useState(null)

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
    fetchPublicProjects().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setProjects(data.slice(0, 3))
      }
    })

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
            alt="Paysagiste et entretien de jardin à Villeneuve d'Ascq - CL Paysage"
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
              <Link to="/contact" className="hero-btn">
                <span>Demander un devis gratuit</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link to="/realisations" className="hero-btn-secondary">
                <span>Voir nos réalisations</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Phares SEO (Jardinage & Aménagement) */}
      <section className="section" id="services-highlights" style={{ background: '#fff' }}>
        <div className="container">
          <FadeIn>
            <span className="section-label">Nos expertises</span>
            <h2 className="section-title">Paysagiste &amp; Jardinier à Villeneuve d'Ascq</h2>
            <p className="section-subtitle" style={{ maxWidth: '720px' }}>
              De l'entretien régulier de votre pelouse et de vos haies jusqu'à la création complète d'un jardin paysager d'exception dans le Nord.
            </p>
          </FadeIn>

          <div className="services-highlight-grid">
            <FadeIn delay={0}>
              <div className="service-highlight-card">
                <span className="service-highlight-badge">Jardinage &amp; Soin végétal</span>
                <h3>Entretien de jardin &amp; Tonte</h3>
                <p>
                  Tonte régulière de pelouse, mulching, débroussaillage et scarification pour un gazon vert et dense tout au long de l'année à Villeneuve d'Ascq.
                </p>
                <Link to="/services" className="service-highlight-link">
                  En savoir plus <span>→</span>
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <div className="service-highlight-card">
                <span className="service-highlight-badge">Taille &amp; Arbustes</span>
                <h3>Taille de haies &amp; Végétaux</h3>
                <p>
                  Taille soignée de haies de thuyas, lauriers, charmilles et troènes. Mise en forme d'arbustes d'ornement et ramassage méticuleux des déchets verts.
                </p>
                <Link to="/services" className="service-highlight-link">
                  En savoir plus <span>→</span>
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="service-highlight-card">
                <span className="service-highlight-badge">Création extérieure</span>
                <h3>Aménagement paysager sur-mesure</h3>
                <p>
                  Conception de massifs fleuris, plantations d'arbres adaptés au terroir lillois, paillage écologique et structuration harmonieuse des volumes.
                </p>
                <Link to="/services" className="service-highlight-link">
                  En savoir plus <span>→</span>
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="service-highlight-card">
                <span className="service-highlight-badge">Espaces à vivre</span>
                <h3>Terrasses, allées &amp; clôtures</h3>
                <p>
                  Pose de terrasses en bois naturel ou dalles extérieures, allées pavées carrossables et clôtures occultantes pour valoriser votre propriété.
                </p>
                <Link to="/services" className="service-highlight-link">
                  En savoir plus <span>→</span>
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Zone d'intervention Locale */}
      <section className="section local-area-section" id="zone-intervention">
        <div className="container">
          <FadeIn>
            <div className="local-area-header">
              <span className="section-label">Proximité &amp; Réactivité</span>
              <h2 className="section-title">Intervention à Villeneuve d'Ascq et aux alentours</h2>
              <p className="local-area-desc">
                Implanté au cœur de la métropole lilloise, <strong>CL Paysage</strong> se déplace chez les particuliers et professionnels pour tous travaux d'aménagement de jardin et de jardinage dans un rayon de 25 km :
              </p>
            </div>

            <div className="local-badges-wrap">
              {CITIES.map((c, i) => (
                <span key={i} className={`city-badge ${c.primary ? 'primary-city' : ''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {c.name}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Approach */}
      <section className="section approach" id="approach">
        <div className="container">
          <FadeIn>
            <span className="section-label">Notre démarche</span>
            <h2 className="section-title">Un savoir-faire artisanal à chaque étape</h2>
          </FadeIn>
          <div className="approach-grid">
            <FadeIn delay={0}>
              <div className="approach-item">
                <svg className="approach-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="24" cy="24" r="20" />
                  <path d="M24 14v10l7 7" />
                  <path d="M16 8l2 4M32 8l-2 4" />
                </svg>
                <h3>1. Étude &amp; Conseil</h3>
                <p>
                  Visite sur place à Villeneuve d'Ascq ou environs pour analyser l'exposition, le sol et vos attentes afin de concevoir un espace harmonieux.
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
                <h3>2. Réalisation soignée</h3>
                <p>
                  Sélection de végétaux vigoureux et matériaux nobles pour des aménagements durables qui traversent les saisons du Nord.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={300}>
              <div className="approach-item">
                <svg className="approach-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M24 6c-6 8-14 13-14 22a14 14 0 0028 0C38 19 30 14 24 6z" />
                  <path d="M20 30c0-4 4-8 4-8s4 4 4 8a4 4 0 01-8 0z" />
                </svg>
                <h3>3. Entretien &amp; Suivi</h3>
                <p>
                  Intervention ponctuelle ou contrat annuel pour que votre jardin conserve toute sa beauté, sans contrainte pour vous.
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
            <span className="section-label">Galerie</span>
            <h2 className="section-title">Nos réalisations en métropole lilloise</h2>
          </FadeIn>
          <FadeIn>
            <div className="preview-grid">
              {projects.map((project) => {
                const photos = project.photos || []
                const mainPhoto = photos.find(p => p.isMain) || photos[0]
                return (
                  <Link to={`/realisations/${project.id}`} key={project.id} className="preview-item">
                    {mainPhoto && <img src={mainPhoto.url} alt={`${project.title} - Paysagiste Villeneuve d'Ascq`} loading="lazy" />}
                    <div className="preview-item-overlay">
                      <h4>{project.title}</h4>
                      <span>{project.location || "Villeneuve d'Ascq & environs"}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </FadeIn>
          <FadeIn>
            <Link to="/realisations" className="btn-text">
              Voir toutes nos réalisations paysagères →
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* FAQ Section pour SEO Local */}
      <section className="section faq-section" id="faq">
        <div className="container">
          <FadeIn>
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
              <span className="section-label">Questions Fréquentes</span>
              <h2 className="section-title">Tout savoir sur nos prestations</h2>
              <p className="section-subtitle">
                Des réponses claires pour vous guider dans vos projets de jardinage et d'aménagement paysager.
              </p>
            </div>

            <div className="faq-container">
              {FAQ_DATA.map((item, index) => {
                const isOpen = openFaq === index
                return (
                  <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                    <button
                      className="faq-question"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <svg className="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="faq-answer">
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner" id="cta">
        <div className="container">
          <div className="cta-inner">
            <div>
              <h2>Un projet de jardinage ou d'aménagement à Villeneuve d'Ascq ?</h2>
              <p>Échangeons ensemble sur vos envies d'extérieur. Devis gratuit et personnalisé sous 48h.</p>
            </div>
            <Link to="/contact" className="btn btn-outline">
              Obtenir mon devis gratuit
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
