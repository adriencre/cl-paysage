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

// --- Projects ---
export async function fetchAdminProjects(token) {
  try {
    const res = await fetch('/api/admin/projects', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem('cl_projects', JSON.stringify(data))
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

  localStorage.setItem('cl_projects', JSON.stringify(updatedList))
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
  localStorage.setItem('cl_projects', JSON.stringify(filtered))
  return true
}

// --- Settings ---
export async function fetchAdminSettings(token) {
  try {
    const res = await fetch('/api/settings')
    if (res.ok) {
      const data = await res.json()
      if (data) {
        localStorage.setItem('cl_settings', JSON.stringify(data))
        return data
      }
    }
  } catch (err) {
    console.warn('[Sync] Backend offline, loading settings from browser cache')
  }

  const saved = localStorage.getItem('cl_settings')
  if (saved) {
    try { return JSON.parse(saved) } catch {}
  }
  return defaultSettings
}

export async function saveAdminSettings(settingsData, token) {
  try {
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settingsData),
    })
  } catch (err) {
    console.warn('[Sync] Backend offline, saving settings to browser storage')
  }

  localStorage.setItem('cl_settings', JSON.stringify(settingsData))
  return settingsData
}
