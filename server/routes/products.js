import express from 'express';
import crypto from 'crypto';
import path from 'path';
import dns from 'dns';
import https from 'https';
import { query } from '../db.js';
import { compareProducts, sortSizes } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const BUCKET = process.env.NEON_BUCKET_NAME || 'maxywalk-assets';

// Fast in-memory cache for product catalog and details (TTL: 60s)
const productCache = new Map();
const PRODUCT_CACHE_TTL_MS = 60 * 1000;
const MAX_PRODUCT_CACHE = 100;

export function clearProductCache() {
  productCache.clear();
}

dns.setServers(['8.8.8.8', '1.1.1.1']);

function customLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.resolve4(hostname, (err, addresses) => {
    if (err || !addresses || addresses.length === 0) {
      return dns.lookup(hostname, options, callback);
    }
    if (options && options.all) {
      return callback(null, addresses.map(a => ({ address: a, family: 4 })));
    }
    return callback(null, addresses[0], 4);
  });
}

const httpsAgent = new https.Agent({ lookup: customLookup, keepAlive: false });

let s3 = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    requestHandler: new NodeHttpHandler({ httpsAgent })
  });
}

async function processProductImages(productId, images = []) {
  if (!Array.isArray(images)) return images;

  const processed = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (typeof img === 'string' && img.startsWith('data:image/')) {
      try {
        const [hdr, b64] = img.split(';base64,');
        const mime = hdr.replace('data:', '') || 'image/jpeg';
        const ext = mime.includes('png') ? 'png' : 'jpg';
        const key = `products/${productId}/image-${String(i + 1).padStart(2, '0')}.${ext}`;
        const buf = Buffer.from(b64, 'base64');
        const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
        const hexData = `\\x${buf.toString('hex')}`;

        // 1. Insert into Neon public.assets table
        await query(
          `INSERT INTO public.assets (id, filename, mime_type, size_bytes, data, sha256, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (id) DO UPDATE SET
             filename = EXCLUDED.filename,
             mime_type = EXCLUDED.mime_type,
             size_bytes = EXCLUDED.size_bytes,
             data = EXCLUDED.data,
             sha256 = EXCLUDED.sha256;`,
          [key, path.basename(key), mime, buf.length, hexData, sha256]
        );

        // 2. Upload to Neon S3 bucket
        if (s3) {
          try {
            await s3.send(new PutObjectCommand({
              Bucket: BUCKET,
              Key: key,
              Body: buf,
              ContentType: mime,
              CacheControl: 'public, max-age=31536000, immutable'
            }));
          } catch (e) {
            console.warn(`S3 upload warning for ${key}:`, e.message);
          }
        }

        processed.push(`/api/assets/${key}`);
      } catch (err) {
        console.error('Error processing product image:', err);
        processed.push(img);
      }
    } else {
      processed.push(img);
    }
  }

  return processed;
}

router.get('/', async (req, res) => {
  try {
    const { category, featured, exclusive, sort, limit, page } = req.query;

    // Set Edge CDN caching headers for global acceleration
    res.set('Cache-Control', 'public, max-age=15, s-maxage=60, stale-while-revalidate=300');

    // Check in-memory cache for serverless instance
    const cacheKey = `cat_${category || 'all'}_${featured || ''}_${exclusive || ''}_${sort || ''}_${limit || ''}_${page || '1'}`;
    const cached = productCache.get(cacheKey);
    if (cached && (Date.now() - cached.time) < PRODUCT_CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    let sql = 'SELECT * FROM public.products';
    const conditions = [];
    const params = [];

    if (category && category !== 'all') {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (featured === 'true' || featured === true) {
      params.push(true);
      conditions.push(`featured = $${params.length}`);
    }
    if (exclusive === 'true' || exclusive === true) {
      params.push(true);
      conditions.push(`is_exclusive = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const rows = await query(sql, params);

    // Normalize sizes and ensure numeric sorting
    let list = rows.map((p) => {
      let rawImgs = Array.isArray(p.images) ? p.images : (p.images ? JSON.parse(p.images) : []);
      // Convert any internal Base64 images to clean asset endpoint URLs if already saved in assets
      let finalImgs = rawImgs.map((img, idx) => {
        if (typeof img === 'string' && img.startsWith('data:image/')) {
          return `/api/assets/products/${p.id}/image-${String(idx + 1).padStart(2, '0')}.jpg`;
        }
        return img;
      });

      return {
        ...p,
        price: Number(p.price) || 0,
        original_price: p.original_price ? Number(p.original_price) : null,
        sizes: sortSizes(p.sizes || []),
        colors: Array.isArray(p.colors) ? p.colors : (p.colors ? JSON.parse(p.colors) : []),
        images: finalImgs
      };
    });

    // Sort order
    if (sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price || compareProducts(a, b));
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price || compareProducts(a, b));
    } else if (sort === 'newest') {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) || compareProducts(a, b));
    } else {
      list.sort(compareProducts);
    }

    const total = list.length;
    const pageNum = Math.max(Number(page) || 1, 1);
    const pageSize = limit && Number(limit) > 0 ? Math.min(Number(limit), 100) : total;

    if (page && limit) {
      const startIndex = (pageNum - 1) * pageSize;
      list = list.slice(startIndex, startIndex + pageSize);
    } else if (limit && Number(limit) > 0) {
      list = list.slice(0, pageSize);
    }

    const result = { products: list, total, page: pageNum, totalPages: Math.ceil(total / (pageSize || 1)) };

    // Store in instance cache
    if (productCache.size >= MAX_PRODUCT_CACHE) {
      const oldest = productCache.keys().next().value;
      productCache.delete(oldest);
    }
    productCache.set(cacheKey, { data: result, time: Date.now() });

    res.json(result);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    res.set('Cache-Control', 'public, max-age=15, s-maxage=60, stale-while-revalidate=300');

    const cacheKey = `product_${id}`;
    const cached = productCache.get(cacheKey);
    if (cached && (Date.now() - cached.time) < PRODUCT_CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const rows = await query('SELECT * FROM public.products WHERE id = $1 LIMIT 1;', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const p = rows[0];
    let rawImgs = Array.isArray(p.images) ? p.images : (p.images ? JSON.parse(p.images) : []);
    let finalImgs = rawImgs.map((img, idx) => {
      if (typeof img === 'string' && img.startsWith('data:image/')) {
        return `/api/assets/products/${p.id}/image-${String(idx + 1).padStart(2, '0')}.jpg`;
      }
      return img;
    });

    const normalized = {
      ...p,
      price: Number(p.price) || 0,
      original_price: p.original_price ? Number(p.original_price) : null,
      sizes: sortSizes(p.sizes || []),
      colors: Array.isArray(p.colors) ? p.colors : (p.colors ? JSON.parse(p.colors) : []),
      images: finalImgs
    };

    if (p.id === 'urbanedge-pro') {
      normalized.variants = [
        { id: 'black', name: 'Midnight Black', image: '/products/exclusive/black.png', hex: '#1F1E1D', colorHex: '#1F1E1D' },
        { id: 'maroon', name: 'Maroon', image: '/products/exclusive/maroon.png', hex: '#5A2328', colorHex: '#5A2328' },
        { id: 'sandal-wood', name: 'Sandal / Wood', image: '/products/exclusive/sandal_wood.png', hex: '#C28B53', colorHex: '#C28B53' },
        { id: 'lightblue', name: 'Light Blue', image: '/products/exclusive/lightblue.png', hex: '#88A0B5', colorHex: '#88A0B5' },
        { id: 'grey', name: 'Slate Grey', image: '/products/exclusive/gray.png', hex: '#6E6C6B', colorHex: '#6E6C6B' },
        { id: 'olivegreen', name: 'Olive Green', image: '/products/exclusive/olivegreen.png', hex: '#535D4A', colorHex: '#535D4A' },
        { id: 'rose', name: 'Rose', image: '/products/exclusive/rose.png', hex: '#B85B64', colorHex: '#B85B64' },
        { id: 'lightpink', name: 'Light Pink', image: '/products/exclusive/lightpink.png', hex: '#D8A0A6', colorHex: '#D8A0A6' }
      ];
    }

    if (productCache.size >= MAX_PRODUCT_CACHE) {
      const oldest = productCache.keys().next().value;
      productCache.delete(oldest);
    }
    productCache.set(cacheKey, { data: normalized, time: Date.now() });

    res.json(normalized);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || `mwjcr-${Date.now()}`;
    const sortedSizes = sortSizes(data.sizes || []);
    
    // Automatically save uploaded images to Neon public.assets and Neon S3 bucket
    const processedImages = await processProductImages(id, data.images || []);

    const sql = `
      INSERT INTO public.products (
        id, name, description, category, price, original_price,
        sizes, colors, images, stock, featured, is_exclusive,
        material, badge, rating, review_count, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11, $12, $13, $14, $15, $16, NOW())
      RETURNING *;
    `;

    const params = [
      id,
      data.name,
      data.description || '',
      data.category || 'slippers',
      Number(data.price) || 0,
      data.originalPrice || data.original_price ? Number(data.originalPrice || data.original_price) : null,
      JSON.stringify(sortedSizes),
      JSON.stringify(data.colors || []),
      JSON.stringify(processedImages),
      Number(data.stock) ?? 10,
      Boolean(data.featured),
      Boolean(data.is_exclusive),
      data.material || 'Full-Grain Leather',
      data.badge || null,
      Number(data.rating) || 5.0,
      Number(data.review_count) || 0
    ];

    const rows = await query(sql, params);
    clearProductCache();

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const sortedSizes = sortSizes(data.sizes || []);
    
    let processedImages = null;
    if (data.images) {
      processedImages = await processProductImages(id, data.images);
    }

    const sql = `
      UPDATE public.products SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        category = COALESCE($4, category),
        price = COALESCE($5, price),
        original_price = $6,
        sizes = COALESCE($7::jsonb, sizes),
        colors = COALESCE($8::jsonb, colors),
        images = COALESCE($9::jsonb, images),
        stock = COALESCE($10, stock),
        featured = COALESCE($11, featured),
        is_exclusive = COALESCE($12, is_exclusive),
        material = COALESCE($13, material),
        badge = $14
      WHERE id = $1
      RETURNING *;
    `;

    const params = [
      id,
      data.name,
      data.description,
      data.category,
      data.price !== undefined ? Number(data.price) : null,
      data.originalPrice !== undefined || data.original_price !== undefined ? Number(data.originalPrice || data.original_price) : null,
      data.sizes ? JSON.stringify(sortedSizes) : null,
      data.colors ? JSON.stringify(data.colors) : null,
      processedImages ? JSON.stringify(processedImages) : null,
      data.stock !== undefined ? Number(data.stock) : null,
      data.featured !== undefined ? Boolean(data.featured) : null,
      data.is_exclusive !== undefined ? Boolean(data.is_exclusive) : null,
      data.material,
      data.badge
    ];

    const rows = await query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    clearProductCache();
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM public.products WHERE id = $1;', [id]);
    clearProductCache();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
