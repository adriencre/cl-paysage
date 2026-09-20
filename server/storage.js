import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getStore } from '@netlify/blobs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const projectsFile = path.join(dataDir, 'projects.json')
const settingsFile = path.join(dataDir, 'settings.json')
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads')

// In-memory cache for serverless warm execution
let memoryProjects = null
let memorySettings = null
let memoryPhotos = new Map()

function getSafeStore(storeName) {
  try {
    return getStore({ name: storeName, consistency: 'strong' })
  } catch (err) {
    return null
  }
}

function readJSONFile(filepath, defaultValue = []) {
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf-8'))
    }
  } catch (err) {
    console.warn(`[Storage] Could not read ${filepath}:`, err.message)
  }
  return defaultValue
}

function writeJSONFile(filepath, data) {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.warn(`[Storage] Read-only environment, skipping write to ${filepath}`)
  }
}

// --- Projects ---
export async function getProjects() {
  const store = getSafeStore('cl-paysage-data')
  if (store) {
    try {
      const data = await store.get('projects', { type: 'json' })
      if (data && Array.isArray(data)) return data
      const initial = memoryProjects || readJSONFile(projectsFile)
      await store.setJSON('projects', initial).catch(() => {})
      return initial
    } catch (err) {
      console.warn('[Storage] Blobs get projects fallback:', err.message)
    }
  }

  if (memoryProjects) return memoryProjects
  memoryProjects = readJSONFile(projectsFile)
  return memoryProjects
}

export async function saveProjects(projects) {
  memoryProjects = projects
  const store = getSafeStore('cl-paysage-data')
  if (store) {
    try {
      await store.setJSON('projects', projects)
      return { persisted: true, storage: 'blobs' }
    } catch (err) {
      console.warn('[Storage] Blobs save projects fallback:', err.message)
    }
  }
  try {
    writeJSONFile(projectsFile, projects)
    if (fs.existsSync(projectsFile)) {
      return { persisted: true, storage: 'filesystem' }
    }
  } catch {}
  return { persisted: false, storage: 'memory' }
}

// --- Settings ---
export async function getSettings() {
  const store = getSafeStore('cl-paysage-data')
  if (store) {
    try {
      const data = await store.get('settings', { type: 'json' })
      if (data) return data
      const initial = memorySettings || readJSONFile(settingsFile, {})
      await store.setJSON('settings', initial).catch(() => {})
      return initial
    } catch (err) {
      console.warn('[Storage] Blobs get settings fallback:', err.message)
    }
  }

  if (memorySettings) return memorySettings
  memorySettings = readJSONFile(settingsFile, {})
  return memorySettings
}

export async function saveSettings(settings) {
  memorySettings = settings
  const store = getSafeStore('cl-paysage-data')
  if (store) {
    try {
      await store.setJSON('settings', settings)
      return { persisted: true, storage: 'blobs' }
    } catch (err) {
      console.warn('[Storage] Blobs save settings fallback:', err.message)
    }
  }
  try {
    writeJSONFile(settingsFile, settings)
    if (fs.existsSync(settingsFile)) {
      return { persisted: true, storage: 'filesystem' }
    }
  } catch {}
  return { persisted: false, storage: 'memory' }
}

// --- Photos ---
export async function savePhoto(filename, buffer, mimetype = 'image/jpeg') {
  memoryPhotos.set(filename, { buffer, contentType: mimetype })

  const store = getSafeStore('cl-paysage-photos')
  if (store) {
    try {
      await store.set(filename, buffer, {
        metadata: { contentType: mimetype }
      })
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
      const { data, metadata } = await store.getWithMetadata(filename, { type: 'arrayBuffer' })
      if (data) {
        return {
          buffer: Buffer.from(data),
          contentType: metadata?.contentType || 'image/jpeg'
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
      await store.delete(filename)
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
      const existing = (await store.get('contacts', { type: 'json' })) || []
      existing.unshift(entry)
      await store.setJSON('contacts', existing.slice(0, 100))
    } catch (err) {
      console.warn('[Storage] Blobs save contact fallback:', err.message)
    }
  }
  return entry
}

