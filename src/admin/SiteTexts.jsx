import { useState, useEffect } from 'react'
import defaultSettings from '../../data/settings.json'
import { fetchAdminSettings, saveAdminSettings } from '../lib/dataSync'
import './SiteTexts.css'

export default function SiteTexts({ token }) {
  const [activeTab, setActiveTab] = useState('home')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const [form, setForm] = useState(() => defaultSettings)

  useEffect(() => {
    fetchAdminSettings(token)
      .then(data => {
        if (data && typeof data === 'object') {
          setForm(data)
        }
      })
      .catch(err => console.error('Erreur chargement textes:', err))
      .finally(() => setLoading(false))
  }, [token])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // Generic updater for nested content keys
  const updateContent = (section, key, value) => {
    setForm(prev => ({
      ...prev,
      content: {
        ...(prev.content || {}),
        [section]: {
          ...((prev.content && prev.content[section]) || {}),
          [key]: value,
        },
      },
    }))
  }

  // Updater for hero fields
  const updateHero = (key, value) => {
    setForm(prev => ({
      ...prev,
      hero: {
        ...(prev.hero || {}),
        [key]: value,
      },
    }))
  }

  // Updater for top-level fields
  const updateTopLevel = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setSaving(true)

    try {
      const result = await saveAdminSettings(form, token)
      if (result.success) {
        showToast('✅ Tous les textes ont été enregistrés avec succès !')
      } else if (result.isAuthError) {
        showToast('⚠ Session expirée — veuillez vous reconnecter')
      } else {
        showToast('⚠ Erreur lors de l\'enregistrement')
      }
    } catch (err) {
      console.error(err)
      showToast('⚠ Erreur de connexion avec le serveur')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2.5rem', color: '#a1a1aa' }}>Chargement des textes…</div>
  }

  const home = form.content?.home || defaultSettings.content?.home || {}
  const services = form.content?.services || defaultSettings.content?.services || {}
  const contact = form.content?.contact || defaultSettings.content?.contact || {}
  const realisations = form.content?.realisations || defaultSettings.content?.realisations || {}
  const navbar = form.content?.navbar || defaultSettings.content?.navbar || {}
  const footer = form.content?.footer || defaultSettings.content?.footer || {}
  const hero = form.hero || defaultSettings.hero || {}

  return (
    <div className="site-texts-page">
      {/* Page Header */}
      <div className="site-texts-header">
        <div>
          <h1>Textes & Contenus du Site</h1>
          <p>
            Modifiez chaque texte, phrase, bouton et description affichés sur l'ensemble de votre site web. Vos modifications s'enregistrent en direct.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="site-texts-save-btn"
          disabled={saving}
        >
          {saving ? 'Enregistrement en cours…' : '💾 Enregistrer les modifications'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="site-texts-tabs">
        <button
          className={`site-texts-tab${activeTab === 'home' ? ' active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          🏠 Page Accueil
        </button>
        <button
          className={`site-texts-tab${activeTab === 'services' ? ' active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          🌿 Page Services
        </button>
        <button
          className={`site-texts-tab${activeTab === 'contact' ? ' active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          ✉️ Page Contact
        </button>
        <button
          className={`site-texts-tab${activeTab === 'realisations' ? ' active' : ''}`}
          onClick={() => setActiveTab('realisations')}
        >
          📸 Page Réalisations
        </button>
        <button
          className={`site-texts-tab${activeTab === 'general' ? ' active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          🧭 Menu & Pied de page
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* =======================================================
            TAB 1: PAGE ACCUEIL
           ======================================================= */}
        {activeTab === 'home' && (
          <div>
            {/* HERO BANNER TEXTS */}
            <div className="text-section-card">
              <div className="text-section-header">
                <div>
                  <h3>Bannière Principale (Hero)</h3>
                  <p>L'accroche principale en haut de la page d'accueil</p>
                </div>
              </div>

              <div className="text-field-group">
                <label>Ligne d'accroche (au-dessus du grand titre)</label>
                <input
                  type="text"
                  className="text-input"
                  value={hero.tagline || ''}
                  onChange={(e) => updateHero('tagline', e.target.value)}
                  placeholder="Atelier de paysage · Conception & Réalisation"
                />
              </div>

              <div className="text-grid-2">
                <div className="text-field-group">
                  <label>Titre principal (Ligne 1)</label>
                  <input
                    type="text"
                    className="text-input"
                    value={hero.titleLine1 || ''}
                    onChange={(e) => updateHero('titleLine1', e.target.value)}
                    placeholder="L'art de façonner"
                  />
                </div>
                <div className="text-field-group">
                  <label>Titre principal (Ligne 2 - En italique)</label>
                  <input
                    type="text"
                    className="text-input"
                    value={hero.titleLine2 || ''}
                    onChange={(e) => updateHero('titleLine2', e.target.value)}
                    placeholder="vos espaces extérieurs"
                  />
                </div>
              </div>

              <div className="text-field-group">
                <label>Description d'introduction</label>
                <textarea
                  className="text-textarea"
                  rows={3}
                  value={hero.description || ''}
                  onChange={(e) => updateHero('description', e.target.value)}
                  placeholder="Conception sur-mesure, aménagement végétal et harmonie des matières..."
                />
              </div>

              <div className="text-field-group" style={{ maxWidth: '420px' }}>
                <label>Texte du bouton d'action</label>
                <input
                  type="text"
                  className="text-input"
                  value={hero.buttonText || ''}
                  onChange={(e) => updateHero('buttonText', e.target.value)}
                  placeholder="Regarder les réalisations"
                />
              </div>
            </div>

            {/* NOTRE APPROCHE */}
            <div className="text-section-card">
              <div className="text-section-header">
                <div>
                  <h3>Section « Notre approche »</h3>
                  <p>Les 3 piliers d'expertise présentés sur la page d'accueil</p>
                </div>
              </div>

              <div className="text-grid-2">
                <div className="text-field-group">
                  <label>Petit label de la section</label>
                  <input
                    type="text"
                    className="text-input"
                    value={home.approachLabel || ''}
                    onChange={(e) => updateContent('home', 'approachLabel', e.target.value)}
                    placeholder="Notre approche"
                  />
                </div>
                <div className="text-field-group">
                  <label>Titre de la section</label>
                  <input
                    type="text"
                    className="text-input"
                    value={home.approachTitle || ''}
                    onChange={(e) => updateContent('home', 'approachTitle', e.target.value)}
                    placeholder="Un savoir-faire à chaque étape"
                  />
                </div>
              </div>

              {/* Pilier 1 - Conception */}
              <div className="text-subcard">
                <h4 className="text-subcard-title">Pilier 1 : Conception</h4>
                <div className="text-field-group">
                  <label>Titre du pilier 1</label>
                  <input
                    type="text"
                    className="text-input"
                    value={home.approachStep1Title || ''}
                    onChange={(e) => updateContent('home', 'approachStep1Title', e.target.value)}
                    placeholder="Conception"
                  />
                </div>
                <div className="text-field-group">
                  <label>Description du pilier 1</label>
                  <textarea
                    className="text-textarea"
                    rows={2}
                    value={home.approachStep1Desc || ''}
                    onChange={(e) => updateContent('home', 'approachStep1Desc', e.target.value)}
                    placeholder="Étude personnalisée de votre terrain, de vos envies et de votre mode de vie pour imaginer un projet qui vous ressemble."
                  />
                </div>
              </div>

              {/* Pilier 2 - Réalisation */}
              <div className="text-subcard">
                <h4 className="text-subcard-title">Pilier 2 : Réalisation</h4>
                <div className="text-field-group">
                  <label>Titre du pilier 2</label>
                  <input
                    type="text"
                    className="text-input"
                    value={home.approachStep2Title || ''}
                    onChange={(e) => updateContent('home', 'approachStep2Title', e.target.value)}
                    placeholder="Réalisation"
                  />
                </div>
                <div className="text-field-group">
                  <label>Description du pilier 2</label>
                  <textarea
                    className="text-textarea"
                    rows={2}
                    value={home.approachStep2Desc || ''}
                    onChange={(e) => updateContent('home', 'approachStep2Desc', e.target.value)}
                    placeholder="Mise en œuvre soignée avec des matériaux nobles et des végétaux sélectionnés pour un résultat durable et harmonieux."
                  />
                </div>
              </div>

              {/* Pilier 3 - Entretien */}
              <div className="text-subcard">
                <h4 className="text-subcard-title">Pilier 3 : Entretien</h4>
                <div className="text-field-group">
                  <label>Titre du pilier 3</label>
                  <input
                    type="text"
                    className="text-input"
                    value={home.approachStep3Title || ''}
                    onChange={(e) => updateContent('home', 'approachStep3Title', e.target.value)}
                    placeholder="Entretien"
                  />
                </div>
                <div className="text-field-group">
                  <label>Description du pilier 3</label>
                  <textarea
                    className="text-textarea"
                    rows={2}
                    value={home.approachStep3Desc || ''}
                    onChange={(e) => updateContent('home', 'approachStep3Desc', e.target.value)}
                    placeholder="Suivi régulier et attentif pour que votre extérieur conserve son éclat saison après saison."
                  />
                </div>
              </div>
            </div>

            {/* PREVIEW & CTA BANNER */}
            <div className="text-section-card">
              <div className="text-section-header">
                <div>
                  <h3>Section Réalisations & Bannière de contact</h3>
                  <p>Titres et boutons de fin de page d'accueil</p>
                </div>
              </div>

              <div className="text-grid-3">
                <div className="text-field-group">
                  <label>Label section Réalisations</label>
                  <input
                    type="text"
                    className="text-input"
                    value={home.previewLabel || ''}
                    onChange={(e) => updateContent('home', 'previewLabel', e.target.value)}
                    placeholder="Réalisations"
                  />
                </div>
                <div className="text-field-group">
                  <label>Titre section Réalisations</label>
                  <input
                    type="text"
                    className="text-input"
                    value={home.previewTitle || ''}
                    onChange={(e) => updateContent('home', 'previewTitle', e.target.value)}
                    placeholder="Nos dernières créations"
                  />
                </div>
                <div className="text-field-group">
                  <label>Bouton vers toutes les réalisations</label>
                  <input
                    type="text"
                    className="text-input"
                    value={home.previewButton || ''}
                    onChange={(e) => updateContent('home', 'previewButton', e.target.value)}
                    placeholder="Voir toutes nos réalisations →"
                  />
                </div>
              </div>

              <div className="text-grid-2" style={{ marginTop: '1.25rem' }}>
                <div className="text-field-group">
                  <label>Titre de la bannière finale CTA</label>
                  <input
                    type="text"
                    className="text-input"
                    value={home.ctaTitle || ''}
                    onChange={(e) => updateContent('home', 'ctaTitle', e.target.value)}
                    placeholder="Votre projet commence ici"
                  />
                </div>
                <div className="text-field-group">
                  <label>Bouton de la bannière finale CTA</label>
                  <input
                    type="text"
                    className="text-input"
                    value={home.ctaButton || ''}
                    onChange={(e) => updateContent('home', 'ctaButton', e.target.value)}
                    placeholder="Nous contacter"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 2: PAGE SERVICES
           ======================================================= */}
        {activeTab === 'services' && (
          <div>
            {/* SERVICES HEADER */}
            <div className="text-section-card">
              <div className="text-section-header">
                <div>
                  <h3>En-tête de la Page Services</h3>
                  <p>Titre et sous-titre visibles en haut de la page</p>
                </div>
              </div>

              <div className="text-grid-2">
                <div className="text-field-group">
                  <label>Petit label d'en-tête</label>
                  <input
                    type="text"
                    className="text-input"
                    value={services.headerLabel || ''}
                    onChange={(e) => updateContent('services', 'headerLabel', e.target.value)}
                    placeholder="Expertise"
                  />
                </div>
                <div className="text-field-group">
                  <label>Grand titre de la page</label>
                  <input
                    type="text"
                    className="text-input"
                    value={services.headerTitle || ''}
                    onChange={(e) => updateContent('services', 'headerTitle', e.target.value)}
                    placeholder="Nos services"
                  />
                </div>
              </div>

              <div className="text-field-group">
                <label>Sous-titre explicatif</label>
                <textarea
                  className="text-textarea"
                  rows={2}
                  value={services.headerSubtitle || ''}
                  onChange={(e) => updateContent('services', 'headerSubtitle', e.target.value)}
                  placeholder="De la conception à l'entretien, nous vous accompagnons à chaque étape de votre projet paysager."
                />
              </div>
            </div>

            {/* THE 4 SERVICES */}
            <div className="text-section-card">
              <div className="text-section-header">
                <div>
                  <h3>Les 4 Cartes de Services</h3>
                  <p>Détail de chaque prestation proposée par l'entreprise</p>
                </div>
              </div>

              {/* Service 1 */}
              <div className="text-subcard">
                <h4 className="text-subcard-title">Service 1 : Conception paysagère</h4>
                <div className="text-field-group">
                  <label>Titre</label>
                  <input
                    type="text"
                    className="text-input"
                    value={services.service1Title || ''}
                    onChange={(e) => updateContent('services', 'service1Title', e.target.value)}
                    placeholder="Conception paysagère"
                  />
                </div>
                <div className="text-field-group">
                  <label>Description</label>
                  <textarea
                    className="text-textarea"
                    rows={2}
                    value={services.service1Desc || ''}
                    onChange={(e) => updateContent('services', 'service1Desc', e.target.value)}
                    placeholder="Plans sur mesure adaptés à votre terrain..."
                  />
                </div>
              </div>

              {/* Service 2 */}
              <div className="text-subcard">
                <h4 className="text-subcard-title">Service 2 : Aménagement extérieur</h4>
                <div className="text-field-group">
                  <label>Titre</label>
                  <input
                    type="text"
                    className="text-input"
                    value={services.service2Title || ''}
                    onChange={(e) => updateContent('services', 'service2Title', e.target.value)}
                    placeholder="Aménagement extérieur"
                  />
                </div>
                <div className="text-field-group">
                  <label>Description</label>
                  <textarea
                    className="text-textarea"
                    rows={2}
                    value={services.service2Desc || ''}
                    onChange={(e) => updateContent('services', 'service2Desc', e.target.value)}
                    placeholder="Terrasses, allées, murets, clôtures..."
                  />
                </div>
              </div>

              {/* Service 3 */}
              <div className="text-subcard">
                <div className="text-subcard-title">
                  <h4>Service 3 : Entretien de jardins</h4>
                </div>
                <div className="text-field-group">
                  <label>Titre</label>
                  <input
                    type="text"
                    className="text-input"
                    value={services.service3Title || ''}
                    onChange={(e) => updateContent('services', 'service3Title', e.target.value)}
                    placeholder="Entretien de jardins"
                  />
                </div>
                <div className="text-field-group">
                  <label>Description</label>
                  <textarea
                    className="text-textarea"
                    rows={2}
                    value={services.service3Desc || ''}
                    onChange={(e) => updateContent('services', 'service3Desc', e.target.value)}
                    placeholder="Taille, tonte, élagage, traitement raisonné..."
                  />
                </div>
              </div>

              {/* Service 4 */}
              <div className="text-subcard">
                <h4 className="text-subcard-title">Service 4 : Terrasses & allées</h4>
                <div className="text-field-group">
                  <label>Titre</label>
                  <input
                    type="text"
                    className="text-input"
                    value={services.service4Title || ''}
                    onChange={(e) => updateContent('services', 'service4Title', e.target.value)}
                    placeholder="Terrasses & allées"
                  />
                </div>
                <div className="text-field-group">
                  <label>Description</label>
                  <textarea
                    className="text-textarea"
                    rows={2}
                    value={services.service4Desc || ''}
                    onChange={(e) => updateContent('services', 'service4Desc', e.target.value)}
                    placeholder="Pierre naturelle, bois, béton décoratif..."
                  />
                </div>
              </div>
            </div>

            {/* PROCESS TIMELINE */}
            <div className="text-section-card">
              <div className="text-section-header">
                <div>
                  <h3>Section « Notre démarche » / Les étapes clés</h3>
                  <p>La frise chronologique expliquant les étapes du projet</p>
                </div>
              </div>

              <div className="text-grid-2">
                <div className="text-field-group">
                  <label>Petit label de la section</label>
                  <input
                    type="text"
                    className="text-input"
                    value={services.processLabel || ''}
                    onChange={(e) => updateContent('services', 'processLabel', e.target.value)}
                    placeholder="Notre démarche"
                  />
                </div>
                <div className="text-field-group">
                  <label>Titre de la section</label>
                  <input
                    type="text"
                    className="text-input"
                    value={services.processTitle || ''}
                    onChange={(e) => updateContent('services', 'processTitle', e.target.value)}
                    placeholder="Les étapes clés"
                  />
                </div>
              </div>

              {/* Steps 1-4 */}
              <div className="text-grid-2" style={{ marginTop: '1rem' }}>
                <div className="text-subcard">
                  <label style={{ color: 'var(--c-olive)', fontWeight: 600 }}>Étape 01 : Titre & Description</label>
                  <input
                    type="text"
                    className="text-input"
                    style={{ marginBottom: '0.5rem', marginTop: '0.35rem' }}
                    value={services.step1Title || ''}
                    onChange={(e) => updateContent('services', 'step1Title', e.target.value)}
                    placeholder="Rencontre"
                  />
                  <textarea
                    className="text-textarea"
                    rows={2}
                    value={services.step1Desc || ''}
                    onChange={(e) => updateContent('services', 'step1Desc', e.target.value)}
                    placeholder="Visite de votre terrain et échange sur vos envies"
                  />
                </div>

                <div className="text-subcard">
                  <label style={{ color: 'var(--c-olive)', fontWeight: 600 }}>Étape 02 : Titre & Description</label>
                  <input
                    type="text"
                    className="text-input"
                    style={{ marginBottom: '0.5rem', marginTop: '0.35rem' }}
                    value={services.step2Title || ''}
                    onChange={(e) => updateContent('services', 'step2Title', e.target.value)}
                    placeholder="Étude"
                  />
                  <textarea
                    className="text-textarea"
                    rows={2}
                    value={services.step2Desc || ''}
                    onChange={(e) => updateContent('services', 'step2Desc', e.target.value)}
                    placeholder="Conception du plan et choix des matériaux et végétaux"
                  />
                </div>

                <div className="text-subcard">
                  <label style={{ color: 'var(--c-olive)', fontWeight: 600 }}>Étape 03 : Titre & Description</label>
                  <input
                    type="text"
                    className="text-input"
                    style={{ marginBottom: '0.5rem', marginTop: '0.35rem' }}
                    value={services.step3Title || ''}
                    onChange={(e) => updateContent('services', 'step3Title', e.target.value)}
                    placeholder="Réalisation"
                  />
                  <textarea
                    className="text-textarea"
                    rows={2}
                    value={services.step3Desc || ''}
                    onChange={(e) => updateContent('services', 'step3Desc', e.target.value)}
                    placeholder="Mise en œuvre par notre équipe avec suivi régulier"
                  />
                </div>

                <div className="text-subcard">
                  <label style={{ color: 'var(--c-olive)', fontWeight: 600 }}>Étape 04 : Titre & Description</label>
                  <input
                    type="text"
                    className="text-input"
                    style={{ marginBottom: '0.5rem', marginTop: '0.35rem' }}
                    value={services.step4Title || ''}
                    onChange={(e) => updateContent('services', 'step4Title', e.target.value)}
                    placeholder="Suivi"
                  />
                  <textarea
                    className="text-textarea"
                    rows={2}
                    value={services.step4Desc || ''}
                    onChange={(e) => updateContent('services', 'step4Desc', e.target.value)}
                    placeholder="Entretien et accompagnement sur le long terme"
                  />
                </div>
              </div>

              {/* Services CTA Banner */}
              <div className="text-grid-2" style={{ marginTop: '1.25rem' }}>
                <div className="text-field-group">
                  <label>Titre de la bannière finale CTA</label>
                  <input
                    type="text"
                    className="text-input"
                    value={services.ctaTitle || ''}
                    onChange={(e) => updateContent('services', 'ctaTitle', e.target.value)}
                    placeholder="Prêt à transformer votre extérieur ?"
                  />
                </div>
                <div className="text-field-group">
                  <label>Texte du bouton CTA</label>
                  <input
                    type="text"
                    className="text-input"
                    value={services.ctaButton || ''}
                    onChange={(e) => updateContent('services', 'ctaButton', e.target.value)}
                    placeholder="Demander un devis"
                  />
                </div>
              </div>
            </div>
          </div>
        )}


        {/* =======================================================
            TAB 4: PAGE CONTACT
           ======================================================= */}
        {activeTab === 'contact' && (
          <div>
            <div className="text-section-card">
              <div className="text-section-header">
                <div>
                  <h3>En-tête & Textes de la Page Contact</h3>
                  <p>Titres d'accroche et présentations pour encourager la prise de contact</p>
                </div>
              </div>

              <div className="text-grid-2">
                <div className="text-field-group">
                  <label>Petit label de la page</label>
                  <input
                    type="text"
                    className="text-input"
                    value={contact.headerLabel || ''}
                    onChange={(e) => updateContent('contact', 'headerLabel', e.target.value)}
                    placeholder="Contact"
                  />
                </div>
                <div className="text-field-group">
                  <label>Grand titre de la page</label>
                  <input
                    type="text"
                    className="text-input"
                    value={contact.headerTitle || ''}
                    onChange={(e) => updateContent('contact', 'headerTitle', e.target.value)}
                    placeholder="Parlons de votre projet"
                  />
                </div>
              </div>

              <div className="text-field-group">
                <label>Sous-titre d'accroche (invitation à échanger)</label>
                <textarea
                  className="text-textarea"
                  rows={2}
                  value={contact.headerSubtitle || ''}
                  onChange={(e) => updateContent('contact', 'headerSubtitle', e.target.value)}
                  placeholder="Une idée, une envie, une question ? Contactez-nous pour échanger sur votre futur extérieur."
                />
                <p className="field-hint">Note : "votre futur extérieur" s'adresse à tous types de projets (jardins, terrasses, allées...)</p>
              </div>

              <div className="text-field-group">
                <label>Texte d'introduction de la colonne coordonnées</label>
                <textarea
                  className="text-textarea"
                  rows={2}
                  value={contact.introText || ''}
                  onChange={(e) => updateContent('contact', 'introText', e.target.value)}
                  placeholder="Nous intervenons dans toute la région. N'hésitez pas à nous contacter par téléphone ou via le formulaire pour un premier échange gratuit et sans engagement."
                />
              </div>

              <div className="text-field-group" style={{ maxWidth: '420px' }}>
                <label>Texte du bouton d'envoi du formulaire</label>
                <input
                  type="text"
                  className="text-input"
                  value={contact.submitButton || ''}
                  onChange={(e) => updateContent('contact', 'submitButton', e.target.value)}
                  placeholder="Envoyer le message"
                />
              </div>
            </div>

            {/* CONFIRMATION MESSAGE SCREEN */}
            <div className="text-section-card">
              <div className="text-section-header">
                <div>
                  <h3>Écran de Confirmation après Envoi</h3>
                  <p>Message affiché au visiteur immédiatement après l'envoi de son message</p>
                </div>
              </div>

              <div className="text-field-group">
                <label>Titre de remerciement</label>
                <input
                  type="text"
                  className="text-input"
                  value={contact.successTitle || ''}
                  onChange={(e) => updateContent('contact', 'successTitle', e.target.value)}
                  placeholder="Merci pour votre message !"
                />
              </div>

              <div className="text-field-group">
                <label>Description rassurante</label>
                <textarea
                  className="text-textarea"
                  rows={2}
                  value={contact.successDesc || ''}
                  onChange={(e) => updateContent('contact', 'successDesc', e.target.value)}
                  placeholder="Votre demande a bien été transmise à notre équipe. Nous l'étudions avec attention et reviendrons vers vous dans les plus brefs délais."
                />
              </div>

              <div className="text-field-group" style={{ maxWidth: '420px' }}>
                <label>Texte du bouton pour envoyer un autre message</label>
                <input
                  type="text"
                  className="text-input"
                  value={contact.successButton || ''}
                  onChange={(e) => updateContent('contact', 'successButton', e.target.value)}
                  placeholder="Envoyer un autre message"
                />
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 5: PAGE RÉALISATIONS
           ======================================================= */}
        {activeTab === 'realisations' && (
          <div>
            <div className="text-section-card">
              <div className="text-section-header">
                <div>
                  <h3>En-tête de la Page Réalisations</h3>
                  <p>Textes visibles au-dessus de la galerie de photos et des filtres</p>
                </div>
              </div>

              <div className="text-grid-2">
                <div className="text-field-group">
                  <label>Petit label d'en-tête</label>
                  <input
                    type="text"
                    className="text-input"
                    value={realisations.headerLabel || ''}
                    onChange={(e) => updateContent('realisations', 'headerLabel', e.target.value)}
                    placeholder="Portfolio"
                  />
                </div>
                <div className="text-field-group">
                  <label>Grand titre de la page</label>
                  <input
                    type="text"
                    className="text-input"
                    value={realisations.headerTitle || ''}
                    onChange={(e) => updateContent('realisations', 'headerTitle', e.target.value)}
                    placeholder="Nos réalisations"
                  />
                </div>
              </div>

              <div className="text-field-group">
                <label>Sous-titre d'introduction</label>
                <textarea
                  className="text-textarea"
                  rows={2}
                  value={realisations.headerSubtitle || ''}
                  onChange={(e) => updateContent('realisations', 'headerSubtitle', e.target.value)}
                  placeholder="Chaque espace est une création unique. Découvrez nos réalisations et laissez-vous inspirer pour le vôtre."
                />
              </div>

              <div className="text-field-group">
                <label>Message si aucun projet dans une catégorie</label>
                <input
                  type="text"
                  className="text-input"
                  value={realisations.emptyText || ''}
                  onChange={(e) => updateContent('realisations', 'emptyText', e.target.value)}
                  placeholder="Aucune réalisation dans cette catégorie pour le moment."
                />
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB 6: MENU & PIED DE PAGE
           ======================================================= */}
        {activeTab === 'general' && (
          <div>
            <div className="text-section-card">
              <div className="text-section-header">
                <div>
                  <h3>Barre de Navigation (Menu Supérieur)</h3>
                  <p>Bouton d'action présent sur toutes les pages du site</p>
                </div>
              </div>

              <div className="text-field-group" style={{ maxWidth: '420px' }}>
                <label>Bouton d'action principal de la barre de navigation</label>
                <input
                  type="text"
                  className="text-input"
                  value={navbar.ctaButton || ''}
                  onChange={(e) => updateContent('navbar', 'ctaButton', e.target.value)}
                  placeholder="Demander un devis"
                />
              </div>
            </div>

            <div className="text-section-card">
              <div className="text-section-header">
                <div>
                  <h3>Pied de Page (Footer)</h3>
                  <p>Titres des colonnes et mentions affichées en bas de page</p>
                </div>
              </div>

              <div className="text-grid-2">
                <div className="text-field-group">
                  <label>Titre de la colonne Navigation</label>
                  <input
                    type="text"
                    className="text-input"
                    value={footer.navigationHeading || ''}
                    onChange={(e) => updateContent('footer', 'navigationHeading', e.target.value)}
                    placeholder="Navigation"
                  />
                </div>
                <div className="text-field-group">
                  <label>Titre de la colonne Contact</label>
                  <input
                    type="text"
                    className="text-input"
                    value={footer.contactHeading || ''}
                    onChange={(e) => updateContent('footer', 'contactHeading', e.target.value)}
                    placeholder="Contact"
                  />
                </div>
              </div>

              <div className="text-field-group">
                <label>Courte description de l'entreprise (dans le footer)</label>
                <textarea
                  className="text-textarea"
                  rows={2}
                  value={form.siteDescription || ''}
                  onChange={(e) => updateTopLevel('siteDescription', e.target.value)}
                  placeholder="CL Paysage, paysagiste et entretien de jardins à Villeneuve d'Ascq..."
                />
              </div>

              <div className="text-field-group" style={{ maxWidth: '420px' }}>
                <label>Mention de signature en bas du footer</label>
                <input
                  type="text"
                  className="text-input"
                  value={footer.creditText || ''}
                  onChange={(e) => updateContent('footer', 'creditText', e.target.value)}
                  placeholder="Site réalisé avec passion"
                />
              </div>
            </div>
          </div>
        )}

        {/* Floating Bottom Bar */}
        <div className="site-texts-bottom-bar">
          <div className="bottom-bar-info">
            <span>✓</span> Les textes modifiés seront appliqués instantanément sur tout le site dès l'enregistrement.
          </div>
          <button
            type="submit"
            className="site-texts-save-btn"
            disabled={saving}
          >
            {saving ? 'Enregistrement…' : '💾 Enregistrer les modifications'}
          </button>
        </div>
      </form>

      {toast && <div className="site-texts-toast">{toast}</div>}
    </div>
  )
}
