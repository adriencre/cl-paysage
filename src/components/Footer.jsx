import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-brand-header">
              <img src="/images/logo.png" alt="CL Paysage" className="footer-logo-img" />
              <div className="footer-brand-name">
                CL <span>Paysage</span>
              </div>
            </div>
            <p>
              Conception et aménagement de jardins d'exception.
              Nous transformons vos extérieurs en espaces de vie uniques.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Navigation</h4>
            <div className="footer-links">
              <Link to="/">Accueil</Link>
              <Link to="/realisations">Réalisations</Link>
              <Link to="/services">Services</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Contact</h4>
            <div className="footer-links">
              <a href="tel:+33600000000">06 00 00 00 00</a>
              <a href="mailto:contact@clpaysage.fr">contact@clpaysage.fr</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {year} CL Paysage. Tous droits réservés.</p>
          <p>Site réalisé avec passion</p>
        </div>
      </div>
    </footer>
  )
}
