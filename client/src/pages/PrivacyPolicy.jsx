import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo.js';

export default function PrivacyPolicy() {
  useSeo({
    title: 'Privacy Policy | MAXYWALK',
    description: 'Read how MAXYWALK collects, uses, and protects your personal information when shopping for handcrafted leather footwear.',
    path: '/privacy',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-surface min-h-screen py-10 sm:py-16 page-enter">
      <div className="container-max max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 border-b border-outline-variant/30 pb-6">
          <div className="flex items-center gap-2 text-xs text-secondary font-bold uppercase tracking-wider mb-2">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span>Legal</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Last Updated: November 2026 · Committed to protecting your personal information
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-outline-variant/40 p-6 sm:p-10 shadow-lux space-y-8 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">1. Overview</h2>
            <p>
              This Privacy Policy describes how <strong>MAXYWALK</strong> collects, uses, stores, and protects your personal data when you visit our website or make a purchase. We value your privacy and comply with the Information Technology Act, 2000, and associated IT Rules of India.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">2. Information We Collect</h2>
            <p className="mb-2">When you place an order or interact with our site, we collect the following information:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Contact Information:</strong> Full name, email address, and mobile / WhatsApp phone number.</li>
              <li><strong>Delivery Information:</strong> House/flat number, street address, city, state, and postal pincode.</li>
              <li><strong>Account Credentials:</strong> If registered, email address and encrypted password or Google authentication token.</li>
              <li><strong>Order History:</strong> Purchased items, sizes, colors, amounts, and delivery status.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">3. Payment Information Security (Razorpay)</h2>
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined text-secondary">verified_user</span>
                <span>PCI-DSS Level 1 Compliant Payment Processing</span>
              </div>
              <p>
                All online transactions on MAXYWALK are securely processed through our payment gateway partner, <strong>Razorpay Software Private Limited</strong>.
              </p>
              <p>
                <strong>MAXYWALK does NOT store or have access to your full credit card numbers, debit card details, CVVs, net banking credentials, or UPI PINs.</strong> Your transaction is encrypted and transmitted directly through Razorpay under 256-bit bank-grade SSL encryption and PCI-DSS Level 1 compliance.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">4. How We Use Your Information</h2>
            <p className="mb-2">Your information is strictly used for:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Fulfilling, packaging, and dispatching your footwear orders.</li>
              <li>Sending order confirmations, tracking updates, and delivery notifications via SMS, WhatsApp, and email.</li>
              <li>Providing customer support regarding custom leather fit or size exchanges.</li>
              <li>Preventing fraudulent orders and maintaining secure transactions.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">5. Third-Party Sharing</h2>
            <p>
              We do not sell, rent, or trade your personal information. We only share necessary details with trusted service partners solely to execute your purchase:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
              <li><strong>Courier Partners:</strong> Name, delivery address, and phone number shared with couriers (e.g., DTDC, India Post, Delhivery) for doorstep delivery.</li>
              <li><strong>Payment Partners:</strong> Razorpay for authorization and settlement of payments.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">6. Data Retention & User Rights</h2>
            <p>
              We retain your purchase history for accounting, taxation, and warranty records as required by Indian law. You have the right to request access to your personal information, request corrections, or request account deletion by emailing us at <a href="mailto:support.maxywalk@gmail.com" className="text-secondary font-bold">support.maxywalk@gmail.com</a>.
            </p>
          </section>

          <section className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
            <h3 className="font-bold text-primary mb-1">Privacy Inquiries</h3>
            <p>MAXYWALK Footwear</p>
            <p>6 A, V Main Road, Kovilpathagai, Avadi, Chennai, Tamil Nadu 600062</p>
            <p>Email: <a href="mailto:support.maxywalk@gmail.com" className="text-secondary font-bold">support.maxywalk@gmail.com</a> | Phone: <a href="tel:+919444743465" className="text-secondary font-bold">+91 94447 43465</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
