import { useState } from 'react';
import useCartStore from '../store/cartStore.js';
import useWishlistStore from '../store/wishlistStore.js';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

const COLORWAYS = [
  {
    id: 'maroon-black',
    name: 'Maroon/Black',
    primary: '#6b1c2b',
    secondary: '#1a1918',
    upperColor: '#631826',
    waveColor: '#1a1918',
    strapColor: '#1a1918',
    buckleColor: '#d4d7db',
    corkColor: '#c79a6b',
  },
  {
    id: 'mustard-brown',
    name: 'Mustard/Brown',
    primary: '#d69e2e',
    secondary: '#452b19',
    upperColor: '#cf9727',
    waveColor: '#452b19',
    strapColor: '#452b19',
    buckleColor: '#d4d7db',
    corkColor: '#c79a6b',
  },
  {
    id: 'burgundy-cream',
    name: 'Burgundy/Cream',
    primary: '#541525',
    secondary: '#f3ece2',
    upperColor: '#4c1220',
    waveColor: '#f3ece2',
    strapColor: '#4c1220',
    buckleColor: '#d4d7db',
    corkColor: '#c79a6b',
  },
  {
    id: 'pink-brown',
    name: 'Pink/Brown',
    primary: '#cf7b88',
    secondary: '#543222',
    upperColor: '#c77481',
    waveColor: '#543222',
    strapColor: '#543222',
    buckleColor: '#d4d7db',
    corkColor: '#c79a6b',
  },
  {
    id: 'light-blue-grey',
    name: 'Light Blue/Grey',
    primary: '#85a4be',
    secondary: '#36434d',
    upperColor: '#7d9cb5',
    waveColor: '#36434d',
    strapColor: '#36434d',
    buckleColor: '#d4d7db',
    corkColor: '#c79a6b',
  },
  {
    id: 'forest-green-cream',
    name: 'Forest Green/Cream',
    primary: '#244834',
    secondary: '#f0e8d9',
    upperColor: '#1f402e',
    waveColor: '#f0e8d9',
    strapColor: '#1f402e',
    buckleColor: '#d4d7db',
    corkColor: '#c79a6b',
  },
];

const BOTTOM_FEATURES = [
  {
    title: 'Premium Finish',
    desc: 'Rich textures. Lasting impression.',
    img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Grip & Stability',
    desc: 'Engineered for every step.',
    img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'All-Day Comfort',
    desc: "Cushioned for what's next.",
    img: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80',
  },
  {
    title: 'Signature Detail',
    desc: 'Subtle branding. Bold identity.',
    img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80',
  },
];

export default function ExclusiveProductSection() {
  const [selectedVariant, setSelectedVariant] = useState(COLORWAYS[0]);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { user } = useAuthStore();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted('exclusive-urbanedge-pro', user));

  const handleAddToCart = () => {
    const product = {
      id: 'exclusive-urbanedge-pro',
      name: `UrbanEdge Pro - ${selectedVariant.name}`,
      price: 4999,
      original_price: 6499,
      category: 'slippers',
      sizes: ['7', '8', '9', '10', '11'],
      colors: [selectedVariant.name],
      images: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCMFcuIlEmOinqex53O1uTOd9tVyWYPSQLQrm79f8hx2_SDW3A9bJ26yPiHsSbdTlHXxgyce-_FVrtMjwFy5EP0GnvX5ip_JuZLB7h3fwc0bwVP4-4G_zwEs9gN4FJyDaQDWlVuNQ4ioWAeEmEvTIOf4X_ok5v7INXpniWrrqTweVWSss_5QYV35113F4ocyduEN5BWZdivdoyC71DQJ2OJHJ1m9sq8BKO346Sp7xK8dfFta2DXtV--',
      ],
      stock: 8,
    };
    addItem(product, '8', selectedVariant.name, 1, user);
    openCart();
    toast.success(`UrbanEdge Pro (${selectedVariant.name}) added to cart!`);
  };

  const handleSaveForLater = () => {
    toggleWishlist('exclusive-urbanedge-pro', user);
    toast.success(isWishlisted ? 'Removed from Wishlist' : 'Saved to Wishlist!');
  };

  return (
    <section className="relative w-full bg-[#faf9f6] text-[#1c1917] overflow-hidden py-16 sm:py-24 border-b border-[#e7e4df]">
      {/* Subtle Studio Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-gradient-to-b from-[#f2ece2]/80 via-[#f8f5f0]/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="container-max relative z-10 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* ── Top Header ────────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-3 mb-2.5">
            <span className="w-10 h-[1.5px] bg-[#d5cfc7]" />
            <span className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.28em] text-[#78716c] font-bold">
              EXCLUSIVE PRODUCT
            </span>
            <span className="w-10 h-[1.5px] bg-[#d5cfc7]" />
          </div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#171412]">
            Crafted for <span className="text-[#D35B22]">a Higher You</span>
          </h2>

          <p className="font-sans text-xs sm:text-sm text-[#78716c] mt-2 font-medium tracking-wide">
            Limited. Distinct. Unforgettable.
          </p>
        </div>

        {/* ── Main Showcase Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center mb-16 sm:mb-24">
          
          {/* Left Column: Colorway Thumbnails List */}
          <div className="lg:col-span-2 flex lg:flex-col flex-row flex-wrap justify-center lg:justify-start gap-3 order-2 lg:order-1">
            {COLORWAYS.map((variant) => {
              const active = selectedVariant.id === variant.id;
              return (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`group flex items-center gap-3 p-2 rounded-2xl border text-left transition-all duration-200 w-full sm:w-[calc(50%-8px)] lg:w-full ${
                    active
                      ? 'border-[#D35B22] bg-white shadow-md ring-2 ring-[#D35B22]/20'
                      : 'border-[#e7e4df] bg-white/70 hover:bg-white hover:border-[#a8a29e]'
                  }`}
                >
                  <div className="relative w-12 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-[#f4f2ee] border border-[#e7e4df] p-1 flex items-center justify-center">
                    <svg viewBox="0 0 100 65" className="w-full h-full drop-shadow-sm">
                      <path d="M 10 40 C 10 25, 20 18, 40 20 C 65 22, 85 30, 95 40 C 100 45, 95 52, 80 54 C 55 57, 20 55, 10 40 Z" fill={variant.corkColor} />
                      <path d="M 20 36 C 25 20, 45 15, 70 20 C 85 24, 90 35, 88 44 C 70 48, 45 46, 25 43 Z" fill={variant.upperColor} />
                      <path d="M 45 18 C 55 22, 60 30, 62 38 C 65 43, 70 46, 80 44 C 85 42, 88 38, 90 35 C 85 32, 75 25, 70 20 Z" fill={variant.waveColor} />
                      <rect x="42" y="22" width="6" height="26" fill={variant.strapColor} />
                      <rect x="39" y="30" width="12" height="10" rx="1" fill="none" stroke={variant.buckleColor} strokeWidth="1.5" />
                    </svg>
                  </div>
                  <span
                    className={`font-sans text-xs font-semibold tracking-tight ${
                      active ? 'text-[#D35B22] font-bold' : 'text-[#44403c] group-hover:text-[#171412]'
                    }`}
                  >
                    {variant.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Center Column: Floating Slipper on Glowing Pedestal with Connector Callouts */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center order-1 lg:order-2 py-8 min-h-[460px] sm:min-h-[520px]">
            
            {/* SVG Connector Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden sm:block" viewBox="0 0 500 460">
              {/* Top-Left Connector */}
              <path d="M 130 95 L 180 95 L 210 145" fill="none" stroke="#D35B22" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
              <circle cx="210" cy="145" r="4" fill="#D35B22" />
              <circle cx="210" cy="145" r="8" fill="#D35B22" fillOpacity="0.25" />

              {/* Bottom-Left Connector */}
              <path d="M 130 330 L 175 330 L 200 280" fill="none" stroke="#D35B22" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
              <circle cx="200" cy="280" r="4" fill="#D35B22" />
              <circle cx="200" cy="280" r="8" fill="#D35B22" fillOpacity="0.25" />

              {/* Top-Right Connector */}
              <path d="M 370 100 L 320 100 L 290 140" fill="none" stroke="#D35B22" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
              <circle cx="290" cy="140" r="4" fill="#D35B22" />
              <circle cx="290" cy="140" r="8" fill="#D35B22" fillOpacity="0.25" />

              {/* Bottom-Right Connector */}
              <path d="M 370 330 L 320 330 L 295 270" fill="none" stroke="#D35B22" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
              <circle cx="295" cy="270" r="4" fill="#D35B22" />
              <circle cx="295" cy="270" r="8" fill="#D35B22" fillOpacity="0.25" />
            </svg>

            {/* 4 Feature Callout Cards */}
            {/* Top-Left */}
            <div className="absolute top-4 sm:top-8 left-2 sm:left-6 z-20 flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-2xl border border-[#e7e4df] shadow-sm">
              <span className="w-7 h-7 rounded-xl bg-[#faf6f0] border border-[#ecdacb] flex items-center justify-center text-[#D35B22]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/></svg>
              </span>
              <div>
                <p className="font-sans text-[11px] font-bold text-[#171412] leading-tight">Premium Leather</p>
                <p className="font-sans text-[9px] text-[#78716c]">Leather & Leather construction</p>
              </div>
            </div>

            {/* Bottom-Left */}
            <div className="absolute bottom-20 sm:bottom-24 left-2 sm:left-6 z-20 flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-2xl border border-[#e7e4df] shadow-sm">
              <span className="w-7 h-7 rounded-xl bg-[#faf6f0] border border-[#ecdacb] flex items-center justify-center text-[#D35B22]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </span>
              <div>
                <p className="font-sans text-[11px] font-bold text-[#171412] leading-tight">All-Day Comfort</p>
                <p className="font-sans text-[9px] text-[#78716c]">Built for every journey</p>
              </div>
            </div>

            {/* Top-Right */}
            <div className="absolute top-4 sm:top-8 right-2 sm:right-6 z-20 flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-2xl border border-[#e7e4df] shadow-sm">
              <span className="w-7 h-7 rounded-xl bg-[#faf6f0] border border-[#ecdacb] flex items-center justify-center text-[#D35B22]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>
              </span>
              <div>
                <p className="font-sans text-[11px] font-bold text-[#171412] leading-tight">Lightweight Design</p>
                <p className="font-sans text-[9px] text-[#78716c]">Airy feel without limits</p>
              </div>
            </div>

            {/* Bottom-Right */}
            <div className="absolute bottom-20 sm:bottom-24 right-2 sm:right-6 z-20 flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-2xl border border-[#e7e4df] shadow-sm">
              <span className="w-7 h-7 rounded-xl bg-[#faf6f0] border border-[#ecdacb] flex items-center justify-center text-[#D35B22]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
              </span>
              <div>
                <p className="font-sans text-[11px] font-bold text-[#171412] leading-tight">Durable Outsole</p>
                <p className="font-sans text-[9px] text-[#78716c]">Hard-wearing traction tread</p>
              </div>
            </div>

            {/* Floating Shoe Display */}
            <div className="relative w-[320px] sm:w-[420px] aspect-[4/3] flex items-center justify-center my-6">
              
              {/* Slipper Graphic SVG (angled at -25 degrees) */}
              <div className="relative z-10 w-[300px] sm:w-[380px] -rotate-[24deg] translate-y-[-10px] drop-shadow-[0_25px_35px_rgba(0,0,0,0.35)] transition-all duration-300">
                <svg viewBox="0 0 450 320" className="w-full h-auto overflow-visible">
                  <defs>
                    <linearGradient id="corkTexture" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#C99E74" />
                      <stop offset="50%" stopColor="#B68B60" />
                      <stop offset="100%" stopColor="#A47B52" />
                    </linearGradient>
                    <linearGradient id="metalBuckle" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="50%" stopColor="#CBD5E1" />
                      <stop offset="100%" stopColor="#94A3B8" />
                    </linearGradient>
                  </defs>

                  {/* Ergonomic Cork Footbed */}
                  <path
                    d="M 50 190 C 50 130, 90 95, 170 100 C 260 105, 360 145, 400 190 C 420 215, 395 240, 340 250 C 230 270, 90 260, 50 190 Z"
                    fill="url(#corkTexture)"
                    stroke="#8C6642"
                    strokeWidth="3.5"
                  />

                  {/* Black Rubber Outsole Base */}
                  <path
                    d="M 53 195 C 53 205, 75 250, 130 260 C 220 275, 330 265, 375 235 L 385 225 C 345 252, 230 262, 130 252 C 80 242, 60 210, 53 195 Z"
                    fill="#1A1817"
                  />

                  {/* Main Suede/Leather Upper */}
                  <path
                    d="M 90 170 C 100 105, 180 75, 275 95 C 345 110, 390 160, 375 205 C 315 228, 215 222, 125 205 C 100 200, 90 188, 90 170 Z"
                    fill={selectedVariant.upperColor}
                  />

                  {/* Contrast Leather Wave Pattern Overlay */}
                  <path
                    d="M 180 82 C 220 100, 245 140, 250 175 C 255 200, 275 218, 310 210 C 335 205, 355 188, 365 170 C 345 158, 315 130, 275 95 Z"
                    fill={selectedVariant.waveColor}
                  />
                  <path
                    d="M 135 140 C 165 158, 195 180, 200 208 C 170 205, 145 192, 125 175 Z"
                    fill={selectedVariant.waveColor}
                  />

                  {/* Adjustable Buckle Strap */}
                  <path
                    d="M 180 90 L 215 218 L 180 224 L 145 96 Z"
                    fill={selectedVariant.strapColor}
                    stroke="#111111"
                    strokeWidth="2"
                  />

                  {/* Brushed Metallic Buckle Hardware */}
                  <rect
                    x="160"
                    y="135"
                    width="36"
                    height="44"
                    rx="6"
                    fill="none"
                    stroke="url(#metalBuckle)"
                    strokeWidth="6"
                  />
                  <line x1="178" y1="135" x2="178" y2="179" stroke="url(#metalBuckle)" strokeWidth="5" />
                </svg>
              </div>

              {/* 3D Glowing Metallic Podium & Volcanic Rock Accents */}
              <div className="absolute -bottom-10 w-[340px] sm:w-[440px] h-[100px] flex items-center justify-center pointer-events-none">
                {/* Ember Glow Floor Reflection */}
                <div className="absolute inset-0 bg-[#D35B22]/25 rounded-full blur-2xl animate-pulse" />

                {/* Metallic Stage Platform */}
                <div className="relative w-full h-[65px] rounded-[100%] bg-gradient-to-b from-[#2B2724] via-[#1A1816] to-[#0A0908] border-2 border-[#D35B22]/70 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-center">
                  {/* Top Glowing Core Ring */}
                  <div className="w-[90%] h-[46px] rounded-[100%] border border-[#E9A174]/80 bg-gradient-to-b from-[#1E1B18] to-[#080706] flex items-center justify-center">
                    <div className="w-[75%] h-[26px] rounded-[100%] bg-gradient-to-t from-[#D35B22]/50 to-transparent blur-[2px]" />
                  </div>
                </div>

                {/* Left Volcanic Rock Accents */}
                <div className="absolute -left-4 bottom-2 w-20 h-14 bg-gradient-to-tr from-[#161413] to-[#2E2825] rounded-tl-3xl rounded-br-2xl shadow-lg border-t border-[#D35B22]/40 -rotate-12" />
                
                {/* Right Volcanic Rock Accents */}
                <div className="absolute -right-4 bottom-2 w-24 h-16 bg-gradient-to-tl from-[#161413] to-[#2E2825] rounded-tr-3xl rounded-bl-2xl shadow-lg border-t border-[#D35B22]/40 rotate-12" />
              </div>
            </div>

            {/* 360° Interactive Badge */}
            <div className="relative z-20 mt-4 flex items-center gap-2 px-4 py-1.5 bg-[#171412] text-[#FAF7F2] rounded-full border border-[#D35B22]/50 shadow-md">
              <span className="text-[#E9A174] text-xs font-bold font-sans tracking-widest flex items-center gap-1.5">
                <span>&#8592;</span> 360° <span>&#8594;</span>
              </span>
            </div>
          </div>

          {/* Right Column: Product Detail & Purchase CTA */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left order-3">
            <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#171412] tracking-tight">
              UrbanEdge <span className="text-[#D35B22]">Pro</span>
            </h3>

            <p className="font-sans text-[11px] uppercase tracking-[0.25em] text-[#D35B22] font-bold mt-1.5 mb-3">
              STEP INTO EXCLUSIVITY
            </p>

            <p className="font-sans text-xs sm:text-sm text-[#78716c] leading-relaxed mb-6 max-w-sm">
              A refined blend of style, comfort and durability — made for those who choose more.
            </p>

            {/* Price Row */}
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-sans text-3xl sm:text-4xl font-extrabold text-[#171412]">₹ 4,999</span>
            </div>

            {/* Primary Add to Cart Pill Button */}
            <button
              onClick={handleAddToCart}
              className="w-full sm:w-auto min-w-[240px] h-13 px-8 rounded-full bg-[#E55315] hover:bg-[#CC470E] text-white font-sans text-xs uppercase tracking-wider font-bold shadow-lg shadow-[#E55315]/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 mb-3.5"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span>Add to Cart</span>
              <span className="text-base">&#8594;</span>
            </button>

            {/* Secondary Save for Later */}
            <button
              onClick={handleSaveForLater}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-semibold text-[#78716c] hover:text-[#171412] transition-colors py-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={isWishlisted ? '#E55315' : 'none'}
                stroke={isWishlisted ? '#E55315' : 'currentColor'}
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>{isWishlisted ? 'Saved in Wishlist' : 'Save for Later'}</span>
            </button>

            {/* Limited Stock Accent */}
            <div className="flex items-center justify-center lg:justify-start gap-2.5 mt-5 pt-5 border-t border-[#e7e4df] w-full sm:w-auto">
              <span className="w-8 h-px bg-[#d5cfc7]" />
              <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#934B19] font-bold">
                LIMITED STOCK
              </span>
              <span className="w-8 h-px bg-[#d5cfc7]" />
            </div>
          </div>
        </div>

        {/* ── Bottom 4 Feature Cards Grid ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-[#e7e4df]">
          {BOTTOM_FEATURES.map((feat) => (
            <div
              key={feat.title}
              className="bg-white rounded-2xl p-4 border border-[#e7e4df] shadow-sm hover:shadow-md transition-all group flex flex-col"
            >
              <div className="w-full h-36 rounded-xl overflow-hidden mb-3 bg-[#f5f2eb] relative">
                <img
                  src={feat.img}
                  alt={feat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
              </div>
              <h4 className="font-display text-sm font-bold text-[#171412] mb-0.5">{feat.title}</h4>
              <p className="font-sans text-xs text-[#78716c]">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
