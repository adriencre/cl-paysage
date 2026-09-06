import { useState } from 'react'
import './Login.css'

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('admin_token', data.token)
        onLogin(data.token)
      } else {
        setError(data.error || 'Mot de passe incorrect')
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login" id="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <img src="/images/logo.png" alt="CL Paysage" className="admin-login-logo-img" />
          <div className="admin-login-logo">CL <span>Paysage</span></div>
        </div>
        <p className="admin-login-sub">Espace d'administration</p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {error && <div className="admin-login-error">{error}</div>}

          <div>
            <label htmlFor="admin-password">Mot de passe</label>
            <input
              type="password"
              id="admin-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez le mot de passe"
              autoFocus
              required
            />
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
