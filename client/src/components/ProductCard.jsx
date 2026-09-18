import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore.js';
import useWishlistStore from '../store/wishlistStore.js';
import { formatPrice } from '../lib/utils.js';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';

export default function ProductCard({ product }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const { addItem, openCart } = useCartStore();
  const { user } = useAuthStore();
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);

  const wishlisted = isWishlisted(product.id, user);
  const defaultSize = product.sizes?.[0] || 'Standard';

  const validImages = useMemo(() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      const filtered = product.images.filter((img) => img && typeof img === 'string' && img.trim() !== '');
      return filtered.length > 0 ? filtered : ['https://placehold.co/400x500/f4f3f1/7e7576?text=MAXYWALK'];
    }
    return ['https://placehold.co/400x500/f4f3f1/7e7576?text=MAXYWALK'];
  }, [product.images]);

  const totalImages = validImages.length;
  const isMultiImage = totalImages >= 2;

  // Viewport IntersectionObserver to pause off-screen cards
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Preload images for smooth transition
  useEffect(() => {
    if (isMultiImage) {
      validImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [isMultiImage, validImages]);

  // Automatic slideshow interval (2.8s) when visible, multi-image, and not hovered
  useEffect(() => {
    if (!isMultiImage || !isVisible || isHovered) return;

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) return;
    }

    const timer = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % totalImages);
    }, 2800);

    return () => clearInterval(timer);
  }, [isMultiImage, isVisible, isHovered, totalImages]);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to add to bag.');
      navigate('/login');
      return;
    }
    addItem(product, defaultSize, product.colors?.[0] || '', 1, user);
    openCart();
    toast.success(`${product.name} added to bag!`, {
      duration: 2000,
      style: { fontFamily: 'Plus Jakarta Sans', fontSize: '13px' },
    });
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id, user);
    toast(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist', {
      icon: wishlisted ? '💔' : '❤️',
      duration: 1500,
      style: { fontFamily: 'Plus Jakarta Sans', fontSize: '13px' },
    });
  };

  return (
    <div
      ref={containerRef}
      className="product-card group flex flex-col w-full bg-white border border-outline-variant/40 hover:border-secondary transition-all duration-300 p-3 sm:p-4 rounded-2xl shadow-lux hover:shadow-lux-md"
    >
      {/* Image Container */}
      <Link
        to={`/product/${product.id}`}
        className="relative w-full aspect-[4/5] overflow-hidden mb-3 block rounded-xl p-4 bg-surface-container/30"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Stacked Images for Smooth Crossfade */}
        {validImages.map((imgSrc, idx) => {
          const isActive = idx === (currentImgIndex % totalImages);
          return (
            <img
              key={`${imgSrc}-${idx}`}
              src={imgSrc}
              alt={`${product.name} view ${idx + 1}`}
              loading={idx === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className={`absolute inset-0 w-full h-full object-contain p-4 drop-shadow-md transition-opacity duration-500 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
              }`}
              onError={(e) => {
                e.target.src = 'https://placehold.co/400x500/f4f3f1/7e7576?text=MAXYWALK';
              }}
            />
          );
        })}

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-2 left-2 bg-primary text-white px-2 py-0.5 font-sans text-[9px] uppercase tracking-wider z-20 font-semibold rounded-sm">
            {product.badge}
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white shadow-sm transition-colors"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <span
            className="material-symbols-outlined text-[17px]"
            style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0", color: wishlisted ? '#934b19' : '#1a1c1b' }}
          >
            favorite
          </span>
        </button>
      </Link>

      {/* Product Info */}
      <div className="flex flex-col flex-grow">
        <span className="text-[10px] uppercase font-sans tracking-wider text-on-surface-variant mb-1 truncate block">
          {product.category} · {product.material || 'Genuine Leather'}
        </span>

        <Link
          to={`/product/${product.id}`}
          className="font-display text-sm sm:text-base leading-snug text-primary font-normal line-clamp-2 hover:text-secondary transition-colors mb-2"
        >
          {product.name}
        </Link>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex text-secondary">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className="material-symbols-outlined text-[12px]"
                  style={{
                    fontVariationSettings: star <= Math.round(product.rating) ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  star
                </span>
              ))}
            </div>
            <span className="text-[10px] text-on-surface-variant">({product.reviewCount || product.review_count || 0})</span>
          </div>
        )}

        {/* Price & Action Row */}
        <div className="mt-auto pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-2">
          <div>
            <span className="font-sans text-sm sm:text-base font-bold text-primary block">
              {formatPrice(product.price)}
            </span>
            {(product.originalPrice || product.original_price) && (
              <span className="text-[11px] text-on-surface-variant line-through block">
                {formatPrice(product.originalPrice || product.original_price)}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className="btn-primary py-0 px-3 sm:px-4 h-9 text-[11px] uppercase tracking-wider flex items-center gap-1 font-semibold flex-shrink-0"
            aria-label="Add to cart"
          >
            <span className="material-symbols-outlined text-sm">shopping_bag</span>
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
