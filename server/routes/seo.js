import express from 'express';
import { query } from '../db.js';

const router = express.Router();

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/shop?category=slippers', changefreq: 'weekly', priority: '0.8' },
  { path: '/shop?category=shoes', changefreq: 'weekly', priority: '0.8' },
  { path: '/shop?category=mules', changefreq: 'weekly', priority: '0.8' },
  { path: '/shop?category=sandals', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/shipping', changefreq: 'monthly', priority: '0.4' },
  { path: '/refund-policy', changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.3' },
  { path: '/terms', changefreq: 'monthly', priority: '0.3' },
];

const FALLBACK_PRODUCT_IDS = [
  'urbanedge-pro',
  'mwjcr-01',
  'mwjcr-02',
  'mwjcr-03',
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getBaseUrl(req) {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL.replace(/\/+$/, '');
  }
  const host = req.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return `https://${host}`;
  }
  return 'https://maxywalk.com';
}

router.get('/sitemap.xml', async (req, res) => {
  const baseUrl = getBaseUrl(req);
  const today = new Date().toISOString().split('T')[0];

  let productEntries = [];
  try {
    const rows = await query(
      `SELECT id, updated_at, created_at FROM public.products ORDER BY created_at DESC LIMIT 500;`
    );
    if (Array.isArray(rows) && rows.length > 0) {
      productEntries = rows.map((r) => {
        const lastmod = (r.updated_at || r.created_at)
          ? new Date(r.updated_at || r.created_at).toISOString().split('T')[0]
          : today;
        return {
          path: `/product/${encodeURIComponent(r.id)}`,
          lastmod,
          changefreq: 'weekly',
          priority: '0.8',
        };
      });
    }
  } catch (err) {
    console.warn('Sitemap DB query fallback:', err.message);
  }

  if (productEntries.length === 0) {
    productEntries = FALLBACK_PRODUCT_IDS.map((id) => ({
      path: `/product/${encodeURIComponent(id)}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.8',
    }));
  }

  const urls = [
    ...STATIC_ROUTES.map((r) => ({ ...r, lastmod: today })),
    ...productEntries,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(`${baseUrl}${u.path}`)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(xml);
});

export default router;
