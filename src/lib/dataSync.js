import defaultProjects from '../../data/projects.json'
import defaultSettings from '../../data/settings.json'
import {
  isSupabaseConfigured,
  fetchSettingsFromSupabase,
  saveSettingsToSupabase,
  fetchProjectsFromSupabase,
  saveProjectToSupabase,
  deleteProjectFromSupabase,
  fetchContactMessagesFromSupabase,
  saveContactMessageToSupabase,
  updateContactMessageInSupabase,
  deleteContactMessageFromSupabase
} from './supabase'

// Purge any legacy data caches from localStorage to ensure server is single source of truth
try {
  localStorage.removeItem('cl_projects')
  localStorage.removeItem('cl_projects_admin')
  localStorage.removeItem('cl_settings')
} catch {}

// Helper to convert File to Base64 Data URL (for preview only)
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

// --- Projects ---
export async function fetchAdminProjects(token) {
  // 1. Try Supabase cloud database first if configured
  if (isSupabaseConfigured) {
    const sbData = await fetchProjectsFromSupabase()
    if (sbData && sbData.length > 0) {
      console.log(`%c[CL-Sync] 📁 ${sbData.length} projet(s) chargés depuis Supabase (Cloud)`, 'color: #3ecf8e; font-weight: bold;')
      return sbData
    }
  }

  // 2. Fallback to server API
  try {
    const res = await fetch('/api/admin/projects', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        console.log(`%c[CL-Sync] 📁 ${data.length} projet(s) admin chargés depuis l'API`, 'color: #10b981; font-weight: bold;')
        return data
      }
    } else if (res.status === 401 || res.status === 403) {
      try {
        window.dispatchEvent(new CustomEvent('admin_auth_failed'))
      } catch {}
    }
  } catch (err) {
    console.warn('[CL-Sync] ⚠️ Serveur inaccessible pour les projets, utilisation des projets par défaut')
  }

  return defaultProjects
}

export async function saveAdminProject(projectData, token, isEdit = false, id = null) {
  let savedServer = false
  let isAuthError = false
  let result = null

  console.log(`%c[CL-Sync] 💾 ${isEdit ? 'Modification' : 'Création'} du projet "${projectData.title || ''}"...`, 'color: #3b82f6; font-weight: bold;')

  // 1. Save to Supabase cloud if configured
  if (isSupabaseConfigured) {
    const sbSaved = await saveProjectToSupabase(projectData, isEdit, id)
    if (sbSaved) {
      savedServer = true
      result = sbSaved
      console.log('%c[CL-Sync] ✅ Projet persisté dans Supabase Cloud !', 'color: #3ecf8e; font-weight: bold;')
    }
  }

  // 2. Also send to server API
  for (let attempt = 0; attempt < 2 && (!savedServer || isSupabaseConfigured); attempt++) {
    try {
      const url = isEdit ? `/api/admin/projects/${id}` : '/api/admin/projects'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      })
      if (res.ok) {
        result = result || (await res.json())
        savedServer = true
        break
      } else if (res.status === 401 || res.status === 403) {
        isAuthError = true
        try {
          window.dispatchEvent(new CustomEvent('admin_auth_failed'))
        } catch {}
        break
      }
    } catch {
      if (savedServer) break
    }
  }

  return { success: savedServer, serverSuccess: savedServer, isAuthError, data: result }
}

export async function deleteAdminProject(id, token) {
  let serverSuccess = false
  let isAuthError = false

  console.log(`%c[CL-Sync] 🗑️ Suppression du projet id=${id}...`, 'color: #ef4444; font-weight: bold;')

  // 1. Delete from Supabase if configured
  if (isSupabaseConfigured) {
    const sbDel = await deleteProjectFromSupabase(id)
    if (sbDel) {
      serverSuccess = true
      console.log('%c[CL-Sync] ✅ Projet supprimé de Supabase Cloud !', 'color: #3ecf8e;')
    }
  }

  // 2. Also call server API
  try {
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) serverSuccess = true
  } catch {}

  return { success: serverSuccess, serverSuccess, isAuthError }
}

// --- Settings ---
// Public read settings with instant session cache for hero image to prevent any flash
export async function fetchPublicSettings() {
  // 1. Try Supabase cloud database first if configured
  if (isSupabaseConfigured) {
    const sbSettings = await fetchSettingsFromSupabase()
    if (sbSettings) {
      if (sbSettings.hero?.bgImage) {
        try { sessionStorage.setItem('cl_hero_bg', sbSettings.hero.bgImage) } catch {}
      }
      return sbSettings
    }
  }

  // 2. Fallback to server API
  try {
    const res = await fetch('/api/settings')
    if (res.ok) {
      const data = await res.json()
      if (data && typeof data === 'object' && !data.error) {
        const merged = {
          ...defaultSettings,
          ...data,
          branding: { ...(defaultSettings.branding || {}), ...(data.branding || {}) },
          hero: { ...(defaultSettings.hero || {}), ...(data.hero || {}) },
          socialLinks: { ...(defaultSettings.socialLinks || {}), ...(data.socialLinks || {}) },
        }
        if (merged.hero?.bgImage) {
          try { sessionStorage.setItem('cl_hero_bg', merged.hero.bgImage) } catch {}
        }
        return merged
      }
    }
  } catch (err) {
    console.warn('[CL-Sync] ⚠️ Serveur inaccessible, utilisation des paramètres par défaut')
  }

  return defaultSettings
}

export async function fetchPublicProjects() {
  if (isSupabaseConfigured) {
    const sbData = await fetchProjectsFromSupabase()
    if (sbData && sbData.length > 0) {
      return sbData
    }
  }

  try {
    const res = await fetch('/api/projects')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
    }
  } catch {}

  return defaultProjects
}

export const fetchAdminSettings = fetchPublicSettings

export async function saveAdminSettings(settingsData, token) {
  console.log('%c[CL-Sync] 💾 Sauvegarde des paramètres en cours...', 'color: #3b82f6; font-weight: bold;', settingsData)

  const current = await fetchAdminSettings(token)
  const merged = {
    ...current,
    ...settingsData,
    branding: {
      ...(current.branding || {}),
      ...(settingsData.branding || {}),
    },
    hero: {
      ...(current.hero || {}),
      ...(settingsData.hero || {}),
    },
    socialLinks: {
      ...(current.socialLinks || {}),
      ...(settingsData.socialLinks || {}),
    },
  }

  let serverSuccess = false
  let isAuthError = false

  // 1. Save to Supabase cloud if configured
  if (isSupabaseConfigured) {
    const sbSaved = await saveSettingsToSupabase(merged)
    if (sbSaved) {
      serverSuccess = true
      console.log('%c[CL-Sync] ✅ Paramètres enregistrés dans Supabase Cloud !', 'color: #3ecf8e; font-weight: bold;')
    }
  }

  // 2. Also send to server API
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(merged),
    })
    if (res.ok) {
      serverSuccess = true
      console.log('%c[CL-Sync] ✅ Paramètres enregistrés sur l\'API serveur !', 'color: #10b981;')
    } else if (res.status === 401 || res.status === 403) {
      isAuthError = true
      try {
        window.dispatchEvent(new CustomEvent('admin_auth_failed'))
      } catch {}
    }
  } catch {}

  // Broadcast settings change in memory to active components
  try {
    window.dispatchEvent(new CustomEvent('cl_settings_updated', { detail: merged }))
  } catch {}

  return { success: serverSuccess, serverSuccess, isAuthError, data: merged }
}

// =======================================================
// --- Contacts & Messagerie Admin ---
// =======================================================

/**
 * Envoie un message de contact depuis le front public avec résilience (Supabase Cloud + API Serveur).
 */
export async function sendContactMessage(formData) {
  const contactId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const payload = {
    id: contactId,
    name: (formData.name || '').trim(),
    email: (formData.email || '').trim(),
    phone: (formData.phone || '').trim(),
    type: (formData.type || '').trim(),
    message: (formData.message || '').trim(),
    status: 'unread',
    notes: '',
    createdAt: new Date().toISOString()
  }

  let cloudSaved = false
  let serverSaved = false

  // 1. Sauvegarder dans Supabase Cloud si configuré
  if (isSupabaseConfigured) {
    try {
      const sbResult = await saveContactMessageToSupabase(payload)
      if (sbResult) {
        cloudSaved = true
        console.log('%c[CL-Contact] ✉️ Message sauvegardé dans Supabase Cloud', 'color: #3ecf8e; font-weight: bold;')
      }
    } catch (err) {
      console.warn('[CL-Contact] Erreur Supabase contact:', err)
    }
  }

  // 2. Envoyer à l'API serveur Express / Netlify Function
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      serverSaved = true
      console.log('%c[CL-Contact] ✉️ Message envoyé à l\'API serveur avec succès', 'color: #10b981; font-weight: bold;')
    }
  } catch (err) {
    console.warn('[CL-Contact] API serveur non joignable:', err)
  }

  // 3. Essai Netlify Forms en fallback si sur Netlify
  try {
    const netlifyData = new FormData()
    netlifyData.append('form-name', 'contact')
    netlifyData.append('name', payload.name)
    netlifyData.append('email', payload.email)
    netlifyData.append('phone', payload.phone)
    netlifyData.append('type', payload.type)
    netlifyData.append('message', payload.message)

    await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(netlifyData).toString(),
    })
  } catch {}

  // Émettre un événement pour mise à jour instantanée si l'admin est ouvert dans le navigateur
  try {
    window.dispatchEvent(new CustomEvent('cl_contacts_updated', { detail: payload }))
  } catch {}

  if (!cloudSaved && !serverSaved) {
    // Si ni le cloud ni le serveur n'ont répondu, on sauvegarde quand même en local pour ne pas perdre la demande
    try {
      const local = JSON.parse(localStorage.getItem('cl_offline_contacts') || '[]')
      local.unshift(payload)
      localStorage.setItem('cl_offline_contacts', JSON.stringify(local))
    } catch {}
  }

  return {
    success: cloudSaved || serverSaved || true,
    data: payload
  }
}

/**
 * Récupère tous les messages de contact pour l'espace administration.
 */
export async function fetchAdminContacts(token) {
  // 1. Tenter Supabase en premier
  if (isSupabaseConfigured) {
    const sbData = await fetchContactMessagesFromSupabase()
    if (Array.isArray(sbData)) {
      console.log(`%c[CL-Sync] 📬 ${sbData.length} message(s) chargés depuis Supabase (Cloud)`, 'color: #3ecf8e;')
      return sbData
    }
  }

  // 2. Tenter l'API serveur
  try {
    const res = await fetch('/api/admin/contacts', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        console.log(`%c[CL-Sync] 📬 ${data.length} message(s) chargés depuis l'API serveur`, 'color: #10b981;')
        return data
      }
    } else if (res.status === 401 || res.status === 403) {
      try {
        window.dispatchEvent(new CustomEvent('admin_auth_failed'))
      } catch {}
    }
  } catch (err) {
    console.warn('[CL-Sync] ⚠️ API contacts non accessible:', err.message)
  }

  // 3. Fallback localStorage si mode hors-ligne
  try {
    const offline = JSON.parse(localStorage.getItem('cl_offline_contacts') || '[]')
    if (offline.length > 0) return offline
  } catch {}

  return []
}

/**
 * Met à jour le statut ou les notes d'un message de contact.
 */
export async function updateAdminContact(id, updates, token) {
  let updated = false

  // 1. Supabase
  if (isSupabaseConfigured) {
    const sbRes = await updateContactMessageInSupabase(id, updates)
    if (sbRes) updated = true
  }

  // 2. API serveur
  try {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    })
    if (res.ok) {
      updated = true
    } else if (res.status === 401 || res.status === 403) {
      try {
        window.dispatchEvent(new CustomEvent('admin_auth_failed'))
      } catch {}
    }
  } catch (err) {
    console.warn('[CL-Sync] Erreur mise à jour contact API:', err)
  }

  // Notifier les composants
  try {
    window.dispatchEvent(new CustomEvent('cl_contacts_updated'))
  } catch {}

  return updated
}

/**
 * Supprime définitivement un message de contact.
 */
export async function deleteAdminContact(id, token) {
  let deleted = false

  // 1. Supabase
  if (isSupabaseConfigured) {
    const sbRes = await deleteContactMessageFromSupabase(id)
    if (sbRes) deleted = true
  }

  // 2. API serveur
  try {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      deleted = true
    } else if (res.status === 401 || res.status === 403) {
      try {
        window.dispatchEvent(new CustomEvent('admin_auth_failed'))
      } catch {}
    }
  } catch (err) {
    console.warn('[CL-Sync] Erreur suppression contact API:', err)
  }

  // Nettoyage offline si présent
  try {
    const offline = JSON.parse(localStorage.getItem('cl_offline_contacts') || '[]')
    const filtered = offline.filter(c => c.id !== id)
    localStorage.setItem('cl_offline_contacts', JSON.stringify(filtered))
  } catch {}

  // Notifier les composants
  try {
    window.dispatchEvent(new CustomEvent('cl_contacts_updated'))
  } catch {}

  return deleted
}

