import { useState, useEffect, useMemo } from 'react'
import { fetchAdminContacts, updateAdminContact, deleteAdminContact } from '../lib/dataSync'
import './Messages.css'

function formatRelativeDate(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 2) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (diffDays === 1 || (diffHours < 48 && date.getDate() === now.getDate() - 1)) {
      return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const TYPE_LABELS = {
  conception: 'Conception de jardin',
  amenagement: 'Aménagement extérieur',
  entretien: 'Entretien de jardin',
  terrasse: 'Terrasse & allées',
  autre: 'Autre demande'
}

export default function Messages({ token }) {
  const [contacts, setContacts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'unread', 'replied', 'archived'
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [internalNote, setInternalNote] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState('')

  const loadContacts = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await fetchAdminContacts(token)
      setContacts(data || [])
      // Auto-select first if none selected
      if (!selectedId && data && data.length > 0) {
        setSelectedId(data[0].id)
        setInternalNote(data[0].notes || '')
      }
    } catch (err) {
      console.error('Erreur chargement contacts:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadContacts()

    const handleUpdate = () => loadContacts(true)
    window.addEventListener('cl_contacts_updated', handleUpdate)

    // Polling toutes les 30s pour actualiser les nouveaux messages
    const interval = setInterval(() => {
      loadContacts(true)
    }, 30000)

    return () => {
      window.removeEventListener('cl_contacts_updated', handleUpdate)
      clearInterval(interval)
    }
  }, [token])

  const selectedMessage = useMemo(() => {
    return contacts.find(c => c.id === selectedId) || null
  }, [contacts, selectedId])

  useEffect(() => {
    if (selectedMessage) {
      setInternalNote(selectedMessage.notes || '')
      setNoteSaved(false)
      // Auto-marquer comme lu si unread
      if (selectedMessage.status === 'unread') {
        handleStatusChange(selectedMessage.id, 'read')
      }
    }
  }, [selectedId])

  const handleSelect = (msg) => {
    setSelectedId(msg.id)
    setInternalNote(msg.notes || '')
    setNoteSaved(false)
    if (msg.status === 'unread') {
      handleStatusChange(msg.id, 'read')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
    await updateAdminContact(id, { status: newStatus }, token)
  }

  const handleSaveNote = async () => {
    if (!selectedId) return
    setContacts(prev => prev.map(c => c.id === selectedId ? { ...c, notes: internalNote } : c))
    await updateAdminContact(selectedId, { notes: internalNote }, token)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2500)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer définitivement le message de ${name || 'ce contact'} ?`)) return
    const remaining = contacts.filter(c => c.id !== id)
    setContacts(remaining)
    if (selectedId === id) {
      setSelectedId(remaining.length > 0 ? remaining[0].id : null)
    }
    await deleteAdminContact(id, token)
  }

  const handleMarkAllRead = async () => {
    const unread = contacts.filter(c => c.status === 'unread')
    if (unread.length === 0) return
    setContacts(prev => prev.map(c => ({ ...c, status: 'read' })))
    for (const msg of unread) {
      await updateAdminContact(msg.id, { status: 'read' }, token)
    }
  }

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text)
    setCopyFeedback(type)
    setTimeout(() => setCopyFeedback(''), 2000)
  }

  const exportCSV = () => {
    if (contacts.length === 0) {
      alert('Aucun message à exporter.')
      return
    }
    const headers = ['Date', 'Nom', 'Email', 'Téléphone', 'Type de projet', 'Statut', 'Message', 'Notes internes']
    const rows = contacts.map(c => [
      `"${c.createdAt || ''}"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(TYPE_LABELS[c.type] || c.type || '').replace(/"/g, '""')}"`,
      `"${c.status || ''}"`,
      `"${(c.message || '').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ])
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `cl_paysage_contacts_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtrage
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      // Filtre statut
      if (activeFilter === 'unread' && c.status !== 'unread') return false
      if (activeFilter === 'replied' && c.status !== 'replied') return false
      if (activeFilter === 'archived' && c.status !== 'archived') return false
      if (activeFilter === 'all' && c.status === 'archived') return false // Par défaut masquer les archivés dans 'Tous'

      // Filtre type de projet
      if (typeFilter !== 'all' && c.type !== typeFilter) return false

      // Recherche texte
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchName = (c.name || '').toLowerCase().includes(query)
        const matchEmail = (c.email || '').toLowerCase().includes(query)
        const matchPhone = (c.phone || '').toLowerCase().includes(query)
        const matchMessage = (c.message || '').toLowerCase().includes(query)
        if (!matchName && !matchEmail && !matchPhone && !matchMessage) return false
      }

      return true
    })
  }, [contacts, activeFilter, typeFilter, searchQuery])

  // Statistiques
  const stats = useMemo(() => {
    const unread = contacts.filter(c => c.status === 'unread').length
    const replied = contacts.filter(c => c.status === 'replied').length
    const archived = contacts.filter(c => c.status === 'archived').length
    const totalActive = contacts.filter(c => c.status !== 'archived').length
    return { unread, replied, archived, total: contacts.length, totalActive }
  }, [contacts])

  if (loading && contacts.length === 0) {
    return (
      <div className="messages-loading">
        <div className="messages-spinner" />
        <p>Chargement de la boîte de réception…</p>
      </div>
    )
  }

  return (
    <div className="messages-container" id="admin-messages">
      {/* En-tête de la page */}
      <div className="messages-header">
        <div>
          <div className="messages-title-row">
            <h1>Messagerie & Contacts</h1>
            {stats.unread > 0 && (
              <span className="messages-badge-unread">{stats.unread} nouveau{stats.unread > 1 ? 'x' : ''}</span>
            )}
          </div>
          <p className="messages-subtitle">
            Consultez les demandes de vos prospects et recontactez-les en un clic.
          </p>
        </div>

        <div className="messages-top-actions">
          {stats.unread > 0 && (
            <button
              type="button"
              className="admin-btn admin-btn-sm"
              onClick={handleMarkAllRead}
              title="Marquer tous les messages comme lus"
            >
              ✓ Tout marquer comme lu
            </button>
          )}
          <button
            type="button"
            className="admin-btn admin-btn-sm"
            onClick={() => loadContacts(true)}
            disabled={refreshing}
            title="Actualiser la liste"
          >
            {refreshing ? '↻ Actualisation…' : '↻ Actualiser'}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-outline"
            onClick={exportCSV}
            title="Exporter les contacts en fichier CSV"
          >
            📥 Exporter CSV
          </button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="messages-stats-grid">
        <div
          className={`messages-stat-card ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <div className="messages-stat-num">{stats.totalActive}</div>
          <div className="messages-stat-label">Demandes reçues</div>
        </div>
        <div
          className={`messages-stat-card stat-unread ${activeFilter === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveFilter('unread')}
        >
          <div className="messages-stat-num">{stats.unread}</div>
          <div className="messages-stat-label">Non lues</div>
        </div>
        <div
          className={`messages-stat-card stat-replied ${activeFilter === 'replied' ? 'active' : ''}`}
          onClick={() => setActiveFilter('replied')}
        >
          <div className="messages-stat-num">{stats.replied}</div>
          <div className="messages-stat-label">Traitées / Répondues</div>
        </div>
        <div
          className={`messages-stat-card ${activeFilter === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveFilter('archived')}
        >
          <div className="messages-stat-num">{stats.archived}</div>
          <div className="messages-stat-label">Archivées</div>
        </div>
      </div>

      {/* Filtres & Recherche */}
      <div className="messages-toolbar">
        <div className="messages-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone ou mot-clé…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="messages-search-clear"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="messages-filter-group">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="messages-type-select"
          >
            <option value="all">Tous les types de projet</option>
            <option value="conception">Conception de jardin</option>
            <option value="amenagement">Aménagement extérieur</option>
            <option value="entretien">Entretien</option>
            <option value="terrasse">Terrasse & allées</option>
            <option value="autre">Autre</option>
          </select>
        </div>
      </div>

      {/* Layout Split-View (Liste à gauche, Détail à droite) */}
      <div className="messages-split-view">
        {/* Panneau de Gauche : Liste des messages */}
        <div className="messages-list-pane">
          {filteredContacts.length === 0 ? (
            <div className="messages-empty-pane">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <h4>Aucun message trouvé</h4>
              <p>
                {searchQuery || typeFilter !== 'all' || activeFilter !== 'all'
                  ? 'Aucun résultat pour les filtres sélectionnés.'
                  : 'Vous n\'avez reçu aucun message pour l\'instant.'}
              </p>
              {(searchQuery || typeFilter !== 'all' || activeFilter !== 'all') && (
                <button
                  type="button"
                  className="admin-btn admin-btn-sm"
                  onClick={() => {
                    setSearchQuery('')
                    setTypeFilter('all')
                    setActiveFilter('all')
                  }}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="messages-items-scroll">
              {filteredContacts.map((item) => {
                const isSelected = item.id === selectedId
                const isUnread = item.status === 'unread'
                const isReplied = item.status === 'replied'
                const isArchived = item.status === 'archived'

                return (
                  <div
                    key={item.id}
                    className={`messages-item-card ${isSelected ? 'selected' : ''} ${isUnread ? 'unread' : ''}`}
                    onClick={() => handleSelect(item)}
                  >
                    <div className="messages-item-avatar">
                      {getInitials(item.name)}
                      {isUnread && <span className="messages-unread-dot" title="Non lu" />}
                    </div>

                    <div className="messages-item-content">
                      <div className="messages-item-top">
                        <span className={`messages-item-name ${isUnread ? 'bold' : ''}`}>
                          {item.name || 'Nom non spécifié'}
                        </span>
                        <span className="messages-item-date">
                          {formatRelativeDate(item.createdAt)}
                        </span>
                      </div>

                      <div className="messages-item-meta">
                        {item.type && (
                          <span className="messages-tag-type">
                            {TYPE_LABELS[item.type] || item.type}
                          </span>
                        )}
                        {isReplied && <span className="messages-status-badge replied">✓ Répondu</span>}
                        {isArchived && <span className="messages-status-badge archived">Archivé</span>}
                      </div>

                      <p className="messages-item-snippet">
                        {item.message || '(Aucun message)'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Panneau de Droite : Détail du message sélectionné */}
        <div className="messages-detail-pane">
          {selectedMessage ? (
            <div className="messages-detail-content">
              {/* En-tête du contact */}
              <div className="messages-detail-header">
                <div className="messages-detail-author">
                  <div className="messages-detail-avatar-large">
                    {getInitials(selectedMessage.name)}
                  </div>
                  <div>
                    <h2>{selectedMessage.name}</h2>
                    <div className="messages-detail-sub">
                      <span>Reçu le {new Date(selectedMessage.createdAt).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                      <span className="messages-sep">·</span>
                      <span className={`messages-status-pill ${selectedMessage.status || 'read'}`}>
                        {selectedMessage.status === 'unread' && '● Non lu'}
                        {selectedMessage.status === 'read' && 'Lu'}
                        {selectedMessage.status === 'replied' && '✓ Traité / Répondu'}
                        {selectedMessage.status === 'archived' && 'Archivé'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statut actions rapides */}
                <div className="messages-detail-top-actions">
                  {selectedMessage.status === 'unread' ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm"
                      onClick={() => handleStatusChange(selectedMessage.id, 'read')}
                    >
                      Marquer comme lu
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm"
                      onClick={() => handleStatusChange(selectedMessage.id, 'unread')}
                    >
                      Marquer comme non lu
                    </button>
                  )}

                  {selectedMessage.status !== 'replied' ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      onClick={() => handleStatusChange(selectedMessage.id, 'replied')}
                    >
                      ✓ Marquer comme traité
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm"
                      onClick={() => handleStatusChange(selectedMessage.id, 'read')}
                    >
                      Rétablir en cours
                    </button>
                  )}

                  {selectedMessage.status !== 'archived' ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm"
                      onClick={() => handleStatusChange(selectedMessage.id, 'archived')}
                      title="Déplacer dans les archives"
                    >
                      📦 Archiver
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm"
                      onClick={() => handleStatusChange(selectedMessage.id, 'read')}
                      title="Restaurer des archives"
                    >
                      Désarchiver
                    </button>
                  )}

                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-danger"
                    onClick={() => handleDelete(selectedMessage.id, selectedMessage.name)}
                    title="Supprimer définitivement"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Barre des Coordonnées & Actions Recontacter */}
              <div className="messages-contact-card">
                <div className="messages-contact-item">
                  <div className="messages-contact-icon">✉️</div>
                  <div className="messages-contact-info">
                    <span className="messages-contact-label">Email</span>
                    <a href={`mailto:${selectedMessage.email}`} className="messages-contact-value">
                      {selectedMessage.email}
                    </a>
                  </div>
                  <div className="messages-contact-btns">
                    <button
                      type="button"
                      className="messages-icon-btn"
                      onClick={() => handleCopy(selectedMessage.email, 'email')}
                      title="Copier l'email"
                    >
                      {copyFeedback === 'email' ? '✓ Copié' : 'Copier'}
                    </button>
                    <a
                      href={`mailto:${selectedMessage.email}?subject=CL%20Paysage%20-%20Votre%20demande%20de%20projet&body=Bonjour%20${encodeURIComponent(selectedMessage.name)},%0D%0A%0D%0AMerci%20pour%20votre%20message%20concernant%20votre%20projet%20de%20paysage.%0D%0A%0D%0A`}
                      className="admin-btn admin-btn-sm admin-btn-primary"
                    >
                      ✉️ Répondre par Email
                    </a>
                  </div>
                </div>

                {selectedMessage.phone && (
                  <div className="messages-contact-item">
                    <div className="messages-contact-icon">📞</div>
                    <div className="messages-contact-info">
                      <span className="messages-contact-label">Téléphone</span>
                      <a href={`tel:${selectedMessage.phone.replace(/[^0-9+]/g, '')}`} className="messages-contact-value">
                        {selectedMessage.phone}
                      </a>
                    </div>
                    <div className="messages-contact-btns">
                      <button
                        type="button"
                        className="messages-icon-btn"
                        onClick={() => handleCopy(selectedMessage.phone, 'phone')}
                        title="Copier le numéro"
                      >
                        {copyFeedback === 'phone' ? '✓ Copié' : 'Copier'}
                      </button>
                      <a
                        href={`tel:${selectedMessage.phone.replace(/[^0-9+]/g, '')}`}
                        className="admin-btn admin-btn-sm"
                      >
                        📞 Appeler
                      </a>
                      <a
                        href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, '').replace(/^0/, '33')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-btn admin-btn-sm"
                        style={{ color: '#25d366', borderColor: 'rgba(37, 211, 102, 0.3)' }}
                        title="Ouvrir dans WhatsApp"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )}

                {selectedMessage.type && (
                  <div className="messages-contact-item">
                    <div className="messages-contact-icon">🌿</div>
                    <div className="messages-contact-info">
                      <span className="messages-contact-label">Type de projet souhaité</span>
                      <span className="messages-contact-value" style={{ fontWeight: 600, color: '#10b981' }}>
                        {TYPE_LABELS[selectedMessage.type] || selectedMessage.type}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Corps du message */}
              <div className="messages-body-section">
                <h3 className="messages-body-title">Contenu du message :</h3>
                <div className="messages-body-bubble">
                  <p>{selectedMessage.message}</p>
                </div>
              </div>

              {/* Notes internes de suivi prospect */}
              <div className="messages-notes-section">
                <div className="messages-notes-header">
                  <h3>Notes internes & Suivi prospect</h3>
                  <span className="messages-notes-desc">
                    Ces notes sont privées et uniquement visibles par l'administration.
                  </span>
                </div>
                <textarea
                  className="messages-notes-textarea"
                  placeholder="Ex : Appelé le 20/09, visite du terrain prévue samedi à 14h. Devis terrasse à préparer…"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  rows={3}
                />
                <div className="messages-notes-footer">
                  <button
                    type="button"
                    className="admin-btn admin-btn-sm admin-btn-primary"
                    onClick={handleSaveNote}
                  >
                    💾 Enregistrer la note
                  </button>
                  {noteSaved && <span className="messages-note-saved">✓ Note enregistrée !</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-detail-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <h3>Sélectionnez un message</h3>
              <p>Choisissez un message dans la liste à gauche pour voir les détails et recontacter le client.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
