import React from 'react';
import { BUSINESS_INFO } from '../../data/businessInfo';
import { Icons } from '../../utils/icons';

interface StorefrontNarrativeSectionProps {
  className?: string;
  id?: string;
  leftContent?: React.ReactNode;
  settings?: any;
}

export const StorefrontNarrativeSection: React.FC<StorefrontNarrativeSectionProps> = ({
  className = '',
  id = 'storefront-model',
  leftContent,
  settings
}) => {
  // Trust anchors for left column
  const trustItems = settings?.guarantee_badge_4
    ? settings.guarantee_badge_4.split('|').map((s: string) => s.trim()).filter(Boolean)
    : ["Guaranteed Instant Price", "Expert In-House Vetting", "Direct Flathead Consultation"];

  const locationVal = settings?.card1_title || `${BUSINESS_INFO.street}, ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}`;
  const locationNote = settings?.card1_desc || 'Flathead County physical facility · Private Consultations';

  const phoneVal = settings?.card2_title || `${BUSINESS_INFO.phoneFormatted} (Mon–Sat)`;
  const phoneNote = settings?.card2_desc || `Monday – Saturday · ${BUSINESS_INFO.terms.hours}`;

  const taxVal = settings?.card3_title || '0% Montana State Sales Tax on All Metals';
  const taxNote = settings?.card3_desc || '';

  const settlementVal = settings?.card4_title || 'Transparent 15% Fee via PayPal or Wire';
  const settlementNote = settings?.card4_desc || 'Comprehensive buyer protection or high-value incoming wire fee credit';

  const shippingVal = settings?.guarantee_title || 'In-House Insured USPS Priority Packaging';
  const shippingNote = settings?.guarantee_desc || 'Discreet packaging with tracking; signature required on orders exceeding $500';

  const footerSecurity = settings?.guarantee_promise_text || 'Verified Storefront Security · Direct Settlement Model';

  return (
    <section className={`section section-warm storefront-narrative-section ${className}`} id={id}>
      <div className="container">
        <div className="storefront-narrative-grid">
          {/* Left Column: Customer Inquiry Form (when provided) or Default Brand Narrative */}
          {leftContent ? (
            <div className="storefront-left-custom-container">
              {leftContent}
            </div>
          ) : (
            <div className="storefront-narrative-content">
              <h2 className="storefront-narrative-title">
                {settings?.tagline || 'A Transparent Model Built for Serious Collectors'}
              </h2>

              <p className="storefront-narrative-lead">
                {settings?.operating_hours ||
                  'Highlander Gold & Silver was established to solve the frustrations collectors encounter with traditional auction platforms: opaque buyer premiums, bidding frenzies, artificial reserves, and prolonged listing delays.'}
              </p>

              <div className="storefront-narrative-body-wrap">
                {settings?.bank_wire_instructions ? (
                  settings.bank_wire_instructions.split('\n\n').map((para: string, idx: number) => (
                    <p key={idx} className="storefront-narrative-body">
                      {para}
                    </p>
                  ))
                ) : (
                  <>
                    <p className="storefront-narrative-body">
                      Operating from our physical location at Jewel Basin Armory in Bigfork, Montana, we offer an ongoing online and in-person storefront. When you find a sovereign gold trophy or certified Morgan dollar you desire, you can purchase it instantly at a guaranteed price with direct settlement.
                    </p>
                    <p className="storefront-narrative-body">
                      Every single piece in our inventory is evaluated personally by our numismatic specialists for strike crispness, cartwheel luster, original surface integrity, and metal purity before being cataloged.
                    </p>
                  </>
                )}
              </div>

              {/* Connecting Trust Anchors */}
              <div className="storefront-trust-strip">
                {trustItems.map((item: string, idx: number) => (
                  <div key={idx} className="storefront-trust-item">
                    <div className="trust-check-icon">
                      <Icons.Check size={14} strokeWidth={2.5} />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Redesigned "Storefront at a Glance" Card */}
          <div className="storefront-glance-card-container">
            <div className="storefront-glance-card">
              <div className="glance-card-header">
                <div className="glance-header-top">
                  <span className="glance-header-badge">
                    <Icons.Sparkles size={12} />
                    <span>{settings?.guarantee_badge || 'Official Armory Specifications'}</span>
                  </span>
                </div>
                <h3 className="glance-card-title">{settings?.tagline || 'Storefront At A Glance'}</h3>
                <p className="glance-card-subtitle">
                  {settings?.operating_hours || 'Direct physical and digital operations based in Flathead County, Montana.'}
                </p>
              </div>

              <div className="glance-items-list">
                {/* 1. Location */}
                <div className="glance-row-item">
                  <div className="glance-item-icon">
                    <Icons.MapPin size={18} />
                  </div>
                  <div className="glance-item-info">
                    <span className="glance-item-label">Location</span>
                    <span className="glance-item-val">{locationVal}</span>
                    {locationNote && <span className="glance-item-note">{locationNote}</span>}
                  </div>
                </div>

                {/* 2. Direct Line */}
                <div className="glance-row-item">
                  <div className="glance-item-icon">
                    <Icons.Phone size={18} />
                  </div>
                  <div className="glance-item-info">
                    <span className="glance-item-label">Direct Line</span>
                    <span className="glance-item-val">{phoneVal}</span>
                    {phoneNote && <span className="glance-item-note">{phoneNote}</span>}
                  </div>
                </div>

                {/* 3. Sales Tax */}
                <div className="glance-row-item">
                  <div className="glance-item-icon">
                    <Icons.ShieldCheck size={18} />
                  </div>
                  <div className="glance-item-info">
                    <span className="glance-item-label">Sales Tax</span>
                    <span className="glance-item-val">{taxVal}</span>
                    {taxNote && <span className="glance-item-note">{taxNote}</span>}
                  </div>
                </div>

                {/* 4. Settlement */}
                <div className="glance-row-item">
                  <div className="glance-item-icon">
                    <Icons.CreditCard size={18} />
                  </div>
                  <div className="glance-item-info">
                    <span className="glance-item-label">Settlement</span>
                    <span className="glance-item-val">{settlementVal}</span>
                    {settlementNote && <span className="glance-item-note">{settlementNote}</span>}
                  </div>
                </div>

                {/* 5. Shipping */}
                <div className="glance-row-item">
                  <div className="glance-item-icon">
                    <Icons.Package size={18} />
                  </div>
                  <div className="glance-item-info">
                    <span className="glance-item-label">Shipping</span>
                    <span className="glance-item-val">{shippingVal}</span>
                    {shippingNote && <span className="glance-item-note">{shippingNote}</span>}
                  </div>
                </div>
              </div>

              {/* Card Footer Trust Lock */}
              <div className="glance-card-footer">
                <div className="glance-footer-badge">
                  <Icons.Lock size={13} />
                  <span>{footerSecurity}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorefrontNarrativeSection;
