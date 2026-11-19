import crypto from 'crypto';

export function naturalCompare(aStr = '', bStr = '') {
  const cleanA = String(aStr || '').trim().replace(/\s+/g, ' ');
  const cleanB = String(bStr || '').trim().replace(/\s+/g, ' ');

  const ax = [];
  const bx = [];

  cleanA.replace(/(\d+)|(\D+)/g, (_, $1, $2) => {
    ax.push([$1 ? Number($1) : Infinity, $2 ? $2.toLowerCase() : '']);
  });

  cleanB.replace(/(\d+)|(\D+)/g, (_, $1, $2) => {
    bx.push([$1 ? Number($1) : Infinity, $2 ? $2.toLowerCase() : '']);
  });

  while (ax.length && bx.length) {
    const an = ax.shift();
    const bn = bx.shift();
    if (an[0] !== Infinity || bn[0] !== Infinity) {
      if (an[0] !== bn[0]) {
        return an[0] - bn[0];
      }
    }
    const strDiff = an[1].localeCompare(bn[1], undefined, { sensitivity: 'base' });
    if (strDiff !== 0) return strDiff;
  }

  return ax.length - bx.length;
}

export function compareProducts(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  // 1. Exclusive product priority (UrbanEdge Pro / is_exclusive)
  const aEx = a.id === 'urbanedge-pro' || a.is_exclusive || a.isExclusive ? 1 : 0;
  const bEx = b.id === 'urbanedge-pro' || b.is_exclusive || b.isExclusive ? 1 : 0;
  if (aEx !== bEx) return bEx - aEx;

  // 2. Featured priority
  const aFeat = a.featured ? 1 : 0;
  const bFeat = b.featured ? 1 : 0;
  if (aFeat !== bFeat) return bFeat - aFeat;

  // 3. Natural alphanumeric sort by product name / code
  const nameDiff = naturalCompare(a.name || '', b.name || '');
  if (nameDiff !== 0) return nameDiff;

  // 4. Stable tie-breaker by created_at (older first)
  const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
  if (aTime !== bTime) return aTime - bTime;

  // 5. Fallback ID comparison
  return String(a.id || '').localeCompare(String(b.id || ''));
}

const APPAREL_ORDER = {
  'xs': 1, 'extra small': 1,
  's': 2, 'small': 2,
  'm': 3, 'medium': 3,
  'l': 4, 'large': 4,
  'xl': 5, 'extra large': 5,
  'xxl': 6, '2xl': 6,
  'xxxl': 7, '3xl': 7,
};

export function sortSizes(sizes) {
  if (!sizes) return [];

  let rawList = [];
  if (Array.isArray(sizes)) {
    rawList = sizes;
  } else if (typeof sizes === 'string') {
    rawList = sizes.split(',').map((s) => s.trim()).filter(Boolean);
  } else {
    return [];
  }

  const seen = new Set();
  const unique = [];
  for (const item of rawList) {
    if (item === null || item === undefined) continue;
    const str = String(item).trim();
    if (str && !seen.has(str)) {
      seen.add(str);
      unique.push(str);
    }
  }

  if (unique.length <= 1) return unique;

  const isAllNumeric = unique.every((s) => {
    const n = Number(s);
    return !Number.isNaN(n) && Number.isFinite(n);
  });

  if (isAllNumeric) {
    return unique.sort((a, b) => Number(a) - Number(b));
  }

  const isAllApparel = unique.every((s) => APPAREL_ORDER[s.toLowerCase()] !== undefined);
  if (isAllApparel) {
    return unique.sort((a, b) => APPAREL_ORDER[a.toLowerCase()] - APPAREL_ORDER[b.toLowerCase()]);
  }

  return unique.sort(naturalCompare);
}

// Password hashing using Node.js crypto.scrypt
export async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export async function verifyPassword(password, hash) {
  return new Promise((resolve) => {
    if (!hash || !hash.includes(':')) return resolve(false);
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
    });
  });
}
