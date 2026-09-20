import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchAdminProjects, deleteAdminProject, saveAdminProject, fetchAdminContacts } from '../lib/dataSync'
import './Dashboard.css'

export default function Dashboard({ token }) {
  const [projects, setProjects] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    try {
      const [projData, contData] = await Promise.all([
        fetchAdminProjects(token),
        fetchAdminContacts(token)
      ])
      setProjects(projData || [])
      setContacts(contData || [])
    } catch (err) {
      console.error('Erreur chargement dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [token])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Supprimer le projet "${title}" ? Cette action est irréversible.`)) return
    await deleteAdminProject(id, token)
    loadData()
  }

  const togglePublish = async (project) => {
    await saveAdminProject({ ...project, published: !project.published }, token, true, project.id)
    loadData()
  }

  const published = projects.filter(p => p.published)
  const drafts = projects.filter(p => !p.published)
  const unreadContacts = contacts.filter(c => c.status === 'unread')
  const recentContacts = contacts.slice(0, 3)

  if (loading) return <div style={{ padding: '2rem', color: '#71717a' }}>Chargement…</div>

  return (
    <div id="admin-dashboard">
      <div className="admin-page-header">
        <h1>Tableau de bord</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/messages" className="admin-btn">
            📬 Messagerie {unreadContacts.length > 0 && `(${unreadContacts.length})`}
          </Link>
          <Link to="/admin/nouveau" className="admin-btn admin-btn-primary">
            + Nouveau projet
          </Link>
        </div>
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
        <div
          className="dashboard-stat"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/admin/messages')}
        >
          <div className="dashboard-stat-value" style={{ color: unreadContacts.length > 0 ? '#ef4444' : 'inherit' }}>
            {unreadContacts.length}
          </div>
          <div className="dashboard-stat-label">
            Message{unreadContacts.length > 1 ? 's' : ''} non lu{unreadContacts.length > 1 ? 's' : ''}
          </div>
        </div>
        <div
          className="dashboard-stat"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/admin/messages')}
        >
          <div className="dashboard-stat-value">{contacts.length}</div>
          <div className="dashboard-stat-label">Total contacts reçus</div>
        </div>
      </div>

      {/* Widget Dernières demandes reçues */}
      <div style={{
        background: 'white',
        border: '1px solid #e4e4e7',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--c-anthracite)', margin: 0 }}>
              Dernières demandes de contact
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#71717a', margin: '0.2rem 0 0' }}>
              Prospects ayant envoyé une demande via le site
            </p>
          </div>
          <Link to="/admin/messages" className="admin-btn admin-btn-sm">
            Voir toute la boîte de réception →
          </Link>
        </div>

        {recentContacts.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0, padding: '0.5rem 0' }}>
            Aucun message reçu pour le moment.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentContacts.map(c => {
              const isUnread = c.status === 'unread'
              return (
                <div
                  key={c.id}
                  onClick={() => navigate('/admin/messages')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: isUnread ? '#fffdf5' : '#f8fafc',
                    border: `1px solid ${isUnread ? '#fde68a' : '#f1f5f9'}`,
                    cursor: 'pointer',
                    gap: '1rem',
                    transition: 'border-color 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isUnread ? '#ef4444' : '#10b981',
                      flexShrink: 0
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>{c.name}</strong>
                        {c.email && <span style={{ fontSize: '0.78rem', color: '#64748b' }}>· {c.email}</span>}
                        {c.phone && <span style={{ fontSize: '0.78rem', color: '#64748b' }}>· {c.phone}</span>}
                        {c.type && (
                          <span style={{
                            fontSize: '0.7rem',
                            background: '#e2e8f0',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '3px'
                          }}>
                            {c.type}
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: '0.8rem',
                        color: '#64748b',
                        margin: '0.2rem 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {c.message}
                      </p>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--c-anthracite)', margin: 0 }}>
          Réalisations & Projets
        </h2>
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
            const photos = p.photos || []
            const mainPhoto = photos.find(ph => ph.isMain) || photos[0]
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
                    {(p.photos || []).length > 0 && <span>· {(p.photos || []).length} photo{(p.photos || []).length > 1 ? 's' : ''}</span>}
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
