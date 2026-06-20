import { COMPANY, NAV_LINKS } from '../data/siteData';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div>
            <div className="navbar__logo" style={{ marginBottom: '0.5rem' }}>
              <span className="navbar__logo-icon">CV</span>
              <span>{COMPANY.shortName}</span>
            </div>
            <p className="footer__brand-desc">{COMPANY.description}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer__heading">Quick Links</h4>
            {NAV_LINKS.slice(0, 6).map((link) => (
              <a key={link.href} href={link.href} className="footer__link">{link.label}</a>
            ))}
          </div>

          {/* Services */}
          <div>
            <h4 className="footer__heading">Services</h4>
            <span className="footer__link">Tourist Visa</span>
            <span className="footer__link">Business Visa</span>
            <span className="footer__link">Student Visa</span>
            <span className="footer__link">Family Reunion</span>
            <span className="footer__link">Transit Visa</span>
          </div>

          {/* Contact */}
          <div>
            <h4 className="footer__heading">Contact Us</h4>
            <span className="footer__link">📍 {COMPANY.address}</span>
            <span className="footer__link">📞 {COMPANY.phone}</span>
            <span className="footer__link">✉️ {COMPANY.email}</span>
            <span className="footer__link">🕐 {COMPANY.officeHours}</span>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/login" className="btn btn--sm btn--outline" style={{ borderColor: 'var(--color-accent)' }}>
                Client Portal →
              </Link>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </p>
          <div className="footer__social">
            <a href="#" className="footer__social-link" aria-label="Facebook">f</a>
            <a href="#" className="footer__social-link" aria-label="Instagram">📷</a>
            <a href="#" className="footer__social-link" aria-label="LinkedIn">in</a>
            <a href="#" className="footer__social-link" aria-label="Twitter">𝕏</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
