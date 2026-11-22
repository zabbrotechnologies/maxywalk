import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ShippingPolicy() {
  useEffect(() => {
    document.title = 'Shipping & Delivery Policy | MAXYWALK';
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
            <span>Delivery</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-2">
            Shipping & Delivery Policy
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Reliable Pan-India Footwear Delivery from our Avadi workshop · Last Updated: November 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-outline-variant/40 p-6 sm:p-10 shadow-lux space-y-8 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          {/* Quick Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-2xl mb-1">local_shipping</span>
              <h3 className="font-bold text-primary text-sm mb-1">Free Delivery</h3>
              <p className="text-[11px] text-on-surface-variant">Free standard shipping on orders above ₹1,999 across India.</p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-2xl mb-1">timer</span>
              <h3 className="font-bold text-primary text-sm mb-1">3–7 Days Transit</h3>
              <p className="text-[11px] text-on-surface-variant">Tamil Nadu orders delivered in 2–3 days; rest of India in 4–7 days.</p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-2xl mb-1">pin_drop</span>
              <h3 className="font-bold text-primary text-sm mb-1">Live Tracking</h3>
              <p className="text-[11px] text-on-surface-variant">Instant WhatsApp and SMS tracking link once package is dispatched.</p>
            </div>
          </div>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">1. Order Processing Time</h2>
            <p>
              Each pair of MAXYWALK footwear is carefully handcrafted, inspected, and packed at our workshop in Avadi, Chennai.
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 mt-2">
              <li><strong>Standard in-stock footwear:</strong> Dispatched within <strong>24 to 48 business hours</strong> after order confirmation.</li>
              <li><strong>Custom handcrafted orders:</strong> Dispatched within <strong>2 to 3 business days</strong>.</li>
              <li>Orders placed on Sundays or national holidays are processed on the subsequent working business day.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">2. Shipping Rates & Charges</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-outline-variant/30 text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-primary">
                    <th className="p-3 border border-outline-variant/30">Shipping Method</th>
                    <th className="p-3 border border-outline-variant/30">Order Value</th>
                    <th className="p-3 border border-outline-variant/30">Estimated Delivery Time</th>
                    <th className="p-3 border border-outline-variant/30">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-outline-variant/30 font-bold">Standard Delivery</td>
                    <td className="p-3 border border-outline-variant/30">₹1,999 and above</td>
                    <td className="p-3 border border-outline-variant/30">4–7 business days</td>
                    <td className="p-3 border border-outline-variant/30 text-green-700 font-bold">FREE</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-outline-variant/30 font-bold">Standard Delivery</td>
                    <td className="p-3 border border-outline-variant/30">Under ₹1,999</td>
                    <td className="p-3 border border-outline-variant/30">4–7 business days</td>
                    <td className="p-3 border border-outline-variant/30">₹149</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-outline-variant/30 font-bold">Express Delivery</td>
                    <td className="p-3 border border-outline-variant/30">All orders</td>
                    <td className="p-3 border border-outline-variant/30">2–3 business days</td>
                    <td className="p-3 border border-outline-variant/30">₹149</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">3. Delivery Coverage & Logistics Partners</h2>
            <p>
              We ship to over 19,000+ postal pincodes across all Indian states and Union Territories through tier-1 courier partners:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
              <li><strong>DTDC Express</strong></li>
              <li><strong>India Post (Speed Post)</strong> for remote & rural postal coverage</li>
              <li><strong>Delhivery</strong></li>
              <li><strong>Blue Dart</strong> (Express Air Shipments)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">4. Order Tracking</h2>
            <p>
              As soon as your package is handed over to the courier, an automated dispatch notification is sent to your registered phone number (via WhatsApp / SMS) and email address. You will receive the AWB courier tracking number and a direct tracking link to monitor your delivery in real-time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">5. 100% Secure Online Payment (Prepaid Orders)</h2>
            <p>
              All orders are processed and dispatched with instant priority upon verified online payment via Razorpay. We accept UPI (Google Pay, PhonePe, Paytm, BHIM), Credit & Debit Cards, and Net Banking with 256-bit bank-grade SSL security.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">6. Damaged or Tampered Packages</h2>
            <p>
              If the outer packaging appears physically damaged, torn, or opened at the time of delivery, please do not accept the package or take an unboxing video and immediately contact our support at <a href="tel:+919444743465" className="text-secondary font-bold">+91 94447 43465</a> within 24 hours.
            </p>
          </section>

          <section className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
            <h3 className="font-bold text-primary mb-1">Dispatch Hub & Contact Details</h3>
            <p><strong>MAXYWALK Footwear</strong></p>
            <p>6 A, V Main Road, Kovilpathagai, Avadi, Chennai, Tamil Nadu 600062</p>
            <p>Customer Support: <a href="tel:+919444743465" className="text-secondary font-bold">+91 94447 43465</a> (9 AM – 9 PM IST) | Email: <a href="mailto:support.maxywalk@gmail.com" className="text-secondary font-bold">support.maxywalk@gmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
