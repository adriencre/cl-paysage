import { Link } from 'react-router-dom'
import FadeIn from '../components/FadeIn'
import './Services.css'

const services = [
  {
    title: 'Conception paysagère',
    desc: 'Plans sur mesure adaptés à votre terrain, votre environnement et vos envies. Nous imaginons des espaces qui s\'intègrent naturellement à leur contexte.',
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
    title: 'Aménagement extérieur',
    desc: 'Terrasses, allées, murets, clôtures — nous construisons avec des matériaux nobles pour des espaces durables et esthétiques.',
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
    title: 'Entretien de jardins',
    desc: 'Taille, tonte, élagage, traitement phytosanitaire — un suivi régulier pour que votre jardin reste impeccable tout au long de l\'année.',
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
    title: 'Terrasses & allées',
    desc: 'Pierre naturelle, bois, béton décoratif — des revêtements choisis avec soin pour prolonger votre intérieur vers l\'extérieur.',
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

const steps = [
  { num: '01', title: 'Rencontre', desc: 'Visite de votre terrain et échange sur vos envies' },
  { num: '02', title: 'Étude', desc: 'Conception du plan et choix des matériaux et végétaux' },
  { num: '03', title: 'Réalisation', desc: 'Mise en œuvre par notre équipe avec suivi régulier' },
  { num: '04', title: 'Suivi', desc: 'Entretien et accompagnement sur le long terme' },
]

export default function Services() {
  return (
    <>
      {/* Header */}
      <section className="page-header" id="services-header">
        <div className="container">
          <FadeIn>
            <span className="section-label">Expertise</span>
            <h1 className="section-title">Nos services</h1>
            <p className="section-subtitle">
              De la conception à l'entretien, nous vous accompagnons
              à chaque étape de votre projet paysager.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Services grid */}
      <section className="section" id="services-list">
        <div className="container">
          <div className="services-grid">
            {services.map((s, i) => (
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

      {/* Process */}
      <section className="section process-section" id="process">
        <div className="container">
          <FadeIn>
            <span className="section-label">Notre démarche</span>
            <h2 className="section-title">Comment ça fonctionne</h2>
          </FadeIn>
          <div className="process-timeline">
            {steps.map((step, i) => (
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
            <h2>Prêt à transformer votre extérieur ?</h2>
            <Link to="/contact" className="btn btn-outline">
              Demander un devis
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
