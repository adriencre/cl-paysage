import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getStore } from '@netlify/blobs'

function getProjectRootDir() {
  if (process.env.LAMBDA_TASK_ROOT) {
    return process.env.LAMBDA_TASK_ROOT
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.url) {
      return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
    }
  } catch {}
  return process.cwd()
}

const rootDir = getProjectRootDir()
const dataDir = path.join(rootDir, 'data')
const projectsFile = path.join(dataDir, 'projects.json')
const settingsFile = path.join(dataDir, 'settings.json')
const uploadsDir = path.join(rootDir, 'public', 'uploads')

// In-memory cache for serverless warm execution
let memoryProjects = null
let memorySettings = null
let memoryPhotos = new Map()

function withTimeout(promise, ms = 2500) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Blobs operation timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId))
}

function getSafeStore(storeName) {
  try {
    const isNetlify = Boolean(
      process.env.NETLIFY ||
      process.env.NETLIFY_BLOBS_CONTEXT ||
      process.env.NETLIFY_SITE_ID
    )
    if (!isNetlify) return null
    return getStore({ name: storeName, consistency: 'strong' })
  } catch (err) {
    return null
  }
}

function readJSONFile(filepath, defaultValue = []) {
  try {
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf-8')
      if (content && content.trim()) {
        return JSON.parse(content)
      }
    }
  } catch (err) {
    console.warn(`[Storage] Could not read ${filepath}:`, err.message)
  }
  return defaultValue
}

function writeJSONFile(filepath, data) {
  try {
    const dir = path.dirname(filepath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.warn(`[Storage] Read-only environment, skipping write to ${filepath}:`, err.message)
    return false
  }
}

// --- Projects ---
export async function getProjects() {
  const store = getSafeStore('cl-paysage-data')
  if (store) {
    try {
      const data = await withTimeout(store.get('projects', { type: 'json' }), 2500)
      if (data && Array.isArray(data)) {
        memoryProjects = data
        return data
      }
      const initial = memoryProjects || readJSONFile(projectsFile, [])
      await withTimeout(store.setJSON('projects', initial), 2500).catch(() => {})
      return initial
    } catch (err) {
      console.warn('[Storage] Blobs get projects fallback:', err.message)
    }
  }

  if (memoryProjects) return memoryProjects
  memoryProjects = readJSONFile(projectsFile, [])
  return memoryProjects
}

export async function saveProjects(projects) {
  memoryProjects = projects
  let persisted = false
  let storageType = 'memory'

  const store = getSafeStore('cl-paysage-data')
  if (store) {
    try {
      await withTimeout(store.setJSON('projects', projects), 3000)
      persisted = true
      storageType = 'blobs'
    } catch (err) {
      console.warn('[Storage] Blobs save projects fallback:', err.message)
    }
  }

  try {
    const written = writeJSONFile(projectsFile, projects)
    if (written) {
      persisted = true
      if (storageType === 'memory') storageType = 'filesystem'
    }
  } catch {}

  return { persisted, storage: storageType }
}

// --- Settings ---
export async function getSettings() {
  const store = getSafeStore('cl-paysage-data')
  if (store) {
    try {
      const data = await withTimeout(store.get('settings', { type: 'json' }), 2500)
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        memorySettings = data
        console.log('[Storage] 📖 Paramètres chargés depuis Netlify Blobs')
        return data
      }
      const initial = memorySettings || readJSONFile(settingsFile, {})
      await withTimeout(store.setJSON('settings', initial), 2500).catch(() => {})
      console.log('[Storage] 📖 Paramètres initialisés dans Netlify Blobs')
      return initial
    } catch (err) {
      console.warn('[Storage] Blobs get settings fallback:', err.message)
    }
  }

  if (memorySettings) {
    console.log('[Storage] 📖 Paramètres chargés depuis la mémoire')
    return memorySettings
  }
  memorySettings = readJSONFile(settingsFile, {})
  console.log('[Storage] 📖 Paramètres chargés depuis le fichier local settings.json')
  return memorySettings
}

export async function saveSettings(settings) {
  memorySettings = settings
  let persisted = false
  let storageType = 'memory'

  const store = getSafeStore('cl-paysage-data')
  if (store) {
    try {
      await withTimeout(store.setJSON('settings', settings), 3000)
      persisted = true
      storageType = 'blobs'
      console.log('[Storage] 💾 Paramètres persistés dans Netlify Blobs avec succès')
    } catch (err) {
      console.warn('[Storage] Blobs save settings fallback:', err.message)
    }
  }

  try {
    const written = writeJSONFile(settingsFile, settings)
    if (written) {
      persisted = true
      if (storageType === 'memory') storageType = 'filesystem'
      console.log('[Storage] 💾 Paramètres sauvegardés sur le disque local (data/settings.json)')
    }
  } catch {}

  console.log(`[Storage] ✅ Résultat sauvegarde paramètres -> mode: ${storageType}, persistance: ${persisted}`)
  return { persisted, storage: storageType }
}

// --- Photos ---
export async function savePhoto(filename, buffer, mimetype = 'image/jpeg') {
  memoryPhotos.set(filename, { buffer, contentType: mimetype })

  const store = getSafeStore('cl-paysage-photos')
  if (store) {
    try {
      await withTimeout(store.set(filename, buffer, {
        metadata: { contentType: mimetype }
      }), 4000)
    } catch (err) {
      console.warn('[Storage] Blobs photo save fallback:', err.message)
    }
  }

  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    const destPath = path.join(uploadsDir, filename)
    fs.writeFileSync(destPath, buffer)
  } catch {}

  // Always return /api/photos/:filename for consistent serving across Netlify & local
  return `/api/photos/${filename}`
}

export async function getPhoto(filename) {
  if (memoryPhotos.has(filename)) {
    return memoryPhotos.get(filename)
  }

  const store = getSafeStore('cl-paysage-photos')
  if (store) {
    try {
      const resp = await withTimeout(store.getWithMetadata(filename, { type: 'arrayBuffer' }), 2500)
      if (resp && resp.data) {
        return {
          buffer: Buffer.from(resp.data),
          contentType: resp.metadata?.contentType || 'image/jpeg'
        }
      }
    } catch (err) {
      console.warn('[Storage] Blobs get photo fallback:', err.message)
    }
  }

  const localPath = path.join(uploadsDir, filename)
  if (fs.existsSync(localPath)) {
    return {
      buffer: fs.readFileSync(localPath),
      contentType: filename.endsWith('.png') ? 'image/png' : 'image/jpeg'
    }
  }
  return null
}

export async function deletePhoto(filename) {
  memoryPhotos.delete(filename)
  const store = getSafeStore('cl-paysage-photos')
  if (store) {
    try {
      await withTimeout(store.delete(filename), 3000)
      return
    } catch (err) {
      console.warn('[Storage] Blobs delete photo fallback:', err.message)
    }
  }

  const localPath = path.join(uploadsDir, filename)
  if (fs.existsSync(localPath)) {
    try { fs.unlinkSync(localPath) } catch {}
  }
}

export async function saveContactMessage(msg) {
  const entry = {
    id: 'msg_' + Date.now(),
    receivedAt: new Date().toISOString(),
    ...msg
  }
  const store = getSafeStore('cl-paysage-data')
  if (store) {
    try {
      const existing = (await withTimeout(store.get('contacts', { type: 'json' }), 2500)) || []
      existing.unshift(entry)
      await withTimeout(store.setJSON('contacts', existing.slice(0, 100)), 2500)
    } catch (err) {
      console.warn('[Storage] Blobs save contact fallback:', err.message)
    }
  }
  return entry
}

