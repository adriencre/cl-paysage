import { Link } from 'react-router-dom'
import FadeIn from '../components/FadeIn'
import { usePageSeo } from '../hooks/usePageSeo'
import './Services.css'

const services = [
  {
    title: 'Entretien de jardins & Jardinage',
    subtitle: 'Intervention régulière ou ponctuelle à Villeneuve d\'Ascq',
    desc: 'Tonte de pelouse soignée, désherbage écologique des allées et parterres, scarification, apport d\'engrais naturel et ramassage méticuleux des feuilles en automne. Profitez d\'un jardin toujours net et entretenu sans contrainte.',
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
    title: 'Taille de haies & Arbustes',
    subtitle: 'Thuyas, lauriers, charmilles, troènes & massifs',
    desc: 'Taille de formation, de réduction ou d\'entretien de vos haies vives et brise-vues végétaux. Nous assurons la mise en forme de vos arbustes d\'ornement et l\'évacuation propre de la totalité des déchets verts.',
    icon: (
      <svg className="service-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 34l8-8M14 26l6 6M10 22l14-14a3 3 0 014.24 4.24L14.24 26.24" />
        <path d="M24 16l4 4" />
        <circle cx="10" cy="30" r="2" />
      </svg>
    ),
  },
  {
    title: 'Conception & Aménagement paysager',
    subtitle: 'Création de jardins sur-mesure dans la métropole lilloise',
    desc: 'Étude personnalisée de votre extérieur selon son exposition et son sol. Modélisation de plans, création de massifs paysagers vivaces, plantations d\'arbres adaptés au climat du Nord et engazonnement (semis ou rouleau).',
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
    title: 'Terrasses & Allées extérieures',
    subtitle: 'Bois naturel, grès cérame, dalles & pavages',
    desc: 'Prolongez votre maison vers l\'extérieur avec des revêtements esthétiques et durables : terrasses en bois exotique ou composite, dalles sur plots contemporaines, allées piétonnes pavées et cours d\'accès carrossables.',
    icon: (
      <svg className="service-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 36h32" />
        <path d="M4 36l6-24h20l6 24" />
        <path d="M12 36l2-12h12l2 12" />
        <path d="M16 24l1-6h6l1 6" />
      </svg>
    ),
  },
  {
    title: 'Clôtures, claustras & occultation',
    subtitle: 'Sécurisation et préservation de votre intimité',
    desc: 'Pose de clôtures rigides avec panneaux de soubassement, lamelles occultantes en bois ou PVC, panneaux brise-vue en aluminium et grillages pour délimiter élégamment votre jardin.',
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
    title: 'Remise en état & Débroussaillage',
    subtitle: 'Nettoyage complet de printemps, d\'automne ou après chantier',
    desc: 'Votre jardin est envahi par les herbes hautes, les ronces ou les branches mortes ? Nous réalisons le débroussaillage intégral, l\'élagage doux des petits arbres et le réaménagement propre de votre parcelle.',
    icon: (
      <svg className="service-icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 36V16l8-10 8 10v20" />
        <path d="M8 26l12-8 12 8" />
        <path d="M4 36h32" />
      </svg>
    ),
  },
]

const steps = [
  { num: '01', title: 'Rencontre sur place', desc: 'Visite gratuite de votre terrain à Villeneuve d\'Ascq ou environs pour écouter vos attentes.' },
  { num: '02', title: 'Devis & Conseils', desc: 'Proposition détaillée avec sélection des végétaux et matériaux les plus adaptés.' },
  { num: '03', title: 'Réalisation soignée', desc: 'Intervention méthodique et respectueuse des lieux, avec matériel professionnel.' },
  { num: '04', title: 'Entretien durable', desc: 'Suivi attentif et conseils pour voir votre extérieur s\'épanouir au fil des années.' },
]

export default function Services() {
  usePageSeo({
    title: "Services Paysagiste & Jardinage à Villeneuve d'Ascq | Tonte, Taille, Création",
    description: "Prestations complètes de jardinage et aménagement paysager à Villeneuve d'Ascq et métropole lilloise : tonte pelouse, taille de haies, terrasse bois, massifs, clôtures. Devis gratuit.",
    canonical: "https://clpaysage.fr/services"
  })

  return (
    <>
      {/* Header */}
      <section className="page-header" id="services-header">
        <div className="container">
          <FadeIn>
            <span className="section-label">Expertise Paysagère &amp; Jardinage</span>
            <h1 className="section-title">Nos services à Villeneuve d'Ascq &amp; Métropole Lilloise</h1>
            <p className="section-subtitle">
              De l'entretien minutieux de vos espaces verts à la conception de jardins d'exception, découvrez nos prestations adaptées aux particuliers et professionnels.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Services grid */}
      <section className="section" id="services-list">
        <div className="container">
          <div className="services-grid">
            {services.map((s, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="service-card">
                  {s.icon}
                  <div style={{ fontSize: '0.8rem', color: 'var(--c-olive)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                    {s.subtitle}
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Local coverage banner */}
      <section style={{ background: '#f5f0e8', padding: '3.5rem 0', borderTop: '1px solid #e8e0d0', borderBottom: '1px solid #e8e0d0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto' }}>
          <FadeIn>
            <span className="section-label">Zone de mobilité</span>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '2rem', marginBottom: '1rem', color: 'var(--c-anthracite)' }}>
              Votre paysagiste intervient dans toute la métropole
            </h2>
            <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#555', marginBottom: '1.5rem' }}>
              Nous nous déplaçons rapidement pour tout devis ou intervention à <strong>Villeneuve d'Ascq</strong> (Annappes, Ascq, Brigode, Flers...), <strong>Hem</strong>, <strong>Croix</strong>, <strong>Wasquehal</strong>, <strong>Marcq-en-Barœul</strong>, <strong>Mouvaux</strong>, <strong>Lille</strong>, <strong>Roubaix</strong>, <strong>Lezennes</strong>, <strong>Ronchin</strong>, <strong>Sainghin-en-Mélantois</strong> et <strong>Chéreng</strong>.
            </p>
            <Link to="/contact" className="btn btn-primary" style={{ display: 'inline-block' }}>
              Demander une visite &amp; un devis gratuit
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Process */}
      <section className="section process-section" id="process">
        <div className="container">
          <FadeIn>
            <span className="section-label">Notre méthode</span>
            <h2 className="section-title">Comment se déroule votre projet</h2>
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
            <div>
              <h2>Besoin d'un entretien ou d'un aménagement ?</h2>
              <p>Recevez une estimation gratuite sous 48h sans aucun engagement.</p>
            </div>
            <Link to="/contact" className="btn btn-outline">
              Contacter CL Paysage
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
