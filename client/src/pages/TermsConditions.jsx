import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TermsConditions() {
  useEffect(() => {
    document.title = 'Terms & Conditions | MAXYWALK';
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
            Terms & Conditions
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Last Updated: November 2026 · Governing PRABHU TRADERS (Brand: MAXYWALK)
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-outline-variant/40 p-6 sm:p-10 shadow-lux space-y-8 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">1. Introduction & Acceptance</h2>
            <p>
              Welcome to <strong>MAXYWALK</strong> (website operated by <strong>PRABHU TRADERS</strong>, having its principal place of business at 6 A, V Main Road, Kovilpathagai, Avadi, Chennai, Tamil Nadu 600062). By visiting our website, browsing our product catalog, or purchasing any handcrafted leather footwear or accessories, you agree to be bound by these Terms and Conditions and all related policies.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">2. Products & Handcrafted Variations</h2>
            <p>
              MAXYWALK specializes in genuine, handcrafted leather slippers, sandals, belts, and accessories. Because leather is a natural material, slight natural variations in grain, texture, and natural color tone are authentic characteristics of genuine leather and are not defects. We make every effort to display the colors and specifications of our products accurately on our website.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">3. Pricing & Payments</h2>
            <p className="mb-2">
              All prices listed on MAXYWALK are quoted in <strong>Indian Rupees (INR)</strong> and are inclusive of applicable taxes.
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>We accept payments through secure online payment methods powered by <strong>Razorpay</strong> (UPI, Credit Cards, Debit Cards, Net Banking, Wallets) as well as <strong>Cash on Delivery (COD)</strong> for select pincodes.</li>
              <li>When paying via Razorpay, your payment details are encrypted using industry-standard 256-bit SSL encryption. We do not store your full card numbers, CVVs, or UPI PINs on our servers.</li>
              <li>We reserve the right to revise product prices at any time prior to the acceptance of an order.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">4. Order Placement & Acceptance</h2>
            <p>
              Upon placing an order, you will receive an order confirmation message via email, SMS, or WhatsApp with your unique Order ID. We reserve the right to refuse or cancel any order for reasons including inventory unavailability, inaccuracies in product or pricing information, or suspected fraudulent activity. In such events, any amount debited will be refunded immediately.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">5. Shipping & Delivery</h2>
            <p>
              Orders are dispatched through trusted courier partners across India. Delivery timeframes and shipping fees are governed by our separate <Link to="/shipping" className="text-secondary font-bold hover:underline">Shipping & Delivery Policy</Link>. While we strive to meet all estimated delivery dates, we are not liable for transit delays caused by force majeure events or courier logistical constraints.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">6. Returns, Exchanges & Cancellations</h2>
            <p>
              Our refund and cancellation terms are outlined in our <Link to="/refund-policy" className="text-secondary font-bold hover:underline">Refund & Cancellation Policy</Link>. Footwear may be returned or exchanged within 7 days of delivery, provided it is unused, unworn, and in its original packaging with tags intact.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">7. Intellectual Property</h2>
            <p>
              All trademarks, product designs, imagery, logos, website layout, and content under the name <strong>MAXYWALK</strong> and <strong>PRABHU TRADERS</strong> are the proprietary property of PRABHU TRADERS and are protected under Indian copyright and trademark laws.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg sm:text-xl font-bold text-primary mb-3">8. Limitation of Liability & Governing Law</h2>
            <p>
              In no event shall PRABHU TRADERS or its founders be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the products. These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the courts in <strong>Chennai / Thiruvallur District, Tamil Nadu</strong>.
            </p>
          </section>

          <section className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
            <h3 className="font-bold text-primary mb-1">Grievance & Legal Officer Contact</h3>
            <p>PRABHU TRADERS · MAXYWALK Footwear</p>
            <p>6 A, V Main Road, Kovilpathagai, Avadi, Chennai, Tamil Nadu 600062</p>
            <p>Email: <a href="mailto:support.maxywalk@gmail.com" className="text-secondary font-bold">support.maxywalk@gmail.com</a> | Phone: <a href="tel:+919444743465" className="text-secondary font-bold">+91 94447 43465</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
