import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore.js';
import useWishlistStore from '../store/wishlistStore.js';
import useAuthStore from '../store/authStore.js';
import { getProduct, DEFAULT_EXCLUSIVE_PRODUCT } from '../lib/api.js';
import toast from 'react-hot-toast';

export default function ExclusiveProductSection() {
  const navigate = useNavigate();
  const [product, setProduct] = useState(DEFAULT_EXCLUSIVE_PRODUCT);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { addItem, openCart } = useCartStore();
  const { user } = useAuthStore();
  
  const checkWishlisted = useWishlistStore((s) => s.isWishlisted);
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  // Touch & Mouse Drag Swipe State for Product Image Slider
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    // Fetch live product data from database/catalog
    getProduct('urbanedge-pro').then((data) => {
      if (data) setProduct(data);
    }).catch(() => setProduct(DEFAULT_EXCLUSIVE_PRODUCT));
  }, []);

  const variants = product.variants && product.variants.length > 0
    ? product.variants
    : DEFAULT_EXCLUSIVE_PRODUCT.variants;

  const selectedVariant = variants[selectedIndex] || variants[0];
  const selectedVariantId = selectedVariant?.id || (selectedVariant?.name ? selectedVariant.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : null);
  const isWishlisted = checkWishlisted(product.id, selectedVariantId, user);

  // Touch swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) > 30) {
      if (distance > 0) {
        setSelectedIndex((prev) => (prev + 1) % variants.length);
      } else {
        setSelectedIndex((prev) => (prev - 1 + variants.length) % variants.length);
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    isDragging.current = true;
    touchStartX.current = e.clientX;
    touchEndX.current = e.clientX;
  };

  const handleMouseUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const distance = touchStartX.current - e.clientX;
    if (Math.abs(distance) > 30) {
      if (distance > 0) {
        setSelectedIndex((prev) => (prev + 1) % variants.length);
      } else {
        setSelectedIndex((prev) => (prev - 1 + variants.length) % variants.length);
      }
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add to bag.');
      navigate('/login');
      return;
    }
    const itemToAdd = {
      id: product.id,
      variantId: selectedVariantId,
      name: product.name,
      price: product.price,
      original_price: product.original_price,
      image: selectedVariant.image || product.images?.[0],
      sizes: product.sizes || ['6', '7', '8', '9', '10', '11'],
      colors: [selectedVariant.name],
      category: product.category || 'sandals',
      stock: product.stock ?? 8,
    };

    addItem(itemToAdd, '8', selectedVariant.name, 1, user);
    openCart();
    toast.success(`${product.name} (${selectedVariant.name}) added to your bag!`);
  };

  const handleSaveForLater = () => {
    const isAdded = toggleWishlist(
      product.id,
      selectedVariantId,
      {
        variantName: selectedVariant.name,
        image: selectedVariant.image || product.images?.[0],
        price: product.price,
        name: product.name,
      },
      user
    );

    if (isAdded) {
      toast.success(`Saved ${product.name} (${selectedVariant.name}) to wishlist!`);
    } else {
      toast.success('Removed from wishlist.');
    }
  };

  return (
    <section className="relative z-10 w-full bg-[#FAF7F2] py-14 sm:py-20 lg:py-24 overflow-hidden border-b border-[#E8E2D8]">
      {/* Soft Radial Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[850px] h-[450px] sm:h-[600px] bg-gradient-radial from-[#FCEEE1]/90 via-[#F7E6D4]/30 to-transparent blur-3xl pointer-events-none z-0" />

      <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10">
        
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
          
          {/* LEFT COLUMN: Color Selector */}
          <div className="lg:col-span-3 flex lg:flex-col flex-row flex-nowrap overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 gap-2.5 sm:gap-3 order-2 lg:order-1 scrollbar-none z-20">
            <div className="w-full hidden lg:block mb-1">
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#78716C] font-bold">
                AVAILABLE FINISHES ({variants.length})
              </span>
            </div>

            {variants.map((v, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={v.id || v.name}
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
                      {v.name}
                    </p>
                    <span className="text-[10px] text-[#78716C] font-medium block mt-0.5">Handcrafted</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CENTER COLUMN: DEDICATED RELATIVE CENTRAL SHOWCASE CONTAINER */}
          <div className="lg:col-span-6 order-1 lg:order-2 flex items-center justify-center px-2 sm:px-4">
            
            {/* Central Showcase Parent Container */}
            <div className="relative w-full max-w-[440px] sm:max-w-[500px] lg:max-w-[540px] aspect-square mx-auto flex items-center justify-center">
              
              {/* Soft Product Shadow (Layer 1) */}
              <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[75%] h-[40px] bg-black/15 rounded-full blur-xl pointer-events-none z-[1]" />

              {/* Open Orange Orbit SVG Frame & Connector Lines (Layer 2) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-[2]" viewBox="0 0 500 500">
                <defs>
                  {/* Left Arc Gradient for soft fading tips */}
                  <linearGradient id="leftArcFade" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#D35B22" stopOpacity="0" />
                    <stop offset="20%" stopColor="#D35B22" stopOpacity="0.8" />
                    <stop offset="80%" stopColor="#D35B22" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#D35B22" stopOpacity="0" />
                  </linearGradient>

                  {/* Right Arc Gradient for soft fading tips */}
                  <linearGradient id="rightArcFade" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#D35B22" stopOpacity="0" />
                    <stop offset="20%" stopColor="#D35B22" stopOpacity="0.8" />
                    <stop offset="80%" stopColor="#D35B22" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#D35B22" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Left Arc Segment (Soft fading top & bottom ends) */}
                <path
                  d="M 132.42 82.08 A 205 205 0 0 0 132.42 417.92"
                  fill="none"
                  stroke="url(#leftArcFade)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                {/* Right Arc Segment (Soft fading top & bottom ends) */}
                <path
                  d="M 367.58 82.08 A 205 205 0 0 1 367.58 417.92"
                  fill="none"
                  stroke="url(#rightArcFade)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                {/* Connector Lines from Callouts directly to Orbit Dots (No Gap) */}
                <line x1="50" y1="132.42" x2="82.08" y2="132.42" stroke="#D35B22" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />
                <line x1="50" y1="367.58" x2="82.08" y2="367.58" stroke="#D35B22" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />
                <line x1="450" y1="132.42" x2="417.92" y2="132.42" stroke="#D35B22" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />
                <line x1="450" y1="367.58" x2="417.92" y2="367.58" stroke="#D35B22" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />

                {/* 4 Reduced Size Orange Connection Dots directly on the Orbit Arcs */}
                <circle cx="82.08" cy="132.42" r="4" fill="#D35B22" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="82.08" cy="367.58" r="4" fill="#D35B22" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="417.92" cy="132.42" r="4" fill="#D35B22" stroke="#FFFFFF" strokeWidth="1.5" />
                <circle cx="417.92" cy="367.58" r="4" fill="#D35B22" stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>

              {/* 4 Connected Unique Feature Callouts (Desktop / Large Screen - Layer 20) */}
              {/* 1. Top Left: Premium Leather */}
              <div className="hidden xl:flex absolute top-[26.5%] left-[-50px] -translate-y-1/2 z-20 flex-col items-center text-center max-w-[130px] pointer-events-auto">
                <div className="w-9 h-9 rounded-full bg-white border border-[#D35B22]/40 shadow-sm flex items-center justify-center text-[#D35B22] mb-1.5 flex-shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h4 className="font-display text-xs font-bold text-[#171412] leading-tight">Premium Leather</h4>
                <p className="font-sans text-[10px] text-[#78716C] leading-snug mt-0.5">Luxury that lasts</p>
              </div>

              {/* 2. Top Right: Lightweight Design */}
              <div className="hidden xl:flex absolute top-[26.5%] right-[-50px] -translate-y-1/2 z-20 flex-col items-center text-center max-w-[130px] pointer-events-auto">
                <div className="w-9 h-9 rounded-full bg-white border border-[#D35B22]/40 shadow-sm flex items-center justify-center text-[#D35B22] mb-1.5 flex-shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
                    <line x1="16" y1="8" x2="2" y2="22"/>
                    <line x1="17.5" y1="15" x2="9" y2="15"/>
                  </svg>
                </div>
                <h4 className="font-display text-xs font-bold text-[#171412] leading-tight">Lightweight Design</h4>
                <p className="font-sans text-[10px] text-[#78716C] leading-snug mt-0.5">Airy feel without limits</p>
              </div>

              {/* 3. Bottom Left: All-Day Comfort (Soft Cushion / Cloud Icon - Unique!) */}
              <div className="hidden xl:flex absolute top-[73.5%] left-[-50px] -translate-y-1/2 z-20 flex-col items-center text-center max-w-[130px] pointer-events-auto">
                <div className="w-9 h-9 rounded-full bg-white border border-[#D35B22]/40 shadow-sm flex items-center justify-center text-[#D35B22] mb-1.5 flex-shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                  </svg>
                </div>
                <h4 className="font-display text-xs font-bold text-[#171412] leading-tight">All-Day Comfort</h4>
                <p className="font-sans text-[10px] text-[#78716C] leading-snug mt-0.5">Built for every journey</p>
              </div>

              {/* 4. Bottom Right: Durable Outsole (Shield Icon) */}
              <div className="hidden xl:flex absolute top-[73.5%] right-[-50px] -translate-y-1/2 z-20 flex-col items-center text-center max-w-[130px] pointer-events-auto">
                <div className="w-9 h-9 rounded-full bg-white border border-[#D35B22]/40 shadow-sm flex items-center justify-center text-[#D35B22] mb-1.5 flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h4 className="font-display text-xs font-bold text-[#171412] leading-tight">Durable Outsole</h4>
                <p className="font-sans text-[10px] text-[#78716C] leading-snug mt-0.5">Made for everyday terrain</p>
              </div>

              {/* SWIPEABLE & DRAGGABLE PRODUCT IMAGE SLIDER (Layer 10) */}
              <div
                className="relative z-10 w-[80%] h-[80%] flex items-center justify-center overflow-hidden animate-float cursor-grab active:cursor-grabbing select-none touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div
                  className="w-full h-full flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
                >
                  {variants.map((v) => (
                    <div key={v.id || v.name} className="w-full h-full flex-shrink-0 flex items-center justify-center p-2">
                      <img
                        src={v.image}
                        alt={`${product.name} ${v.name}`}
                        className="w-full h-full object-contain filter drop-shadow-[0_20px_25px_rgba(0,0,0,0.2)]"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT COLUMN: Real Catalog Product Information & Purchase Panel */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-left order-3 z-20">
            <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#D35B22] font-bold mb-1.5">
              {product.badge || 'LIMITED EDITION'}
            </span>

            <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#171412] tracking-tight mb-1">
              {product.name}
            </h3>

            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#D35B22] font-bold mb-3">
              {product.tagline || 'STEP INTO EXCLUSIVITY'}
            </p>

            <p className="font-sans text-xs sm:text-sm text-[#78716C] leading-relaxed mb-6 max-w-sm">
              {product.description || 'A refined blend of style, comfort and durability — made for those who choose more.'}
            </p>

            {/* Price Display */}
            <div className="mb-6 flex items-baseline gap-2.5">
              <span className="font-sans text-3xl sm:text-4xl font-extrabold text-[#171412]">
                ₹ {product.price?.toLocaleString()}
              </span>
              {product.original_price && (
                <span className="font-sans text-sm text-[#A8A29E] line-through">
                  ₹ {product.original_price?.toLocaleString()}
                </span>
              )}
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

            {/* Limited Stock Label */}
            <div className="flex items-center justify-center lg:justify-start gap-2.5 mt-5 pt-5 border-t border-[#E8E2D8] w-full sm:w-auto">
              <span className="w-8 h-px bg-[#D5CFC7]" />
              <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#934B19] font-bold">
                LIMITED EDITION
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
            { title: 'All-Day Comfort', desc: 'Built for every journey', icon: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z' },
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

      </div>
    </section>
  );
}
