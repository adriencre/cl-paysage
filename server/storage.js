import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getStore } from '@netlify/blobs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const projectsFile = path.join(dataDir, 'projects.json')
const settingsFile = path.join(dataDir, 'settings.json')
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads')

function isNetlify() {
  return !!process.env.NETLIFY
}

function getDataStore() {
  return getStore({ name: 'cl-paysage-data', consistency: 'strong' })
}

function getPhotoStore() {
  return getStore({ name: 'cl-paysage-photos', consistency: 'strong' })
}

function readJSONFile(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'))
  } catch {
    return []
  }
}

function writeJSONFile(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
}

// --- Projects ---
export async function getProjects() {
  if (isNetlify()) {
    try {
      const store = getDataStore()
      const data = await store.get('projects', { type: 'json' })
      if (data && Array.isArray(data)) return data
      // Seed if not yet in store
      const initial = readJSONFile(projectsFile)
      await store.setJSON('projects', initial)
      return initial
    } catch (err) {
      console.error('[Storage Netlify] Error fetching projects:', err)
      return readJSONFile(projectsFile)
    }
  }
  return readJSONFile(projectsFile)
}

export async function saveProjects(projects) {
  if (isNetlify()) {
    const store = getDataStore()
    await store.setJSON('projects', projects)
    return
  }
  writeJSONFile(projectsFile, projects)
}

// --- Settings ---
export async function getSettings() {
  if (isNetlify()) {
    try {
      const store = getDataStore()
      const data = await store.get('settings', { type: 'json' })
      if (data) return data
      const initial = readJSONFile(settingsFile)
      await store.setJSON('settings', initial)
      return initial
    } catch (err) {
      console.error('[Storage Netlify] Error fetching settings:', err)
      return readJSONFile(settingsFile)
    }
  }
  return readJSONFile(settingsFile)
}

export async function saveSettings(settings) {
  if (isNetlify()) {
    const store = getDataStore()
    await store.setJSON('settings', settings)
    return
  }
  writeJSONFile(settingsFile, settings)
}

// --- Photos ---
export async function savePhoto(filename, buffer, mimetype = 'image/jpeg') {
  if (isNetlify()) {
    const photoStore = getPhotoStore()
    await photoStore.set(filename, buffer, {
      metadata: { contentType: mimetype }
    })
    return `/api/photos/${filename}`
  }

  // Local filesystem
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
  const destPath = path.join(uploadsDir, filename)
  fs.writeFileSync(destPath, buffer)
  return `/uploads/${filename}`
}

export async function getPhoto(filename) {
  if (isNetlify()) {
    const photoStore = getPhotoStore()
    const { data, metadata } = await photoStore.getWithMetadata(filename, { type: 'arrayBuffer' })
    if (!data) return null
    return {
      buffer: Buffer.from(data),
      contentType: metadata?.contentType || 'image/jpeg'
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
  if (isNetlify()) {
    try {
      const photoStore = getPhotoStore()
      await photoStore.delete(filename)
    } catch (err) {
      console.error('[Storage Netlify] Error deleting photo:', err)
    }
    return
  }

  const localPath = path.join(uploadsDir, filename)
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath)
  }
}
