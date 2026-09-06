import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { login, authMiddleware } from './auth.js'
import { upload, deleteFile } from './uploads.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// Paths
const dataDir = path.join(__dirname, '..', 'data')
const projectsFile = path.join(dataDir, 'projects.json')
const settingsFile = path.join(dataDir, 'settings.json')
const publicDir = path.join(__dirname, '..', 'public')

// Middleware
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(publicDir, 'uploads')))

// --- Helpers ---
function readJSON(filepath) {
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'))
}

function writeJSON(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
}

function getPhotoUrl(photo) {
  if (photo.isStatic) return `/images/${photo.filename}`
  return `/uploads/${photo.filename}`
}

// ===========================
// PUBLIC API
// ===========================

// Get all published projects
app.get('/api/projects', (req, res) => {
  try {
    const projects = readJSON(projectsFile)
    const published = projects
      .filter(p => p.published)
      .map(p => ({
        ...p,
        photos: p.photos.map(ph => ({ ...ph, url: getPhotoUrl(ph) })),
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json(published)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Get a single project by id
app.get('/api/projects/:id', (req, res) => {
  try {
    const projects = readJSON(projectsFile)
    const project = projects.find(p => p.id === req.params.id)
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' })
    
    const enriched = {
      ...project,
      photos: project.photos.map(ph => ({ ...ph, url: getPhotoUrl(ph) })),
    }
    
    // Get prev/next published projects for navigation
    const published = projects
      .filter(p => p.published)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const idx = published.findIndex(p => p.id === project.id)
    const prev = idx > 0 ? { id: published[idx - 1].id, title: published[idx - 1].title } : null
    const next = idx < published.length - 1 ? { id: published[idx + 1].id, title: published[idx + 1].title } : null

    res.json({ project: enriched, prev, next })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Get settings
app.get('/api/settings', (req, res) => {
  try {
    res.json(readJSON(settingsFile))
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ===========================
// ADMIN API
// ===========================

// Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body
  const token = login(password)
  if (token) {
    res.json({ token })
  } else {
    res.status(401).json({ error: 'Mot de passe incorrect' })
  }
})

// --- Protected routes ---

// Get ALL projects (including drafts) for admin
app.get('/api/admin/projects', authMiddleware, (req, res) => {
  try {
    const projects = readJSON(projectsFile)
      .map(p => ({
        ...p,
        photos: p.photos.map(ph => ({ ...ph, url: getPhotoUrl(ph) })),
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json(projects)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Create project
app.post('/api/admin/projects', authMiddleware, (req, res) => {
  try {
    const projects = readJSON(projectsFile)
    const newProject = {
      id: uuidv4(),
      title: req.body.title || 'Sans titre',
      description: req.body.description || '',
      category: req.body.category || 'autre',
      location: req.body.location || '',
      date: req.body.date || '',
      photos: req.body.photos || [],
      socialLinks: req.body.socialLinks || { instagram: '', facebook: '', pinterest: '', tiktok: '' },
      published: req.body.published ?? false,
      createdAt: new Date().toISOString(),
    }
    projects.push(newProject)
    writeJSON(projectsFile, projects)
    res.status(201).json({
      ...newProject,
      photos: newProject.photos.map(ph => ({ ...ph, url: getPhotoUrl(ph) })),
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Update project
app.put('/api/admin/projects/:id', authMiddleware, (req, res) => {
  try {
    const projects = readJSON(projectsFile)
    const idx = projects.findIndex(p => p.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Projet non trouvé' })

    const updated = {
      ...projects[idx],
      title: req.body.title ?? projects[idx].title,
      description: req.body.description ?? projects[idx].description,
      category: req.body.category ?? projects[idx].category,
      location: req.body.location ?? projects[idx].location,
      date: req.body.date ?? projects[idx].date,
      photos: req.body.photos ?? projects[idx].photos,
      socialLinks: req.body.socialLinks ?? projects[idx].socialLinks,
      published: req.body.published ?? projects[idx].published,
    }
    projects[idx] = updated
    writeJSON(projectsFile, projects)
    res.json({
      ...updated,
      photos: updated.photos.map(ph => ({ ...ph, url: getPhotoUrl(ph) })),
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Delete project
app.delete('/api/admin/projects/:id', authMiddleware, (req, res) => {
  try {
    const projects = readJSON(projectsFile)
    const project = projects.find(p => p.id === req.params.id)
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' })

    // Delete uploaded photos (not static ones)
    project.photos.forEach(ph => {
      if (!ph.isStatic) deleteFile(ph.filename)
    })

    const filtered = projects.filter(p => p.id !== req.params.id)
    writeJSON(projectsFile, filtered)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Upload images
app.post('/api/admin/upload', authMiddleware, upload.array('photos', 20), (req, res) => {
  try {
    const files = req.files.map(f => ({
      filename: f.filename,
      url: `/uploads/${f.filename}`,
      isMain: false,
      isStatic: false,
    }))
    res.json(files)
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'upload' })
  }
})

// Delete a single uploaded image
app.delete('/api/admin/upload/:filename', authMiddleware, (req, res) => {
  const success = deleteFile(req.params.filename)
  if (success) {
    res.json({ success: true })
  } else {
    res.status(404).json({ error: 'Fichier non trouvé' })
  }
})

// Update settings
app.put('/api/admin/settings', authMiddleware, (req, res) => {
  try {
    const current = readJSON(settingsFile)
    const updated = { ...current, ...req.body }
    writeJSON(settingsFile, updated)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// --- Production: serve Vite build ---
if (process.env.NODE_ENV === 'production') {
  const distDir = path.join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`[API] Serveur démarré sur http://localhost:${PORT}`)
})
