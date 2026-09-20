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
  deletePhoto,
  saveContactMessage
} from './storage.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const publicDir = path.join(__dirname, '..', 'public')

// Middleware
app.use(cors())
app.use(express.json({ limit: '6mb' }))
app.use(express.urlencoded({ extended: true, limit: '6mb' }))
app.use('/uploads', express.static(path.join(publicDir, 'uploads')))

function formatPhoto(photo) {
  if (photo.isStatic) return { ...photo, url: `/images/${photo.filename}` }
  return { ...photo, url: photo.url || `/api/photos/${photo.filename}` }
}

// Router to support /api, /.netlify/functions/api, and direct routing
const router = express.Router()

// Get all published projects
router.get('/projects', async (req, res) => {
  try {
    const projects = await getProjects()
    const published = (projects || [])
      .filter(p => p.published)
      .map(p => ({
        ...p,
        photos: (p.photos || []).map(formatPhoto),
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json(published)
  } catch (err) {
    console.error('Error fetching projects:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Get a single project
router.get('/projects/:id', async (req, res) => {
  try {
    const projects = await getProjects()
    const project = (projects || []).find(p => p.id === req.params.id)
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' })

    const enriched = {
      ...project,
      photos: (project.photos || []).map(formatPhoto),
    }

    const published = (projects || [])
      .filter(p => p.published)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const idx = published.findIndex(p => p.id === project.id)
    const prev = idx > 0 ? { id: published[idx - 1].id, title: published[idx - 1].title } : null
    const next = idx < published.length - 1 ? { id: published[idx + 1].id, title: published[idx + 1].title } : null

    res.json({ project: enriched, prev, next })
  } catch (err) {
    console.error('Error fetching project:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Serve photo blob (supports both /photos/:filename and /uploads/:filename)
router.get(['/photos/:filename', '/uploads/:filename'], async (req, res) => {
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
    const settings = await getSettings()
    res.json(settings)
  } catch (err) {
    console.error('Error fetching settings:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Contact form submission
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, type, message } = req.body || {}
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Champs obligatoires manquants (nom, email, message)' })
    }
    const saved = await saveContactMessage({ name, email, phone, type, message })
    console.log(`[Contact] Nouveau message reçu de ${name} (${email})`)
    res.json({ success: true, message: 'Message reçu avec succès', data: saved })
  } catch (err) {
    console.error('Contact error:', err)
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' })
  }
})

// Login
router.post('/admin/login', (req, res) => {
  try {
    const { password } = req.body || {}
    const token = login(password)
    if (token) {
      res.json({ token })
    } else {
      res.status(401).json({ error: 'Mot de passe incorrect' })
    }
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Verify admin token
router.get('/admin/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user })
})

// Get all admin projects
router.get('/admin/projects', authMiddleware, async (req, res) => {
  try {
    const projects = await getProjects()
    const mapped = (projects || [])
      .map(p => ({
        ...p,
        photos: (p.photos || []).map(formatPhoto),
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json(mapped)
  } catch (err) {
    console.error('Admin projects error:', err)
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
    const saveResult = await saveProjects(projects)
    res.status(201).json({ ...newProject, _persisted: saveResult.persisted })
  } catch (err) {
    console.error('Create project error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Update project
router.put('/admin/projects/:id', authMiddleware, async (req, res) => {
  try {
    const projects = await getProjects()
    const idx = (projects || []).findIndex(p => p.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Projet non trouvé' })

    const updated = {
      ...projects[idx],
      ...req.body,
      id: projects[idx].id,
      updatedAt: new Date().toISOString(),
    }
    projects[idx] = updated
    const saveResult = await saveProjects(projects)
    res.json({ ...updated, _persisted: saveResult.persisted })
  } catch (err) {
    console.error('Update project error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Delete project
router.delete('/admin/projects/:id', authMiddleware, async (req, res) => {
  try {
    const projects = await getProjects()
    const project = (projects || []).find(p => p.id === req.params.id)
    if (!project) return res.status(404).json({ error: 'Projet non trouvé' })

    for (const ph of project.photos || []) {
      if (!ph.isStatic && ph.filename) {
        await deletePhoto(ph.filename)
      }
    }

    const filtered = projects.filter(p => p.id !== req.params.id)
    const saveResult = await saveProjects(filtered)
    res.json({ success: true, _persisted: saveResult.persisted })
  } catch (err) {
    console.error('Delete project error:', err)
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

// Delete uploaded photo (#18)
router.delete('/admin/upload/:filename', authMiddleware, async (req, res) => {
  try {
    await deletePhoto(req.params.filename)
    res.json({ success: true })
  } catch (err) {
    console.error('Delete photo error:', err)
    res.status(500).json({ error: 'Erreur suppression' })
  }
})

// Update settings — deep merge for nested objects
router.put('/admin/settings', authMiddleware, async (req, res) => {
  try {
    const current = await getSettings()
    const updated = {
      ...current,
      ...req.body,
      branding: { ...(current.branding || {}), ...(req.body.branding || {}) },
      hero: { ...(current.hero || {}), ...(req.body.hero || {}) },
      socialLinks: { ...(current.socialLinks || {}), ...(req.body.socialLinks || {}) },
    }
    const saveResult = await saveSettings(updated)
    res.json({ ...updated, _persisted: saveResult.persisted })
  } catch (err) {
    console.error('Settings error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Multer error handler (#15)
router.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fichier trop volumineux (max 20 Mo)' })
  }
  if (err && err.message && err.message.includes('Format non supporté')) {
    return res.status(400).json({ error: err.message })
  }
  next(err)
})

// Mount router on all path representations
app.use('/api', router)
app.use('/.netlify/functions/api', router)
app.use('/', router)

export default app
