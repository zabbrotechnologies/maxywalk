import { useState } from 'react';
import useCartStore from '../store/cartStore.js';
import useWishlistStore from '../store/wishlistStore.js';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

const COLORWAYS = [
  {
    id: 'maroon-black',
    name: 'Maroon/Black',
    primary: '#681826',
    secondary: '#1A1A1A',
    upperColor: '#5c1722',
    accentColor: '#1e1c1d',
    strapColor: '#1a1a1a',
    soleColor: '#C49B71',
    thumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMFcuIlEmOinqex53O1uTOd9tVyWYPSQLQrm79f8hx2_SDW3A9bJ26yPiHsSbdTlHXxgyce-_FVrtMjwFy5EP0GnvX5ip_JuZLB7h3fwc0bwVP4-4G_zwEs9gN4FJyDaQDWlVuNQ4ioWAeEmEvTIOf4X_ok5v7INXpniWrrqTweVWSss_5QYV35113F4ocyduEN5BWZdivdoyC71DQJ2OJHJ1m9sq8BKO346Sp7xK8dfFta2DXtV--',
  },
  {
    id: 'mustard-brown',
    name: 'Mustard/Brown',
    primary: '#D49B28',
    secondary: '#4A2F1B',
    upperColor: '#c99126',
    accentColor: '#4a2f1b',
    strapColor: '#4a2f1b',
    soleColor: '#C49B71',
    thumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkZZLptrzF3_pLJdGwE1D0fzBf9J6BskKwY_creH1fEwQGjpA8E1ZqUMQcf5oG0DPqTdDQOe0jiSWO8xDYWLfLedhMNKW5or3L6QIdT4kNWSpCsGqeM06tYRvuYRe-Y1giC2c_OBy7TTJgqxv_s8CrqRLxmNSIM6YZu8lhceL1wjSjQPg39qPyrz461bIcjc5-OvPVhEnA2eJ7fhvH0yagBHcjNNgrqediDKAK4ax5ilJPk55aRuEG',
  },
  {
    id: 'burgundy-cream',
    name: 'Burgundy/Cream',
    primary: '#5B1728',
    secondary: '#E8DFD1',
    upperColor: '#521423',
    accentColor: '#f1ebd9',
    strapColor: '#521423',
    soleColor: '#C49B71',
    thumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMFcuIlEmOinqex53O1uTOd9tVyWYPSQLQrm79f8hx2_SDW3A9bJ26yPiHsSbdTlHXxgyce-_FVrtMjwFy5EP0GnvX5ip_JuZLB7h3fwc0bwVP4-4G_zwEs9gN4FJyDaQDWlVuNQ4ioWAeEmEvTIOf4X_ok5v7INXpniWrrqTweVWSss_5QYV35113F4ocyduEN5BWZdivdoyC71DQJ2OJHJ1m9sq8BKO346Sp7xK8dfFta2DXtV--',
  },
  {
    id: 'pink-brown',
    name: 'Pink/Brown',
    primary: '#C97D8A',
    secondary: '#5C3827',
    upperColor: '#c77d8a',
    accentColor: '#5c3827',
    strapColor: '#5c3827',
    soleColor: '#C49B71',
    thumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6nu1sVJmuhxAQ780WR1vB5n2GcenI6W1NEgIRGAtZ764Uk7UFV_qgPyRj4dUUa3_i3cEJzM0FMnQHO1bDZtTNzseokXLTXkHKNUbZ3FHh6-9y5IFlhZ1G32aWG7VkQo8lLYxbgyXU_-lfRXcycfUG1YLiotTERB6_SdATPIZXQwkb5gsWCb01lyDb3FXWWRORbBqQjQUgcWMHX-z_st_7AE1V523NomA9G1imL9bX3nDArBQnGVg',
  },
  {
    id: 'light-blue-grey',
    name: 'Light Blue/Grey',
    primary: '#7E9BB5',
    secondary: '#3D4A54',
    upperColor: '#7b98b2',
    accentColor: '#3d4a54',
    strapColor: '#3d4a54',
    soleColor: '#C49B71',
    thumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAy9uIBLtM48fYq1AlBrQamS2Dj7jXFNVNX2n814Z51DiV4LuTj-EnP57VbeZkSNwLHeXpomeiGTawYezijQB25UOFsQ4z4E5llsZz_4RLODXSoe-0bpC4GZ8UN0PUA8d29RmafijMqyq25C6Pdca8Od9nyx5o1-57k8n61Bpm2crxPPHHuicw4XKOKeHmOGtyGTPtds5oHpUnohJj3GRBHBU5dHs6JD-782XyvJ6AkrqjGzheuQ10x',
  },
  {
    id: 'forest-green-cream',
    name: 'Forest Green/Cream',
    primary: '#244B36',
    secondary: '#EBE3D3',
    upperColor: '#204531',
    accentColor: '#ede5d6',
    strapColor: '#204531',
    soleColor: '#C49B71',
    thumb: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6nu1sVJmuhxAQ780WR1vB5n2GcenI6W1NEgIRGAtZ764Uk7UFV_qgPyRj4dUUa3_i3cEJzM0FMnQHO1bDZtTNzseokXLTXkHKNUbZ3FHh6-9y5IFlhZ1G32aWG7VkQo8lLYxbgyXU_-lfRXcycfUG1YLiotTERB6_SdATPIZXQwkb5gsWCb01lyDb3FXWWRORbBqQjQUgcWMHX-z_st_7AE1V523NomA9G1imL9bX3nDArBQnGVg',
  },
];

const BOTTOM_FEATURES = [
  {
    title: 'Premium Finish',
    desc: 'Rich textures. Lasting impression.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMFcuIlEmOinqex53O1uTOd9tVyWYPSQLQrm79f8hx2_SDW3A9bJ26yPiHsSbdTlHXxgyce-_FVrtMjwFy5EP0GnvX5ip_JuZLB7h3fwc0bwVP4-4G_zwEs9gN4FJyDaQDWlVuNQ4ioWAeEmEvTIOf4X_ok5v7INXpniWrrqTweVWSss_5QYV35113F4ocyduEN5BWZdivdoyC71DQJ2OJHJ1m9sq8BKO346Sp7xK8dfFta2DXtV--',
  },
  {
    title: 'Grip & Stability',
    desc: 'Engineered for every step.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkZZLptrzF3_pLJdGwE1D0fzBf9J6BskKwY_creH1fEwQGjpA8E1ZqUMQcf5oG0DPqTdDQOe0jiSWO8xDYWLfLedhMNKW5or3L6QIdT4kNWSpCsGqeM06tYRvuYRe-Y1giC2c_OBy7TTJgqxv_s8CrqRLxmNSIM6YZu8lhceL1wjSjQPg39qPyrz461bIcjc5-OvPVhEnA2eJ7fhvH0yagBHcjNNgrqediDKAK4ax5ilJPk55aRuEG',
  },
  {
    title: 'All-Day Comfort',
    desc: "Cushioned for what's next.",
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAy9uIBLtM48fYq1AlBrQamS2Dj7jXFNVNX2n814Z51DiV4LuTj-EnP57VbeZkSNwLHeXpomeiGTawYezijQB25UOFsQ4z4E5llsZz_4RLODXSoe-0bpC4GZ8UN0PUA8d29RmafijMqyq25C6Pdca8Od9nyx5o1-57k8n61Bpm2crxPPHHuicw4XKOKeHmOGtyGTPtds5oHpUnohJj3GRBHBU5dHs6JD-782XyvJ6AkrqjGzheuQ10x',
  },
  {
    title: 'Signature Detail',
    desc: 'Subtle branding. Bold identity.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6nu1sVJmuhxAQ780WR1vB5n2GcenI6W1NEgIRGAtZ764Uk7UFV_qgPyRj4dUUa3_i3cEJzM0FMnQHO1bDZtTNzseokXLTXkHKNUbZ3FHh6-9y5IFlhZ1G32aWG7VkQo8lLYxbgyXU_-lfRXcycfUG1YLiotTERB6_SdATPIZXQwkb5gsWCb01lyDb3FXWWRORbBqQjQUgcWMHX-z_st_7AE1V523NomA9G1imL9bX3nDArBQnGVg',
  },
];

export default function ExclusiveProductSection() {
  const [selectedVariant, setSelectedVariant] = useState(COLORWAYS[0]);
  const [rotationAngle, setRotationAngle] = useState(-24);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { user } = useAuthStore();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted('exclusive-urbanedge-pro', user));

  const handleAddToCart = () => {
    const exclusiveProduct = {
      id: 'exclusive-urbanedge-pro',
      name: `UrbanEdge Pro (${selectedVariant.name})`,
      price: 4999,
      category: 'slippers',
      sizes: ['7', '8', '9', '10', '11'],
      colors: [selectedVariant.name],
      images: [selectedVariant.thumb],
      stock: 8,
    };
    addItem(exclusiveProduct, '8', selectedVariant.name, 1, user);
    openCart();
    toast.success(`UrbanEdge Pro in ${selectedVariant.name} added to cart!`);
  };

  const handleSaveForLater = () => {
    toggleWishlist('exclusive-urbanedge-pro', user);
    toast.success(isWishlisted ? 'Removed from Wishlist' : 'Saved to Wishlist!');
  };

  return (
    <section className="relative w-full bg-[#f8f7f5] text-primary overflow-hidden py-14 sm:py-20 border-b border-outline-variant/30">
      {/* Background glow & subtle patterns */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-secondary/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="container-max relative z-10 px-4 sm:px-6">
        {/* ── Section Header ────────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="flex items-center justify-center gap-3 mb-2.5">
            <span className="w-8 h-px bg-outline-variant/70" />
            <span className="font-sans text-[11px] sm:text-xs uppercase tracking-[0.25em] text-on-surface-variant font-bold">
              EXCLUSIVE PRODUCT
            </span>
            <span className="w-8 h-px bg-outline-variant/70" />
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#161413]">
            Crafted for <span className="text-[#C85A24]">a Higher You</span>
          </h2>

          <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-2 font-medium tracking-wide">
            Limited. Distinct. Unforgettable.
          </p>
        </div>

        {/* ── Main 3-Column Showcase ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-14 sm:mb-20">
          {/* Left Column: Vertical Color Swatch Selector */}
          <div className="lg:col-span-2 flex lg:flex-col flex-row flex-wrap justify-center lg:justify-start gap-3 order-2 lg:order-1">
            {COLORWAYS.map((variant) => {
              const active = selectedVariant.id === variant.id;
              return (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`group flex items-center gap-2.5 p-1.5 rounded-xl border text-left transition-all duration-300 w-full sm:w-auto lg:w-full ${
                    active
                      ? 'border-[#C85A24] bg-white shadow-md ring-2 ring-[#C85A24]/20 scale-[1.02]'
                      : 'border-outline-variant/50 bg-white/70 hover:bg-white hover:border-primary/40'
                  }`}
                >
                  <div className="relative w-12 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high border border-outline-variant/30 flex items-center justify-center">
                    <div
                      className="w-full h-full"
                      style={{
                        background: `linear-gradient(135deg, ${variant.primary} 50%, ${variant.secondary} 50%)`,
                      }}
                    />
                  </div>
                  <span
                    className={`font-sans text-xs font-semibold tracking-tight transition-colors ${
                      active ? 'text-[#C85A24]' : 'text-on-surface group-hover:text-primary'
                    }`}
                  >
                    {variant.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Center Column: 3D Pedestal & Floating Shoe Showcase with Callouts */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center order-1 lg:order-2 min-h-[380px] sm:min-h-[460px]">
            {/* 4 Feature Callouts Surrounding the Shoe */}
            {/* Top-Left: Premium Leather */}
            <div className="absolute top-2 sm:top-6 left-0 sm:left-4 z-20 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/40 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary text-xs">
                <span className="material-symbols-outlined text-[14px]">verified</span>
              </span>
              <div className="text-left">
                <p className="font-sans text-[11px] font-bold text-primary leading-tight">Premium Leather</p>
                <p className="font-sans text-[9px] text-on-surface-variant">Leather & Leather construction</p>
              </div>
            </div>

            {/* Bottom-Left: All-Day Comfort */}
            <div className="absolute bottom-16 sm:bottom-20 left-0 sm:left-4 z-20 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/40 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary text-xs">
                <span className="material-symbols-outlined text-[14px]">layers</span>
              </span>
              <div className="text-left">
                <p className="font-sans text-[11px] font-bold text-primary leading-tight">All-Day Comfort</p>
                <p className="font-sans text-[9px] text-on-surface-variant">Built for every journey</p>
              </div>
            </div>

            {/* Top-Right: Lightweight Design */}
            <div className="absolute top-2 sm:top-6 right-0 sm:right-4 z-20 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/40 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary text-xs">
                <span className="material-symbols-outlined text-[14px]">feather</span>
              </span>
              <div className="text-left">
                <p className="font-sans text-[11px] font-bold text-primary leading-tight">Lightweight Design</p>
                <p className="font-sans text-[9px] text-on-surface-variant">Airy feel without limits</p>
              </div>
            </div>

            {/* Bottom-Right: Durable Outsole */}
            <div className="absolute bottom-16 sm:bottom-20 right-0 sm:right-4 z-20 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/40 shadow-sm">
              <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary text-xs">
                <span className="material-symbols-outlined text-[14px]">shield</span>
              </span>
              <div className="text-left">
                <p className="font-sans text-[11px] font-bold text-primary leading-tight">Durable Outsole</p>
                <p className="font-sans text-[9px] text-on-surface-variant">Hard-wearing traction tread</p>
              </div>
            </div>

            {/* Dynamic Product Render with Perspective & Floating Shadow */}
            <div className="relative w-full max-w-[340px] sm:max-w-[420px] aspect-square flex items-center justify-center my-4 group cursor-pointer">
              {/* Product Slipper Graphic SVG/Visual styled precisely */}
              <div
                className="relative z-10 w-[270px] sm:w-[330px] transition-transform duration-700 ease-out drop-shadow-2xl"
                style={{ transform: `rotate(${rotationAngle}deg) translateY(-8px)` }}
                onMouseEnter={() => setRotationAngle(-18)}
                onMouseLeave={() => setRotationAngle(-24)}
              >
                <svg viewBox="0 0 400 280" className="w-full h-auto drop-shadow-2xl overflow-visible">
                  <defs>
                    <radialGradient id={`glow-${selectedVariant.id}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#C85A24" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Cork Footbed Base */}
                  <path
                    d="M 50 160 C 50 110, 80 80, 140 85 C 220 90, 310 120, 350 160 C 370 180, 350 205, 300 215 C 210 230, 90 220, 50 160 Z"
                    fill={selectedVariant.soleColor}
                    stroke="#A88159"
                    strokeWidth="4"
                  />
                  {/* Outsole Grip Layer */}
                  <path
                    d="M 52 165 C 52 175, 70 215, 120 225 C 190 235, 290 230, 330 205 L 340 195 C 310 218, 200 226, 120 218 C 70 208, 55 180, 52 165 Z"
                    fill="#1A1918"
                  />

                  {/* Upper Leather Base Silhouette */}
                  <path
                    d="M 80 145 C 90 90, 160 65, 240 80 C 300 95, 340 135, 330 175 C 280 195, 190 190, 110 175 C 90 170, 80 160, 80 145 Z"
                    fill={selectedVariant.upperColor}
                  />

                  {/* Dynamic Contrast Color Wave Pattern */}
                  <path
                    d="M 160 70 C 190 85, 210 120, 215 150 C 220 170, 240 185, 270 180 C 290 175, 310 160, 320 145 C 300 135, 275 110, 240 80 Z"
                    fill={selectedVariant.accentColor}
                  />
                  <path
                    d="M 120 120 C 145 135, 170 155, 175 178 C 150 175, 130 165, 110 150 Z"
                    fill={selectedVariant.accentColor}
                  />

                  {/* Adjustable Leather Buckle Strap */}
                  <path
                    d="M 155 75 L 185 185 L 155 190 L 125 80 Z"
                    fill={selectedVariant.strapColor}
                    stroke="#111111"
                    strokeWidth="1.5"
                  />
                  {/* Metal Buckle Hardware */}
                  <rect
                    x="138"
                    y="115"
                    width="32"
                    height="38"
                    rx="4"
                    fill="none"
                    stroke="#D4D7DB"
                    strokeWidth="5"
                  />
                  <line x1="154" y1="115" x2="154" y2="153" stroke="#D4D7DB" strokeWidth="4" />
                </svg>
              </div>

              {/* 3D Glowing Circular Pedestal Platform */}
              <div className="absolute -bottom-6 w-[280px] sm:w-[360px] h-[80px] flex items-center justify-center pointer-events-none">
                {/* Outer Ember Halo */}
                <div className="absolute inset-0 bg-[#C85A24]/20 rounded-full blur-xl animate-pulse" />

                {/* Dark Stepped Metallic Stage */}
                <div className="relative w-full h-[55px] rounded-[100%] bg-gradient-to-b from-[#2E2926] to-[#12100E] border-2 border-[#C85A24]/60 shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex items-center justify-center">
                  {/* Inner Stage Light Ring */}
                  <div className="w-[88%] h-[40px] rounded-[100%] border border-[#E9A174]/70 bg-gradient-to-b from-[#1C1816] to-[#0A0908] flex items-center justify-center">
                    {/* Glowing Core */}
                    <div className="w-[70%] h-[24px] rounded-[100%] bg-gradient-to-t from-[#C85A24]/40 to-transparent blur-[2px]" />
                  </div>
                </div>
              </div>
            </div>

            {/* 360° Interactive Badge */}
            <div className="relative z-20 mt-3 flex items-center gap-1.5 px-3 py-1 bg-[#1A1816] text-[#FAF7F2] rounded-full border border-outline-variant/40 shadow-md">
              <span className="material-symbols-outlined text-xs text-[#E9A174] animate-spin" style={{ animationDuration: '6s' }}>
                sync
              </span>
              <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-[#E9A174]">
                360° VIEW
              </span>
            </div>
          </div>

          {/* Right Column: Product Detail & Purchase CTA */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left order-3">
            <h3 className="font-display text-3xl sm:text-4xl font-bold text-[#161413] tracking-tight">
              UrbanEdge <span className="text-[#C85A24]">Pro</span>
            </h3>

            <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#C85A24] font-bold mt-1 mb-3">
              STEP INTO EXCLUSIVITY
            </p>

            <p className="font-sans text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6 max-w-sm">
              A refined blend of style, comfort and durability — handcrafted in full-grain leather with ergonomic cork arch support.
            </p>

            {/* Price Badge */}
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-sans text-2xl sm:text-3xl font-bold text-[#161413]">₹ 4,999</span>
              <span className="font-sans text-xs text-on-surface-variant line-through">₹ 6,499</span>
              <span className="font-sans text-[10px] bg-secondary/15 text-secondary px-2 py-0.5 rounded font-bold uppercase">
                Save ₹1,500
              </span>
            </div>

            {/* Primary Add to Cart CTA */}
            <button
              onClick={handleAddToCart}
              className="w-full sm:w-auto min-w-[220px] h-12 px-6 rounded-xl bg-gradient-to-r from-[#D35B22] to-[#BD4B15] text-white font-sans text-xs uppercase tracking-wider font-bold shadow-lg shadow-[#D35B22]/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-3"
            >
              <span className="material-symbols-outlined text-sm">shopping_bag</span>
              <span>Add to Cart</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>

            {/* Secondary Wishlist CTA */}
            <button
              onClick={handleSaveForLater}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors py-2"
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0", color: isWishlisted ? '#C85A24' : 'currentColor' }}
              >
                favorite
              </span>
              <span>{isWishlisted ? 'Saved in Wishlist' : 'Save for Later'}</span>
            </button>

            {/* Limited Stock Tag */}
            <div className="flex items-center justify-center lg:justify-start gap-2 mt-4 pt-4 border-t border-outline-variant/40 w-full sm:w-auto">
              <span className="w-6 h-px bg-outline-variant" />
              <span className="font-sans text-[10px] uppercase tracking-widest text-[#934B19] font-bold">
                LIMITED STOCK
              </span>
              <span className="w-6 h-px bg-outline-variant" />
            </div>
          </div>
        </div>

        {/* ── Bottom 4 Feature Cards Grid ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-outline-variant/30">
          {BOTTOM_FEATURES.map((feat) => (
            <div
              key={feat.title}
              className="bg-white rounded-2xl p-4 border border-outline-variant/40 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="w-full h-36 rounded-xl overflow-hidden mb-3.5 bg-surface-container-low relative">
                <img
                  src={feat.img}
                  alt={feat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
              </div>
              <h4 className="font-display text-sm font-bold text-primary mb-0.5">{feat.title}</h4>
              <p className="font-sans text-xs text-on-surface-variant">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
