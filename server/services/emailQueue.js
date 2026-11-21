import crypto from 'crypto';
import { query } from '../db.js';
import emailProvider from './emailProvider.js';
import * as templates from './emailTemplates.js';

let isProcessing = false;

/**
 * Get or create unique unsubscribe token for a customer
 */
export async function getOrCreateUnsubscribeToken(email, customerId = null) {
  const cleanEmail = email.toLowerCase().trim();
  const existing = await query(
    'SELECT unsubscribe_token, promotional_emails_enabled FROM public.customer_email_preferences WHERE LOWER(email) = $1 LIMIT 1;',
    [cleanEmail]
  );

  if (existing.length > 0 && existing[0].unsubscribe_token) {
    return {
      token: existing[0].unsubscribe_token,
      enabled: existing[0].promotional_emails_enabled
    };
  }

  const token = crypto.randomBytes(24).toString('hex');
  const id = `pref-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  await query(
    `INSERT INTO public.customer_email_preferences (id, customer_id, email, promotional_emails_enabled, unsubscribe_token, created_at, updated_at)
     VALUES ($1, $2, $3, true, $4, NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET unsubscribe_token = EXCLUDED.unsubscribe_token
     RETURNING unsubscribe_token, promotional_emails_enabled;`,
    [id, customerId, cleanEmail, token]
  );

  return { token, enabled: true };
}

/**
 * Enqueue a single transactional or announcement notification safely and idempotently.
 */
export async function queueEmail({
  customerId = null,
  orderId = null,
  productId = null,
  campaignId = null,
  recipientEmail,
  eventType,
  subject,
  templateData = {},
  notificationCategory = 'transactional',
  idempotencyKey = null,
  immediate = true
}) {
  if (!recipientEmail || !emailProvider.isValidEmail(recipientEmail)) {
    console.warn(`[EmailQueue] Skipping queue insertion for invalid email: "${recipientEmail}"`);
    return null;
  }

  const cleanEmail = recipientEmail.toLowerCase().trim();
  const id = `enq-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const key = idempotencyKey || `idem-${id}`;

  try {
    const rows = await query(
      `INSERT INTO public.email_notification_queue (
        id, customer_id, order_id, product_id, campaign_id,
        recipient_email, event_type, subject, template_data,
        notification_category, idempotency_key, status,
        attempts, max_attempts, next_retry_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, 'pending', 0, 4, NOW(), NOW())
      ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = NOW()
      RETURNING *;`,
      [
        id,
        customerId,
        orderId,
        productId,
        campaignId,
        cleanEmail,
        eventType,
        subject,
        JSON.stringify(templateData || {}),
        notificationCategory,
        key
      ]
    );

    // For transactional customer emails in serverless, process immediately within the function lifecycle
    if (immediate && notificationCategory === 'transactional') {
      try {
        await processEmailQueue({ batchSize: 1 });
      } catch (e) {
        console.warn('[EmailQueue] Immediate delivery notice:', e.message);
      }
    } else {
      triggerQueueProcessorSoon();
    }

    return rows[0] || null;
  } catch (err) {
    console.error(`[EmailQueue] Error queuing ${eventType} to ${cleanEmail}:`, err.message);
    return null;
  }
}

/**
 * Queue a new product announcement campaign for all eligible registered customers.
 */
export async function queueNewProductAnnouncement(product) {
  if (!product || !product.id) return null;

  // 1. Check if an announcement campaign has already been triggered for this product
  const existingCampaign = await query(
    'SELECT id, campaign_status FROM public.product_announcement_campaigns WHERE product_id = $1 LIMIT 1;',
    [product.id]
  );

  if (existingCampaign.length > 0) {
    console.log(`[EmailQueue] Announcement already exists for product ${product.id} (Campaign: ${existingCampaign[0].id}). Skipping duplicate campaign.`);
    return existingCampaign[0];
  }

  // 2. Fetch all registered customer accounts (excluding admin accounts)
  const customers = await query(`
    SELECT DISTINCT u.id, u.email, u.name, p.promotional_emails_enabled, p.unsubscribe_token
    FROM public.users u
    LEFT JOIN public.customer_email_preferences p ON LOWER(u.email) = LOWER(p.email)
    WHERE u.role != 'admin' 
      AND LOWER(u.email) NOT LIKE '%admin%'
      AND u.email IS NOT NULL 
      AND u.email != ''
      AND (p.promotional_emails_enabled IS NULL OR p.promotional_emails_enabled = true);
  `);

  const campaignId = `camp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const totalRecipients = customers.length;
  const siteUrl = process.env.CLIENT_URL || 'https://maxywalk.com';

  console.log(`[EmailQueue] Creating Product Announcement Campaign ${campaignId} for "${product.name}" with ${totalRecipients} eligible recipients.`);

  // 3. Create Campaign record
  await query(
    `INSERT INTO public.product_announcement_campaigns (
      id, product_id, product_name, campaign_status, total_recipients,
      queued_count, sent_count, failed_count, created_at
    ) VALUES ($1, $2, $3, 'queued', $4, 0, 0, 0, NOW());`,
    [campaignId, product.id, product.name || 'Footwear Drop', totalRecipients]
  );

  if (totalRecipients === 0) {
    await query(
      "UPDATE public.product_announcement_campaigns SET campaign_status = 'completed', completed_at = NOW() WHERE id = $1;",
      [campaignId]
    );
    return { id: campaignId, status: 'completed', total_recipients: 0 };
  }

  // 4. Insert queue items in batches of 50 to avoid query size limits
  const BATCH_SIZE = 50;
  let queuedTotal = 0;

  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    const chunk = customers.slice(i, i + BATCH_SIZE);
    for (const cust of chunk) {
      if (!emailProvider.isValidEmail(cust.email)) continue;

      const token = cust.unsubscribe_token || crypto.randomBytes(24).toString('hex');
      const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${token}`;

      const subject = `New Arrival at MAXYWALK — Discover ${product.name || 'Handcrafted Footwear'}!`;
      const templateData = {
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          original_price: product.original_price || product.originalPrice,
          sizes: product.sizes,
          images: product.images
        },
        customerName: cust.name || 'Valued Customer',
        unsubscribeUrl,
        siteUrl
      };

      const idempotencyKey = `announcement-${campaignId}-${cust.email.toLowerCase().trim()}`;

      await queueEmail({
        customerId: cust.id,
        productId: product.id,
        campaignId,
        recipientEmail: cust.email,
        eventType: 'NEW_PRODUCT_PUBLISHED',
        subject,
        templateData,
        notificationCategory: 'announcement',
        idempotencyKey
      });

      queuedTotal++;
    }
  }

  // 5. Update campaign status to active/queued
  await query(
    "UPDATE public.product_announcement_campaigns SET queued_count = $2, campaign_status = 'processing' WHERE id = $1;",
    [campaignId, queuedTotal]
  );

  // In serverless environments, process the announcement batch immediately within the request lifecycle
  try {
    await processEmailQueue({ batchSize: 50 });
  } catch (err) {
    console.warn('[EmailQueue] Immediate campaign processing notice:', err.message);
  }

  return { id: campaignId, status: 'processing', total_recipients: totalRecipients, queued_count: queuedTotal };
}

/**
 * Process a batch of pending/retrying emails atomically using FOR UPDATE SKIP LOCKED
 */
export async function processEmailQueue({ batchSize = 10 } = {}) {
  if (isProcessing) {
    return { processed: 0, message: 'Queue processor is currently busy' };
  }

  isProcessing = true;
  let processedCount = 0;
  const siteUrl = process.env.CLIENT_URL || 'https://maxywalk.com';

  try {
    // Unstick any jobs that were frozen midway in a recycled serverless container
    await query(`
      UPDATE public.email_notification_queue 
      SET status = 'pending' 
      WHERE status = 'processing' 
        AND updated_at < NOW() - INTERVAL '3 minutes';
    `);

    // Atomically claim up to batchSize jobs
    const jobs = await query(
      `SELECT * FROM public.email_notification_queue
       WHERE status IN ('pending', 'retrying') 
         AND next_retry_at <= NOW()
       ORDER BY created_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED;`,
      [batchSize]
    );

    if (jobs.length === 0) {
      return { processed: 0, message: 'Queue is clear' };
    }

    for (const job of jobs) {
      // Mark as processing
      await query("UPDATE public.email_notification_queue SET status = 'processing', updated_at = NOW() WHERE id = $1;", [job.id]);

      let rendered = null;
      const data = typeof job.template_data === 'string' ? JSON.parse(job.template_data || '{}') : (job.template_data || {});
      data.siteUrl = data.siteUrl || siteUrl;

      try {
        switch (job.event_type) {
          case 'CUSTOMER_REGISTERED':
            rendered = templates.renderWelcomeEmail(data);
            break;
          case 'ORDER_PLACED':
            rendered = templates.renderOrderPlacedEmail(data);
            break;
          case 'PAYMENT_SUCCESS':
            rendered = templates.renderPaymentSuccessEmail(data);
            break;
          case 'PAYMENT_FAILED':
            rendered = templates.renderPaymentFailedEmail(data);
            break;
          case 'ORDER_PROCESSING':
            rendered = templates.renderOrderProcessingEmail(data);
            break;
          case 'ORDER_PACKED':
            rendered = templates.renderOrderPackedEmail(data);
            break;
          case 'ORDER_SHIPPED':
            rendered = templates.renderOrderShippedEmail(data);
            break;
          case 'OUT_FOR_DELIVERY':
            rendered = templates.renderOutForDeliveryEmail(data);
            break;
          case 'ORDER_DELIVERED':
            rendered = templates.renderOrderDeliveredEmail(data);
            break;
          case 'ORDER_CANCELLED':
            rendered = templates.renderOrderCancelledEmail(data);
            break;
          case 'NEW_PRODUCT_PUBLISHED':
            rendered = templates.renderNewProductAnnouncementEmail(data);
            break;
          default:
            throw new Error(`Unknown event type: ${job.event_type}`);
        }

        // Deliver email via provider
        const sendResult = await emailProvider.sendMail({
          to: job.recipient_email,
          subject: job.subject || rendered.subject,
          html: rendered.html,
          text: rendered.text
        });

        // 1. Success transition
        await query(
          `UPDATE public.email_notification_queue 
           SET status = 'sent', sent_at = NOW(), attempts = attempts + 1, last_error = NULL 
           WHERE id = $1;`,
          [job.id]
        );

        // 2. Log success
        const logId = `log-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        await query(
          `INSERT INTO public.email_notification_logs (
            id, notification_id, event_type, recipient_email, delivery_status,
            provider_message_id, created_at
          ) VALUES ($1, $2, $3, $4, 'success', $5, NOW());`,
          [logId, job.id, job.event_type, job.recipient_email, sendResult.messageId || 'sent']
        );

        // 3. Update campaign counter if applicable
        if (job.campaign_id) {
          await query(
            'UPDATE public.product_announcement_campaigns SET sent_count = sent_count + 1 WHERE id = $1;',
            [job.campaign_id]
          );
        }

        processedCount++;
      } catch (err) {
        console.error(`[EmailQueue] Delivery failure for job ${job.id} (${job.event_type} to ${job.recipient_email}):`, err.message);

        const nextAttempts = (job.attempts || 0) + 1;
        const maxAttempts = job.max_attempts || 4;
        const isPermanent = nextAttempts >= maxAttempts || err.message?.includes('Invalid recipient') || err.code === 'EENVELOPE';

        const newStatus = isPermanent ? 'failed' : 'retrying';
        // Exponential backoff: 2min, 4min, 8min...
        const backoffMinutes = Math.min(Math.pow(2, nextAttempts), 30);

        await query(
          `UPDATE public.email_notification_queue 
           SET status = $2, 
               attempts = $3, 
               last_error = $4, 
               next_retry_at = NOW() + INTERVAL '1 minute' * $5
           WHERE id = $1;`,
          [job.id, newStatus, nextAttempts, err.message, backoffMinutes]
        );

        // Log failure
        const logId = `log-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        await query(
          `INSERT INTO public.email_notification_logs (
            id, notification_id, event_type, recipient_email, delivery_status,
            error_message, created_at
          ) VALUES ($1, $2, $3, $4, 'failed', $5, NOW());`,
          [logId, job.id, job.event_type, job.recipient_email, err.message]
        );

        // If campaign job permanently failed, update campaign counter
        if (job.campaign_id && isPermanent) {
          await query(
            'UPDATE public.product_announcement_campaigns SET failed_count = failed_count + 1 WHERE id = $1;',
            [job.campaign_id]
          );
        }
      }
    }

    // Check completed campaigns
    await query(`
      UPDATE public.product_announcement_campaigns
      SET campaign_status = 'completed', completed_at = NOW()
      WHERE campaign_status = 'processing' 
        AND (sent_count + failed_count) >= total_recipients;
    `);

    return { processed: processedCount, totalClaimed: jobs.length };
  } finally {
    isProcessing = false;
  }
}

/**
 * Debounced trigger to process queue in background soon
 */
let debounceTimer = null;
export function triggerQueueProcessorSoon() {
  if (debounceTimer) return;
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    processEmailQueue({ batchSize: 10 }).catch((err) => {
      console.warn('[EmailQueue] Background processor error:', err.message);
    });
  }, 1000);
}

/**
 * Retry an eligible failed email notification
 */
export async function retryNotification(id) {
  const rows = await query(
    `UPDATE public.email_notification_queue 
     SET status = 'pending', attempts = 0, next_retry_at = NOW(), last_error = NULL
     WHERE id = $1 
     RETURNING *;`,
    [id]
  );
  if (rows.length > 0) {
    triggerQueueProcessorSoon();
    return rows[0];
  }
  return null;
}
