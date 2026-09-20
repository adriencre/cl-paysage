import defaultProjects from '../../data/projects.json'
import defaultSettings from '../../data/settings.json'

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
  try {
    const res = await fetch('/api/admin/projects', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        console.log(`%c[CL-Sync] 📁 ${data.length} projet(s) chargés directement depuis le serveur`, 'color: #10b981; font-weight: bold;')
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

  console.log(`%c[CL-Sync] 💾 ${isEdit ? 'Modification' : 'Création'} du projet "${projectData.title || ''}" sur le serveur...`, 'color: #3b82f6; font-weight: bold;')

  // Attempt server save (with one retry on network failure)
  for (let attempt = 0; attempt < 2 && !savedServer; attempt++) {
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
        result = await res.json()
        savedServer = true
        console.log('%c[CL-Sync] ✅ Projet enregistré sur le serveur avec succès !', 'color: #10b981; font-weight: bold;')
      } else if (res.status === 401 || res.status === 403) {
        isAuthError = true
        console.warn('[CL-Sync] ❌ Token invalide lors de la sauvegarde du projet')
        try {
          window.dispatchEvent(new CustomEvent('admin_auth_failed'))
        } catch {}
        break
      } else {
        console.warn(`[CL-Sync] ⚠️ Réponse serveur ${res.status} sur projet (tentative ${attempt + 1})`)
      }
    } catch (err) {
      console.warn(`[CL-Sync] ⚠️ Erreur réseau projet (tentative ${attempt + 1}):`, err.message)
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  return { success: savedServer, serverSuccess: savedServer, isAuthError, data: result }
}

export async function deleteAdminProject(id, token) {
  let serverSuccess = false
  let isAuthError = false

  console.log(`%c[CL-Sync] 🗑️ Suppression du projet id=${id} sur le serveur...`, 'color: #ef4444; font-weight: bold;')

  for (let attempt = 0; attempt < 2 && !serverSuccess; attempt++) {
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        serverSuccess = true
        console.log('%c[CL-Sync] ✅ Projet supprimé du serveur avec succès !', 'color: #10b981;')
      } else if (res.status === 401 || res.status === 403) {
        isAuthError = true
        try {
          window.dispatchEvent(new CustomEvent('admin_auth_failed'))
        } catch {}
        break
      } else {
        console.warn(`[CL-Sync] ⚠️ Réponse serveur ${res.status} sur suppression (tentative ${attempt + 1})`)
      }
    } catch (err) {
      console.warn(`[CL-Sync] ⚠️ Erreur réseau suppression (tentative ${attempt + 1}):`, err.message)
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  return { success: serverSuccess, serverSuccess, isAuthError }
}

// --- Settings ---
export async function fetchAdminSettings(token) {
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
        console.log('%c[CL-Sync] ⚙️ Paramètres chargés depuis le serveur (zéro localStorage)', 'color: #10b981; font-weight: bold;', merged)
        return merged
      }
    }
  } catch (err) {
    console.warn('[CL-Sync] ⚠️ Serveur inaccessible, utilisation des paramètres par défaut')
  }

  return defaultSettings
}

export async function saveAdminSettings(settingsData, token) {
  console.log('%c[CL-Sync] 💾 Sauvegarde directe sur le serveur (zéro localStorage)...', 'color: #3b82f6; font-weight: bold;', settingsData)

  // Fetch fresh settings from server
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

  // Attempt server save (with one retry on network failure)
  for (let attempt = 0; attempt < 2 && !serverSuccess; attempt++) {
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
        console.log('%c[CL-Sync] ✅ Paramètres enregistrés sur le SERVEUR avec succès ! (HTTP ' + res.status + ')', 'color: #10b981; font-weight: bold;')
      } else if (res.status === 401 || res.status === 403) {
        isAuthError = true
        console.warn('[CL-Sync] ❌ Session expirée ou jeton invalide')
        try {
          window.dispatchEvent(new CustomEvent('admin_auth_failed'))
        } catch {}
        break
      } else {
        console.warn(`[CL-Sync] ⚠️ Réponse serveur ${res.status} (tentative ${attempt + 1})`)
      }
    } catch (err) {
      console.warn(`[CL-Sync] ⚠️ Connexion impossible (tentative ${attempt + 1}):`, err.message)
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  // Broadcast settings change in memory to active components
  try {
    window.dispatchEvent(new CustomEvent('cl_settings_updated', { detail: merged }))
    console.log('%c[CL-Sync] 📢 Événement en mémoire "cl_settings_updated" diffusé', 'color: #8b5cf6;')
  } catch {}

  return { success: serverSuccess, serverSuccess, isAuthError, data: merged }
}
