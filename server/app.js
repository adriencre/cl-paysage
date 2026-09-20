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
  getContactMessages,
  saveContactMessage,
  updateContactMessage,
  deleteContactMessage
} from './storage.js'

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
const app = express()
const publicDir = path.join(rootDir, 'public')

// Middleware
app.use(cors())
app.use(express.json({ limit: '6mb' }))
app.use(express.urlencoded({ extended: true, limit: '6mb' }))
app.use('/uploads', express.static(path.join(publicDir, 'uploads')))

// Global request logger
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[API ${req.method}] ${req.originalUrl || req.url} -> ${res.statusCode} (${duration}ms)`)
  })
  next()
})

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
    const { id, name, email, phone, type, message } = req.body || {}
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Champs obligatoires manquants (nom, email, message)' })
    }
    const saved = await saveContactMessage({ id, name, email, phone, type, message })
    console.log(`[Contact] ✉️ Nouveau message reçu de ${name} (${email}) - ID: ${saved.id}`)
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
      console.log('[API Auth] 🔑 Connexion admin RÉUSSIE')
      res.json({ token })
    } else {
      console.warn('[API Auth] ❌ Échec de connexion admin (mot de passe incorrect)')
      res.status(401).json({ error: 'Mot de passe incorrect' })
    }
  } catch (err) {
    console.error('[API Auth] Erreur serveur:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Verify admin token
router.get('/admin/verify', authMiddleware, (req, res) => {
  console.log('[API Auth] 🛡️ Token admin vérifié avec succès')
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
    console.log(`[API Projects] 📋 ${mapped.length} projets admin chargés`)
    res.json(mapped)
  } catch (err) {
    console.error('[API Projects] Erreur chargement admin:', err)
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
    console.log(`[API Projects] ➕ Projet créé: "${newProject.title}" (id: ${newProject.id}, mode: ${saveResult.storage})`)
    res.status(201).json({ ...newProject, _persisted: saveResult.persisted })
  } catch (err) {
    console.error('[API Projects] Create error:', err)
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
    console.log(`[API Projects] ✏️ Projet mis à jour: "${updated.title}" (id: ${updated.id}, mode: ${saveResult.storage})`)
    res.json({ ...updated, _persisted: saveResult.persisted })
  } catch (err) {
    console.error('[API Projects] Update error:', err)
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
    console.log(`[API Projects] 🗑️ Projet supprimé: "${project.title}" (id: ${req.params.id})`)
    res.json({ success: true, _persisted: saveResult.persisted })
  } catch (err) {
    console.error('[API Projects] Delete error:', err)
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
    console.log(`[API Upload] 📷 ${results.length} photo(s) téléversée(s) avec succès`)
    res.json(results)
  } catch (err) {
    console.error('[API Upload] Upload error:', err)
    res.status(500).json({ error: 'Erreur upload' })
  }
})

// Delete uploaded photo (#18)
router.delete('/admin/upload/:filename', authMiddleware, async (req, res) => {
  try {
    await deletePhoto(req.params.filename)
    console.log(`[API Upload] 🗑️ Photo supprimée: ${req.params.filename}`)
    res.json({ success: true })
  } catch (err) {
    console.error('[API Upload] Delete photo error:', err)
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
    console.log(`[API Settings] ⚙️ Paramètres enregistrés avec succès ! (stockage: ${saveResult.storage}, persisté: ${saveResult.persisted})`)
    res.json({ ...updated, _persisted: saveResult.persisted })
  } catch (err) {
    console.error('[API Settings] Settings error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// --- Admin Contacts / Messagerie ---

// Get all contact messages (Admin)
router.get('/admin/contacts', authMiddleware, async (req, res) => {
  try {
    const contacts = await getContactMessages()
    const sorted = [...(contacts || [])].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.receivedAt || 0)
      const dateB = new Date(b.createdAt || b.receivedAt || 0)
      return dateB - dateA
    })
    console.log(`[API Contacts] 📬 ${sorted.length} message(s) chargé(s) pour l'admin`)
    res.json(sorted)
  } catch (err) {
    console.error('[API Contacts] Erreur lecture:', err)
    res.status(500).json({ error: 'Erreur serveur lors de la lecture des messages' })
  }
})

// Update contact message (Admin - status, notes, etc.)
router.put('/admin/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const { status, notes } = req.body || {}
    const updated = await updateContactMessage(req.params.id, {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    })

    if (!updated) {
      return res.status(404).json({ error: 'Message non trouvé' })
    }

    console.log(`[API Contacts] ✏️ Message ${req.params.id} mis à jour (statut: ${updated.status})`)
    res.json(updated)
  } catch (err) {
    console.error('[API Contacts] Erreur mise à jour:', err)
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du message' })
  }
})

// Delete contact message (Admin)
router.delete('/admin/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const success = await deleteContactMessage(req.params.id)
    if (!success) {
      return res.status(404).json({ error: 'Message non trouvé' })
    }
    console.log(`[API Contacts] 🗑️ Message supprimé: ${req.params.id}`)
    res.json({ success: true })
  } catch (err) {
    console.error('[API Contacts] Erreur suppression:', err)
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du message' })
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
