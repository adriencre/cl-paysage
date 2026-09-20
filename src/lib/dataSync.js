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

// Clean helper to remove oversized inline data URLs without corrupting strings
function stripOversizedDataUrls(projects) {
  if (!Array.isArray(projects)) return projects
  return projects.map(p => ({
    ...p,
    photos: (p.photos || []).map(ph => {
      if (ph.url && ph.url.startsWith('data:') && ph.url.length > 30000) {
        // If filename is present, refer to the uploaded photo URL
        if (ph.filename) {
          return { ...ph, url: `/uploads/${ph.filename}` }
        }
        return { ...ph, url: '' }
      }
      return ph
    })
  }))
}

export function safeSetLocalStorage(key, value) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    return true
  } catch (e) {
    console.warn(`[Storage] Quota error on ${key}, cleaning up local cache:`, e.message)
    try {
      // 1. Clean existing project caches
      for (const k of ['cl_projects_admin', 'cl_projects']) {
        const raw = localStorage.getItem(k)
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            localStorage.setItem(k, JSON.stringify(stripOversizedDataUrls(parsed)))
          } catch {}
        }
      }

      // 2. Clean current payload if it contains projects
      let valToStore = value
      if (Array.isArray(value)) {
        valToStore = stripOversizedDataUrls(value)
      } else if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (Array.isArray(parsed)) {
            valToStore = JSON.stringify(stripOversizedDataUrls(parsed))
          }
        } catch {}
      }

      localStorage.setItem(key, typeof valToStore === 'string' ? valToStore : JSON.stringify(valToStore))
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
        safeSetLocalStorage('cl_projects_admin', data)
        safeSetLocalStorage('cl_projects', data)
        return data
      }
    } else if (res.status === 401 || res.status === 403) {
      try {
        window.dispatchEvent(new CustomEvent('admin_auth_failed'))
      } catch {}
    }
  } catch (err) {
    console.warn('[Sync] Backend API offline, using local storage cache')
  }

  // Check admin cache first, then public cache, then defaults
  const savedAdmin = localStorage.getItem('cl_projects_admin')
  if (savedAdmin) {
    try { return JSON.parse(savedAdmin) } catch {}
  }
  const saved = localStorage.getItem('cl_projects')
  if (saved) {
    try { return JSON.parse(saved) } catch {}
  }
  return defaultProjects
}

export async function saveAdminProject(projectData, token, isEdit = false, id = null) {
  let savedServer = false
  let isAuthError = false
  let result = null

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
      } else if (res.status === 401 || res.status === 403) {
        isAuthError = true
        console.warn('[Sync] Token invalid or expired during project save')
        try {
          window.dispatchEvent(new CustomEvent('admin_auth_failed'))
        } catch {}
        break
      } else {
        console.warn(`[Sync] Server returned ${res.status} on project save (attempt ${attempt + 1})`)
      }
    } catch (err) {
      console.warn(`[Sync] Backend offline (attempt ${attempt + 1}):`, err.message)
      if (attempt === 0) {
        // Brief wait before retry
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  // Update local cache so the UI stays responsive
  const current = await fetchAdminProjects(token)
  let updatedList = [...current]
  if (isEdit) {
    const idx = updatedList.findIndex(p => p.id === id)
    if (idx !== -1) {
      updatedList[idx] = { ...updatedList[idx], ...projectData }
      result = result || updatedList[idx]
    } else {
      updatedList.unshift({ ...projectData, id })
      result = result || { ...projectData, id }
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

  // Save to admin cache
  safeSetLocalStorage('cl_projects_admin', updatedList)

  // Only sync to public cache if server confirmed or offline fallback with valid project
  if (savedServer) {
    safeSetLocalStorage('cl_projects', updatedList)
  }

  return { success: true, serverSuccess: savedServer, isAuthError, data: result }
}

export async function deleteAdminProject(id, token) {
  let serverSuccess = false
  let isAuthError = false

  for (let attempt = 0; attempt < 2 && !serverSuccess; attempt++) {
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        serverSuccess = true
      } else if (res.status === 401 || res.status === 403) {
        isAuthError = true
        try {
          window.dispatchEvent(new CustomEvent('admin_auth_failed'))
        } catch {}
        break
      } else {
        console.warn(`[Sync] Server returned ${res.status} on project delete (attempt ${attempt + 1})`)
      }
    } catch (err) {
      console.warn(`[Sync] Backend offline (attempt ${attempt + 1}):`, err.message)
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  const current = await fetchAdminProjects(token)
  const filtered = current.filter(p => p.id !== id)
  safeSetLocalStorage('cl_projects_admin', filtered)
  if (serverSuccess) {
    safeSetLocalStorage('cl_projects', filtered)
  }

  return { success: true, serverSuccess, isAuthError }
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
      if (data && typeof data === 'object' && !data.error) {
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
      } else if (res.status === 401 || res.status === 403) {
        isAuthError = true
        console.warn('[Sync] Token invalid or expired during save')
        try {
          window.dispatchEvent(new CustomEvent('admin_auth_failed'))
        } catch {}
        break
      } else {
        console.warn(`[Sync] Server returned ${res.status} on settings save (attempt ${attempt + 1})`)
      }
    } catch (err) {
      console.warn(`[Sync] Backend offline (attempt ${attempt + 1}):`, err.message)
      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }
  }

  // Persist to local browser storage
  safeSetLocalStorage('cl_settings', merged)

  // Broadcast settings change to all active components
  try {
    window.dispatchEvent(new CustomEvent('cl_settings_updated', { detail: merged }))
  } catch {}

  return { success: true, serverSuccess, isAuthError, data: merged }
}
