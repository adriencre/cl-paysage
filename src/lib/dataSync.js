import defaultProjects from '../../data/projects.json'
import defaultSettings from '../../data/settings.json'

// Helper to convert File to Base64 Data URL
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

export function safeSetLocalStorage(key, value) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    return true
  } catch (e) {
    console.warn(`[Storage] Quota error on ${key}, attempting storage cleanup:`, e.message)
    try {
      // Free space by trimming base64 URLs from cl_projects
      const projRaw = localStorage.getItem('cl_projects')
      if (projRaw) {
        const parsed = JSON.parse(projRaw)
        if (Array.isArray(parsed)) {
          const trimmed = parsed.map((p, idx) => {
            if (idx === 0) return p
            return {
              ...p,
              photos: (p.photos || []).map(ph => {
                if (ph.url && ph.url.startsWith('data:') && ph.url.length > 2000) {
                  return { ...ph, url: ph.url.slice(0, 2000) }
                }
                return ph
              })
            }
          })
          localStorage.setItem('cl_projects', JSON.stringify(trimmed))
        }
      }
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }
}

// --- Projects ---
export async function fetchAdminProjects(token) {
  try {
    const res = await fetch('/api/admin/projects', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        safeSetLocalStorage('cl_projects', data)
        return data
      }
    }
  } catch (err) {
    console.warn('[Sync] Backend API offline, using local storage cache')
  }

  const saved = localStorage.getItem('cl_projects')
  if (saved) {
    try { return JSON.parse(saved) } catch {}
  }
  return defaultProjects
}

export async function saveAdminProject(projectData, token, isEdit = false, id = null) {
  let savedServer = false
  let result = null

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
    }
  } catch (err) {
    console.warn('[Sync] Backend offline, saving to browser storage')
  }

  // Always update local cache
  const current = await fetchAdminProjects(token)
  let updatedList = [...current]
  if (isEdit) {
    const idx = updatedList.findIndex(p => p.id === id)
    if (idx !== -1) {
      updatedList[idx] = { ...updatedList[idx], ...projectData }
      result = updatedList[idx]
    } else {
      updatedList.unshift({ ...projectData, id })
      result = { ...projectData, id }
    }
  } else {
    const newProj = result || {
      ...projectData,
      id: 'proj_' + Date.now(),
      createdAt: new Date().toISOString(),
    }
    updatedList.unshift(newProj)
    result = newProj
  }

  safeSetLocalStorage('cl_projects', updatedList)
  return result
}

export async function deleteAdminProject(id, token) {
  try {
    await fetch(`/api/admin/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (err) {
    console.warn('[Sync] Backend offline, deleting from browser storage')
  }

  const current = await fetchAdminProjects(token)
  const filtered = current.filter(p => p.id !== id)
  safeSetLocalStorage('cl_projects', filtered)
  return true
}

// --- Settings ---
export async function fetchAdminSettings(token) {
  let cached = null
  const saved = localStorage.getItem('cl_settings')
  if (saved) {
    try { cached = JSON.parse(saved) } catch {}
  }

  try {
    const res = await fetch('/api/settings')
    if (res.ok) {
      const data = await res.json()
      if (data && typeof data === 'object') {
        const merged = {
          ...defaultSettings,
          ...cached,
          ...data,
          branding: { ...(defaultSettings.branding || {}), ...(cached?.branding || {}), ...(data.branding || {}) },
          hero: { ...(defaultSettings.hero || {}), ...(cached?.hero || {}), ...(data.hero || {}) },
          socialLinks: { ...(defaultSettings.socialLinks || {}), ...(cached?.socialLinks || {}), ...(data.socialLinks || {}) },
        }
        safeSetLocalStorage('cl_settings', merged)
        return merged
      }
    }
  } catch (err) {
    console.warn('[Sync] Backend offline, loading settings from browser cache')
  }

  return cached || defaultSettings
}

export async function saveAdminSettings(settingsData, token) {
  // Always get existing settings to perform a safe deep merge
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
    } else if (res.status === 401) {
      isAuthError = true
      console.warn('[Sync] Token invalid or expired during save')
    }
  } catch (err) {
    console.warn('[Sync] Backend offline, saving settings to local storage')
  }

  // Always persist to local browser storage so the site updates immediately
  safeSetLocalStorage('cl_settings', merged)

  // Broadcast settings change to all active components
  try {
    window.dispatchEvent(new CustomEvent('cl_settings_updated', { detail: merged }))
  } catch {}

  return { success: true, serverSuccess, isAuthError, data: merged }
}
