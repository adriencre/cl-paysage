import { createClient } from '@supabase/supabase-js'
import defaultProjects from '../../data/projects.json'
import defaultSettings from '../../data/settings.json'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

if (isSupabaseConfigured) {
  console.log('%c[Supabase] 🚀 Connecté avec succès ! Synchronisation Cloud active.', 'color: #3ecf8e; font-weight: bold;')
} else {
  console.log('%c[Supabase] ℹ️ Supabase non configuré (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY absents). Mode local/serveur actif.', 'color: #f59e0b;')
}

// --- Upload d'image direct vers Supabase Storage (CDN public mondial) ---
export async function uploadPhotoToSupabase(file) {
  if (!supabase) throw new Error('Supabase non configuré')

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
  const filePath = `uploads/${filename}`

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    })

  if (error) {
    console.error('[Supabase Storage Error]:', error)
    throw error
  }

  const { data: publicData } = supabase.storage
    .from('photos')
    .getPublicUrl(filePath)

  console.log(`%c[Supabase Storage] 📷 Photo téléversée avec succès sur le CDN:`, 'color: #3ecf8e;', publicData.publicUrl)
  return publicData.publicUrl
}

// --- Paramètres du site (Settings) ---
export async function fetchSettingsFromSupabase() {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', 1)
      .maybeSingle()

    if (error) {
      console.warn('[Supabase Settings] Erreur lecture:', error.message)
      return null
    }

    if (data && data.data) {
      return {
        ...defaultSettings,
        ...data.data,
        branding: { ...(defaultSettings.branding || {}), ...(data.data.branding || {}) },
        hero: { ...(defaultSettings.hero || {}), ...(data.data.hero || {}) },
        socialLinks: { ...(defaultSettings.socialLinks || {}), ...(data.data.socialLinks || {}) },
      }
    }
  } catch (err) {
    console.warn('[Supabase Settings] Exception:', err)
  }

  return null
}

export async function saveSettingsToSupabase(settingsData) {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        id: 1,
        data: settingsData,
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('[Supabase Settings] Erreur sauvegarde:', error.message)
      return false
    }

    console.log('%c[Supabase Settings] 💾 Paramètres sauvegardés dans PostgreSQL avec succès !', 'color: #3ecf8e; font-weight: bold;')
    return true
  } catch (err) {
    console.error('[Supabase Settings] Erreur:', err)
    return false
  }
}

// --- Projets / Réalisations ---
export async function fetchProjectsFromSupabase() {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[Supabase Projects] Erreur lecture:', error.message)
      return null
    }

    if (Array.isArray(data)) {
      // Si la table projects est vide dans Supabase, on la peuple automatiquement avec les 4 projets par défaut
      if (data.length === 0 && defaultProjects && defaultProjects.length > 0) {
        console.log('%c[Supabase Projects] 🔄 Table "projects" vide dans Supabase, initialisation automatique des réalisations par défaut...', 'color: #3b82f6; font-weight: bold;')
        try {
          const rowsToInsert = defaultProjects.map(p => ({
            id: p.id,
            title: p.title || 'Sans titre',
            description: p.description || '',
            category: p.category || 'autre',
            location: p.location || '',
            date: p.date || '',
            photos: p.photos || [],
            social_links: p.socialLinks || {},
            published: p.published ?? true,
            created_at: p.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
          const { data: inserted, error: insertError } = await supabase
            .from('projects')
            .upsert(rowsToInsert)
            .select()

          if (!insertError && inserted && inserted.length > 0) {
            console.log(`%c[Supabase Projects] ✅ ${inserted.length} projets insérés avec succès dans Supabase !`, 'color: #3ecf8e; font-weight: bold;')
            return inserted.map(p => ({
              id: p.id,
              title: p.title,
              description: p.description || '',
              category: p.category || 'autre',
              location: p.location || '',
              date: p.date || '',
              photos: p.photos || [],
              socialLinks: p.social_links || {},
              published: Boolean(p.published),
              createdAt: p.created_at,
              updatedAt: p.updated_at,
            }))
          }
        } catch (seedErr) {
          console.warn('[Supabase Projects] Auto-seed error:', seedErr)
        }
      }

      return data.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description || '',
        category: p.category || 'autre',
        location: p.location || '',
        date: p.date || '',
        photos: p.photos || [],
        socialLinks: p.social_links || {},
        published: Boolean(p.published),
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))
    }
  } catch (err) {
    console.warn('[Supabase Projects] Exception:', err)
  }

  return null
}

export async function saveProjectToSupabase(projectData, isEdit = false, id = null) {
  if (!supabase) return null

  const rowId = id || projectData.id || `proj_${Date.now()}`
  const row = {
    id: rowId,
    title: projectData.title || 'Sans titre',
    description: projectData.description || '',
    category: projectData.category || 'autre',
    location: projectData.location || '',
    date: projectData.date || '',
    photos: projectData.photos || [],
    social_links: projectData.socialLinks || {},
    published: projectData.published ?? true,
    updated_at: new Date().toISOString(),
  }

  if (!isEdit) {
    row.created_at = new Date().toISOString()
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .upsert(row)
      .select()

    if (error) {
      console.error('[Supabase Projects] Erreur sauvegarde:', error.message)
      return false
    }

    console.log('%c[Supabase Projects] 💾 Projet enregistré dans PostgreSQL:', 'color: #3ecf8e; font-weight: bold;', row.title)
    return row
  } catch (err) {
    console.error('[Supabase Projects] Erreur:', err)
    return false
  }
}

export async function deleteProjectFromSupabase(id) {
  if (!supabase) return null

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Supabase Projects] Erreur suppression:', error.message)
      return false
    }

    console.log('%c[Supabase Projects] 🗑️ Projet supprimé de PostgreSQL:', 'color: #3ecf8e;', id)
    return true
  } catch (err) {
    console.error('[Supabase Projects] Erreur:', err)
    return false
  }
}
