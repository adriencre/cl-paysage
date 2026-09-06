import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { login, authMiddleware } from './auth.js'
import { upload } from './uploads.js'
import {
  getProjects,
  saveProjects,
  getSettings,
  saveSettings,
  savePhoto,
  getPhoto,
  deletePhoto
} from './storage.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const publicDir = path.join(__dirname, '..', 'public')

// Middleware
app.use(cors())
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))
app.use('/uploads', express.static(path.join(publicDir, 'uploads')))

function formatPhoto(photo) {
  if (photo.isStatic) return { ...photo, url: `/images/${photo.filename}` }
  return { ...photo, url: photo.url || `/api/photos/${photo.filename}` }
}

// Router to support both /api and /.netlify/functions/api
const router = express.Router()

// Get all published projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await getProjects()
    const published = projects
      .filter(p => p.published)
      .map(p => ({
        ...p,
        photos: (p.photos || []).map(formatPhoto),
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json(published)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Get a single project
router.get('/projects/:id', async (req, res) => {
  try {
    const projects = await getProjects()
    const project = projects.find(p => p.id === req.params.id)
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' })

    const enriched = {
      ...project,
      photos: (project.photos || []).map(formatPhoto),
    }

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

// Serve photo blob
router.get('/photos/:filename', async (req, res) => {
  try {
    const photo = await getPhoto(req.params.filename)
    if (!photo) return res.status(404).send('Photo non trouvée')
    res.setHeader('Content-Type', photo.contentType || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(photo.buffer)
  } catch (err) {
    res.status(500).send('Erreur')
  }
})

// Get settings
router.get('/settings', async (req, res) => {
  try {
    res.json(await getSettings())
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Login
router.post('/admin/login', (req, res) => {
  const { password } = req.body
  const token = login(password)
  if (token) {
    res.json({ token })
  } else {
    res.status(401).json({ error: 'Mot de passe incorrect' })
  }
})

// Get all admin projects
router.get('/admin/projects', authMiddleware, async (req, res) => {
  try {
    const projects = await getProjects()
    const mapped = projects
      .map(p => ({
        ...p,
        photos: (p.photos || []).map(formatPhoto),
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json(mapped)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Create project
router.post('/admin/projects', authMiddleware, async (req, res) => {
  try {
    const projects = await getProjects()
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
      updatedAt: new Date().toISOString(),
    }
    projects.push(newProject)
    await saveProjects(projects)
    res.status(201).json(newProject)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Update project
router.put('/admin/projects/:id', authMiddleware, async (req, res) => {
  try {
    const projects = await getProjects()
    const idx = projects.findIndex(p => p.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Projet non trouvé' })

    const updated = {
      ...projects[idx],
      ...req.body,
      id: projects[idx].id,
      updatedAt: new Date().toISOString(),
    }
    projects[idx] = updated
    await saveProjects(projects)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Delete project
router.delete('/admin/projects/:id', authMiddleware, async (req, res) => {
  try {
    const projects = await getProjects()
    const project = projects.find(p => p.id === req.params.id)
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' })

    for (const ph of project.photos || []) {
      if (!ph.isStatic && ph.filename) {
        await deletePhoto(ph.filename)
      }
    }

    const filtered = projects.filter(p => p.id !== req.params.id)
    await saveProjects(filtered)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Upload photos
router.post('/admin/upload', authMiddleware, upload.array('photos', 20), async (req, res) => {
  try {
    const results = []
    for (const file of req.files || []) {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
      const filename = uuidv4() + ext
      const url = await savePhoto(filename, file.buffer, file.mimetype)
      results.push({
        filename,
        url,
        isMain: false,
        isStatic: false,
      })
    }
    res.json(results)
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: 'Erreur upload' })
  }
})

// Update settings
router.put('/admin/settings', authMiddleware, async (req, res) => {
  try {
    const current = await getSettings()
    const updated = { ...current, ...req.body }
    await saveSettings(updated)
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

app.use('/api', router)
app.use('/.netlify/functions/api', router)

// Production static file serving if not in serverless
if (process.env.NODE_ENV === 'production' && !process.env.NETLIFY) {
  const distDir = path.join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

// Only listen when run directly (not serverless)
if (!process.env.NETLIFY) {
  app.listen(PORT, () => {
    console.log(`[API] Serveur démarré sur http://localhost:${PORT}`)
  })
}

export default app
