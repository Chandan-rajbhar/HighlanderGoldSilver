import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../utils/icons';
import { BUSINESS_INFO } from '../data/businessInfo';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { StorefrontNarrativeSection } from '../components/common/StorefrontNarrativeSection';
import { settingsService } from '../services/settingsService';

export const AboutPage: React.FC = () => {
  useScrollReveal();

  const [aboutSettings, setAboutSettings] = useState<any>(() =>
    settingsService.getActiveStorefrontContent('about')
  );

  useEffect(() => {
    settingsService.getSettings('about')
      .then(data => {
        if (data) setAboutSettings((prev: any) => ({ ...prev, ...data }));
      })
      .catch(() => {});

    const handleUpdate = (e: any) => {
      const detail = e.detail;
      if (detail && (detail.section === 'about' || detail.id === 'about')) {
        setAboutSettings((prev: any) => ({ ...prev, ...(detail.data || detail) }));
      }
    };
    window.addEventListener('hgs:settings-updated', handleUpdate);
    return () => window.removeEventListener('hgs:settings-updated', handleUpdate);
  }, []);

  return (
    <main className="about-page-main">
      {/* Page Header Banner with Right-Side Jewel Basin Armory Heritage Image */}
      <section className="page-header-banner">
        <div className="container">
          <div className="page-banner-grid">
            <div className="page-banner-content">
              <nav className="page-breadcrumbs" aria-label="Breadcrumb">
                <Link to="/" className="breadcrumb-link">Home</Link>
                <span className="breadcrumb-sep">/</span>
                <span className="breadcrumb-current">About</span>
              </nav>

              <h1 className="page-banner-title">
                {aboutSettings.difference_title || "Heritage, Integrity & Numismatic Precision"}
              </h1>
              <p className="page-banner-desc">
                {aboutSettings.difference_subtitle ||
                  "Founded on transparency, decades of precious metals experience, and Montana hospitality. We operate as an ongoing storefront rather than a high-pressure auction house."}
              </p>

              {/* Quick Trust Highlights */}
              <div className="collection-stats-strip">
                {aboutSettings.guarantee_badge_1 && (
                  <div className="stat-pill">
                    <Icons.MapPin size={14} />
                    <span>{aboutSettings.guarantee_badge_1}</span>
                  </div>
                )}
                {aboutSettings.guarantee_badge_2 && (
                  <div className="stat-pill">
                    <Icons.ShieldCheck size={14} />
                    <span>{aboutSettings.guarantee_badge_2}</span>
                  </div>
                )}
                {aboutSettings.guarantee_badge_3 && (
                  <div className="stat-pill">
                    <Icons.Check size={14} />
                    <span>{aboutSettings.guarantee_badge_3}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right-Side Relevant Image Showcase */}
            <div className="page-banner-media">
              <div className="page-banner-media-box">
                <img
                  src={aboutSettings.hero_image || aboutSettings.difference_eyebrow || "/assets/brand/about_heritage_hero.jpg"}
                  alt="Jewel Basin Armory Precious Metals Specialist and Numismatic Inspection"
                  className="page-banner-img"
                  width={1920}
                  height={1080}
                  loading="eager"
                />
              </div>
              <div className="page-banner-badge">
                <div className="banner-badge-icon">
                  <Icons.Sparkles size={16} />
                </div>
                <span className="banner-badge-text">
                  {aboutSettings.heritage_title || "Jewel Basin Armory Numismatic Heritage"}
                </span>
                <span className="banner-badge-sub">
                  {aboutSettings.heritage_desc || "Est. Montana"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About & Storefront Narrative Section — Refined 2-Column Layout */}
      <StorefrontNarrativeSection settings={aboutSettings} />

      {/* 3 Pillars of Numismatic Excellence */}
      <section className="section section-warm">
        <div className="container">
          <div className="section-header-center">
            <h2 className="section-title">
              {aboutSettings.card4_title || "The Three Pillars of Highlander Quality"}
            </h2>
            <p className="section-subtitle">
              {aboutSettings.card4_desc ||
                "Every coin and bullion bar in our vault must meet three rigorous standards before being made available for acquisition."}
            </p>
          </div>

          <div className="pillars-grid" style={{ marginTop: '3rem' }}>
            <div className="pillar-card">
              <div className="pillar-num">01</div>
              <h3 className="pillar-title">
                {aboutSettings.card1_title || "Hand-Selected Eye Appeal"}
              </h3>
              <p className="pillar-desc">
                {aboutSettings.card1_desc ||
                  "We spend numerous hours each week inspecting coins individually. We look beyond basic numeric grades to assess field cleanliness, original mint luster, peripheral toning, and sharp strike definition that true connoisseurs appreciate."}
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-num">02</div>
              <h3 className="pillar-title">
                {aboutSettings.card2_title || "Certified Grading & Authenticity"}
              </h3>
              <p className="pillar-desc">
                {aboutSettings.card2_desc ||
                  "Our numismatic pieces carry certification from leading independent services including NGC, PCGS, and historical grading services, encapsulated in tamper-evident holders with guaranteed strike authenticity and pedigree."}
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-num">03</div>
              <h3 className="pillar-title">
                {aboutSettings.card3_title || "Precious Metal Integrity"}
              </h3>
              <p className="pillar-desc">
                {aboutSettings.card3_desc ||
                  "From sovereign .999 pure gold strikes to 90% Morgan silver dollars and 10 oz Scottsdale bullion bars, all precious metal weights, dimensions, and alloy purities are verified with precision acoustic and magnetic testing."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee & Terms Deep Dive */}
      <section className="section section-body">
        <div className="container">
          <div className="guarantee-box reveal-on-scroll is-revealed">
            <span className="guarantee-badge">
              <Icons.ShieldCheck size={16} strokeWidth={2.5} />
              {aboutSettings.guarantee_badge || "Our Unconditional Customer Promise"}
            </span>
            <h2 style={{ marginTop: '0.65rem', marginBottom: '1.25rem', color: 'var(--color-aubergine)' }}>
              {aboutSettings.guarantee_title || "The Highlander Sold Value Guarantee"}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              <p>
                {aboutSettings.guarantee_desc || (
                  <>
                    <strong>Fair Market Value Protection:</strong> We stand entirely behind every valuation in our catalog. If at any time a customer proves that a piece purchased from our storefront was overpriced based on its current market state, Highlander Gold &amp; Silver will refund the cost difference, or accept return of the item at its full purchased value (as-sold).
                  </>
                )}
              </p>
              {aboutSettings.guarantee_promise_prefix && (
                <p>
                  {aboutSettings.guarantee_promise_prefix}
                </p>
              )}
              {aboutSettings.guarantee_promise_text && (
                <p>
                  {aboutSettings.guarantee_promise_text}
                </p>
              )}
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <Link to="/collection" className="btn btn-gold">
                <span>{aboutSettings.heritage_btn_primary || "Explore Storefront Inventory"}</span>
                <Icons.ArrowRight size={16} />
              </Link>
              <Link to="/contact" className="btn btn-silver">
                <span>{aboutSettings.heritage_btn_secondary || "Contact Jewel Basin Armory"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
