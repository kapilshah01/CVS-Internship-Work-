import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ScrollReveal, { RevealItem } from '../components/ScrollReveal';
import AppointmentCalendar from '../components/AppointmentCalendar';
import { serviceCatalogService } from '../services/serviceCatalogService';
import { dbAddFeedback } from '../utils/db';
import { VISA_FEE_NATIONALITIES } from '../data/visaFeeSchedule';
import {
  COMPANY, TRUST_STATS, COUNTRIES, SERVICES,
  PROCESS_STEPS, WHY_CHOOSE_US, TEAM_MEMBERS, MILESTONES,
  TESTIMONIALS, FAQS, GALLERY_IMAGES,
} from '../data/siteData';

/* ========== Animated Counter ========== */
function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const end = value;
          const duration = 2000;
          const step = Math.max(1, Math.floor(end / (duration / 16)));
          const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(start);
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ========== Hero Background Slideshow ========== */
const heroImages = [
  '/images/destinations/shanghai-generated.png',
  '/images/destinations/great-wall-generated.png',
  '/images/destinations/forbidden-city.png',
  '/images/destinations/beijing-generated.png',
];

const mobileImageMap = {
  '/images/destinations/shanghai-generated.png': '/images/destinations/shanghai.png',
  '/images/destinations/great-wall-generated.png': '/images/destinations/great-wall.png',
  '/images/destinations/beijing-generated.png': '/images/destinations/beijing.png',
  '/images/destinations/tokyo-generated.png': '/images/destinations/tokyo.png',
  '/images/destinations/seoul-generated.png': '/images/destinations/seoul.png',
  '/images/destinations/mount-fuji-generated.png': '/images/destinations/mount-fuji.png',
};

const resolveImageForDevice = (src, isMobile) => (isMobile ? (mobileImageMap[src] || src) : src);
const visibleNationalities = VISA_FEE_NATIONALITIES.filter((item) => item !== 'Other Countries' && item !== 'Nepal');
const makeFlagDataUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const nationalityFlags = {
  Nepal: makeFlagDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#fff"/><path d="M22 8 L22 82 L54 82 L86 54 L58 54 L86 30 L54 30 L54 8 Z" fill="#dc143c" stroke="#1e3a8a" stroke-width="6" stroke-linejoin="round"/><circle cx="52" cy="22" r="6" fill="#fff"/><path d="M52 47a9 9 0 1 0 0.1 0Z" fill="#fff"/></svg>`),
  USA: makeFlagDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#fff"/><g fill="#b22234"><rect width="120" height="7"/><rect y="14" width="120" height="7"/><rect y="28" width="120" height="7"/><rect y="42" width="120" height="7"/><rect y="56" width="120" height="7"/><rect y="70" width="120" height="7"/><rect y="84" width="120" height="6"/></g><rect width="52" height="38" fill="#3c3b6e"/><g fill="#fff"><circle cx="8" cy="8" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="28" cy="8" r="2"/><circle cx="38" cy="8" r="2"/><circle cx="48" cy="8" r="2"/><circle cx="13" cy="16" r="2"/><circle cx="23" cy="16" r="2"/><circle cx="33" cy="16" r="2"/><circle cx="43" cy="16" r="2"/><circle cx="8" cy="24" r="2"/><circle cx="18" cy="24" r="2"/><circle cx="28" cy="24" r="2"/><circle cx="38" cy="24" r="2"/><circle cx="48" cy="24" r="2"/><circle cx="13" cy="32" r="2"/><circle cx="23" cy="32" r="2"/><circle cx="33" cy="32" r="2"/><circle cx="43" cy="32" r="2"/></g></svg>`),
  Canada: makeFlagDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#fff"/><rect width="24" height="90" fill="#d62828"/><rect x="96" width="24" height="90" fill="#d62828"/><path d="M60 18l5 12 11-4-5 11 12 3-12 4 6 11-12-4-5 13-5-13-12 4 6-11-12-4 12-3-5-11 11 4z" fill="#d62828"/></svg>`),
  Israel: makeFlagDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#fff"/><rect y="12" width="120" height="10" fill="#1d4ed8"/><rect y="68" width="120" height="10" fill="#1d4ed8"/><path d="M60 28l10 18H50z" fill="none" stroke="#1d4ed8" stroke-width="4"/><path d="M60 62L50 44h20z" fill="none" stroke="#1d4ed8" stroke-width="4"/></svg>`),
  Romania: makeFlagDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="40" height="90" fill="#1d4ed8"/><rect x="40" width="40" height="90" fill="#facc15"/><rect x="80" width="40" height="90" fill="#dc2626"/></svg>`),
  'Albania / Micronesia & BIH': makeFlagDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#e11d48"/><path d="M60 24l8 10 10-4-5 10 9 7-11 1-3 11-8-7-8 7-3-11-11-1 9-7-5-10 10 4z" fill="#111827"/></svg>`),
  Serbia: makeFlagDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="30" fill="#dc2626"/><rect y="30" width="120" height="30" fill="#1d4ed8"/><rect y="60" width="120" height="30" fill="#fff"/><rect x="24" y="22" width="14" height="22" rx="2" fill="#facc15"/></svg>`),
  Brazil: makeFlagDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#16a34a"/><path d="M60 16l38 29-38 29L22 45z" fill="#facc15"/><circle cx="60" cy="45" r="16" fill="#1d4ed8"/><path d="M46 43c10-6 20-6 28 0" fill="none" stroke="#fff" stroke-width="3"/></svg>`),
  Argentina: makeFlagDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="30" fill="#7dd3fc"/><rect y="30" width="120" height="30" fill="#fff"/><rect y="60" width="120" height="30" fill="#7dd3fc"/><circle cx="60" cy="45" r="7" fill="#f59e0b"/></svg>`),
  Panama: makeFlagDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="60" height="45" fill="#fff"/><rect x="60" width="60" height="45" fill="#dc2626"/><rect y="45" width="60" height="45" fill="#1d4ed8"/><rect x="60" y="45" width="60" height="45" fill="#fff"/><circle cx="30" cy="22" r="7" fill="#1d4ed8"/><circle cx="90" cy="67" r="7" fill="#dc2626"/></svg>`),
  Uruguay: makeFlagDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#fff"/><g fill="#60a5fa"><rect y="10" width="120" height="8"/><rect y="26" width="120" height="8"/><rect y="42" width="120" height="8"/><rect y="58" width="120" height="8"/><rect y="74" width="120" height="8"/></g><circle cx="22" cy="22" r="10" fill="#f59e0b"/></svg>`),
};
const normalizeServiceTitle = (value = '') => String(value)
  .normalize('NFKC')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

const dedupeServicesForDisplay = (items = []) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = normalizeServiceTitle(item.title) || String(item.description || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const DEFAULT_SERVICE_LOOKUP = new Map(
  SERVICES.map((service) => [normalizeServiceTitle(service.title), service])
);

const nationalityAccents = [
  { bar: 'linear-gradient(90deg, #d8b04c 0%, #f5df9a 50%, #d8b04c 100%)', badge: 'linear-gradient(135deg, rgba(216,176,76,0.28) 0%, rgba(23,50,77,0.12) 100%)', glow: 'rgba(216,176,76,0.16)' },
  { bar: 'linear-gradient(90deg, #6aa6d9 0%, #a8d4f2 50%, #6aa6d9 100%)', badge: 'linear-gradient(135deg, rgba(106,166,217,0.26) 0%, rgba(23,50,77,0.12) 100%)', glow: 'rgba(106,166,217,0.16)' },
  { bar: 'linear-gradient(90deg, #6fbf9f 0%, #b9ead7 50%, #6fbf9f 100%)', badge: 'linear-gradient(135deg, rgba(111,191,159,0.24) 0%, rgba(23,50,77,0.12) 100%)', glow: 'rgba(111,191,159,0.14)' },
  { bar: 'linear-gradient(90deg, #d98a6a 0%, #f1c3ab 50%, #d98a6a 100%)', badge: 'linear-gradient(135deg, rgba(217,138,106,0.24) 0%, rgba(23,50,77,0.12) 100%)', glow: 'rgba(217,138,106,0.14)' },
];

/* ========== Home Page ========== */
export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [services, setServices] = useState(SERVICES);
  const [feedbackForm, setFeedbackForm] = useState({ fullName: '', email: '', rating: 5, message: '' });
  const [feedbackState, setFeedbackState] = useState({ loading: false, error: '', success: '' });

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const sync = (event) => setIsMobile(event.matches);
    setIsMobile(media.matches);
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    let active = true;

    const loadServices = async () => {
      try {
        const rows = await serviceCatalogService.getAll({ active: true });
        if (!active || !rows?.length) return;
        setServices(rows.map((item) => ({
          id: item.id,
          icon: item.icon || '•',
          title: item.title,
          description: item.description,
        })));
      } catch {
        if (active) {
          setServices(SERVICES);
        }
      }
    };

    loadServices();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setServices((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      const seenTitles = new Set(
        current.map((item) => String(item?.title || '').trim().toLowerCase()).filter(Boolean)
      );

      const missingDefaults = SERVICES.filter((service) => {
        const titleKey = String(service.title || '').trim().toLowerCase();
        return titleKey && !seenTitles.has(titleKey);
      }).map((service, index) => ({
        id: service.id || `default-service-${index}`,
        ...service,
      }));

      if (missingDefaults.length === 0) return current;
      return [...current, ...missingDefaults];
    });
  }, []);

  const visibleHeroImages = isMobile ? heroImages.slice(0, 2) : heroImages;
  const visibleGalleryImages = isMobile ? GALLERY_IMAGES.slice(0, 4) : GALLERY_IMAGES;
  const activeHeroIndex = heroIdx % visibleHeroImages.length;

  const handleFeedbackChange = (key) => (event) => {
    setFeedbackForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    setFeedbackState({ loading: true, error: '', success: '' });
    try {
      await dbAddFeedback(feedbackForm);
      setFeedbackForm({ fullName: '', email: '', rating: 5, message: '' });
      setFeedbackState({ loading: false, error: '', success: 'Thank you for your feedback. We appreciate your time.' });
    } catch (error) {
      setFeedbackState({ loading: false, error: error.message || 'Failed to submit feedback.', success: '' });
    }
  };

  return (
    <main>
      {/* ===== 1. HERO ===== */}
      <section id="hero" className="hero" aria-label="Hero">
        <div className="hero__bg">
          {visibleHeroImages.map((src, i) => (
            <img
              key={src}
              src={resolveImageForDevice(src, isMobile)}
              alt=""
              className={`hero__bg-image ${i === activeHeroIndex ? 'hero__bg-image--active' : ''}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={i === 0 ? 'high' : 'auto'}
            />
          ))}
          <div className="hero__overlay"></div>
        </div>

        <motion.div
          className="hero__content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="hero__badge">
            ✦ Trusted Since {COMPANY.foundedYear}
          </div>
          <h1 className="hero__title">
            Pioneer in <span>China Visa</span> and Travel Documentation
          </h1>
          <p className="hero__subtitle">{COMPANY.description}</p>

          <div className="hero__cta">
            <a href="#contact" className="btn btn--primary btn--lg">Apply Now</a>
            <a href="#countries" className="btn btn--secondary btn--lg">Check Visa Requirements</a>
          </div>

          <div className="hero__trust">
            <div className="hero__trust-item">
              <span className="hero__trust-icon">🏆</span> Trusted Since {COMPANY.foundedYear}
            </div>
            <div className="hero__trust-item">
              <span className="hero__trust-icon">🛂</span> China Visa Specialists
            </div>
            <div className="hero__trust-item">
              <span className="hero__trust-icon">✓</span> Transparent Process
            </div>
          </div>
        </motion.div>

        <div className="hero__scroll-indicator" aria-hidden="true">
          <span>Scroll to explore</span>
          <span style={{ fontSize: '1.2rem' }}>↓</span>
        </div>
      </section>

      {/* ===== 2. TRUST STATS ===== */}
      <section className="section" aria-label="Trust statistics">
        <div className="container">
          <ScrollReveal>
            <div className="stats-grid">
              {TRUST_STATS.map((stat, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-card__value">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="stat-card__label">{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== 3. COUNTRIES WE SERVE ===== */}
      <section id="countries" className="section section--alt" aria-labelledby="countries-title">
        <div className="container">
          <ScrollReveal>
            <div className="section__header">
              <span className="section__label">Destinations</span>
              <h2 id="countries-title" className="section__title">Countries We Serve</h2>
              <p className="section__subtitle">
                We currently process China visa applications for the following applicant nationalities.
              </p>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <div
              style={{
                position: 'relative',
                marginBottom: '2.25rem',
                padding: '1.35rem',
                borderRadius: '28px',
                background: 'linear-gradient(135deg, rgba(18,31,52,0.96) 0%, rgba(34,46,64,0.94) 58%, rgba(49,55,58,0.92) 100%)',
                border: '1px solid rgba(201,168,76,0.2)',
                boxShadow: '0 24px 60px rgba(8, 15, 28, 0.26)',
                overflow: 'hidden',
              }}
            >
              <motion.div
                aria-hidden="true"
                animate={{ x: ['-10%', '8%', '-10%'], y: ['0%', '8%', '0%'], opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: '-60px',
                  right: '-40px',
                  width: '180px',
                  height: '180px',
                  borderRadius: '999px',
                  background: 'radial-gradient(circle, rgba(201,168,76,0.28) 0%, rgba(201,168,76,0) 72%)',
                }}
              />
              <motion.div
                aria-hidden="true"
                animate={{ x: ['0%', '12%', '0%'], y: ['0%', '-10%', '0%'], opacity: [0.45, 0.7, 0.45] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  bottom: '-70px',
                  left: '-50px',
                  width: '220px',
                  height: '220px',
                  borderRadius: '999px',
                  background: 'radial-gradient(circle, rgba(91,134,194,0.18) 0%, rgba(24,36,58,0) 72%)',
                }}
              />
              <motion.div
                aria-hidden="true"
                animate={{ x: ['0%', '18%', '0%'] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  inset: 'auto -10% 0 -10%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.55) 35%, rgba(255,255,255,0.08) 50%, rgba(201,168,76,0.55) 65%, transparent 100%)',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#d8b04c' }}>
                    Eligible Nationalities
                  </p>
                  <h3 style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.1rem, 2vw, 1.5rem)', color: '#f7f1e3', fontFamily: 'var(--font-heading)' }}>
                    Countries Currently Supported
                  </h3>
                </div>
                <div style={{ padding: '0.5rem 0.85rem', borderRadius: '999px', background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(244,236,216,0.95) 100%)', border: '1px solid rgba(201,168,76,0.24)', fontSize: '0.84rem', fontWeight: 700, color: '#17324d', position: 'relative', zIndex: 1, boxShadow: '0 10px 24px rgba(7, 14, 24, 0.18)' }}>
                  {visibleNationalities.length} Nationalities
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.9rem',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
              {visibleNationalities.map((item, index) => (
                (() => {
                  const accent = nationalityAccents[index % nationalityAccents.length];
                  return (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.42, delay: index * 0.05 }}
                  whileHover={{ y: -7, scale: 1.03, rotate: item.length % 2 === 0 ? -0.4 : 0.4, boxShadow: '0 18px 34px rgba(7, 14, 24, 0.28)' }}
                  style={{
                    padding: '1rem 1rem 0.95rem',
                    borderRadius: '20px',
                    border: '1px solid rgba(201,168,76,0.28)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,243,231,0.96) 100%)',
                    boxShadow: '0 14px 30px rgba(7, 14, 24, 0.18)',
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    color: '#1d2b40',
                    textAlign: 'center',
                    backdropFilter: 'blur(6px)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 14px 30px rgba(7, 14, 24, 0.18), inset 0 0 0 1px ${accent.glow}`,
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: '4px',
                      backgroundImage: `url("${nationalityFlags[item] || ''}")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                      opacity: 0.42,
                      filter: 'brightness(1.24) saturate(1.35) contrast(1.04) drop-shadow(0 10px 18px rgba(7, 14, 24, 0.04))',
                      pointerEvents: 'none',
                      borderRadius: '18px',
                      mixBlendMode: 'multiply',
                    }}
                  />
                  <div style={{ position: 'absolute', inset: '0 auto auto 0', width: '100%', height: '4px', background: accent.bar }} />
                  <div style={{ position: 'absolute', right: '-18px', bottom: '-18px', width: '72px', height: '72px', borderRadius: '999px', background: `radial-gradient(circle, ${accent.glow} 0%, rgba(255,255,255,0) 72%)` }} />
                  <div style={{ width: '42px', height: '42px', margin: '0 auto 0.7rem', borderRadius: '14px', display: 'grid', placeItems: 'center', background: accent.badge, color: '#17324d', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)', position: 'relative', zIndex: 1 }}>
                    {item.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>{item}</div>
                </motion.div>
                  );
                })()
              ))}
              </div>
            </div>
          </ScrollReveal>

          <div className="countries-grid">
            {COUNTRIES.map((country, i) => (
              <ScrollReveal key={country.id} delay={i * 0.1}>
                <div className={`country-card ${country.featured ? 'country-card--featured' : ''}`}>
                  <img
                    src={resolveImageForDevice(country.image, isMobile)}
                    alt={`${country.name} destination`}
                    className="country-card__image"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="country-card__flag" aria-hidden="true">{country.flag}</div>
                  <div className="country-card__overlay">
                    <h3 className="country-card__name">{country.name}</h3>
                    <p className="country-card__desc">{country.description}</p>
                    <div className="country-card__tags">
                      {country.visaTypes.map((type) => (
                        <span key={type} className="country-card__tag">{type}</span>
                      ))}
                    </div>
                    <div className="country-card__nationalities">
                      <p className="country-card__nationalities-label">Eligible Nationalities</p>
                      <div className="country-card__nationalities-list">
                        {(country.eligibleNationalities || []).map((nationality, index) => (
                          <span
                            key={`${country.id}-${nationality}`}
                            className="country-card__nationality"
                            style={{ '--country-delay': `${index * 90}ms` }}
                          >
                            {nationality}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. VISA SERVICES ===== */}
      <section id="services" className="section section--alt" aria-labelledby="services-title">
        <div className="container">
          <ScrollReveal>
            <div className="section__header">
              <span className="section__label">What We Offer</span>
              <h2 id="services-title" className="section__title">Our Visa Services</h2>
              <p className="section__subtitle">
                Comprehensive visa application support for all categories.
              </p>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <div className="services-grid">
            {services.map((service, i) => (
              <ScrollReveal key={service.id || service.title || i} delay={i * 0.08}>
                <div className="service-card">
                  <div className="service-card__icon">{service.icon}</div>
                  <h3 className="service-card__title">{service.title}</h3>
                  <p className="service-card__text">{service.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. HOW IT WORKS ===== */}
      <section id="process" className="section" aria-labelledby="process-title">
        <div className="container">
          <ScrollReveal>
            <div className="section__header">
              <span className="section__label">Process</span>
              <h2 id="process-title" className="section__title">How It Works</h2>
              <p className="section__subtitle">
                Our streamlined 5-step process ensures a smooth visa application experience.
              </p>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <div className="process-timeline">
            {PROCESS_STEPS.map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.12} variant="fadeLeft">
                <div className="process-step">
                  <div className="process-step__number">{step.icon}</div>
                  <div className="process-step__content">
                    <h3 className="process-step__title">{step.title}</h3>
                    <p className="process-step__text">{step.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. APPOINTMENT CALENDAR ===== */}
      <AppointmentCalendar />

      {/* ===== 7. WHY CHOOSE US ===== */}
      <section className="section section--dark" aria-labelledby="why-title">
        <div className="container">
          <ScrollReveal>
            <div className="section__header">
              <span className="section__label">Why Us</span>
              <h2 id="why-title" className="section__title">Why Choose Us</h2>
              <p className="section__subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>
                The pioneer in China visa services with a proven track record of excellence.
              </p>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <div className="features-grid">
            {WHY_CHOOSE_US.map((feature, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="feature-card">
                  <div className="feature-card__icon">{feature.icon}</div>
                  <h3 className="feature-card__title">{feature.title}</h3>
                  <p className="feature-card__text">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 8. FOUNDER MESSAGE ===== */}
      <section id="about" className="section" aria-labelledby="founder-title">
        <div className="container">
          <ScrollReveal>
            <div className="section__header">
              <span className="section__label">Leadership</span>
              <h2 id="founder-title" className="section__title">Founder's Message</h2>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" delay={0.15}>
            <div className="founder">
              <div className="founder__image" aria-label="Founder photo placeholder">
                👤
              </div>
              <div className="founder__content">
                <blockquote className="founder__quote">
                  "Our vision has always been to bridge the gap between Nepal and the world through seamless visa services.
                  Since 2066 B.S., we have helped thousands of individuals and businesses achieve their international travel goals.
                  We believe every journey begins with trust, and we are committed to being your most reliable visa partner."
                </blockquote>
                <p className="founder__name">Founder & Managing Director</p>
                <p className="founder__role">{COMPANY.name}</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== 9. PROFESSIONAL TEAM ===== */}
      <section className="section section--alt" aria-labelledby="team-title">
        <div className="container">
          <ScrollReveal>
            <div className="section__header">
              <span className="section__label">Our Team</span>
              <h2 id="team-title" className="section__title">Professional Team</h2>
              <p className="section__subtitle">
                Meet our dedicated team of visa documentation experts.
              </p>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <div className="team-grid">
            {TEAM_MEMBERS.map((member, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="team-card">
                  <div className="team-card__avatar">
                    {member.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <h3 className="team-card__name">{member.name}</h3>
                  <p className="team-card__role">{member.role}</p>
                  <p className="team-card__text">{member.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 10. COMPANY JOURNEY ===== */}
      <section className="section" aria-labelledby="journey-title">
        <div className="container">
          <ScrollReveal>
            <div className="section__header">
              <span className="section__label">Our Story</span>
              <h2 id="journey-title" className="section__title">Company Journey</h2>
              <p className="section__subtitle">
                From our founding to becoming the trusted name in visa services.
              </p>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <div className="journey-timeline">
            {MILESTONES.map((milestone, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="journey-item">
                  <div className="journey-item__year">{milestone.year}</div>
                  <h3 className="journey-item__title">{milestone.title}</h3>
                  <p className="journey-item__text">{milestone.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 11. DESTINATION GALLERY ===== */}
      <section
        id="gallery"
        className="section section--alt section--gallery-tight"
        aria-labelledby="gallery-title"
      >
        <div className="container">
          <ScrollReveal>
            <div className="section__header section__header--compact">
              <span className="section__label">Visual Journey</span>
              <h2 id="gallery-title" className="section__title">Destination Gallery</h2>
              <p className="section__subtitle">
                Explore breathtaking destinations awaiting your visit.
              </p>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <div className="gallery-grid">
            {visibleGalleryImages.map((img, i) => (
              <ScrollReveal key={i} delay={i * 0.06} variant="zoomIn">
                <div className="gallery-item">
                  <img
                    src={resolveImageForDevice(img.src, isMobile)}
                    alt={img.alt}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="gallery-item__overlay">
                    <div>
                      <div className="gallery-item__label">{img.alt}</div>
                      <div className="gallery-item__location">{img.location}</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 12. TESTIMONIALS ===== */}
      <section className="section" aria-labelledby="testimonials-title">
        <div className="container">
          <ScrollReveal>
            <div className="section__header">
              <span className="section__label">Reviews</span>
              <h2 id="testimonials-title" className="section__title">What Our Clients Say</h2>
              <p className="section__subtitle">
                Hear from our satisfied clients about their visa application experience.
              </p>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((review, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="testimonial-card">
                  <div className="testimonial-card__stars">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                  <p className="testimonial-card__text">{review.text}</p>
                  <div className="testimonial-card__author">
                    <div className="testimonial-card__avatar">
                      {review.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="testimonial-card__name">{review.name}</div>
                      <div className="testimonial-card__role">{review.role}</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="feedback-title" style={{ paddingTop: '2.25rem', paddingBottom: '2.25rem' }}>
        <div className="container">
          <ScrollReveal>
            <div className="section__header" style={{ marginBottom: '1rem' }}>
              <span className="section__label">Feedback</span>
              <h2 id="feedback-title" className="section__title" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', marginBottom: '0.45rem' }}>Share Your Experience</h2>
              <p className="section__subtitle" style={{ maxWidth: '520px' }}>
                Tell us how your experience was so we can keep improving our service.
              </p>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="dashboard__panel" style={{ maxWidth: '560px', margin: '0 auto', padding: '1rem 1rem 0.9rem' }}>
              {feedbackState.error && <div className="form-error" style={{ marginBottom: '1rem' }}>{feedbackState.error}</div>}
              {feedbackState.success && (
                <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  {feedbackState.success}
                </div>
              )}

              <form onSubmit={handleFeedbackSubmit}>
                <div className="form-row" style={{ gap: '0.65rem', marginBottom: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="feedback-name">Full Name</label>
                    <input className="form-input" id="feedback-name" value={feedbackForm.fullName} onChange={handleFeedbackChange('fullName')} required style={{ padding: '0.55rem 0.75rem' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="feedback-email">Email</label>
                    <input className="form-input" id="feedback-email" type="email" value={feedbackForm.email} onChange={handleFeedbackChange('email')} required style={{ padding: '0.55rem 0.75rem' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label className="form-label" htmlFor="feedback-rating">Rating</label>
                  <div id="feedback-rating" style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', fontSize: '2rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackForm((prev) => ({ ...prev, rating: star }))}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '0.1rem',
                          cursor: 'pointer',
                          lineHeight: 1,
                          fontSize: '2.4rem',
                          color: star <= Number(feedbackForm.rating) ? '#D4AF37' : '#CBD5E1',
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="feedback-message">Feedback</label>
                  <textarea
                    className="form-textarea"
                    id="feedback-message"
                    value={feedbackForm.message}
                    onChange={handleFeedbackChange('message')}
                    placeholder="Share what went well or what we should improve..."
                    style={{ minHeight: '78px', padding: '0.65rem 0.75rem' }}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn--primary" disabled={feedbackState.loading} style={{ padding: '0.7rem 1rem' }}>
                  {feedbackState.loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== 13. FAQ ===== */}
      <section id="faq" className="section section--alt" aria-labelledby="faq-title">
        <div className="container">
          <ScrollReveal>
            <div className="section__header">
              <span className="section__label">FAQ</span>
              <h2 id="faq-title" className="section__title">Frequently Asked Questions</h2>
              <p className="section__subtitle">
                Find answers to the most common questions about our visa services.
              </p>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <ScrollReveal key={i} delay={i * 0.05}>
                <div className="faq-item">
                  <button
                    className="faq-item__question"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{faq.question}</span>
                    <span className={`faq-item__icon ${openFaq === i ? 'faq-item__icon--open' : ''}`}>+</span>
                  </button>
                  <div className={`faq-item__answer ${openFaq === i ? 'faq-item__answer--open' : ''}`}>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 14. CONTACT ===== */}
      <section id="contact" className="section" aria-labelledby="contact-title">
        <div className="container">
          <ScrollReveal>
            <div className="section__header">
              <span className="section__label">Get In Touch</span>
              <h2 id="contact-title" className="section__title">Contact Us</h2>
              <p className="section__subtitle">
                Ready to start your visa application? Contact our team today.
              </p>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="contact-grid">
              <div className="contact-info">
                <div className="contact-item">
                  <div className="contact-item__icon">📍</div>
                  <div>
                    <div className="contact-item__label">Office Address</div>
                    <div className="contact-item__text">{COMPANY.address}</div>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-item__icon">📞</div>
                  <div>
                    <div className="contact-item__label">Phone</div>
                    <div className="contact-item__text">{COMPANY.phone}</div>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-item__icon">✉️</div>
                  <div>
                    <div className="contact-item__label">Email</div>
                    <div className="contact-item__text">{COMPANY.email}</div>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-item__icon">🕐</div>
                  <div>
                    <div className="contact-item__label">Office Hours</div>
                    <div className="contact-item__text">{COMPANY.officeHours}</div>
                  </div>
                </div>

                <div className="contact-map">
                  <iframe
                    className="contact-map__frame"
                    title="China Visa Service office location"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(COMPANY.address)}&z=16&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
