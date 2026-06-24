import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ScrollReveal, { RevealItem } from '../components/ScrollReveal';
import AppointmentCalendar from '../components/AppointmentCalendar';
import { serviceCatalogService } from '../services/serviceCatalogService';
import { dbAddFeedback } from '../utils/db';
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
                We provide expert visa processing services exclusively for these countries.
                China visa application is our flagship specialty.
              </p>
              <div className="gold-line"></div>
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
                  <div className="country-card__overlay">
                    <h3 className="country-card__name">{country.name}</h3>
                    <p className="country-card__desc">{country.description}</p>
                    <div className="country-card__tags">
                      {country.visaTypes.map((type) => (
                        <span key={type} className="country-card__tag">{type}</span>
                      ))}
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
      <section id="gallery" className="section section--alt" aria-labelledby="gallery-title">
        <div className="container">
          <ScrollReveal>
            <div className="section__header">
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
