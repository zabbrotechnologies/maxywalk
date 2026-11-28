import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSeo } from '../lib/seo.js';

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useSeo({
    title: 'Contact Us | MAXYWALK Handcrafted Leather Footwear',
    description: 'Contact MAXYWALK in Avadi, Chennai for custom leather slippers, footwear sizing, bulk orders, and customer support. Call +91 94447 43465 or WhatsApp us.',
    keywords: 'MAXYWALK contact, MAXYWALK Avadi, custom leather slippers Chennai, footwear brand support',
    path: '/contact',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitted(true);
    toast.success('Thank you! Your message has been received. Our team will contact you shortly.');
  };

  return (
    <div className="bg-surface min-h-screen py-10 sm:py-16 page-enter">
      <div className="container-max max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8 border-b border-outline-variant/30 pb-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-secondary font-bold uppercase tracking-wider mb-2">
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span>Support</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-2">
            Contact Us
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
            Have a question about custom sizing, orders, or delivery? Reach out to our artisan workshop team in Avadi, Chennai.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Official Business Details (Crucial for Razorpay KYC) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-outline-variant/40 p-6 sm:p-8 shadow-lux space-y-6">
              <h2 className="font-display text-xl font-bold text-primary pb-3 border-b border-outline-variant/30">
                Operating Business Details
              </h2>

              <div className="space-y-4 text-xs sm:text-sm text-on-surface-variant">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-secondary">Brand & Entity Name</p>
                  <p className="font-bold text-primary text-base">MAXYWALK</p>
                  <p className="text-[11px] text-on-surface-variant">Premium Handcrafted Leather Footwear</p>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0 mt-0.5">location_on</span>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-secondary">Workshop & Registered Address</p>
                    <p className="font-medium text-primary leading-relaxed">
                      6 A, V Main Road, Kovilpathagai,<br />
                      Avadi, Chennai, Tamil Nadu – 600062, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0 mt-0.5">call</span>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-secondary">Customer Support Phone</p>
                    <a href="tel:+919444743465" className="font-bold text-primary hover:text-secondary text-sm">
                      +91 94447 43465 / 094447 43465
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0 mt-0.5">mail</span>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-secondary">Customer Care Email</p>
                    <a href="mailto:support.maxywalk@gmail.com" className="font-bold text-primary hover:text-secondary text-sm">
                      support.maxywalk@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0 mt-0.5">schedule</span>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-secondary">Operational Working Hours</p>
                    <p className="font-medium text-primary">Monday to Sunday: 9:00 AM – 9:00 PM IST</p>
                    <p className="text-[11px] text-on-surface-variant">Typical response time: Within 2 to 4 hours</p>
                  </div>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href="https://wa.me/919444743465?text=Hi%20MAXYWALK!%20I%20have%20an%20inquiry%20regarding%20my%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center text-xs h-11 bg-green-700 hover:bg-green-800"
                >
                  <span className="material-symbols-outlined text-base">chat</span>
                  <span>Chat on WhatsApp</span>
                </a>
                <a
                  href="https://maps.google.com/?q=MAXYWALK+Avadi+Tamil+Nadu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline w-full justify-center text-xs h-11"
                >
                  <span className="material-symbols-outlined text-base">map</span>
                  <span>View on Google Maps</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-outline-variant/40 p-6 sm:p-8 shadow-lux">
              <h2 className="font-display text-xl font-bold text-primary mb-2">
                Send Us a Message
              </h2>
              <p className="text-xs text-on-surface-variant mb-6">
                Fill out the form below and our artisan desk will get back to you promptly.
              </p>

              {submitted ? (
                <div className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center space-y-3">
                  <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
                  <h3 className="font-bold text-green-900 text-base">Message Sent Successfully</h3>
                  <p className="text-xs text-green-800">
                    Thank you, {formData.name}. We have received your query and will reply to <strong>{formData.email}</strong> or call you shortly.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', message: '' }); }}
                    className="btn-outline text-xs h-9 px-4 mt-2"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rajesh Kumar"
                      className="input-hairline text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                        className="input-hairline text-sm"
                      />
                    </div>
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
                        Phone / WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="input-hairline text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
                      Message / Order Query *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Inquire about custom leather size, order tracking, or assistance..."
                      className="input-hairline text-sm py-2"
                    />
                  </div>

                  <button type="submit" className="btn-primary w-full justify-center text-xs h-12 font-bold">
                    Submit Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
