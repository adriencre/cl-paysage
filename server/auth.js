import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'cl-paysage-admin-secret-key-2026'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'clpaysage2026'

export function login(password) {
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
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
  try {
    jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' })
  }
}
