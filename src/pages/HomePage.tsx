import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeroSection } from './Home/HeroSection';
import { FeaturedCarousel } from '../components/collection/FeaturedCarousel';
import { SectionHeading } from '../components/common/SectionHeading';
import { INVENTORY_ITEMS } from '../data/inventory';
import { BUSINESS_INFO } from '../data/businessInfo';
import { Icons } from '../utils/icons';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { settingsService } from '../services/settingsService';

export const HomePage: React.FC = () => {
  // Setup smooth scroll reveal observer
  useScrollReveal();

  const [settings, setSettings] = useState(() => settingsService.getActiveStorefrontContent());

  useEffect(() => {
    settingsService.getSettings()
      .then((data) => setSettings(prev => ({ ...prev, ...data })))
      .catch(() => {});

    const handleUpdate = (e: any) => {
      if (e.detail) setSettings((prev: any) => ({ ...prev, ...e.detail }));
    };

    window.addEventListener('hgs:settings-updated', handleUpdate);
    return () => window.removeEventListener('hgs:settings-updated', handleUpdate);
  }, []);

  return (
    <main>
      {/* 1. Preserved Homepage Hero Section */}
      <HeroSection />

      {/* 2. Featured Precious Metals Horizontal Carousel */}
      <section className="section section-body" id="featured-collection">
        <div className="container">
          <FeaturedCarousel
            items={INVENTORY_ITEMS}
          />

          <div className="mobile-cta-center" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <Link to="/collection" className="btn btn-gold btn-browse-collection" style={{ display: 'inline-flex' }}>
              <span>Browse All {INVENTORY_ITEMS.length} Certified Pieces</span>
              <Icons.ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Direct Storefront Model & Trust Pillars */}
      <section className="section section-warm" id="storefront-model">
        <div className="container">
          <SectionHeading
            align="center"
            eyebrow={settings.difference_eyebrow || "The Highlander Difference · Bigfork, Montana"}
            title={settings.difference_title || "A Dedicated Storefront for Numismatic Collectors"}
            subtitle={settings.difference_subtitle || "We operate as a direct storefront rather than an auction house. Acquire sovereign gold, rare coins, and investment-grade bullion with instant pricing, zero bidding wars, and immediate settlement."}
          />

          <div className="store-highlights-grid">
            <div className="highlight-card reveal-on-scroll is-revealed">
              <div className="highlight-icon-box">
                <Icons.CreditCard size={22} />
              </div>
              <h3 className="highlight-title">{settings.card1_title || "Direct Storefront Purchase"}</h3>
              <p className="highlight-text">
                {settings.card1_desc || "Browse verified inventory and purchase immediately via PayPal or bank wire. No bidding wars, timer countdowns, or auction delays."}
              </p>
            </div>

            <div className="highlight-card reveal-on-scroll is-revealed">
              <div className="highlight-icon-box">
                <Icons.ShieldCheck size={22} />
              </div>
              <h3 className="highlight-title">{settings.card2_title || "Sold Value Guarantee"}</h3>
              <p className="highlight-text">
                {settings.card2_desc || "Every piece is evaluated for true luster, strike, eye appeal, and metal integrity. Backed by our market value difference refund promise."}
              </p>
            </div>

            <div className="highlight-card reveal-on-scroll is-revealed">
              <div className="highlight-icon-box">
                <Icons.Package size={22} />
              </div>
              <h3 className="highlight-title">{settings.card3_title || "In-House Insured Delivery"}</h3>
              <p className="highlight-text">
                {settings.card3_desc || "All packaging is performed in-house from Jewel Basin Armory. Every parcel is shipped via USPS Priority, fully insured with tracking."}
              </p>
            </div>

            <div className="highlight-card reveal-on-scroll is-revealed">
              <div className="highlight-icon-box">
                <Icons.Check size={22} />
              </div>
              <h3 className="highlight-title">{settings.card4_title || "0% Montana Sales Tax"}</h3>
              <p className="highlight-text">
                {settings.card4_desc || "Take advantage of Montana's 0% state sales tax on precious metals, combined with transparent 15% settlement fee."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Highlander Sold Value Guarantee Callout */}
      <section className="section section-body" id="guarantee">
        <div className="container">
          <div className="guarantee-box reveal-on-scroll is-revealed">
            <div>
              <span className="guarantee-badge">
                <Icons.ShieldCheck size={16} strokeWidth={2.5} />
                {settings.guarantee_badge || "Authentic Value & Authenticity Promise"}
              </span>
              <h2 className="guarantee-title">
                {settings.guarantee_title || "The Highlander Sold Value Guarantee"}
              </h2>
              <p className="text-muted guarantee-desc">
                {settings.guarantee_desc || "Highlander Gold & Silver hand-selects coins and precious metals for superior eye appeal, strike quality, and metal integrity. We represent sovereign gold, certified Morgan dollars, commemorative coins, and pure bullion."}
              </p>
              <p className="text-muted guarantee-desc">
                <strong>{settings.guarantee_promise_prefix || "Our Direct Promise:"}</strong> {settings.guarantee_promise_text || "If at any time a customer proves that a piece they purchased was overpriced based on its current market state, HGS will refund the cost difference, or accept the return of the item at its full purchased value (as-sold). Acquire with complete confidence knowing your investment is backed by genuine integrity."}
              </p>
              <div className="guarantee-badges-list">
                {[
                  settings.guarantee_badge_1 || "Verified Sold Value Guarantee",
                  settings.guarantee_badge_2 || "Hand-Selected Eye Appeal",
                  settings.guarantee_badge_3 || "Difference Refund Protection",
                  settings.guarantee_badge_4 || "0% Montana State Sales Tax"
                ].filter(Boolean).map((badge, idx) => (
                  <span key={idx} className="badge-verified">
                    <Icons.Check size={13} />
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Heritage & Storefront Location Banner */}
      <section className="section section-cream" id="heritage-preview">
        <div className="container">
          <div className="heritage-preview-card reveal-on-scroll is-revealed">
            <div className="heritage-preview-content">

              <h2 className="heritage-preview-title">
                {settings.heritage_title || "Rooted in Flathead Valley Numismatic Tradition"}
              </h2>
              <p className="heritage-preview-text">
                {settings.heritage_desc || `Operating from our physical location at ${BUSINESS_INFO.street} in Bigfork, Montana, Highlander Gold & Silver offers private collector consultations, direct telephone inquiries, and secure nationwide insured distribution.`}
              </p>
              <div className="heritage-preview-actions">
                <Link to="/about" className="btn btn-gold">
                  <span>{settings.heritage_btn_primary || "Learn About Our Storefront"}</span>
                  <Icons.ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="btn btn-silver">
                  <span>{settings.heritage_btn_secondary || "Contact Our Team"}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
