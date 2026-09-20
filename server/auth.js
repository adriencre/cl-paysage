import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'cl-paysage-admin-secret-key-2026'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'clpaysage2026'

// Warn at startup if using default credentials in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[AUTH] ⚠ Using default JWT_SECRET — set JWT_SECRET env variable for production!')
}
if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
  console.warn('[AUTH] ⚠ Using default ADMIN_PASSWORD — set ADMIN_PASSWORD env variable for production!')
}

export function login(password) {
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '30d' })
    return token
  }
  return null
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' })
  }

  try {
    jwt.verify(token, JWT_SECRET)
    return next()
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}
