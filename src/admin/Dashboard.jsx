import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Dashboard.css'

export default function Dashboard({ token }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/admin/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setProjects(await res.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProjects() }, [])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Supprimer le projet "${title}" ? Cette action est irréversible.`)) return

    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) fetchProjects()
    } catch (err) {
      console.error(err)
    }
  }

  const togglePublish = async (project) => {
    try {
      await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ published: !project.published }),
      })
      fetchProjects()
    } catch (err) {
      console.error(err)
    }
  }

  const published = projects.filter(p => p.published)
  const drafts = projects.filter(p => !p.published)

  if (loading) return <div style={{ padding: '2rem', color: '#71717a' }}>Chargement…</div>

  return (
    <div id="admin-dashboard">
      <div className="admin-page-header">
        <h1>Réalisations</h1>
        <Link to="/admin/nouveau" className="admin-btn admin-btn-primary">
          + Nouveau projet
        </Link>
      </div>

      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <div className="dashboard-stat-value">{projects.length}</div>
          <div className="dashboard-stat-label">Projets au total</div>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-value">{published.length}</div>
          <div className="dashboard-stat-label">Publiés</div>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-value">{drafts.length}</div>
          <div className="dashboard-stat-label">Brouillons</div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="dashboard-empty">
          <p>Aucune réalisation pour le moment.</p>
          <Link to="/admin/nouveau" className="admin-btn admin-btn-primary">
            Créer votre premier projet
          </Link>
        </div>
      ) : (
        <div className="dashboard-list">
          {projects.map((p) => {
            const mainPhoto = p.photos.find(ph => ph.isMain) || p.photos[0]
            return (
              <div key={p.id} className="dashboard-item">
                {mainPhoto ? (
                  <img
                    src={mainPhoto.url}
                    alt={p.title}
                    className="dashboard-item-thumb"
                  />
                ) : (
                  <div className="dashboard-item-thumb" />
                )}

                <div className="dashboard-item-info">
                  <h3>{p.title}</h3>
                  <div className="dashboard-item-meta">
                    {p.category && <span>{p.category}</span>}
                    {p.location && <span>· {p.location}</span>}
                    {p.photos.length > 0 && <span>· {p.photos.length} photo{p.photos.length > 1 ? 's' : ''}</span>}
                  </div>
                </div>

                <span className={`dashboard-item-badge ${p.published ? 'published' : 'draft'}`}>
                  {p.published ? 'Publié' : 'Brouillon'}
                </span>

                <div className="dashboard-item-actions">
                  <button
                    className="admin-btn admin-btn-sm"
                    onClick={() => togglePublish(p)}
                    title={p.published ? 'Dépublier' : 'Publier'}
                  >
                    {p.published ? '⏸ Dépublier' : '▶ Publier'}
                  </button>
                  <button
                    className="admin-btn admin-btn-sm"
                    onClick={() => navigate(`/admin/editer/${p.id}`)}
                  >
                    ✎ Modifier
                  </button>
                  <button
                    className="admin-btn admin-btn-sm admin-btn-danger"
                    onClick={() => handleDelete(p.id, p.title)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
