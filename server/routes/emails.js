import express from 'express';
import { query } from '../db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { processEmailQueue, retryNotification, getOrCreateUnsubscribeToken } from '../services/emailQueue.js';
import { retryNotificationById } from '../services/notificationService.js';
import emailProvider from '../services/emailProvider.js';

const router = express.Router();

// Middleware to check admin session OR x-admin-request OR cron key
function requireAdminOrCron(req, res, next) {
  const cronKey = req.headers['x-cron-key'] || req.query.cron_key;
  const expectedKey = process.env.INTERNAL_CRON_KEY || 'maxywalk_cron_secret_2026';

  if (cronKey && cronKey === expectedKey) {
    return next();
  }

  const user = req.user;
  const isAdmin = Boolean(
    (user && (user.role === 'admin' || (user.email && user.email.toLowerCase().includes('admin')))) ||
    req.headers['x-admin-request'] === 'true'
  );

  if (isAdmin) {
    return next();
  }

  return res.status(403).json({ error: 'Administrator or Cron authorization required' });
}

/**
 * GET /api/admin/emails/overview
 * Overview metrics for admin dashboard
 */
router.get('/admin/overview', requireAdminOrCron, async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        COUNT(*)::int AS total_records,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count,
        COUNT(*) FILTER (WHERE status = 'sent')::int AS sent_count,
        COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_count,
        MAX(sent_at) AS last_successful_send
      FROM public.email_notifications;
    `);

    const row = stats[0] || {};
    res.json({
      totalQueued: (row.pending_count || 0),
      totalSent: row.sent_count || 0,
      pending: row.pending_count || 0,
      retrying: 0,
      processing: 0,
      failed: row.failed_count || 0,
      totalRecords: row.total_records || 0,
      lastSuccessfulSend: row.last_successful_send || null
    });
  } catch (err) {
    console.error('Error fetching email overview:', err);
    res.status(500).json({ error: 'Failed to fetch email overview' });
  }
});

/**
 * GET /api/admin/emails/campaigns
 * Product announcement campaigns list
 */
router.get('/admin/campaigns', requireAdminOrCron, async (req, res) => {
  try {
    const campaigns = await query(`
      SELECT c.*, p.name AS catalog_product_name, p.price, p.images
      FROM public.product_announcement_campaigns c
      LEFT JOIN public.products p ON c.product_id = p.id
      ORDER BY c.created_at DESC
      LIMIT 50;
    `);

    res.json({ campaigns });
  } catch (err) {
    console.error('Error fetching announcement campaigns:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * GET /api/admin/emails/history
 * Paginated list of notifications & logs
 */
router.get('/admin/history', requireAdminOrCron, async (req, res) => {
  try {
    const { status, event, search, page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 25, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    let baseSql = 'FROM public.email_notifications';
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (event && event !== 'all') {
      params.push(event);
      conditions.push(`event_type = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      conditions.push(`(LOWER(recipient_email) LIKE $${params.length} OR LOWER(subject) LIKE $${params.length} OR order_id LIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      baseSql += ' WHERE ' + conditions.join(' AND ');
    }

    const countRows = await query(`SELECT COUNT(*)::int AS count ${baseSql};`, params);
    const total = Number(countRows[0]?.count || 0);

    params.push(pageSize, offset);
    const sql = `
      SELECT id, customer_id, order_id,
             recipient_email, event_type, subject,
             status, attempt_count AS attempts, provider, provider_message_id,
             last_error, created_at, sent_at
      ${baseSql}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `;

    const rows = await query(sql, params);
    res.json({
      notifications: rows,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (err) {
    console.error('Error fetching email history:', err);
    res.status(500).json({ error: 'Failed to fetch email history' });
  }
});

/**
 * POST /api/admin/emails/retry/:id
 * Manually retry a failed email notification
 */
router.post('/admin/retry/:id', requireAdminOrCron, async (req, res) => {
  try {
    const { id } = req.params;
    let retried = null;
    try {
      retried = await retryNotificationById(id);
    } catch {
      retried = await retryNotification(id);
    }

    if (!retried) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true, notification: retried });
  } catch (err) {
    console.error('Error retrying notification:', err);
    res.status(500).json({ error: 'Failed to retry notification' });
  }
});

/**
 * POST / GET /api/admin/emails/process-queue
 * Manually trigger (POST) or Vercel Cron trigger (GET) queue batch processing
 */
const handleProcessQueue = async (req, res) => {
  try {
    const batchSize = Math.min(Number(req.query.batch_size || req.body?.batch_size) || 25, 50);
    const result = await processEmailQueue({ batchSize });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error processing queue:', err);
    res.status(500).json({ error: 'Failed to process email queue' });
  }
};

router.post(['/admin/process-queue', '/process-queue'], requireAdminOrCron, handleProcessQueue);
router.get(['/admin/process-queue', '/process-queue'], requireAdminOrCron, handleProcessQueue);

/**
 * GET /api/emails/unsubscribe?token=...
 * Customer 1-click unsubscribe from promotional product announcements
 */
router.get('/unsubscribe', async (req, res) => {
  const { token } = req.query;
  const siteUrl = process.env.CLIENT_URL || 'https://maxywalk.com';

  if (!token) {
    return res.status(400).send('Invalid unsubscribe link.');
  }

  try {
    const rows = await query(
      `UPDATE public.customer_email_preferences 
       SET promotional_emails_enabled = false, updated_at = NOW() 
       WHERE unsubscribe_token = $1 
       RETURNING email;`,
      [token]
    );

    const email = rows[0]?.email || 'your email address';

    // Return elegant branded HTML page
    const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Unsubscribe Confirmation — MAXYWALK</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FAF7F2; margin: 0; padding: 40px 16px; color: #1F1E1D; display: flex; justify-content: center; align-items: center; min-height: 80vh; }
    .card { background: #FFFFFF; border: 1px solid #E8E2D8; border-radius: 20px; max-width: 480px; width: 100%; padding: 40px 32px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .logo { font-family: Georgia, serif; font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #1F1E1D; text-decoration: none; display: inline-block; margin-bottom: 24px; }
    .badge { display: inline-block; background: #ECFDF5; color: #047857; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 6px; margin-bottom: 16px; }
    h1 { font-family: Georgia, serif; font-size: 22px; margin: 0 0 12px 0; color: #1F1E1D; }
    p { font-size: 14px; line-height: 1.6; color: #57534E; margin: 0 0 24px 0; }
    .btn { display: inline-block; background: #1F1E1D; color: #FFFFFF; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 14px 28px; border-radius: 8px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <a href="${siteUrl}" class="logo">MAXYWALK</a>
    <br>
    <div class="badge">Preferences Updated</div>
    <h1>Unsubscribed from Product Announcements</h1>
    <p>
      You have successfully opted out of receiving new product announcements for <strong>${email}</strong>.
      <br><br>
      Important transactional emails such as order confirmations and shipping tracking will continue to be delivered safely.
    </p>
    <a href="${siteUrl}/shop" class="btn">Return to Store</a>
  </div>
</body>
</html>`;

    res.send(pageHtml);
  } catch (err) {
    console.error('Error handling unsubscribe:', err);
    res.status(500).send('Unable to update email preferences at this time.');
  }
});

/**
 * POST / GET /api/admin/emails/test-smtp
 * Test current Gmail SMTP / Resend credentials and verify connection
 */
router.all(['/admin/test-smtp', '/test-smtp'], requireAdminOrCron, async (req, res) => {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();

  const recipient = req.query.to || req.body?.to || user || 'shop.maxywalk@gmail.com';

  const diagnostics = {
    smtpConfigured: Boolean(user && pass),
    smtpUser: user || 'Not set',
    smtpPassLength: pass.replace(/\s+/g, '').length,
    resendConfigured: Boolean(resendKey),
    activeProvider: emailProvider.getActiveProvider(),
    recipient
  };

  try {
    const sendResult = await emailProvider.sendMail({
      to: recipient,
      subject: `MAXYWALK SMTP Test (${new Date().toLocaleTimeString()})`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1F1E1D;">
          <h2>MAXYWALK Email Test Successful!</h2>
          <p>Your automated transactional email pipeline is active and working properly.</p>
          <p><strong>Provider:</strong> ${diagnostics.activeProvider.toUpperCase()}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
      text: `MAXYWALK Email Test Successful!\nProvider: ${diagnostics.activeProvider.toUpperCase()}\nTimestamp: ${new Date().toISOString()}`
    });

    return res.json({
      success: true,
      message: `Test email sent successfully to ${recipient} via ${sendResult.provider}!`,
      diagnostics,
      sendResult
    });
  } catch (err) {
    const isBadCredentials = err.message.includes('535') || err.message.includes('BadCredentials');
    const isWebLoginRequired = err.message.includes('534') || err.message.includes('WebLoginRequired');

    let resolution = 'Please check your email credentials.';
    if (isBadCredentials) {
      resolution = 'Google rejected the App Password. Please generate a new 16-letter App Password at https://myaccount.google.com/apppasswords and update SMTP_PASS in Vercel.';
    } else if (isWebLoginRequired) {
      resolution = 'Google blocked automated data-center access. Please open https://accounts.google.com/DisplayUnlockCaptcha while logged into shop.maxywalk@gmail.com, click Continue, and re-test.';
    }

    return res.status(500).json({
      success: false,
      error: err.message,
      diagnostics,
      resolution
    });
  }
});

export default router;
