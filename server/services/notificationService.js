import crypto from 'crypto';
import { query } from '../db.js';
import emailProvider from './emailProvider.js';
import * as templates from './emailTemplates.js';

/**
 * Event-Driven Order Notification Service
 * Primary Engine for Transactional Order & Payment Notifications
 * Powered by Resend (Official SDK) with PostgreSQL Idempotency & Tracking
 */

/**
 * Build a deterministic idempotency key for an event
 */
export function buildIdempotencyKey(eventType, orderId, qualifier = '') {
  const cleanType = String(eventType || '').toLowerCase().trim();
  const cleanOrder = String(orderId || '').trim();
  const cleanQual = String(qualifier || '').trim();
  return cleanQual ? `notif-${cleanType}-${cleanOrder}-${cleanQual}` : `notif-${cleanType}-${cleanOrder}`;
}

/**
 * Dispatch an event-driven order notification immediately and idempotently.
 * Never throws unhandled errors to the caller — order and payment flows remain guaranteed.
 */
export async function sendOrderNotification({
  order,
  eventType,
  recipientEmail = null,
  customerName = null,
  trackingInfo = null,
  reason = null,
  metadata = {},
  forceRetry = false,
  idempotencyKey = null
}) {
  if (!order || (!order.id && !order.order_id)) {
    console.warn('[NotificationService] Skipped: Invalid order payload provided');
    return { success: false, error: 'Invalid order' };
  }

  const orderId = order.order_id || order.id;
  const siteUrl = process.env.CLIENT_URL || 'https://maxywalk.com';

  // 1. Resolve shipping address & recipient email safely
  const addr = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address || '{}')
    : (order.shipping_address || {});

  const targetEmail = (
    recipientEmail ||
    order.user_email ||
    order.userEmail ||
    addr.email ||
    ''
  ).toLowerCase().trim();

  if (!targetEmail || !emailProvider.isValidEmail(targetEmail)) {
    console.warn(`[NotificationService] Skipped ${eventType} for order #${orderId}: No valid recipient email ("${targetEmail}")`);
    return { success: false, error: `Invalid recipient email: "${targetEmail}"` };
  }

  const resolvedCustomerName = customerName || 
    addr.fullName || 
    `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || 
    order.userName || 
    'Valued Customer';

  // 2. Generate or verify Idempotency Key
  const eventKey = idempotencyKey || buildIdempotencyKey(eventType, order.id || orderId);

  try {
    // 3. Idempotency Check
    const existing = await query(
      `SELECT id, status, attempt_count, provider_message_id, created_at 
       FROM public.email_notifications 
       WHERE idempotency_key = $1 LIMIT 1;`,
      [eventKey]
    );

    let notifId = `notif-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    let isRetryAttempt = false;

    if (existing.length > 0) {
      const record = existing[0];
      if (record.status === 'sent' && !forceRetry) {
        console.log(`[NotificationService] Idempotency: Notification ${eventKey} already sent (${record.provider_message_id}). Skipping duplicate email.`);
        return {
          success: true,
          skipped: true,
          reason: 'duplicate_prevented',
          providerMessageId: record.provider_message_id
        };
      }
      notifId = record.id;
      isRetryAttempt = true;
    }

    // 4. Render Email Template
    let rendered = null;
    const templateData = {
      order,
      customerName: resolvedCustomerName,
      trackingInfo: trackingInfo || {
        courier: addr.courier || 'Blue Dart / Delhivery',
        trackingNumber: order.tracking_number || addr.tracking_number || 'Available in tracking link',
        trackingUrl: addr.tracking_url || `${siteUrl}/account?tab=orders`
      },
      reason: reason || metadata.reason || '',
      amount: metadata.amount || order.total,
      refundRef: metadata.refundRef || metadata.refundId || order.razorpay_payment_id || '',
      paymentMethod: metadata.paymentMethod || (order.payment_method === 'razorpay' ? 'Online / Razorpay' : 'Cash on Delivery'),
      paymentRef: metadata.paymentRef || metadata.paymentId || order.razorpay_payment_id || '',
      siteUrl
    };

    switch (eventType) {
      case 'ORDER_PLACED':
        rendered = templates.renderOrderPlacedEmail(templateData);
        break;
      case 'PAYMENT_SUCCESS':
        rendered = templates.renderPaymentSuccessEmail(templateData);
        break;
      case 'PAYMENT_FAILED':
        rendered = templates.renderPaymentFailedEmail({
          ...templateData,
          retryUrl: `${siteUrl}/checkout`
        });
        break;
      case 'ORDER_PROCESSING':
        rendered = templates.renderOrderProcessingEmail(templateData);
        break;
      case 'ORDER_PACKED':
        rendered = templates.renderOrderPackedEmail(templateData);
        break;
      case 'ORDER_SHIPPED':
        rendered = templates.renderOrderShippedEmail(templateData);
        break;
      case 'OUT_FOR_DELIVERY':
        rendered = templates.renderOutForDeliveryEmail(templateData);
        break;
      case 'ORDER_DELIVERED':
        rendered = templates.renderOrderDeliveredEmail(templateData);
        break;
      case 'ORDER_CANCELLED':
        rendered = templates.renderOrderCancelledEmail(templateData);
        break;
      case 'REFUND_INITIATED':
        rendered = templates.renderRefundInitiatedEmail(templateData);
        break;
      case 'REFUND_COMPLETED':
        rendered = templates.renderRefundCompletedEmail(templateData);
        break;
      case 'CUSTOMER_REGISTERED':
        rendered = templates.renderWelcomeEmail({
          name: resolvedCustomerName,
          email: targetEmail,
          siteUrl
        });
        break;
      default:
        console.warn(`[NotificationService] Unrecognized eventType: ${eventType}`);
        return { success: false, error: `Unrecognized eventType: ${eventType}` };
    }

    // 5. Insert or Update Pending Notification Record
    if (isRetryAttempt) {
      await query(
        `UPDATE public.email_notifications 
         SET attempt_count = attempt_count + 1, updated_at = NOW() 
         WHERE id = $1;`,
        [notifId]
      );
    } else {
      await query(
        `INSERT INTO public.email_notifications (
          id, order_id, customer_id, event_type, recipient_email,
          subject, provider, status, attempt_count, idempotency_key,
          metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 1, $8, $9::jsonb, NOW(), NOW())
        ON CONFLICT (idempotency_key) DO UPDATE SET updated_at = NOW();`,
        [
          notifId,
          orderId,
          order.customer_id || null,
          eventType,
          targetEmail,
          rendered.subject,
          emailProvider.getActiveProvider(),
          eventKey,
          JSON.stringify(metadata || {})
        ]
      );
    }

    // 6. Deliver via Resend
    let sendResult = null;
    try {
      sendResult = await emailProvider.sendMail({
        to: targetEmail,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text
      });

      // 7. Update status to 'sent'
      await query(
        `UPDATE public.email_notifications 
         SET status = 'sent', provider = $2, provider_message_id = $3, 
             sent_at = NOW(), last_error = NULL, updated_at = NOW() 
         WHERE id = $1;`,
        [notifId, sendResult.provider || 'resend', sendResult.messageId || 'sent']
      );

      // Log success in logs table
      const logId = `log-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      await query(
        `INSERT INTO public.email_notification_logs (
          id, notification_id, event_type, recipient_email, delivery_status,
          provider_message_id, created_at
        ) VALUES ($1, $2, $3, $4, 'success', $5, NOW());`,
        [logId, notifId, eventType, targetEmail, sendResult.messageId || 'sent']
      ).catch(() => {});

      console.log(`[NotificationService] Successfully sent ${eventType} for order #${orderId} to ${targetEmail} (Provider ID: ${sendResult.messageId})`);
      return { success: true, providerMessageId: sendResult.messageId, notifId };
    } catch (deliverErr) {
      console.error(`[NotificationService] Delivery failed for ${eventType} to ${targetEmail}:`, deliverErr.message);

      // 8. Record failure in database
      await query(
        `UPDATE public.email_notifications 
         SET status = 'failed', last_error = $2, updated_at = NOW() 
         WHERE id = $1;`,
        [notifId, deliverErr.message]
      );

      const logId = `log-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      await query(
        `INSERT INTO public.email_notification_logs (
          id, notification_id, event_type, recipient_email, delivery_status,
          error_message, created_at
        ) VALUES ($1, $2, $3, $4, 'failed', $5, NOW());`,
        [logId, notifId, eventType, targetEmail, deliverErr.message]
      ).catch(() => {});

      return { success: false, error: deliverErr.message, notifId };
    }
  } catch (err) {
    console.error(`[NotificationService] Fatal notification error for order #${orderId}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Manually retry a failed email notification from the Admin Dashboard
 */
export async function retryNotificationById(notificationId) {
  const rows = await query(
    `SELECT * FROM public.email_notifications WHERE id = $1 LIMIT 1;`,
    [notificationId]
  );

  if (rows.length === 0) {
    throw new Error('Notification record not found');
  }

  const notif = rows[0];
  let order = null;

  if (notif.order_id) {
    const orderRows = await query(
      `SELECT * FROM public.orders WHERE id = $1 OR order_id = $1 LIMIT 1;`,
      [notif.order_id]
    );
    if (orderRows.length > 0) {
      order = orderRows[0];
    }
  }

  if (!order) {
    order = {
      id: notif.order_id,
      order_id: notif.order_id,
      user_email: notif.recipient_email,
      total: notif.metadata?.amount || 0
    };
  }

  return sendOrderNotification({
    order,
    eventType: notif.event_type,
    recipientEmail: notif.recipient_email,
    metadata: notif.metadata || {},
    idempotencyKey: notif.idempotency_key,
    forceRetry: true
  });
}

export default {
  sendOrderNotification,
  retryNotificationById,
  buildIdempotencyKey
};
