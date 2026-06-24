import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_LINKS, COMPANY } from '../data/siteData';
import { scrollToElement } from '../utils/scroll';

export default function Navbar({ onToggleDarkMode, isDark, user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleNavClick = (e, href) => {
    if (isHome && href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        const navbarHeight = document.querySelector('.navbar')?.offsetHeight ?? 72;
        scrollToElement(el, { duration: 280, offset: navbarHeight });
      }
      setMenuOpen(false);
    }
  };

  const portalLink = user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';

  return (
    <>
      <nav
        className={`navbar ${scrolled || !isHome ? 'navbar--solid' : 'navbar--transparent'}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="navbar__inner">
          <Link to="/" className="navbar__logo" aria-label={COMPANY.shortName}>
            <span className="navbar__logo-icon">CV</span>
            <span>{COMPANY.shortName}</span>
          </Link>

          <div className="navbar__links">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={isHome ? link.href : `/${link.href}`}
                className="navbar__link"
                onClick={(e) => handleNavClick(e, link.href)}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="navbar__actions">
            <button
              className="dark-toggle"
              onClick={onToggleDarkMode}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {user ? (
              <>
                <Link to={portalLink} className="btn btn--sm btn--outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
                  Dashboard
                </Link>
                <button
                  type="button"
                  className="btn btn--sm btn--outline"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
                  onClick={onLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/employee/login" className="btn btn--sm btn--outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
                Staff Login
              </Link>
            )}

            <button
              className={`navbar__toggle ${menuOpen ? 'navbar__toggle--active' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`} role="dialog" aria-label="Mobile menu">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={isHome ? link.href : `/${link.href}`}
            className="mobile-menu__link"
            onClick={(e) => handleNavClick(e, link.href)}
          >
            {link.label}
          </a>
        ))}
        {user ? (
          <>
            <Link to={portalLink} className="btn btn--primary btn--lg" onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
            <button
              type="button"
              className="btn btn--outline btn--lg"
              onClick={() => {
                setMenuOpen(false);
                onLogout?.();
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/employee/login" className="btn btn--primary btn--lg" onClick={() => setMenuOpen(false)}>
            Staff Login
          </Link>
        )}
      </div>
    </>
  );
}
