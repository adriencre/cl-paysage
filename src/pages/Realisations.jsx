import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import defaultProjects from '../../data/projects.json'
import FadeIn from '../components/FadeIn'
import './Realisations.css'

const CATEGORIES = [
  { value: 'all', label: 'Tout' },
  { value: 'amenagement', label: 'Aménagement' },
  { value: 'jardin', label: 'Jardin' },
  { value: 'terrasse', label: 'Terrasse & Allées' },
  { value: 'entretien', label: 'Entretien' },
]

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

export default function Realisations() {
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => {
        if (!r.ok) throw new Error('API offline')
        return r.json()
      })
      .then(data => setProjects(data))
      .catch(() => {
        const formatted = defaultProjects.map(p => ({
          ...p,
          photos: p.photos.map(ph => ({ ...ph, url: ph.isStatic ? `/images/${ph.filename}` : `/uploads/${ph.filename}` }))
        }))
        setProjects(formatted)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'
    ? projects
    : projects.filter(p => p.category === filter)

  return (
    <>
      <section className="page-header" id="realisations-header">
        <div className="container">
          <FadeIn>
            <span className="section-label">Portfolio</span>
            <h1 className="section-title">Nos réalisations</h1>
            <p className="section-subtitle">
              Chaque jardin est une création unique. Découvrez nos projets
              et laissez-vous inspirer pour le vôtre.
            </p>

            <div className="filter-bar">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  className={`filter-btn${filter === c.value ? ' active' : ''}`}
                  onClick={() => setFilter(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section" id="projects-list">
        <div className="container">
          {loading ? (
            <p style={{ color: 'var(--c-gray)', textAlign: 'center' }}>Chargement…</p>
          ) : (
            <div className="projects-grid">
              {filtered.length === 0 ? (
                <div className="projects-empty">
                  <p>Aucune réalisation dans cette catégorie pour le moment.</p>
                </div>
              ) : (
                filtered.map((project, i) => {
                  const mainPhoto = project.photos.find(p => p.isMain) || project.photos[0]
                  return (
                    <FadeIn key={project.id} delay={i * 80}>
                      <Link to={`/realisations/${project.id}`} className="project-card">
                        <div className="project-card-img">
                          {mainPhoto && (
                            <img src={mainPhoto.url} alt={project.title} loading="lazy" />
                          )}
                        </div>
                        <div className="project-card-body">
                          <div className="project-card-category">
                            {CATEGORY_LABELS[project.category] || project.category}
                          </div>
                          <h3>{project.title}</h3>
                          <p className="project-card-meta">
                            {[project.location, formatDate(project.date)].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </Link>
                    </FadeIn>
                  )
                })
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
