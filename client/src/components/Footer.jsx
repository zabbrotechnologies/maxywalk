import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="w-full bg-surface-container-highest border-t border-outline-variant/30 mt-auto overflow-hidden">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-outline-variant/20 bg-surface-container-low py-4 px-4">
        <div className="container-max grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <span className="material-symbols-outlined text-secondary text-2xl flex-shrink-0">verified_user</span>
            <div>
              <p className="text-xs font-bold text-primary">100% Genuine Leather</p>
              <p className="text-[10px] text-on-surface-variant">Handcrafted in Avadi, TN</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <span className="material-symbols-outlined text-secondary text-2xl flex-shrink-0">local_shipping</span>
            <div>
              <p className="text-xs font-bold text-primary">Pan-India Delivery</p>
              <p className="text-[10px] text-on-surface-variant">Reliable doorstep shipping</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <span className="material-symbols-outlined text-secondary text-2xl flex-shrink-0">category</span>
            <div>
              <p className="text-xs font-bold text-primary">Various Designs & Models</p>
              <p className="text-[10px] text-on-surface-variant">Distinct styles & custom finishes</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <span className="material-symbols-outlined text-secondary text-2xl flex-shrink-0">lock</span>
            <div>
              <p className="text-xs font-bold text-primary">Razorpay Secure Checkout</p>
              <p className="text-[10px] text-on-surface-variant">256-bit SSL encrypted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-max py-10 sm:py-14 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand & Address Column (Crucial for Razorpay KYC) */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-3">
            <Link to="/" className="font-display text-2xl font-bold tracking-widest text-primary block">
              MAXYWALK
            </Link>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Handcrafting premium custom leather slippers, shoes, mules, and sandals in Avadi since 2021 under the registered brand <strong>MAXYWALK</strong>.
            </p>

            {/* Complete Physical Business Contact Details */}
            <div className="space-y-2 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-secondary mt-0.5 flex-shrink-0">location_on</span>
                <span>
                  <strong>MAXYWALK</strong><br />
                  6 A, V Main Road, Kovilpathagai, Avadi, Chennai, Tamil Nadu – 600062
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-secondary flex-shrink-0">call</span>
                <span>Phone: <a href="tel:+919444743465" className="hover:text-primary font-bold text-secondary">+91 94447 43465</a></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-secondary flex-shrink-0">mail</span>
                <span>Email: <a href="mailto:support.maxywalk@gmail.com" className="hover:text-primary font-bold text-secondary">support.maxywalk@gmail.com</a></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-secondary flex-shrink-0">schedule</span>
                <span>Hours: Mon–Sun, 9:00 AM – 9:00 PM IST</span>
              </div>
            </div>

            {/* Direct WhatsApp Action Button */}
            <div className="pt-2">
              <a
                href="https://wa.me/919444743465?text=Hi%20MAXYWALK!%20I'm%20visiting%20your%20website."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-700 text-white px-4 py-2 text-xs font-sans uppercase tracking-wider font-bold hover:bg-green-800 transition-colors rounded-lg shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">chat</span>
                <span>WhatsApp Customer Support</span>
              </a>
            </div>
          </div>

          {/* Quick Footwear Catalog Links */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="font-sans text-xs uppercase tracking-widest text-primary font-bold mb-3">
              Collection
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { to: '/shop', label: 'All Footwear' },
                { to: '/shop?category=slippers', label: 'Slippers & Mules' },
                { to: '/shop?category=shoes', label: 'Handcrafted Shoes' },
                { to: '/shop?category=sandals', label: 'Handcrafted Sandals' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-on-surface-variant hover:text-secondary transition-colors block py-0.5">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Mandatory Razorpay Legal & Compliance Links */}
          <div className="sm:col-span-1 lg:col-span-3">
            <h4 className="font-sans text-xs uppercase tracking-widest text-primary font-bold mb-3">
              Policies & Compliance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/terms" className="text-on-surface-variant hover:text-secondary font-medium transition-colors block py-0.5">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-on-surface-variant hover:text-secondary font-medium transition-colors block py-0.5">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-on-surface-variant hover:text-secondary font-medium transition-colors block py-0.5">
                  Shipping & Delivery Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-on-surface-variant hover:text-secondary font-medium transition-colors block py-0.5">
                  Cancellation & Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-on-surface-variant hover:text-secondary font-medium transition-colors block py-0.5">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & Payment Security */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-4">
            <div>
              <h4 className="font-sans text-xs uppercase tracking-widest text-primary font-bold mb-2">
                Newsletter
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                Subscribe for exclusive custom releases and direct artisan discounts.
              </p>
              {subscribed ? (
                <div className="p-3 bg-green-50 border border-green-200 text-xs text-green-800 font-bold rounded-lg">
                  ✓ Thank you for subscribing!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-1.5">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="flex-1 bg-white border border-outline-variant px-3 py-2 text-xs text-primary rounded-lg focus:outline-none focus:border-primary"
                  />
                  <button type="submit" className="btn-primary py-0 px-4 h-9 text-xs font-bold rounded-lg">
                    Join
                  </button>
                </form>
              )}
            </div>

            {/* Payment Gateway Trust Badge */}
            <div className="pt-2 border-t border-outline-variant/20">
              <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant mb-2">
                100% Secure Payments
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="px-2 py-1 bg-white border border-outline-variant/40 rounded font-bold text-primary">Razorpay</span>
                <span className="px-2 py-1 bg-white border border-outline-variant/40 rounded font-bold text-primary">UPI</span>
                <span className="px-2 py-1 bg-white border border-outline-variant/40 rounded font-bold text-primary">GPay / PhonePe</span>
                <span className="px-2 py-1 bg-white border border-outline-variant/40 rounded font-bold text-primary">Cards / NetBanking</span>
                <span className="px-2 py-1 bg-white border border-outline-variant/40 rounded font-bold text-primary">100% Prepaid</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-outline-variant/30 py-4 px-4 bg-surface-container-high">
        <div className="container-max flex flex-col sm:flex-row justify-between items-center gap-2 text-center">
          <p className="text-[10px] sm:text-xs text-on-surface-variant font-sans uppercase tracking-wider">
            © {new Date().getFullYear()} MAXYWALK LEATHER FOOTWEAR · ALL RIGHTS RESERVED
          </p>
          <div className="flex items-center gap-4 text-[11px] text-on-surface-variant">
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/shipping" className="hover:underline">Shipping</Link>
            <Link to="/refund-policy" className="hover:underline">Refunds</Link>
            <Link to="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
