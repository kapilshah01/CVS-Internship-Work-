import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ScrollReveal, { RevealItem } from '../components/ScrollReveal';
import AppointmentCalendar from '../components/AppointmentCalendar';
import {
  COMPANY, TRUST_STATS, COUNTRIES, CITIES, SERVICES,
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
        if (!entry.isIntersecting) { started.current = false; setCount(0); }
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

/* ========== Home Page ========== */
export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main>
      {/* ===== 1. HERO ===== */}
      <section id="hero" className="hero" aria-label="Hero">
        <div className="hero__bg">
          {heroImages.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`hero__bg-image ${i === heroIdx ? 'hero__bg-image--active' : ''}`}
              loading={i === 0 ? 'eager' : 'lazy'}
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
                    src={country.image}
                    alt={`${country.name} destination`}
                    className="country-card__image"
                    loading="lazy"
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

      {/* ===== 4. FEATURED CITIES ===== */}
      <section id="cities" className="section" aria-labelledby="cities-title">
        <div className="container">
          <ScrollReveal>
            <div className="section__header">
              <span className="section__label">Explore</span>
              <h2 id="cities-title" className="section__title">Featured Cities</h2>
              <p className="section__subtitle">
                Discover the stunning cities you can visit with our visa services.
              </p>
              <div className="gold-line"></div>
            </div>
          </ScrollReveal>

          <div className="cities-grid">
            {CITIES.map((city, i) => (
              <ScrollReveal key={city.id} delay={i * 0.08} variant="zoomIn">
                <div className="city-card">
                  <img
                    src={city.image}
                    alt={`${city.name}, ${city.country}`}
                    className="city-card__image"
                    loading="lazy"
                  />
                  <div className="city-card__overlay">
                    <h3 className="city-card__name">{city.name}</h3>
                    <span className="city-card__country">{city.country}</span>
                    <p className="city-card__desc">{city.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. VISA SERVICES ===== */}
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
            {SERVICES.map((service, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
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

      {/* ===== 6. HOW IT WORKS ===== */}
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

      {/* ===== 7. APPOINTMENT CALENDAR ===== */}
      <AppointmentCalendar />

      {/* ===== 8. WHY CHOOSE US ===== */}
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

      {/* ===== 9. FOUNDER MESSAGE ===== */}
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

      {/* ===== 10. PROFESSIONAL TEAM ===== */}
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

      {/* ===== 11. COMPANY JOURNEY ===== */}
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

      {/* ===== 12. DESTINATION GALLERY ===== */}
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
            {GALLERY_IMAGES.map((img, i) => (
              <ScrollReveal key={i} delay={i * 0.06} variant="zoomIn">
                <div className="gallery-item">
                  <img src={img.src} alt={img.alt} loading="lazy" />
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

      {/* ===== 13. TESTIMONIALS ===== */}
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

      {/* ===== 14. FAQ ===== */}
      <section className="section section--alt" aria-labelledby="faq-title">
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

      {/* ===== 15. CONTACT ===== */}
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
                  📍 Google Maps will be embedded here with the office location
                </div>
              </div>

              <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-name">Full Name</label>
                  <input className="form-input" id="contact-name" type="text" placeholder="Enter your full name" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-email">Email Address</label>
                  <input className="form-input" id="contact-email" type="email" placeholder="Enter your email" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-phone">Phone Number</label>
                  <input className="form-input" id="contact-phone" type="tel" placeholder="Enter your phone number" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-country">Country of Interest</label>
                  <select className="form-select" id="contact-country">
                    <option value="">Select a country</option>
                    <option value="china">China</option>
                    <option value="japan">Japan</option>
                    <option value="south-korea">South Korea</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-message">Message</label>
                  <textarea className="form-textarea" id="contact-message" placeholder="Tell us about your visa requirements..." required></textarea>
                </div>
                <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }}>
                  Send Inquiry
                </button>
              </form>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
