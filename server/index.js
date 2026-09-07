import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import app from './app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001

// Production static file serving if run directly via Node (not serverless)
if (process.env.NODE_ENV === 'production' && !process.env.NETLIFY) {
  const distDir = path.join(__dirname, '..', 'dist')
  app.use(express.static(distDir))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`[API] Serveur démarré sur http://localhost:${PORT}`)
})

export default app
