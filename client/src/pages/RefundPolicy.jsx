import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo.js';

export default function RefundPolicy() {
  useSeo({
    title: 'Cancellation & Refund Policy | MAXYWALK',
    description: 'MAXYWALK 7-day return, size replacement, and refund policy for handcrafted leather footwear orders across India.',
    path: '/refund-policy',
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
            <span>Returns & Refunds</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary mb-2">
            Cancellation & Refund Policy
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Clear, customer-first 7-day return and refund policy · Last Updated: November 2026
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-outline-variant/40 p-6 sm:p-10 shadow-lux space-y-8 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          {/* Highlight Card */}
          <div className="bg-green-50 border border-green-200 p-5 rounded-2xl space-y-1">
            <div className="flex items-center gap-2 text-green-900 font-bold text-sm">
              <span className="material-symbols-outlined text-green-700">verified</span>
              <span>7-Day Hassle-Free Returns & Free Size Replacement</span>
            </div>
            <p className="text-xs text-green-800">
              We want you to love your handcrafted leather footwear. If the size does not fit or you receive a defective piece, we provide prompt replacements or a full refund within 5–7 business days.
            </p>
          </div>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">1. Order Cancellation Policy</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Before Dispatch:</strong> You may cancel your order free of charge at any time before it has been dispatched from our Avadi workshop (usually within 12–24 hours of placing the order). Call or WhatsApp us at <strong>+91 94447 43465</strong> with your Order ID. A 100% full refund will be initiated immediately.
              </li>
              <li>
                <strong>After Dispatch:</strong> Once the order has been handed over to our courier partner, it cannot be cancelled in transit. You may accept the delivery and initiate a standard 7-day return or exchange.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">2. 7-Day Return & Exchange Window</h2>
            <p className="mb-2">
              You may initiate a return or exchange request within <strong>7 days from the date of delivery</strong> under the following conditions:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>The footwear must be <strong>unused, unworn, unwashed</strong>, and free of any sole scuffs or leather creases. Please test slippers indoors on a clean carpeted surface.</li>
              <li>The product must be in its original packaging with all brand tags intact.</li>
              <li>Free replacement is available for <strong>size fitting issues</strong> (e.g., exchanging size 8 for size 9).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">3. How to Initiate a Return or Exchange</h2>
            <ol className="list-decimal list-inside space-y-2 pl-2">
              <li>Contact our support team via WhatsApp / Phone at <strong>+91 94447 43465</strong> or email <strong>support.maxywalk@gmail.com</strong>.</li>
              <li>Provide your Order ID (e.g., <code>MW-123456</code>) and a brief reason (e.g., size exchange or defect).</li>
              <li>Our team will arrange a reverse pickup from your address or guide you on the nearest return drop-off.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">4. Refund Processing & Timelines</h2>
            <p>
              Once your returned footwear arrives at our workshop and passes quality inspection (usually within 24–48 hours of receipt):
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-outline-variant/30 text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-primary">
                    <th className="p-3 border border-outline-variant/30">Original Payment Mode</th>
                    <th className="p-3 border border-outline-variant/30">Refund Method</th>
                    <th className="p-3 border border-outline-variant/30">Processing Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-outline-variant/30 font-bold">Online Payment (Razorpay UPI, Debit/Credit Card, Net Banking)</td>
                    <td className="p-3 border border-outline-variant/30">Reversed automatically to original payment account via Razorpay</td>
                    <td className="p-3 border border-outline-variant/30 font-bold text-primary">5 to 7 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-2">
              * Note: Refund timelines depend on bank settlement cycles. You will receive an email/SMS confirmation containing the Razorpay refund transaction reference number.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">5. Non-Returnable Items</h2>
            <p>
              Custom-engraved leather goods or footwear showing clear signs of outdoor wear, dirt, or customer damage are not eligible for refunds or exchanges.
            </p>
          </section>

          <section className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
            <h3 className="font-bold text-primary mb-1">Customer Support & Returns Desk</h3>
            <p><strong>MAXYWALK Footwear</strong></p>
            <p>6 A, V Main Road, Kovilpathagai, Avadi, Chennai, Tamil Nadu 600062</p>
            <p>Helpline / WhatsApp: <a href="tel:+919444743465" className="text-secondary font-bold">+91 94447 43465</a> (Monday – Sunday: 9 AM to 9 PM IST)</p>
            <p>Email: <a href="mailto:support.maxywalk@gmail.com" className="text-secondary font-bold">support.maxywalk@gmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
