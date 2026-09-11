import { useState, useRef } from 'react';
import useCartStore from '../store/cartStore.js';
import useWishlistStore from '../store/wishlistStore.js';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

const COLOR_VARIANTS = [
  {
    id: 'maroon-black',
    name: 'Maroon / Black',
    label: 'Maroon/Black',
    image: '/products/exclusive/urbanedge_maroon_black.jpg',
    colorHex: '#5C1D24',
    secondaryHex: '#1A1816',
  },
  {
    id: 'mustard-brown',
    name: 'Mustard / Brown',
    label: 'Mustard/Brown',
    image: '/products/exclusive/urbanedge_mustard_brown.jpg',
    colorHex: '#D49B24',
    secondaryHex: '#542E16',
  },
  {
    id: 'burgundy-cream',
    name: 'Burgundy / Cream',
    label: 'Burgundy/Cream',
    image: '/products/exclusive/urbanedge_burgundy_cream.jpg',
    colorHex: '#722030',
    secondaryHex: '#EAE5D9',
  },
  {
    id: 'pink-brown',
    name: 'Pink / Brown',
    label: 'Pink/Brown',
    image: '/products/exclusive/urbanedge_pink_brown.jpg',
    colorHex: '#DE989C',
    secondaryHex: '#5C3826',
  },
  {
    id: 'lightblue-grey',
    name: 'Light Blue / Grey',
    label: 'Light Blue/Grey',
    image: '/products/exclusive/urbanedge_lightblue_grey.jpg',
    colorHex: '#8DAAC0',
    secondaryHex: '#4A525A',
  },
  {
    id: 'forestgreen-cream',
    name: 'Forest Green / Cream',
    label: 'Forest Green/Cream',
    image: '/products/exclusive/urbanedge_forestgreen_cream.jpg',
    colorHex: '#2E5339',
    secondaryHex: '#EDE8DC',
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
  const [selectedVariant, setSelectedVariant] = useState(COLOR_VARIANTS[0]);
  const [rotateAngle, setRotateAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  const { addItem, openCart } = useCartStore();
  const { user } = useAuthStore();
  const isWishlisted = useWishlistStore((s) => s.isWishlisted('urbanedge-pro', user));
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const containerRef = useRef(null);

  // Mouse tilt parallax for realistic 3D feel
  const handleMouseMove = (e) => {
    if (!containerRef.current || isDragging) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setMouseTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  // Interactive 360 drag simulation
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX || (e.touches && e.touches[0].clientX) || 0);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const diff = (currentX - startX) * 0.4;
    setRotateAngle((prev) => prev + diff);
    setStartX(currentX);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleAddToCart = () => {
    const productData = {
      id: 'urbanedge-pro',
      name: `UrbanEdge Pro (${selectedVariant.name})`,
      price: 4999,
      original_price: 6499,
      image: selectedVariant.image,
      sizes: ['6', '7', '8', '9', '10', '11'],
      colors: [selectedVariant.name],
      category: 'slippers',
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
      {/* Subtle Warm Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#FAF0E6]/80 via-[#F5E6D3]/40 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="container-max px-4 sm:px-6 lg:px-8">
        {/* ── Top Header ────────────────────────────────────────── */}
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

        {/* ── Main 3-Column Showcase ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center mb-16 lg:mb-20">
          
          {/* Left Column: Color Variants Selector */}
          <div className="lg:col-span-3 flex lg:flex-col flex-row flex-wrap justify-center lg:justify-start gap-2.5 sm:gap-3 order-2 lg:order-1">
            <div className="w-full hidden lg:block mb-1">
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#78716C] font-bold">
                Available Finishes ({COLOR_VARIANTS.length})
              </span>
            </div>

            {COLOR_VARIANTS.map((v) => {
              const isSelected = selectedVariant.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`relative flex items-center gap-3 p-1.5 sm:p-2 rounded-2xl transition-all duration-300 text-left group w-[140px] sm:w-[155px] lg:w-full bg-white border ${
                    isSelected
                      ? 'border-[#D35B22] shadow-[0_4px_16px_rgba(211,91,34,0.18)] scale-[1.02]'
                      : 'border-[#E8E2D8] hover:border-[#D35B22]/50 hover:shadow-sm opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[#FAF7F2] p-1 flex-shrink-0 flex items-center justify-center border border-[#E8E2D8]/60">
                    <img
                      src={v.image}
                      alt={v.name}
                      className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>

                  {/* Label */}
                  <div className="min-w-0 pr-1">
                    <p className={`font-sans text-xs sm:text-xs font-bold leading-tight truncate ${isSelected ? 'text-[#D35B22]' : 'text-[#171412]'}`}>
                      {v.label}
                    </p>
                    <span className="text-[10px] text-[#A8A29E] font-medium block">Handcrafted</span>
                  </div>

                  {/* Active Indicator Dot */}
                  {isSelected && (
                    <span className="absolute right-2 top-2 w-2 h-2 rounded-full bg-[#D35B22] animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Center Column: 3D Product & 360° Turntable */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseMoveCapture={handleDragMove}
            onMouseUp={handleDragEnd}
            onTouchStart={handleMouseDown}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            className="lg:col-span-6 relative flex flex-col items-center justify-center min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] select-none cursor-grab active:cursor-grabbing order-1 lg:order-2"
          >
            {/* 4 Feature Callouts Surrounding Shoe */}
            {/* 1. Top Left: Premium Leather */}
            <div className="hidden sm:flex absolute top-4 left-0 sm:left-4 z-20 items-start gap-2.5 max-w-[150px] text-left pointer-events-auto group">
              <div className="w-8 h-8 rounded-full bg-white border border-[#D35B22]/40 shadow-md flex items-center justify-center text-[#D35B22] flex-shrink-0">
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
            <div className="hidden sm:flex absolute top-4 right-0 sm:right-4 z-20 items-start gap-2.5 max-w-[150px] text-right sm:flex-row-reverse pointer-events-auto group">
              <div className="w-8 h-8 rounded-full bg-white border border-[#D35B22]/40 shadow-md flex items-center justify-center text-[#D35B22] flex-shrink-0">
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
            <div className="hidden sm:flex absolute bottom-20 left-0 sm:left-4 z-20 items-start gap-2.5 max-w-[150px] text-left pointer-events-auto group">
              <div className="w-8 h-8 rounded-full bg-white border border-[#D35B22]/40 shadow-md flex items-center justify-center text-[#D35B22] flex-shrink-0">
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
            <div className="hidden sm:flex absolute bottom-20 right-0 sm:right-4 z-20 items-start gap-2.5 max-w-[150px] text-right sm:flex-row-reverse pointer-events-auto group">
              <div className="w-8 h-8 rounded-full bg-white border border-[#D35B22]/40 shadow-md flex items-center justify-center text-[#D35B22] flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-display text-xs font-bold text-[#171412] leading-tight">Durable Outsole</h4>
                <p className="font-sans text-[10px] text-[#78716C] leading-snug">Made for everyday terrain</p>
              </div>
            </div>

            {/* Floating 3D Main Product Image */}
            <div
              style={{
                transform: `perspective(1000px) rotateX(${mouseTilt.y}deg) rotateY(${mouseTilt.x + rotateAngle * 0.15}deg) translateY(-10px)`,
                transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              className="relative z-10 w-[270px] sm:w-[340px] md:w-[380px] lg:w-[410px] aspect-square flex items-center justify-center"
            >
              <img
                key={selectedVariant.id}
                src={selectedVariant.image}
                alt={selectedVariant.name}
                className="w-full h-full object-contain filter drop-shadow-[0_24px_30px_rgba(0,0,0,0.22)] animate-fade-in transition-all duration-500 hover:scale-105"
                draggable={false}
              />
            </div>

            {/* 3D Circular Turntable Platform */}
            <div className="relative -mt-16 sm:-mt-20 w-[300px] sm:w-[380px] md:w-[440px] h-[90px] flex items-center justify-center pointer-events-none">
              {/* Floor Neon Glow */}
              <div className="absolute inset-0 bg-[#D35B22]/20 rounded-full blur-2xl animate-pulse" />

              {/* Podium Base Metallic Disc */}
              <div className="relative w-full h-[58px] rounded-[100%] bg-gradient-to-b from-[#2B2724] via-[#1A1816] to-[#0A0908] border-2 border-[#D35B22]/80 shadow-[0_18px_36px_rgba(0,0,0,0.55)] flex items-center justify-center">
                {/* Glowing Core Ring */}
                <div className="w-[90%] h-[42px] rounded-[100%] border border-[#E9A174] bg-gradient-to-b from-[#1C1A18] to-[#080706] flex items-center justify-center">
                  <div className="w-[75%] h-[24px] rounded-[100%] bg-gradient-to-t from-[#D35B22]/60 to-transparent blur-[2px]" />
                </div>
              </div>

              {/* Side Dark Volcanic Textured Elements */}
              <div className="absolute -left-3 bottom-1 w-16 h-12 bg-[#1C1A18] rounded-tl-2xl shadow-lg border-t border-[#D35B22]/30 -rotate-12" />
              <div className="absolute -right-3 bottom-1 w-18 h-14 bg-[#1C1A18] rounded-tr-2xl shadow-lg border-t border-[#D35B22]/30 rotate-12" />
            </div>

            {/* 360° Interactive Badge */}
            <div className="relative z-20 mt-3 flex items-center gap-1.5 px-4 py-1.5 bg-[#171412] text-[#FAF7F2] rounded-full border border-[#D35B22]/50 shadow-md">
              <span className="text-[#E9A174] text-[11px] font-bold font-sans tracking-widest flex items-center gap-1.5">
                <span>&#8592;</span> 360° <span>&#8594;</span>
              </span>
            </div>
          </div>

          {/* Right Column: Product Detail & Purchase Panel */}
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

            {/* Price */}
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-sans text-3xl sm:text-4xl font-extrabold text-[#171412]">
                ₹ 4,999
              </span>
              <span className="font-sans text-xs text-[#A8A29E] line-through">
                ₹ 6,499
              </span>
            </div>

            {/* Primary Add to Cart CTA */}
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

            {/* Save for Later Wishlist Button */}
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

            {/* Limited Stock Badge */}
            <div className="flex items-center justify-center lg:justify-start gap-2.5 mt-5 pt-5 border-t border-[#E8E2D8] w-full sm:w-auto">
              <span className="w-8 h-px bg-[#D5CFC7]" />
              <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#934B19] font-bold">
                LIMITED STOCK
              </span>
              <span className="w-8 h-px bg-[#D5CFC7]" />
            </div>
          </div>
        </div>

        {/* ── Bottom 4 Feature Cards Grid ────────────────────────────── */}
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
