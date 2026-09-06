import multer from 'multer'
import path from 'path'

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.avif']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Format non supporté. Utilisez JPG, PNG ou WebP.'), false)
  }
}

// Memory storage works everywhere (local Node.js and Serverless Netlify Functions)
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
})
