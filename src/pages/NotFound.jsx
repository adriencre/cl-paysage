import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '4rem 1.5rem',
      backgroundColor: 'var(--c-beige, #F5F0E8)'
    }}>
      <span style={{
        fontFamily: 'var(--f-body)',
        fontSize: '0.9rem',
        fontWeight: 600,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'var(--c-olive, #4A5D3A)',
        marginBottom: '1rem'
      }}>
        Erreur 404
      </span>
      <h1 style={{
        fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
        marginBottom: '1.25rem',
        color: 'var(--c-anthracite, #2C2C2C)'
      }}>
        Page introuvable
      </h1>
      <p style={{
        fontSize: '1.1rem',
        color: '#666',
        maxWidth: '480px',
        marginBottom: '2.5rem',
        lineHeight: 1.6
      }}>
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn btn-primary">
          Retour à l'accueil
        </Link>
        <Link to="/contact" className="btn btn-outline">
          Nous contacter
        </Link>
      </div>
    </div>
  )
}
