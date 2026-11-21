import express from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { queueEmail } from '../services/emailQueue.js';

const router = express.Router();

// Helper to call Razorpay API
async function callRazorpay(endpoint, method = 'POST', data = null) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const err = new Error('Razorpay credentials not configured in environment');
    err.status = 401;
    throw err;
  }

  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1${endpoint}`, {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  });

  const body = await response.json();
  if (!response.ok) {
    const err = new Error(body?.error?.description || body?.message || 'Razorpay API request failed');
    err.status = response.status === 401 ? 401 : 500;
    err.details = body;
    throw err;
  }
  return body;
}

/**
 * STEP 1: BACKEND - Create Order
 * POST /api/create-order (and /api/payment/create-order)
 * Request: { amount (paise), currency, receipt, notes }
 * Return: { order_id, amount, currency, key_id }
 */
router.post(['/create-order', '/payment/create-order'], async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount)) {
      return res.status(400).json({ error: 'Valid amount in paise is required' });
    }

    if (parsedAmount < 100) {
      return res.status(400).json({ error: 'Amount must be at least 100 paise (₹1.00)' });
    }

    const orderPayload = {
      amount: Math.round(parsedAmount),
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {}
    };

    const rzpOrder = await callRazorpay('/orders', 'POST', orderPayload);

    return res.status(200).json({
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Internal server error while creating order'
    });
  }
});

/**
 * STEP 3: BACKEND - Verify Signature
 * POST /api/verify-payment (and /api/payment/verify-payment)
 * Request: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 */
router.post(['/verify-payment', '/payment/verify-payment'], async (req, res) => {
  try {
    const orderId = req.body.razorpay_order_id || req.body.order_id;
    const paymentId = req.body.razorpay_payment_id || req.body.payment_id;
    const signature = req.body.razorpay_signature || req.body.signature;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required signature parameters (order_id, payment_id, signature)'
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        error: 'Razorpay key secret not configured on server'
      });
    }

    // HMAC-SHA256 verification
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);

    const isMatch = expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isMatch) {
      // Queue PAYMENT_FAILED email if order exists
      try {
        const failedOrders = await query('SELECT * FROM public.orders WHERE razorpay_order_id = $1 LIMIT 1;', [orderId]);
        if (failedOrders.length > 0 && failedOrders[0].user_email) {
          const fo = failedOrders[0];
          await queueEmail({
            orderId: fo.order_id || fo.id,
            recipientEmail: fo.user_email,
            eventType: 'PAYMENT_FAILED',
            subject: `Payment Unsuccessful — MAXYWALK Order #${fo.order_id || fo.id}`,
            templateData: { order: fo, amount: fo.total },
            idempotencyKey: `pay-failed-${orderId}`
          }).catch(e => console.warn('[Payment] Failed email notice:', e.message));
        }
      } catch {}

      return res.status(400).json({
        success: false,
        error: 'Signature verification failed'
      });
    }

    // If order exists in database, update payment status
    try {
      const orderRows = await query(
        `SELECT id, status, payment_status, items FROM public.orders 
         WHERE razorpay_order_id = $1 LIMIT 1;`,
        [orderId]
      );

      if (orderRows.length > 0 && orderRows[0].payment_status !== 'paid') {
        const order = orderRows[0];
        const items = Array.isArray(order.items) ? order.items : [];
        for (const item of items) {
          const pId = item.productId || item.id;
          const qty = Math.max(Number(item.qty) || 1, 1);
          if (pId) {
            await query('UPDATE public.products SET stock = GREATEST(stock - $2, 0) WHERE id = $1;', [pId, qty]);
          }
        }

        await query(
          `UPDATE public.orders 
           SET status = 'confirmed', payment_status = 'paid', razorpay_payment_id = $2, razorpay_signature = $3 
           WHERE id = $1;`,
          [order.id, paymentId, signature]
        );

        // Queue PAYMENT_SUCCESS notification
        if (order.user_email) {
          await queueEmail({
            orderId: order.order_id || order.id,
            recipientEmail: order.user_email,
            eventType: 'PAYMENT_SUCCESS',
            subject: `Payment Successful — MAXYWALK Order #${order.order_id || order.id}`,
            templateData: {
              order,
              amount: order.total,
              paymentMethod: 'Online / Razorpay',
              paymentRef: paymentId,
              date: new Date()
            },
            idempotencyKey: `pay-success-${paymentId}`
          }).catch(e => console.warn('[Payment] Success email notice:', e.message));
        }
      }
    } catch (dbErr) {
      console.warn('Note: Order DB status update bypassed:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order_id: orderId,
      payment_id: paymentId
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while verifying payment'
    });
  }
});

export default router;
