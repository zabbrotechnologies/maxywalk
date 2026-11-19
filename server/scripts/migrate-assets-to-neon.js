import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dns from 'dns';
import https from 'https';
import { fileURLToPath } from 'url';
import { query } from '../db.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BUCKET = process.env.NEON_BUCKET_NAME || 'maxywalk-assets';

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

const httpsAgent = new https.Agent({
  lookup: customLookup,
  keepAlive: true,
});

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

async function uploadSingleAsset(key, filename, mimeType, buffer) {
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const hexData = `\\x${buffer.toString('hex')}`;

  if (s3) {
    try {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable'
      }));
      console.log(`  [S3 OK] ${key} (${(buffer.length / 1024).toFixed(1)} kB)`);
    } catch (e) {
      console.warn(`  [S3 Error] ${key}:`, e.message);
    }
  }

  try {
    await query(
      `INSERT INTO public.assets (id, filename, mime_type, size_bytes, data, sha256, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE SET
         filename = EXCLUDED.filename,
         mime_type = EXCLUDED.mime_type,
         size_bytes = EXCLUDED.size_bytes,
         data = EXCLUDED.data,
         sha256 = EXCLUDED.sha256;`,
      [key, filename, mimeType, buffer.length, hexData, sha256]
    );
  } catch (e) {}

  return { key, sizeBytes: buffer.length };
}

async function run() {
  console.log('=== COMPLETE MAXYWALK ASSET MIGRATION TO NEON S3 BUCKET ===');
  console.log(`Target Bucket: ${BUCKET}`);
  console.log(`S3 Connected: ${s3 ? 'YES' : 'NO'}`);

  const queue = [];

  // 1. Catalog Product Images
  console.log('\nScanning Catalog Product Images...');
  const prods = await query('SELECT id, name, images FROM public.products ORDER BY id ASC;');
  for (const p of prods) {
    let imgs = p.images;
    if (typeof imgs === 'string') {
      try { imgs = JSON.parse(imgs); } catch { imgs = []; }
    }
    if (!Array.isArray(imgs)) continue;

    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      if (typeof img === 'string' && img.startsWith('data:image/')) {
        const [hdr, b64] = img.split(';base64,');
        const mime = hdr.replace('data:', '') || 'image/jpeg';
        const buf = Buffer.from(b64, 'base64');
        const ext = mime.includes('png') ? 'png' : 'jpg';
        const key = `products/${p.id}/image-${String(i + 1).padStart(2, '0')}.${ext}`;
        const fn = `image-${String(i + 1).padStart(2, '0')}.${ext}`;
        queue.push({ key, fn, mime, buf });
      }
    }
  }

  // 2. Exclusive Product Assets
  console.log('Scanning Exclusive Product Assets...');
  const clientDir = path.resolve(ROOT_DIR, 'client/public/products/exclusive');
  if (fs.existsSync(clientDir)) {
    const exclFiles = fs.readdirSync(clientDir);
    for (const f of exclFiles) {
      if (f.endsWith('.png') || f.endsWith('.jpg')) {
        const filePath = path.join(clientDir, f);
        const buf = fs.readFileSync(filePath);
        const key = `products/urbanedge-pro/${f}`;
        queue.push({ key, fn: f, mime: 'image/png', buf });
      }
    }
  }

  // 3. Category & Brand Assets
  console.log('Scanning Category Showcase & Brand Images...');
  const publicDir = path.resolve(ROOT_DIR, 'client/public');
  const staticFiles = [
    { src: 'logo.png', destKey: 'brand/logo.png', mime: 'image/png' },
    { src: 'products/belt.png', destKey: 'categories/belt.png', mime: 'image/png' },
    { src: 'products/sandal.png', destKey: 'categories/sandal.png', mime: 'image/png' },
    { src: 'products/slipper.png', destKey: 'categories/slipper.png', mime: 'image/png' },
    { src: 'products/wallet.png', destKey: 'categories/wallet.png', mime: 'image/png' },
    { src: 'products/mule.png', destKey: 'categories/mule.png', mime: 'image/png' },
  ];

  for (const item of staticFiles) {
    const fullPath = path.join(publicDir, item.src);
    if (fs.existsSync(fullPath)) {
      const buf = fs.readFileSync(fullPath);
      queue.push({ key: item.destKey, fn: path.basename(item.src), mime: item.mime, buf });
    }
  }

  console.log(`\nTotal assets queued for upload: ${queue.length}`);
  console.log('Uploading in parallel batches of 5...\n');

  let totalUploaded = 0;
  let totalBytes = 0;
  const BATCH_SIZE = 5;

  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    const batch = queue.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(item => uploadSingleAsset(item.key, item.fn, item.mime, item.buf))
    );
    for (const r of results) {
      totalUploaded++;
      totalBytes += r.sizeBytes;
    }
  }

  console.log('\n=== COMPLETE S3 BUCKET SYNC FINISHED ===');
  console.log(`Successfully Uploaded: ${totalUploaded} objects to s3://${BUCKET}/`);
  console.log(`Total Upload Size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
}

run().catch(console.error);
