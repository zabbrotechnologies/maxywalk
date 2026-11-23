import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore.js';
import useAuthStore from '../store/authStore.js';
import { placeOrder, getUserProfile, updateUserProfile, createRazorpayOrder, verifyRazorpayPayment } from '../lib/api.js';
import { formatPrice, INDIAN_STATES } from '../lib/utils.js';
import toast from 'react-hot-toast';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const STEPS = ['Information', 'Delivery', 'Payment'];

const SHIPPING_OPTIONS = [
  { id: 'standard', label: 'Standard Delivery', desc: '5–7 business days', price: 0 },
  { id: 'express', label: 'Express Delivery', desc: '2–3 business days', price: 149 },
];

export default function Checkout() {
  const items = useCartStore((s) => s.items) || [];
  const clearCart = useCartStore((s) => s.clearCart);
  const { user, userProfile, setUserProfile } = useAuthStore();

  const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 1), 0);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [showSummaryMobile, setShowSummaryMobile] = useState(false);

  // Saved Addresses & Switcher state
  const [savedAddresses, setSavedAddresses] = useState(
    Array.isArray(userProfile?.addresses) ? userProfile.addresses : (Array.isArray(user?.addresses) ? user.addresses : [])
  );
  const [selectedAddressId, setSelectedAddressId] = useState('new');

  // Form state
  const [contact, setContact] = useState({
    email: userProfile?.email || user?.email || '',
    phone: userProfile?.phone || user?.phone || ''
  });
  const [address, setAddress] = useState({ firstName: '', lastName: '', address: '', city: '', state: 'Tamil Nadu', pincode: '' });
  const [shipping, setShipping] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const idempotencyKeyRef = useRef(`idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // Auto-extract customer info and saved addresses on mount
  useEffect(() => {
    document.title = 'Checkout | MAXYWALK';
    const activeEmail = user?.email || userProfile?.email;
    if (activeEmail) {
      getUserProfile(activeEmail).then((p) => {
        if (p) {
          setUserProfile(p);
          setContact((prev) => ({
            email: p.email || prev.email || activeEmail,
            phone: p.phone !== undefined && p.phone !== '' ? p.phone : prev.phone
          }));
          if (Array.isArray(p.addresses)) {
            setSavedAddresses(p.addresses);
          }
        }
      });
    }
  }, [user?.email, userProfile?.email, setUserProfile]);

  // Synchronize profile changes and default address pre-fill
  useEffect(() => {
    const list = Array.isArray(userProfile?.addresses)
      ? userProfile.addresses
      : (Array.isArray(user?.addresses) ? user.addresses : []);
    setSavedAddresses(list);

    if (userProfile) {
      setContact((prev) => ({
        email: userProfile.email || prev.email || user?.email || '',
        phone: userProfile.phone !== undefined && userProfile.phone !== '' ? userProfile.phone : prev.phone
      }));
    }

    if (list.length > 0) {
      const def = list.find((a) => a.isDefault) || list[0];
      if (def && (selectedAddressId === 'new' || !selectedAddressId)) {
        setSelectedAddressId(def.id);
        setAddress({
          firstName: def.firstName || def.fullName?.split(' ')[0] || '',
          lastName: def.lastName || def.fullName?.split(' ').slice(1).join(' ') || '',
          address: def.address || '',
          city: def.city || '',
          state: def.state || 'Tamil Nadu',
          pincode: def.pincode || ''
        });
        if (def.phone) {
          setContact((prev) => ({ ...prev, phone: prev.phone || def.phone }));
        }
      }
    } else if (userProfile?.name && !address.firstName) {
      const parts = userProfile.name.trim().split(' ');
      setAddress((prev) => ({
        ...prev,
        firstName: prev.firstName || parts[0] || '',
        lastName: prev.lastName || parts.slice(1).join(' ') || ''
      }));
    }
  }, [userProfile, user]);

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setAddress({
      firstName: addr.firstName || addr.fullName?.split(' ')[0] || '',
      lastName: addr.lastName || addr.fullName?.split(' ').slice(1).join(' ') || '',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || 'Tamil Nadu',
      pincode: addr.pincode || ''
    });
    if (addr.phone) {
      setContact((prev) => ({ ...prev, phone: addr.phone }));
    }
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    const parts = (userProfile?.name || user?.displayName || '').trim().split(' ');
    setAddress({
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      address: '',
      city: '',
      state: 'Tamil Nadu',
      pincode: ''
    });
  };

  const isTamilNadu = (address.state || '').trim().toLowerCase().replace(/\s+/g, '') === 'tamilnadu';
  const shippingCost = isTamilNadu ? 100 : 250;
  const total = subtotal + shippingCost;

  const isEmailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e?.trim() || '');
  const isPhoneValid = (p) => /^[6-9]\d{9}$/.test((p || '').replace(/[^0-9]/g, ''));
  const isPincodeValid = (pin) => /^\d{6}$/.test((pin || '').trim());

  const handleNext = () => {
    if (step === 0) {
      if (!contact.email || !isEmailValid(contact.email)) {
        toast.error('Please enter a valid email address above.');
        return;
      }
      if (!contact.phone || !isPhoneValid(contact.phone)) {
        toast.error('Please enter a valid 10-digit mobile number above.');
        return;
      }
      if (!address.firstName?.trim()) {
        toast.error('Please enter your First Name.');
        return;
      }
      if (!address.address?.trim()) {
        toast.error('Please enter your House / Street / Landmark address.');
        return;
      }
      if (!address.city?.trim()) {
        toast.error('Please enter your City.');
        return;
      }
      if (!address.pincode || !isPincodeValid(address.pincode)) {
        toast.error('Please enter a valid 6-digit Pincode.');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 2));
  };
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handlePlaceOrder = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const fullShippingAddress = {
        ...address,
        ...contact,
        fullName: `${address.firstName} ${address.lastName}`.trim() || 'Customer',
      };

      const baseOrderPayload = {
        items: items.map((i) => ({
          productId: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
          size: i.selectedSize,
          color: i.selectedColor,
          image: i.image,
        })),
        shippingAddress: fullShippingAddress,
        shipping_address: fullShippingAddress,
        user_email: contact.email || user?.email,
        userEmail: contact.email || user?.email,
        shipping,
        subtotal,
        shippingCost,
        total,
        idempotency_key: idempotencyKeyRef.current,
      };

      const handleAutoSaveAddress = () => {
        const userEmail = user?.email || userProfile?.email;
        if (userEmail && (selectedAddressId === 'new' || savedAddresses.length === 0)) {
          try {
            const newSavedAddr = {
              id: `addr-${Date.now()}`,
              ...address,
              phone: contact.phone,
              fullName: `${address.firstName} ${address.lastName}`.trim() || 'Customer',
              isDefault: savedAddresses.length === 0
            };
            const updatedAddresses = [newSavedAddr, ...savedAddresses];
            updateUserProfile({
              email: userEmail,
              phone: contact.phone || userProfile?.phone,
              addresses: updatedAddresses
            }).then((res) => setUserProfile(res)).catch(() => {});
          } catch {}
        }
      };

      // Cash on Delivery (COD) path
      if (paymentMethod === 'cod') {
        const orderData = await placeOrder({
          ...baseOrderPayload,
          paymentMethod: 'cod',
          payment_method: 'cod'
        });
        clearCart();
        handleAutoSaveAddress();
        setOrderPlaced(orderData);
        toast.success('Order placed successfully via Cash on Delivery!');
        return;
      }

      // Online Payment (Razorpay) path
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // 1. Create order on server
      const rzpOrderData = await createRazorpayOrder({
        ...baseOrderPayload,
        paymentMethod: 'razorpay',
        payment_method: 'razorpay'
      });

      const razorpayKey = rzpOrderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.error('Razorpay Key ID not configured. Please add RAZORPAY_KEY_ID in Vercel environment variables.');
        setLoading(false);
        return;
      }

      if (!rzpOrderData.razorpayOrderId) {
        toast.error('Failed to initialize payment session. Please try again.');
        setLoading(false);
        return;
      }

      // 2. Open Razorpay Checkout modal
      const options = {
        key: rzpOrderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rzpOrderData.amount,
        currency: rzpOrderData.currency || 'INR',
        name: 'MAXYWALK',
        description: 'Handcrafted Footwear & Goods',
        image: '/logo.png',
        order_id: rzpOrderData.razorpayOrderId,
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              internal_order_id: rzpOrderData.internalId,
            });

            clearCart();
            handleAutoSaveAddress();
            setOrderPlaced(verifyRes.order || rzpOrderData.order || { order_id: rzpOrderData.orderId });
            toast.success('Payment successful via Razorpay!');
          } catch (vErr) {
            console.error('Signature verification error:', vErr);
            toast.error(vErr.response?.data?.error || 'Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: `${address.firstName} ${address.lastName}`.trim() || 'Customer',
          email: (contact.email || '').trim(),
          contact: (contact.phone || '').replace(/[^0-9]/g, '').slice(-10),
        },
        notes: {
          address: `${address.address}, ${address.city}, ${address.state} - ${address.pincode}`,
        },
        theme: {
          color: '#1F1E1D',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast('Payment cancelled. Your items remain saved in your cart.', { icon: 'ℹ️' });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setLoading(false);
        toast.error(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
      });
      rzp.open();
    } catch (err) {
      console.error('Order placement error:', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message || (typeof err.response?.data === 'string' && err.response.data.length < 200 ? err.response.data : null);
      toast.error(serverMsg || err.message || 'Failed to place order. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  // Case 1: Order Confirmed
  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center page-enter px-4 py-12 bg-surface">
        <div className="max-w-md w-full mx-auto text-center bg-white p-6 sm:p-8 rounded-3xl border border-outline-variant/40 shadow-lux">
          <div className="w-16 h-16 bg-green-50 flex items-center justify-center mx-auto mb-4 rounded-full">
            <span className="material-symbols-outlined text-4xl text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-primary font-bold mb-2">Order Confirmed!</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mb-1">Thank you for ordering with MaxyWalk.</p>
          <div className="my-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-center space-y-2">
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Your Order ID</p>
              <p className="font-display text-xl font-bold text-secondary mt-0.5">{orderPlaced.order_id || orderPlaced.orderId}</p>
            </div>
            <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs px-2">
              <span className="text-on-surface-variant">Payment Mode</span>
              <span className="font-bold text-primary">
                <span className="text-green-700 flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Paid via Razorpay
                </span>
              </span>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
            Our artisan in Avadi is preparing your package. We will dispatch it and contact you on WhatsApp/Phone.
          </p>
          <div className="space-y-2">
            <Link to="/shop" className="btn-primary w-full justify-center text-xs h-12">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Cart is Empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-surface page-enter">
        <header className="h-16 px-4 sm:px-6 flex justify-between items-center border-b border-outline-variant/30 bg-white">
          <Link to="/shop" className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back to Store</span>
          </Link>
          <Link to="/" className="font-display text-base sm:text-lg tracking-widest text-primary font-bold">MAXYWALK</Link>
          <div className="w-16" />
        </header>

        <div className="max-w-md w-full mx-auto text-center px-4 py-16">
          <div className="w-20 h-20 bg-surface-container flex items-center justify-center mx-auto mb-4 rounded-full">
            <span className="material-symbols-outlined text-4xl text-outline">shopping_bag</span>
          </div>
          <h2 className="font-display text-2xl text-primary font-bold mb-2">Your Shopping Bag is Empty</h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mb-6">
            You don't have any items in your bag yet. Choose from our handcrafted slippers, sandals, and leather goods to proceed with checkout.
          </p>
          <Link to="/shop" className="btn-primary text-xs h-12 px-8 inline-flex">
            Browse Footwear Collection
          </Link>
        </div>

        <div className="p-4 text-center text-xs text-on-surface-variant border-t border-outline-variant/30">
          © {new Date().getFullYear()} MAXYWALK · MAXYWALK LEATHER
        </div>
      </div>
    );
  }

  // Case 3: Standard 3-Step Checkout Flow (100% Online Payment via Razorpay)
  return (
    <div className="page-enter min-h-screen w-full overflow-hidden bg-surface">
      {/* Header */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 flex justify-between items-center border-b border-outline-variant/30 bg-white sticky top-0 z-40">
        <Link to="/shop" className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary font-medium">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Return</span>
        </Link>
        <Link to="/" className="font-display text-base sm:text-lg tracking-widest text-primary font-bold">MAXYWALK</Link>
        <div className="flex items-center gap-1 text-green-700">
          <span className="material-symbols-outlined text-sm">lock</span>
          <span className="text-[10px] font-sans uppercase tracking-wider font-bold">100% Secure Checkout</span>
        </div>
      </header>

      {/* Mobile Accordion for Order Summary */}
      <div className="lg:hidden border-b border-outline-variant/30 bg-surface-container-low px-4 py-3">
        <button
          onClick={() => setShowSummaryMobile(!showSummaryMobile)}
          className="w-full flex items-center justify-between text-xs font-bold text-primary"
        >
          <div className="flex items-center gap-1.5 text-secondary">
            <span className="material-symbols-outlined text-base">shopping_bag</span>
            <span>{showSummaryMobile ? 'Hide' : 'Show'} Order Summary ({items.length} items)</span>
            <span className="material-symbols-outlined text-sm">{showSummaryMobile ? 'expand_less' : 'expand_more'}</span>
          </div>
          <span className="font-display text-base text-primary font-bold">{formatPrice(total)}</span>
        </button>

        {showSummaryMobile && (
          <div className="pt-4 space-y-3">
            {items.map((item) => (
              <div key={item.cartKey} className="flex gap-2.5 items-center bg-white p-2.5 rounded-xl border border-outline-variant/20">
                <img src={item.image || 'https://placehold.co/100x120?text=MaxyWalk'} alt={item.name} className="w-12 h-14 object-contain drop-shadow-sm p-1 rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary truncate">{item.name}</p>
                  <p className="text-[10px] text-on-surface-variant">Size {item.selectedSize} · Qty {item.qty}</p>
                </div>
                <span className="text-xs font-bold text-primary">{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <main className="container-max py-6 sm:py-10 px-4">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* Left: 3-Step Checkout Flow */}
          <div className="w-full lg:w-[58%]">
            {/* Stepper */}
            <nav className="flex items-center justify-between gap-1 mb-8 overflow-x-auto pb-1">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1.5 flex-1 last:flex-none">
                  <div
                    className={`w-6 h-6 flex items-center justify-center text-[11px] font-bold rounded-full flex-shrink-0 transition-colors ${
                      i < step ? 'bg-secondary text-white' : i === step ? 'bg-primary text-white' : 'border border-outline-variant text-outline'
                    }`}
                  >
                    {i < step ? <span className="material-symbols-outlined text-xs">check</span> : i + 1}
                  </div>
                  <span className={`text-[11px] font-sans uppercase tracking-wider whitespace-nowrap ${i === step ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>{s}</span>
                  {i < 2 && <div className="flex-1 h-px bg-outline-variant/40 mx-1" />}
                </div>
              ))}
            </nav>

            {/* Step 0: Information */}
            {step === 0 && (
              <div className="space-y-6">
                <section className="bg-white p-5 sm:p-6 rounded-3xl border border-outline-variant/40 shadow-lux">
                  <h2 className="font-display text-xl sm:text-2xl text-primary font-bold mb-4">Contact Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">Email Address</label>
                      <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required className="input-hairline text-sm" placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">Phone Number (WhatsApp Updates)</label>
                      <input type="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} required className="input-hairline text-sm" placeholder="+91 98765 43210" />
                    </div>
                  </div>
                </section>

                <section className="bg-white p-5 sm:p-6 rounded-3xl border border-outline-variant/40 shadow-lux">
                  <h2 className="font-display text-xl sm:text-2xl text-primary font-bold mb-4">Delivery Address</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">First Name</label>
                      <input type="text" value={address.firstName} onChange={(e) => setAddress({ ...address, firstName: e.target.value })} required className="input-hairline text-sm" />
                    </div>
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">Last Name</label>
                      <input type="text" value={address.lastName} onChange={(e) => setAddress({ ...address, lastName: e.target.value })} required className="input-hairline text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">House / Street / Landmark</label>
                      <input type="text" value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} required className="input-hairline text-sm" placeholder="e.g. 6A, V Main Road, Kovilpathagai" />
                    </div>
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">City</label>
                      <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required className="input-hairline text-sm" placeholder="e.g. Avadi, Chennai" />
                    </div>
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">Pincode</label>
                      <input type="text" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} required className="input-hairline text-sm" maxLength={6} placeholder="600062" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">State</label>
                      <div className="relative">
                        <select value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="input-hairline text-sm appearance-none pr-8">
                          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-base">expand_more</span>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="pt-2 flex flex-col sm:flex-row justify-between gap-3">
                  <button onClick={handleNext} className="btn-primary w-full sm:w-auto justify-center text-xs h-12 order-1 sm:order-2">
                    Continue to Delivery
                  </button>
                  <Link to="/shop" className="text-xs text-on-surface-variant hover:text-primary font-sans text-center py-2 order-2 sm:order-1">← Return to Shop</Link>
                </div>
              </div>
            )}

            {/* Step 1: Delivery Timeline & Shipping */}
            {step === 1 && (
              <div className="space-y-6">
                <section className="bg-white p-5 sm:p-6 rounded-3xl border border-outline-variant/40 shadow-lux">
                  <h2 className="font-display text-xl sm:text-2xl text-primary font-bold mb-1">Delivery &amp; Crafting Timeline</h2>
                  <p className="text-xs text-on-surface-variant mb-5">Each pair of MAXYWALK footwear is individually handcrafted and quality-checked before dispatch.</p>
                  
                  {/* Delivery Phase Info Box */}
                  <div className="p-5 rounded-2xl border-2 border-primary/20 bg-surface-container-low/60 space-y-4">
                    {/* Crafting Duration */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 text-secondary">
                        <span className="material-symbols-outlined text-xl">handyman</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-bold text-xs sm:text-sm text-primary">Handcrafted Artisanal Production</h3>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary whitespace-nowrap">4 to 5 Days</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          Precision hand-cutting, leather moulding, and sole bonding at our Avadi workshop.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-outline-variant/30" />

                    {/* Delivery Duration */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                        <span className="material-symbols-outlined text-xl">local_shipping</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-bold text-xs sm:text-sm text-primary">Express Courier Delivery</h3>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">2 to 3 Days</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          Insured doorstep delivery to {address.city ? `${address.city}, ` : ''}{address.state || 'Tamil Nadu'} with live SMS and tracking updates.
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant font-medium">
                        Standard Shipping ({isTamilNadu ? 'Tamil Nadu' : 'Rest of India'})
                      </span>
                      <span className="font-bold text-primary text-sm">
                        ₹{shippingCost}
                      </span>
                    </div>
                  </div>
                </section>
                <div className="pt-2 flex flex-col sm:flex-row justify-between gap-3">
                  <button onClick={handleNext} className="btn-primary w-full sm:w-auto justify-center text-xs h-12 order-1 sm:order-2">Continue to Payment</button>
                  <button onClick={handleBack} className="text-xs text-on-surface-variant hover:text-primary order-2 sm:order-1 text-center py-2">← Back to Information</button>
                </div>
              </div>
            )}

            {/* Step 2: Payment (100% Online Payment via Razorpay) */}
            {step === 2 && (
              <div className="space-y-6">
                <section className="bg-white p-5 sm:p-6 rounded-3xl border border-outline-variant/40 shadow-lux">
                  <h2 className="font-display text-xl sm:text-2xl text-primary font-bold mb-4">Payment Method</h2>
                  
                  <div className="space-y-3.5">
                    {/* Razorpay Online Payment */}
                    <div className="p-5 rounded-2xl border-2 border-primary bg-surface-container-low shadow-sm flex items-start gap-4">
                      <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center mt-0.5 flex-shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                            <span>100% Secure Online Payment</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-900 text-[10px] font-bold uppercase rounded-full">Prepaid</span>
                          </h3>
                          <span className="text-[11px] font-bold text-secondary">Instant Dispatch</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          Pay securely with Google Pay, PhonePe, Paytm, BHIM UPI, Credit/Debit Cards (Visa, Mastercard, RuPay), or Net Banking via Razorpay.
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="px-2 py-0.5 bg-white border border-outline-variant/40 rounded text-[10px] font-bold text-primary">UPI</span>
                          <span className="px-2 py-0.5 bg-white border border-outline-variant/40 rounded text-[10px] font-bold text-primary">GPay</span>
                          <span className="px-2 py-0.5 bg-white border border-outline-variant/40 rounded text-[10px] font-bold text-primary">PhonePe</span>
                          <span className="px-2 py-0.5 bg-white border border-outline-variant/40 rounded text-[10px] font-bold text-primary">Cards</span>
                          <span className="px-2 py-0.5 bg-white border border-outline-variant/40 rounded text-[10px] font-bold text-primary">NetBanking</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-surface-container rounded-xl flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-secondary text-base flex-shrink-0">lock</span>
                    <span>All online transactions are encrypted via Razorpay with 256-bit bank-grade SSL security.</span>
                  </div>
                </section>

                <div className="pt-2 flex flex-col sm:flex-row justify-between gap-3">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="btn-primary w-full sm:w-auto justify-center text-xs h-12 gap-2 font-bold order-1 sm:order-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">lock</span>
                        {paymentMethod === 'cod' ? `Place Order (Cash on Delivery) · ${formatPrice(total)}` : `Pay with Razorpay · ${formatPrice(total)}`}
                      </>
                    )}
                  </button>
                  <button onClick={handleBack} className="text-xs text-on-surface-variant hover:text-primary order-2 sm:order-1 text-center py-2">
                    ← Back to Delivery
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Desktop Order Summary Sidebar */}
          <div className="hidden lg:block w-[42%]">
            <div className="bg-white border border-outline-variant/40 p-6 sticky top-24 shadow-lux rounded-3xl">
              <h2 className="font-display text-lg font-bold text-primary mb-4 pb-3 border-b border-outline-variant/30">
                Order Summary ({items.length} items)
              </h2>
              <div className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.cartKey} className="flex gap-3 items-center">
                    <div className="w-14 h-16 bg-surface-container relative flex-shrink-0 border border-outline-variant/20 rounded-xl overflow-hidden">
                      <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center text-[9px] font-bold z-10">{item.qty}</span>
                      <img src={item.image || 'https://placehold.co/100x120?text=MaxyWalk'} alt={item.name} className="w-full h-full object-contain drop-shadow-sm p-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-primary truncate">{item.name}</p>
                      <p className="text-[10px] text-on-surface-variant">Size {item.selectedSize}</p>
                    </div>
                    <span className="text-xs font-bold text-primary">{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-xs border-t border-outline-variant/30 pt-4 mb-4">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal</span>
                  <span className="text-primary font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Shipping</span>
                  <span className="text-primary font-bold">{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
                </div>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-primary">
                <span className="font-sans text-xs uppercase tracking-widest text-primary font-bold">Total</span>
                <span className="font-display text-2xl font-bold text-primary">{formatPrice(total)}</span>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-3 text-center">100% Secure Online Payment · Handcrafted in Tamil Nadu</p>
            </div>
          </div>
        </div>
      </main>

      {/* Checkout Compliance Footer */}
      <footer className="mt-12 py-6 border-t border-outline-variant/30 bg-surface-container-low text-center text-xs text-on-surface-variant">
        <div className="container-max px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px]">
            © {new Date().getFullYear()} MAXYWALK LEATHER FOOTWEAR · ALL RIGHTS RESERVED
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <Link to="/terms" target="_blank" className="hover:underline">Terms & Conditions</Link>
            <Link to="/privacy" target="_blank" className="hover:underline">Privacy Policy</Link>
            <Link to="/shipping" target="_blank" className="hover:underline">Shipping Policy</Link>
            <Link to="/refund-policy" target="_blank" className="hover:underline">Refund Policy</Link>
            <Link to="/contact" target="_blank" className="hover:underline">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
