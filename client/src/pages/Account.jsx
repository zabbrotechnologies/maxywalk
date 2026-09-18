import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import useWishlistStore from '../store/wishlistStore.js';
import { getMyOrders, updateUserProfile, getUserProfile, getProducts } from '../lib/api.js';
import { formatPrice, formatDate, getStatusColor, ORDER_STEPS, getStepIndex, getExpectedDeliveryDate } from '../lib/utils.js';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'orders', label: 'My Orders', icon: 'shopping_cart' },
  { id: 'wishlist', label: 'Wishlist', icon: 'favorite' },
  { id: 'addresses', label: 'Addresses', icon: 'location_on' },
  { id: 'profile', label: 'Profile', icon: 'person' },
];

export default function Account() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [orders, setOrders] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, userProfile, setUserProfile, logout, isAdmin: storeIsAdmin } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  const isAdmin = storeIsAdmin || (user?.email && user.email.toLowerCase().includes('admin'));
  const getWishlistItems = useWishlistStore((s) => s.getWishlistItems);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlistItems = getWishlistItems(user);
  const wishlistKey = wishlistItems.map((i) => i.key).join(',');
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [editName, setEditName] = useState(userProfile?.name || user?.user_metadata?.name || '');
  const [editPhone, setEditPhone] = useState(userProfile?.phone || user?.user_metadata?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => { document.title = 'My Account | MAXYWALK'; }, []);

  useEffect(() => {
    if (user?.email) {
      getUserProfile().then((p) => {
        if (p) {
          setUserProfile(p);
          if (p.name) setEditName(p.name);
          if (p.phone !== undefined) setEditPhone(p.phone);
        }
      });
    }
  }, [user?.email]);

  useEffect(() => {
    if (userProfile?.name) setEditName(userProfile.name);
    else if (user?.user_metadata?.name) setEditName(user.user_metadata.name);
    if (userProfile?.phone !== undefined) setEditPhone(userProfile.phone);
  }, [userProfile, user]);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'overview') {
      setLoading(true);
      getMyOrders(user).then((d) => setOrders(Array.isArray(d?.orders) ? d.orders : [])).catch(() => setOrders([])).finally(() => setLoading(false));
    }
    getProducts({ limit: 50 }).then((d) => setCatalogProducts(d.products || [])).catch(() => setCatalogProducts([]));
  }, [activeTab, wishlistKey, user]);

  const handleTabChange = (tab) => { setActiveTab(tab); setSearchParams({ tab }); };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateUserProfile({
        uid: user?.id,
        email: user?.email,
        name: editName,
        phone: editPhone
      });
      setUserProfile(updated);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile.'); }
    finally { setSavingProfile(false); }
  };

  const getOrderItemImage = (item, catalogList = []) => {
    if (!item) return 'https://placehold.co/200x250/f4f3f1/7e7576?text=MAXYWALK';
    if (item.image) return item.image;
    if (item.variantImage) return item.variantImage;

    const prodId = item.productId || item.id;
    const catalogProd = catalogList.find((p) => p.id === prodId);
    const color = item.selectedColor || item.color;
    
    if (color && catalogProd?.variants?.length > 0) {
      const matched = catalogProd.variants.find(
        (v) => v.name?.toLowerCase() === color.toLowerCase() || v.id?.toLowerCase() === color.toLowerCase()
      );
      if (matched?.image) return matched.image;
    }

    return catalogProd?.images?.[0] || catalogProd?.image || 'https://placehold.co/200x250/f4f3f1/7e7576?text=MAXYWALK';
  };

  const orderList = Array.isArray(orders) ? orders : [];
  const activeOrder = orderList.find((o) => !['delivered', 'cancelled'].includes(o?.status));

  function OrderTrackerSection({ order }) {
    if (!order) return null;
    const status = order.status ? String(order.status).toLowerCase() : 'pending';
    const isCancelled = status === 'cancelled';

    if (isCancelled) {
      return (
        <div className="bg-red-50/70 border border-red-200/60 p-4 rounded-xl text-center space-y-1 mt-3">
          <div className="inline-flex items-center gap-1.5 text-red-700 font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-base">cancel</span>
            <span>Order Cancelled</span>
          </div>
          <p className="text-[11px] text-red-600/80">This order was cancelled and will not be shipped.</p>
        </div>
      );
    }

    const steps = [
      { key: 'placed', label: 'Order Placed' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'crafting', label: 'Packed' },
      { key: 'dispatched', label: 'Dispatched' },
      { key: 'delivered', label: 'Delivered' },
    ];

    let currentIdx = getStepIndex(status);
    if (currentIdx < 0) currentIdx = 0;

    return (
      <div className="bg-[#FAF7F2] border border-[#E8E2D8] p-4 rounded-xl space-y-3 mt-3">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-[#E8E2D8]">
          <span className="font-sans text-[10px] uppercase tracking-widest text-[#78716C] font-bold">
            ORDER TRACKING
          </span>
          <span className="font-sans text-[10px] uppercase tracking-widest text-[#D35B22] font-bold">
            Current Status: {status.toUpperCase()}
          </span>
        </div>

        <div className="relative pt-2 pb-2">
          <div className="flex justify-between relative z-10">
            {steps.map((step, i) => {
              const isCompleted = i < currentIdx;
              const isCurrent = i === currentIdx;

              return (
                <div key={step.key} className="flex flex-col items-center text-center gap-1 flex-1">
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isCompleted
                        ? 'bg-[#D35B22] text-white shadow-sm'
                        : isCurrent
                        ? 'bg-[#171412] text-white ring-4 ring-[#171412]/15 shadow-md scale-105'
                        : 'bg-white border border-[#E8E2D8] text-[#78716C]'
                    }`}
                  >
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-xs">check</span>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider ${
                      isCompleted || isCurrent ? 'text-[#171412]' : 'text-[#78716C]/60'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-[#78716C] font-medium">
                    {isCompleted || isCurrent ? formatDate(order.created_at || order.createdAt) : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[#E8E2D8] flex justify-between items-center">
          <span className="text-[10px] uppercase tracking-widest text-[#78716C] font-bold">Expected Delivery</span>
          <span className="text-xs font-bold text-[#171412]">{getExpectedDeliveryDate(order.created_at || order.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter w-full overflow-hidden bg-white min-h-screen">
      <div className="flex max-w-container mx-auto min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-60 flex-shrink-0 border-r border-outline-variant/30 py-8 px-4 sticky top-0 h-screen overflow-y-auto bg-white">
          <div className="mb-6 px-3">
            <div className="w-10 h-10 bg-surface-container-high flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-xl text-secondary">person</span>
            </div>
            <h2 className="font-display text-base font-bold text-primary">My Account</h2>
            <p className="text-xs text-on-surface-variant truncate">{userProfile?.name || user?.email}</p>
          </div>
          <nav className="flex flex-col gap-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => handleTabChange(item.id)} className={`admin-nav-item text-left text-xs ${activeTab === item.id ? 'active' : ''}`}>
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span className="font-sans uppercase tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-4 border-t border-outline-variant/30 px-3">
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-error font-medium hover:text-error/80 transition-colors">
              <span className="material-symbols-outlined text-base">logout</span> Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile Top Tabs */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant/30 flex z-40 shadow-lg">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => handleTabChange(item.id)} className={`flex-1 flex flex-col items-center py-2.5 gap-1 text-[10px] uppercase font-bold tracking-wider ${activeTab === item.id ? 'text-secondary border-t-2 border-secondary' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              <span className="truncate max-w-[60px]">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-8 py-6 pb-24 md:pb-8 w-full overflow-hidden">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Admin Banner if Admin */}
              {(isAdmin || user?.email?.toLowerCase().includes('admin')) && (
                <div className="bg-primary/10 border border-primary/30 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lux">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-primary">Administrator Account</h3>
                      <p className="text-xs text-on-surface-variant">Manage customer orders, products catalogue, and CRM overview.</p>
                    </div>
                  </div>
                  <Link to="/admin" className="btn-primary text-xs h-11 px-5 w-full sm:w-auto justify-center">
                    Open Admin Portal →
                  </Link>
                </div>
              )}

              <h1 className="font-display text-2xl sm:text-3xl text-primary font-bold">
                Welcome back, {(userProfile?.name || user?.displayName || 'Customer').split(' ')[0]}!
              </h1>

              {/* Stat Cards - 1 by 1 on Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Orders', value: orderList.length, icon: 'shopping_bag' },
                  { label: 'Active Orders', value: orderList.filter((o) => !['delivered', 'cancelled'].includes(o?.status)).length, icon: 'local_shipping', accent: true },
                  { label: 'Wishlist Items', value: wishlistItems.length, icon: 'favorite_border' },
                ].map((s) => (
                  <div key={s.label} className={`border border-outline-variant/40 p-5 flex flex-col justify-between h-32 ${s.accent ? 'bg-surface-container-low border-secondary/40' : 'bg-white'}`}>
                    <span className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{s.label}</span>
                    <div className="flex items-end justify-between">
                      <span className="font-display text-3xl font-bold text-primary">{s.value}</span>
                      <span className="material-symbols-outlined text-2xl" style={{ color: s.accent ? '#934b19' : '#cfc4c5', fontVariationSettings: s.accent ? "'FILL' 1" : "'FILL' 0" }}>{s.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Order Tracker */}
              {activeOrder && (
                <div className="bg-white border border-outline-variant/40 p-4 sm:p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-outline-variant/20">
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">Active Order</span>
                      <span className="font-bold text-primary text-sm">{activeOrder.order_id || activeOrder.orderId || activeOrder.id}</span>
                    </div>
                    <span className="text-sm font-bold text-secondary">{formatPrice(activeOrder.total)}</span>
                  </div>

                  <div className="relative pt-2 pb-2">
                    <div className="flex justify-between relative z-10">
                      {ORDER_STEPS.map((step, i) => {
                        const currentIdx = getStepIndex(activeOrder.status);
                        const done = i <= currentIdx;
                        return (
                          <div key={step} className="flex flex-col items-center text-center gap-1 flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${done ? 'bg-secondary text-white' : 'bg-white border border-outline-variant text-on-surface-variant'}`}>
                              {done && i < currentIdx ? <span className="material-symbols-outlined text-xs">check</span> : i + 1}
                            </div>
                            <span className={`text-[9px] uppercase font-bold tracking-wider ${done ? 'text-primary' : 'text-on-surface-variant/60'}`}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Expected Delivery</span>
                    <span className="text-xs font-bold text-primary">{getExpectedDeliveryDate(activeOrder.created_at || activeOrder.createdAt)}</span>
                  </div>
                </div>
              )}

              {/* Recent Orders List */}
              {orderList.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-display text-lg font-bold text-primary">Recent Orders</h3>
                    <button onClick={() => handleTabChange('orders')} className="text-xs text-secondary font-bold hover:underline">View All</button>
                  </div>
                  <div className="space-y-2.5">
                    {orderList.slice(0, 3).map((order) => {
                      const items = Array.isArray(order.items) ? order.items : typeof order.items === 'string' ? JSON.parse(order.items || '[]') : [];
                      const firstItem = items[0] || {};
                      return (
                        <div key={order.id} className="flex items-center gap-3 sm:gap-4 p-3.5 border border-outline-variant/30 bg-white rounded-xl shadow-xs">
                          {/* Compact Product Image on Left */}
                          <div className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg bg-[#FAF7F2] border border-outline-variant/40 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={getOrderItemImage(firstItem, catalogProducts)}
                              alt={firstItem.name || 'Order'}
                              className="w-full h-full object-contain drop-shadow-sm"
                              onError={(e) => { e.target.src = 'https://placehold.co/200x250/f4f3f1/7e7576?text=MAXYWALK'; }}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-primary truncate">{order.order_id || order.orderId || order.id}</p>
                            <p className="text-[11px] text-on-surface-variant truncate">
                              {formatDate(order.created_at || order.createdAt?.toDate?.() || order.createdAt)} · {items.length} item(s)
                            </p>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`px-2 py-0.5 text-[10px] font-sans uppercase tracking-wider font-bold rounded ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-primary">{formatPrice(order.total)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-primary">My Orders</h1>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 skeleton" />)}</div>
              ) : orderList.length === 0 ? (
                <div className="text-center py-16 bg-white border border-outline-variant/30 p-6">
                  <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">shopping_bag</span>
                  <p className="text-xs text-on-surface-variant mb-4">You haven't placed any orders yet.</p>
                  <Link to="/shop" className="btn-primary text-xs h-11">Browse Footwear</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderList.map((order) => {
                    const items = Array.isArray(order.items) ? order.items : typeof order.items === 'string' ? JSON.parse(order.items || '[]') : [];
                    const isExpanded = expandedOrderId === order.id;
                    return (
                      <div key={order.id} className="border border-outline-variant/30 bg-white p-4 sm:p-5 space-y-4 rounded-xl shadow-sm hover:border-outline-variant/60 transition-all">
                        {/* Header: Order ID & Status */}
                        <div className="flex justify-between items-start pb-3 border-b border-outline-variant/20">
                          <div>
                            <p className="font-bold text-xs sm:text-sm text-primary">{order.order_id || order.orderId || order.id}</p>
                            <p className="text-[10px] text-on-surface-variant">{formatDate(order.created_at || order.createdAt?.toDate?.() || order.createdAt)}</p>
                          </div>
                          <span className={`px-2.5 py-1 text-[10px] font-sans uppercase tracking-wider font-bold rounded ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>

                        {/* Main Body: LEFT Product Images + RIGHT Items Info & Pricing */}
                        <div className="flex gap-3 sm:gap-5 items-start">
                          {/* LEFT: Compact Product Images */}
                          <div className="flex-shrink-0 flex flex-col gap-2">
                            {items.map((item, i) => (
                              <div key={i} className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg bg-[#FAF7F2] border border-outline-variant/40 p-1 flex items-center justify-center overflow-hidden">
                                <img
                                  src={getOrderItemImage(item, catalogProducts)}
                                  alt={item.name}
                                  className="w-full h-full object-contain drop-shadow-sm"
                                  onError={(e) => { e.target.src = 'https://placehold.co/200x250/f4f3f1/7e7576?text=MAXYWALK'; }}
                                />
                              </div>
                            ))}
                          </div>

                          {/* RIGHT: Items List & Total Paid */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="space-y-1.5">
                              {items.map((item, i) => {
                                const colorLabel = item.selectedColor || item.color;
                                const sizeLabel = item.selectedSize || item.size || 'Standard';
                                return (
                                  <div key={i} className="flex justify-between items-start text-xs gap-2">
                                    <div className="min-w-0">
                                      <p className="font-bold text-primary truncate text-xs sm:text-sm">{item.name}</p>
                                      <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                                        {colorLabel ? `${colorLabel} · ` : ''}Size {sizeLabel} × {item.qty || 1}
                                      </p>
                                    </div>
                                    <span className="font-bold text-primary flex-shrink-0">{formatPrice((item.price || 0) * (item.qty || 1))}</span>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-outline-variant/20">
                              <span className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">TOTAL PAID</span>
                              <span className="font-display text-base sm:text-lg font-bold text-primary">{formatPrice(order.total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Row: TRACK ORDER Button */}
                        <div className="pt-3 border-t border-outline-variant/20 flex justify-end">
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="btn-secondary py-0 px-4 h-9 text-[11px] uppercase tracking-wider font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">local_shipping</span>
                            <span>{isExpanded ? 'Hide Tracking' : 'Track Order'}</span>
                          </button>
                        </div>

                        {/* Expandable Inline Tracking Section */}
                        {isExpanded && (
                          <OrderTrackerSection order={order} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-primary">Saved Wishlist</h1>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-16 bg-white border border-outline-variant/30 p-6">
                  <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">favorite_border</span>
                  <p className="text-xs text-on-surface-variant mb-4">No saved items in your wishlist.</p>
                  <Link to="/shop" className="btn-primary text-xs h-11">Explore Catalogue</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistItems.map((item) => {
                    const catalogProduct = catalogProducts.find((p) => p.id === item.productId || p.id === item.id);
                    let matchedVariant = null;
                    if (item.variantId && catalogProduct?.variants) {
                      matchedVariant = catalogProduct.variants.find(
                        (v) => v.id === item.variantId || v.name?.toLowerCase() === item.variantName?.toLowerCase() || v.name?.toLowerCase() === item.variantId?.toLowerCase()
                      );
                    }

                    const displayImage = item.image || matchedVariant?.image || catalogProduct?.images?.[0] || catalogProduct?.image || 'https://placehold.co/400x500/f4f3f1/7e7576?text=MAXYWALK';
                    const productName = item.name || catalogProduct?.name || item.productId || 'Footwear Item';
                    const variantLabel = item.variantName || matchedVariant?.name || null;
                    const price = item.price || catalogProduct?.price || 0;

                    return (
                      <div key={item.key} className="p-3 bg-white border border-outline-variant/30 flex flex-col gap-2 rounded-xl hover:border-secondary transition-all shadow-sm">
                        <Link to={`/product/${item.productId}`} className="aspect-[4/5] bg-surface-container overflow-hidden block rounded-lg">
                          <img
                            src={displayImage}
                            alt={productName}
                            className="w-full h-full object-contain drop-shadow-sm p-1 transition-transform duration-300 hover:scale-105"
                            onError={(e) => { e.target.src = 'https://placehold.co/400x500/f4f3f1/7e7576?text=MAXYWALK'; }}
                          />
                        </Link>
                        <div className="flex flex-col flex-grow">
                          <Link to={`/product/${item.productId}`} className="font-display text-xs sm:text-sm font-bold text-primary truncate hover:text-secondary block">
                            {productName}
                          </Link>
                          {variantLabel && (
                            <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                              {variantLabel}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-outline-variant/20">
                            <p className="text-xs font-bold text-secondary">{formatPrice(price)}</p>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                toggleWishlist(item.productId, item.variantId, {}, user);
                                toast.success('Removed from wishlist');
                              }}
                              className="text-on-surface-variant/60 hover:text-error transition-colors p-1"
                              title="Remove item"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-primary">Personal Profile</h1>
              <form onSubmit={handleSaveProfile} className="max-w-md space-y-4 bg-white p-5 border border-outline-variant/30">
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">Full Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-hairline text-sm" />
                </div>
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">Email Address</label>
                  <input type="email" value={user?.email || ''} disabled className="input-hairline text-sm opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1">Phone Number (WhatsApp)</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="input-hairline text-sm" placeholder="+91 98765 43210" />
                </div>
                <button type="submit" disabled={savingProfile} className="btn-primary w-full justify-center text-xs h-11 font-bold">
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <h1 className="font-display text-2xl font-bold text-primary">Saved Addresses</h1>
              <div className="bg-white border border-outline-variant/30 p-6 text-center">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">location_on</span>
                <p className="text-xs text-on-surface-variant">Addresses are saved automatically when you place an order.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
