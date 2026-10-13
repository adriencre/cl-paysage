import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import defaultSettings from '../../data/settings.json'
import { fetchPublicSettings } from '../lib/dataSync'
import FadeIn from '../components/FadeIn'
import { usePageSeo } from '../hooks/usePageSeo'
import './Services.css'

export default function Services() {
  usePageSeo({
    title: "Services Paysagiste & Jardinage à Villeneuve d'Ascq | Tonte, Taille, Création",
    description: "Services de paysagiste et jardinage à Villeneuve d'Ascq et alentours : conception paysagère, aménagement extérieur, entretien de jardin, terrasses et allées. Devis gratuit.",
    canonical: "https://cl-paysage.com/services"
  })

  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    fetchPublicSettings()
      .then(d => {
        if (d && typeof d === 'object') setSettings(d)
      })
      .catch(() => {})

    const handleUpdate = (e) => {
      if (e.detail) setSettings(e.detail)
    }
    window.addEventListener('cl_settings_updated', handleUpdate)

    return () => window.removeEventListener('cl_settings_updated', handleUpdate)
  }, [])

  const servicesContent = settings.content?.services || defaultSettings.content?.services || {}
  const taxCredit = settings.content?.taxCredit || defaultSettings.content?.taxCredit || {}

  const servicesList = [
    {
      title: servicesContent.service1Title || 'Conception paysagère',
      desc: servicesContent.service1Desc || 'Plans sur mesure adaptés à votre terrain, votre environnement et vos envies. Nous imaginons des espaces qui s\'intègrent naturellement à leur contexte.',
      icon: (
        <svg className="service-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="32" height="32" rx="2" />
          <path d="M4 14h32" />
          <circle cx="12" cy="9" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="18" cy="9" r="1.5" fill="currentColor" stroke="none" />
          <path d="M10 26l6-8 5 5 4-3 5 6" />
        </svg>
      ),
    },
    {
      title: servicesContent.service2Title || 'Aménagement extérieur',
      desc: servicesContent.service2Desc || 'Terrasses, allées, murets, clôtures — nous construisons avec des matériaux nobles pour des espaces durables et esthétiques.',
      icon: (
        <svg className="service-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 36h28" />
          <path d="M10 36V20h8v16" />
          <path d="M22 36V24h8v12" />
          <path d="M14 20L20 10l6 10" />
          <path d="M26 24l4-6" />
        </svg>
      ),
    },
    {
      title: servicesContent.service3Title || 'Entretien de jardins',
      desc: servicesContent.service3Desc || 'Taille, tonte, élagage, traitement raisonné — un suivi régulier pour que votre extérieur reste impeccable tout au long de l\'année.',
      icon: (
        <svg className="service-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 36V18" />
          <path d="M20 18c-4-2-10-2-12 4 6 0 10-1 12-4z" />
          <path d="M20 24c4-2 10-2 12 4-6 0-10-1-12-4z" />
          <path d="M20 12c-3-1.5-7-1.5-8.5 3 4 0 7-.5 8.5-3z" />
          <path d="M20 12c3-1.5 7-1.5 8.5 3-4 0-7-.5-8.5-3z" />
          <circle cx="20" cy="8" r="3" />
        </svg>
      ),
    },
    {
      title: servicesContent.service4Title || 'Terrasses & allées',
      desc: servicesContent.service4Desc || 'Pierre naturelle, bois, béton décoratif — des revêtements choisis avec soin pour prolonger votre intérieur vers l\'extérieur.',
      icon: (
        <svg className="service-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 36h32" />
          <path d="M4 36l6-24h20l6 24" />
          <path d="M12 36l2-12h12l2 12" />
          <path d="M16 24l1-6h6l1 6" />
        </svg>
      ),
    },
  ]

  const processSteps = [
    {
      num: servicesContent.step1Num || '01',
      title: servicesContent.step1Title || 'Rencontre',
      desc: servicesContent.step1Desc || 'Visite de votre terrain et échange sur vos envies'
    },
    {
      num: servicesContent.step2Num || '02',
      title: servicesContent.step2Title || 'Étude',
      desc: servicesContent.step2Desc || 'Conception du plan et choix des matériaux et végétaux'
    },
    {
      num: servicesContent.step3Num || '03',
      title: servicesContent.step3Title || 'Réalisation',
      desc: servicesContent.step3Desc || 'Mise en œuvre par notre équipe avec suivi régulier'
    },
    {
      num: servicesContent.step4Num || '04',
      title: servicesContent.step4Title || 'Suivi',
      desc: servicesContent.step4Desc || 'Entretien et accompagnement sur le long terme'
    },
  ]

  return (
    <>
      {/* Header */}
      <section className="page-header" id="services-header">
        <div className="container">
          <FadeIn>
            <span className="section-label">{servicesContent.headerLabel || "Expertise"}</span>
            <h1 className="section-title">{servicesContent.headerTitle || "Nos services"}</h1>
            <p className="section-subtitle">
              {servicesContent.headerSubtitle || "De la conception à l'entretien, nous vous accompagnons à chaque étape de votre projet paysager."}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Services grid */}
      <section className="section" id="services-list">
        <div className="container">
          <div className="services-grid">
            {servicesList.map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="service-card">
                  {s.icon}
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Tax Credit Banner / Card */}
      {taxCredit.enabled !== false && (
        <section className="section tax-credit-section" id="tax-credit">
          <div className="container">
            <FadeIn>
              <div className="tax-credit-card">
                <div className="tax-credit-content">
                  <div className="tax-credit-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>{taxCredit.badge || "Avantage fiscal"}</span>
                  </div>
                  <h2>{taxCredit.title || "Bénéficiez de 50% de crédit d'impôt sur l'entretien"}</h2>
                  <p>
                    {taxCredit.description || "Pour vos travaux d'entretien courant de jardin (tonte, taille de haies, débroussaillage, désherbage...), profitez d'une réduction ou d'un crédit d'impôt de 50% selon la réglementation en vigueur (services à la personne)."}
                  </p>
                </div>
                <div className="tax-credit-action">
                  <Link to="/contact" className="btn btn-primary">
                    {taxCredit.buttonText || "Se renseigner pour un projet"}
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* Process */}
      <section className="section process-section" id="process">
        <div className="container">
          <FadeIn>
            <span className="section-label">{servicesContent.processLabel || "Notre démarche"}</span>
            <h2 className="section-title">{servicesContent.processTitle || "Les étapes clés"}</h2>
          </FadeIn>
          <div className="process-timeline">
            {processSteps.map((step, i) => (
              <FadeIn key={i} delay={i * 120}>
                <div className="process-step">
                  <div className="process-number">{step.num}</div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner" id="services-cta">
        <div className="container">
          <div className="cta-inner">
            <h2>{servicesContent.ctaTitle || "Prêt à transformer votre extérieur ?"}</h2>
            <Link to="/contact" className="btn btn-outline">
              {servicesContent.ctaButton || "Demander un devis"}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
