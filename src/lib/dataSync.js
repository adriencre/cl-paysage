import defaultProjects from '../../data/projects.json'
import defaultSettings from '../../data/settings.json'
import {
  isSupabaseConfigured,
  fetchSettingsFromSupabase,
  saveSettingsToSupabase,
  fetchProjectsFromSupabase,
  saveProjectToSupabase,
  deleteProjectFromSupabase
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
export async function fetchAdminSettings(token) {
  // 1. Try Supabase cloud database first if configured
  if (isSupabaseConfigured) {
    const sbSettings = await fetchSettingsFromSupabase()
    if (sbSettings) {
      console.log('%c[CL-Sync] ⚙️ Paramètres chargés depuis Supabase (Cloud)', 'color: #3ecf8e; font-weight: bold;', sbSettings)
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
        return merged
      }
    }
  } catch (err) {
    console.warn('[CL-Sync] ⚠️ Serveur inaccessible, utilisation des paramètres par défaut')
  }

  return defaultSettings
}

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
