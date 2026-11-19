import express from 'express';
import crypto from 'crypto';
import dns from 'dns';
import https from 'https';
import { query } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
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

// Support both single segment (ast-123) and multi-segment nested paths (products/mwjcr-01/image-01.jpg)
router.get('/*', async (req, res) => {
  try {
    const rawPath = req.params[0] || req.path.replace(/^\//, '');
    const id = decodeURIComponent(rawPath);

    if (!id) {
      return res.status(400).json({ error: 'Asset path is required' });
    }

    // 1. Try public.assets PostgreSQL database table first
    const rows = await query('SELECT mime_type, data, sha256 FROM public.assets WHERE id = $1 LIMIT 1;', [id]);
    if (rows.length > 0) {
      const asset = rows[0];
      res.set({
        'Content-Type': asset.mime_type || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': `"${asset.sha256}"`
      });

      let buffer;
      if (Buffer.isBuffer(asset.data)) {
        buffer = asset.data;
      } else if (typeof asset.data === 'string') {
        let b = Buffer.from(asset.data.replace(/^\\x/i, ''), 'hex');
        const s = b.toString('utf8');
        if (s.startsWith('\\x')) {
          b = Buffer.from(s.slice(2), 'hex');
        }
        buffer = b;
      } else {
        buffer = Buffer.from(asset.data);
      }

      return res.send(buffer);
    }

    // 2. Fallback to Neon Object Storage S3 Bucket
    if (s3) {
      try {
        const s3Res = await s3.send(new GetObjectCommand({
          Bucket: BUCKET,
          Key: id
        }));
        const bytes = await s3Res.Body.transformToByteArray();
        res.set({
          'Content-Type': s3Res.ContentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
        return res.send(Buffer.from(bytes));
      } catch (s3Err) {
        // Not in S3 either
      }
    }

    return res.status(404).json({ error: 'Asset not found' });
  } catch (err) {
    console.error('Asset stream error:', err);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// Admin Asset Upload Route (saves to both Neon DB table and Neon S3 bucket)
router.post('/upload', requireAdmin, async (req, res) => {
  try {
    const { filename, mime_type, data, customKey } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    let buffer;
    if (data.includes('base64,')) {
      buffer = Buffer.from(data.split('base64,')[1], 'base64');
    } else {
      buffer = Buffer.from(data, 'base64');
    }

    const mime = mime_type || (filename?.endsWith('.png') ? 'image/png' : 'image/jpeg');
    const id = customKey || `ast-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // 1. Insert into Neon public.assets table
    const hexData = `\\x${buffer.toString('hex')}`;
    await query(
      `INSERT INTO public.assets (id, filename, mime_type, size_bytes, data, sha256, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE SET
         filename = EXCLUDED.filename,
         mime_type = EXCLUDED.mime_type,
         size_bytes = EXCLUDED.size_bytes,
         data = EXCLUDED.data,
         sha256 = EXCLUDED.sha256;`,
      [id, filename || `${id}.jpg`, mime, buffer.length, hexData, sha256]
    );

    // 2. Also upload to Neon Object Storage S3 bucket
    if (s3) {
      try {
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: id,
          Body: buffer,
          ContentType: mime,
          CacheControl: 'public, max-age=31536000, immutable'
        }));
      } catch (s3Err) {
        console.warn('S3 upload warning on admin upload:', s3Err.message);
      }
    }

    res.status(201).json({
      url: `/api/assets/${id}`,
      id,
      filename: filename || `${id}.jpg`,
      size_bytes: buffer.length
    });
  } catch (err) {
    console.error('Asset upload error:', err);
    res.status(500).json({ error: 'Failed to upload asset' });
  }
});

export default router;
