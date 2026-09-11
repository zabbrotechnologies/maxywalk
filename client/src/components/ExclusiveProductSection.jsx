import { useState } from 'react';
import useCartStore from '../store/cartStore.js';
import useWishlistStore from '../store/wishlistStore.js';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

const COLOR_VARIANTS = [
  {
    id: 'black',
    name: 'Black',
    label: 'Black',
    image: '/products/exclusive/black.png',
    colorHex: '#1F1E1D',
  },
  {
    id: 'maroon',
    name: 'Maroon',
    label: 'Maroon',
    image: '/products/exclusive/maroon.png',
    colorHex: '#5A2328',
  },
  {
    id: 'sandal-wood',
    name: 'Sandal / Wood',
    label: 'Sandal / Wood',
    image: '/products/exclusive/sandal_wood.png',
    colorHex: '#C28B53',
  },
  {
    id: 'lightblue',
    name: 'Light Blue',
    label: 'Light Blue',
    image: '/products/exclusive/lightblue.png',
    colorHex: '#88A0B5',
  },
  {
    id: 'grey',
    name: 'Grey',
    label: 'Grey',
    image: '/products/exclusive/grey.png',
    colorHex: '#6E6C6B',
  },
  {
    id: 'olivegreen',
    name: 'Olive Green',
    label: 'Olive Green',
    image: '/products/exclusive/olivegreen.png',
    colorHex: '#535D4A',
  },
  {
    id: 'rose',
    name: 'Rose',
    label: 'Rose',
    image: '/products/exclusive/rose.png',
    colorHex: '#B85B64',
  },
  {
    id: 'lightpink',
    name: 'Light Pink',
    label: 'Light Pink',
    image: '/products/exclusive/lightpink.png',
    colorHex: '#D6A29C',
  },
];

const DETAIL_CARDS = [
  {
    title: 'Premium Finish',
    desc: 'Rich textures. Lasting impression.',
    image: '/products/exclusive/detail_premium_finish.jpg',
  },
  {
    title: 'Grip & Stability',
    desc: 'Engineered for every step.',
    image: '/products/exclusive/detail_grip_stability.jpg',
  },
  {
    title: 'All-Day Comfort',
    desc: "Cushioned for what's next.",
    image: '/products/exclusive/detail_allday_comfort.jpg',
  },
  {
    title: 'Signature Detail',
    desc: 'Subtle branding. Bold identity.',
    image: '/products/exclusive/detail_signature_detail.jpg',
  },
];

export default function ExclusiveProductSection() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { addItem, openCart } = useCartStore();
  const { user } = useAuthStore();

  const selectedVariant = COLOR_VARIANTS[selectedIndex];
  const isWishlisted = useWishlistStore((s) => s.isWishlisted('urbanedge-pro', user));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const handleAddToCart = () => {
    const productData = {
      id: 'urbanedge-pro',
      name: `UrbanEdge Pro (${selectedVariant.name})`,
      price: 4999,
      original_price: 6499,
      image: selectedVariant.image,
      sizes: ['6', '7', '8', '9', '10', '11'],
      colors: [selectedVariant.name],
      category: 'sandals',
      stock: 8,
    };

    addItem(productData, '8', selectedVariant.name, 1, user);
    openCart();
    toast.success('UrbanEdge Pro added to your bag!');
  };

  const handleSaveForLater = () => {
    toggleWishlist('urbanedge-pro', user);
    if (!isWishlisted) {
      toast.success('Saved to wishlist!');
    }
  };

  return (
    <section className="relative w-full bg-[#FAF7F2] py-14 sm:py-20 lg:py-24 overflow-hidden border-b border-[#E8E2D8]">
      {/* Subtle Warm Background Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[850px] h-[450px] sm:h-[600px] bg-gradient-radial from-[#FCEEE1]/90 via-[#F7E6D4]/30 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="container-max px-4 sm:px-6 lg:px-8">
        {/* ── Top Section Header ────────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 lg:mb-16">
          <div className="inline-flex items-center justify-center gap-3 mb-3">
            <span className="w-8 sm:w-12 h-px bg-[#D35B22]/60" />
            <span className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#D35B22] font-bold">
              EXCLUSIVE PRODUCT
            </span>
            <span className="w-8 sm:w-12 h-px bg-[#D35B22]/60" />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#171412] tracking-tight leading-tight mb-2 sm:mb-3">
            Crafted for <span className="text-[#D35B22]">a Higher You</span>
          </h2>

          <p className="font-sans text-xs sm:text-sm md:text-base text-[#78716C] tracking-wide font-medium">
            Limited. Distinct. Unforgettable.
          </p>
        </div>

        {/* ── Main 3-Column Composition ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center mb-16 lg:mb-20">
          
          {/* LEFT COLUMN: Color Selector (Desktop Vertical, Mobile/Tablet Horizontal Scroll) */}
          <div className="lg:col-span-3 flex lg:flex-col flex-row flex-nowrap overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 gap-2.5 sm:gap-3 order-2 lg:order-1 scrollbar-none">
            <div className="w-full hidden lg:block mb-1">
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#78716C] font-bold">
                AVAILABLE FINISHES ({COLOR_VARIANTS.length})
              </span>
            </div>

            {COLOR_VARIANTS.map((v, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`relative flex items-center gap-3 p-2 sm:p-2.5 rounded-2xl transition-all duration-300 text-left group flex-shrink-0 min-w-[150px] lg:min-w-0 lg:w-full cursor-pointer bg-white border ${
                    isSelected
                      ? 'border-[#D35B22] shadow-[0_4px_20px_rgba(211,91,34,0.18)] scale-[1.03]'
                      : 'border-[#E8E2D8] hover:border-[#D35B22]/50 hover:shadow-sm opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[#FAF7F2] p-1 flex-shrink-0 flex items-center justify-center border border-[#E8E2D8]/60">
                    <img
                      src={v.image}
                      alt={v.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>

                  {/* Label */}
                  <div className="min-w-0 pr-1">
                    <p className={`font-sans text-xs font-bold leading-tight truncate ${isSelected ? 'text-[#D35B22]' : 'text-[#171412]'}`}>
                      {v.label}
                    </p>
                    <span className="text-[10px] text-[#78716C] font-medium block mt-0.5">Handcrafted</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CENTER COLUMN: Supplied Product Showcase & Realistic Turntable Base */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center min-h-[420px] sm:min-h-[500px] lg:min-h-[560px] order-1 lg:order-2 px-2 sm:px-4">
            
            {/* 4 Connected Feature Callouts (Desktop / Large Tablet Only) */}
            {/* 1. Top Left: Premium Leather */}
            <div className="hidden xl:flex absolute top-4 left-[-20px] z-20 items-start gap-2.5 max-w-[150px] text-left">
              <div className="w-8 h-8 rounded-full bg-white border border-[#D35B22]/40 shadow-sm flex items-center justify-center text-[#D35B22] flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h4 className="font-display text-xs font-bold text-[#171412] leading-tight">Premium Leather</h4>
                <p className="font-sans text-[10px] text-[#78716C] leading-snug">Luxury that lasts</p>
              </div>
            </div>

            {/* 2. Top Right: Lightweight Design */}
            <div className="hidden xl:flex absolute top-4 right-[-20px] z-20 items-start gap-2.5 max-w-[150px] text-right flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-white border border-[#D35B22]/40 shadow-sm flex items-center justify-center text-[#D35B22] flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
                  <line x1="16" y1="8" x2="2" y2="22"/>
                  <line x1="17.5" y1="15" x2="9" y2="15"/>
                </svg>
              </div>
              <div>
                <h4 className="font-display text-xs font-bold text-[#171412] leading-tight">Lightweight Design</h4>
                <p className="font-sans text-[10px] text-[#78716C] leading-snug">Airy feel without limits</p>
              </div>
            </div>

            {/* 3. Bottom Left: All-Day Comfort */}
            <div className="hidden xl:flex absolute bottom-28 left-[-20px] z-20 items-start gap-2.5 max-w-[150px] text-left">
              <div className="w-8 h-8 rounded-full bg-white border border-[#D35B22]/40 shadow-sm flex items-center justify-center text-[#D35B22] flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                  <polyline points="2 17 12 22 22 17"/>
                  <polyline points="2 12 12 17 22 12"/>
                </svg>
              </div>
              <div>
                <h4 className="font-display text-xs font-bold text-[#171412] leading-tight">All-Day Comfort</h4>
                <p className="font-sans text-[10px] text-[#78716C] leading-snug">Built for every journey</p>
              </div>
            </div>

            {/* 4. Bottom Right: Durable Outsole */}
            <div className="hidden xl:flex absolute bottom-28 right-[-20px] z-20 items-start gap-2.5 max-w-[150px] text-right flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-white border border-[#D35B22]/40 shadow-sm flex items-center justify-center text-[#D35B22] flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-display text-xs font-bold text-[#171412] leading-tight">Durable Outsole</h4>
                <p className="font-sans text-[10px] text-[#78716C] leading-snug">Made for everyday terrain</p>
              </div>
            </div>

            {/* Floating Animation Wrapper & Smooth Slide Track */}
            <div className="relative z-10 w-full max-w-[420px] sm:max-w-[500px] lg:max-w-[560px] aspect-[4/3] flex items-center justify-center overflow-hidden animate-[float_4s_easeInOut_infinite]">
              <div
                className="w-full h-full flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
              >
                {COLOR_VARIANTS.map((v) => (
                  <div key={v.id} className="w-full h-full flex-shrink-0 flex items-center justify-center p-2">
                    <img
                      src={v.image}
                      alt={`UrbanEdge Pro ${v.name}`}
                      className="w-full h-full object-contain filter drop-shadow-[0_24px_30px_rgba(0,0,0,0.22)]"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Realistic Turntable Platform Base from Reference Image 5 */}
            <div className="relative -mt-16 sm:-mt-22 w-[340px] sm:w-[440px] md:w-[500px] h-[100px] flex items-center justify-center pointer-events-none">
              {/* Floor Neon Ambient Glow */}
              <div className="absolute inset-0 bg-[#D35B22]/20 rounded-full blur-2xl animate-pulse" />

              {/* Realistic Turntable Base Image */}
              <img
                src="/products/exclusive/realistic_turntable_base.png"
                alt="360 Turntable Base"
                className="w-full h-full object-contain filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.45)]"
              />

              {/* 360° Text Badge Overlay inside turntable center */}
              <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto">
                <span className="text-[#FAF7F2] text-[11px] sm:text-xs font-bold font-sans tracking-widest flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/20 shadow-md">
                  <span>&#8592;</span> 360° <span>&#8594;</span>
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Information & Cart Action Panel */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-left order-3">
            <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#D35B22] font-bold mb-1.5">
              LIMITED EDITION
            </span>

            <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#171412] tracking-tight mb-1">
              UrbanEdge <span className="text-[#D35B22]">Pro</span>
            </h3>

            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#D35B22] font-bold mb-3">
              STEP INTO EXCLUSIVITY
            </p>

            <p className="font-sans text-xs sm:text-sm text-[#78716C] leading-relaxed mb-6 max-w-sm">
              A refined blend of style, comfort and durability — made for those who choose more.
            </p>

            {/* Price Display */}
            <div className="mb-6 flex items-baseline gap-2.5">
              <span className="font-sans text-3xl sm:text-4xl font-extrabold text-[#171412]">
                ₹ 4,999
              </span>
              <span className="font-sans text-sm text-[#A8A29E] line-through">
                ₹ 6,499
              </span>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-full sm:w-auto min-w-[240px] h-13 px-8 rounded-full bg-[#E55315] hover:bg-[#CC470E] text-white font-sans text-xs uppercase tracking-wider font-bold shadow-lg shadow-[#E55315]/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 mb-3.5 cursor-pointer"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span>Add to Cart</span>
              <span className="text-base">&#8594;</span>
            </button>

            {/* Save for Later Button */}
            <button
              onClick={handleSaveForLater}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-semibold text-[#78716C] hover:text-[#171412] transition-colors py-2 cursor-pointer"
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

            {/* Limited Stock Label */}
            <div className="flex items-center justify-center lg:justify-start gap-2.5 mt-5 pt-5 border-t border-[#E8E2D8] w-full sm:w-auto">
              <span className="w-8 h-px bg-[#D5CFC7]" />
              <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#934B19] font-bold">
                LIMITED STOCK
              </span>
              <span className="w-8 h-px bg-[#D5CFC7]" />
            </div>
          </div>
        </div>

        {/* ── Feature Callouts Strip (Mobile / Tablet Display) ────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xl:hidden mb-12 p-4 bg-white rounded-2xl border border-[#E8E2D8]">
          {[
            { title: 'Premium Leather', desc: 'Luxury that lasts', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
            { title: 'Lightweight Design', desc: 'Airy feel without limits', icon: 'M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z' },
            { title: 'All-Day Comfort', desc: 'Built for every journey', icon: 'M12 2L2 7l10 5 10-5-10-5z' },
            { title: 'Durable Outsole', desc: 'Made for everyday terrain', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-2.5 p-2">
              <div className="w-7 h-7 rounded-full bg-[#FAF7F2] border border-[#D35B22]/30 flex items-center justify-center text-[#D35B22] flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={item.icon} />
                </svg>
              </div>
              <div className="min-w-0">
                <h5 className="font-display text-[11px] font-bold text-[#171412] leading-tight truncate">{item.title}</h5>
                <p className="font-sans text-[9px] text-[#78716C] leading-none truncate mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom 4 Detail Cards Grid ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-[#E8E2D8]">
          {DETAIL_CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-4 border border-[#E8E2D8] shadow-sm hover:shadow-md hover:border-[#D35B22]/50 transition-all duration-300 group flex flex-col"
            >
              <div className="w-full h-36 rounded-xl overflow-hidden mb-3 bg-[#FAF7F2] relative">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
              </div>
              <h4 className="font-display text-sm font-bold text-[#171412] mb-0.5">{card.title}</h4>
              <p className="font-sans text-xs text-[#78716C]">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
