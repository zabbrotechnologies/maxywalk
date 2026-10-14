/**
 * Format price in Indian Rupees (Crash-Proof)
 */
export const formatPrice = (amount) => {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '₹0';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `₹${amount}`;
  }
};

/**
 * Format date safely (Crash-Proof)
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return 'Recent';
  try {
    const raw = dateStr?.toDate ? dateStr.toDate() : dateStr;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr || '');
  }
};

/**
 * Truncate text to n chars
 */
export const truncate = (str, n = 60) =>
  str?.length > n ? str.substring(0, n) + '…' : str;

/**
 * Get order status badge color
 */
export const getStatusColor = (status) => {
  const map = {
    placed: 'bg-blue-50 text-blue-700',
    confirmed: 'bg-indigo-50 text-indigo-700',
    crafting: 'bg-amber-50 text-amber-700',
    dispatched: 'bg-purple-50 text-purple-700',
    shipped: 'bg-purple-50 text-purple-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
  };
  return map[status] || 'bg-surface-container text-on-surface';
};

/**
 * Order status steps for timeline
 */
export const ORDER_STEPS = ['placed', 'confirmed', 'crafting', 'dispatched', 'delivered'];

export const getStepIndex = (status) => {
  if (status === 'shipped' || status === 'dispatched') return 3;
  return ORDER_STEPS.indexOf(status);
};

/**
 * Indian states list
 */
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry',
];

/**
 * Product categories
 */
export const CATEGORIES = [
  { value: 'all', label: 'All Products' },
  { value: 'slippers', label: 'Slippers & Mules' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'sandals', label: 'Sandals' },
  { value: 'belts', label: 'Belts' },
  { value: 'wallets', label: 'Wallets' },
];

/**
 * Shoe sizes (Indian)
 */
export const SHOE_SIZES = ['6', '7', '8', '9', '10', '11', '12'];

// Standard apparel size hierarchy for non-numeric sizing
const APPAREL_SIZE_MAP = {
  'XXXS': 1,
  '3XS': 1,
  'XXS': 2,
  '2XS': 2,
  'XS': 3,
  'S': 4,
  'M': 5,
  'L': 6,
  'XL': 7,
  'XXL': 8,
  '2XL': 8,
  'XXXL': 9,
  '3XL': 9,
  '4XL': 10,
  '5XL': 11,
  'FREE SIZE': 90,
  'ONE SIZE': 91,
  'STANDARD': 92,
};

/**
 * Normalizes and sorts product sizes in consistent ascending order:
 * 1. Numeric sizes (e.g. 6, 7, 8, 9, 10, 11, 12) ordered numerically
 * 2. Standard apparel sizes (XS, S, M, L, XL, etc.) ordered by hierarchy
 * 3. Preserves arbitrary alphanumeric sizes safely using natural comparison
 * 4. Deduplicates and trims sizes
 *
 * @param {Array|string} sizes Raw sizes array or comma-separated string
 * @returns {Array<string>} Sorted, normalized array of size strings
 */
export function sortSizes(sizes) {
  if (!sizes) return [];

  let list = [];
  if (Array.isArray(sizes)) {
    list = [...sizes];
  } else if (typeof sizes === 'string') {
    list = sizes.split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    return [];
  }

  const sanitized = [];
  const seen = new Set();
  for (const item of list) {
    if (item === undefined || item === null) continue;
    const str = String(item).trim();
    if (!str) continue;
    const key = str.toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      sanitized.push(str);
    }
  }

  return sanitized.sort((a, b) => {
    const numA = Number(a);
    const numB = Number(b);
    const isNumA = !isNaN(numA) && a.trim() !== '';
    const isNumB = !isNaN(numB) && b.trim() !== '';

    // If both are numeric, sort numerically ascending
    if (isNumA && isNumB) {
      return numA - numB;
    }

    // Numbers come before non-numbers
    if (isNumA && !isNumB) return -1;
    if (!isNumA && isNumB) return 1;

    // Check apparel size map
    const upperA = a.toUpperCase();
    const upperB = b.toUpperCase();
    const orderA = APPAREL_SIZE_MAP[upperA];
    const orderB = APPAREL_SIZE_MAP[upperB];

    if (orderA !== undefined && orderB !== undefined) {
      return orderA - orderB;
    }
    if (orderA !== undefined) return -1;
    if (orderB !== undefined) return 1;

    // Fallback: natural locale comparison
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });
}
