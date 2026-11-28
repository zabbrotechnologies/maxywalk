import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import { authenticate } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import customerRoutes from './routes/customers.js';
import assetRoutes from './routes/assets.js';
import paymentRoutes from './routes/payment.js';
import emailRoutes from './routes/emails.js';
import seoRoutes from './routes/seo.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({
  limit: '20mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(authenticate);

// API Routes
app.use('/api', paymentRoutes);
app.use('/api', seoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/admin/emails', emailRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'neon-postgresql', timestamp: new Date().toISOString() });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`MaxyWalk Express API server listening on http://localhost:${PORT}`);
  });
}

export default app;
