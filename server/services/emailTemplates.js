/**
 * MAXYWALK Luxury Email Template System
 * Responsive, Gmail-compatible HTML email templates with plain-text fallbacks.
 */

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatInr(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function getFullImageUrl(img, siteUrl = 'https://maxywalk.com') {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  if (img.startsWith('data:')) return '';
  const cleanPath = img.startsWith('/') ? img : '/' + img;
  const baseUrl = (process.env.CLIENT_URL || 'https://maxywalk.com').replace(/\/+$/, '');
  return `${baseUrl}${cleanPath}`;
}

// Master Layout Wrapper
function masterLayout({ preheader = '', contentHtml, siteUrl = 'https://maxywalk.com', isPromotional = false, unsubscribeUrl = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MAXYWALK</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1F1E1D;">
  ${preheader ? `<div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #FAF7F2; opacity: 0;">${escapeHtml(preheader)}</div>` : ''}


  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAF7F2; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card (600px Max) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E8E2D8; overflow: hidden; box-shadow: 0 4px 16px rgba(31, 30, 29, 0.04);">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 32px 24px 24px 24px; background-color: #1F1E1D; border-bottom: 2px solid #D35B22;">
              <a href="${siteUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #FFFFFF; text-transform: uppercase;">
                  MAXYWALK
                </span>
              </a>
              <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 2.5px; color: #D35B22; margin-top: 6px; font-weight: bold;">
                Handcrafted Pure Leather Footwear
              </div>
            </td>
          </tr>

          <!-- Dynamic Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Professional Footer -->
          <tr>
            <td style="padding: 24px 28px; background-color: #FAF7F2; border-top: 1px solid #E8E2D8; font-size: 12px; color: #78716C; text-align: center; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: bold; color: #1F1E1D;">MAXYWALK FOOTWEAR</p>
              <p style="margin: 0 0 10px 0;">Handcrafted Leather Footwear Workshop, Avadi, Chennai, Tamil Nadu 600054, India.</p>
              
              <p style="margin: 0 0 12px 0;">
                <a href="${siteUrl}/shop" style="color: #D35B22; text-decoration: none; font-weight: bold; margin: 0 8px;">Footwear Collection</a> &bull;
                <a href="${siteUrl}/account?tab=orders" style="color: #D35B22; text-decoration: none; font-weight: bold; margin: 0 8px;">Track Orders</a> &bull;
                <a href="mailto:shop.maxywalk@gmail.com" style="color: #D35B22; text-decoration: none; font-weight: bold; margin: 0 8px;">Customer Support</a>
              </p>

              ${isPromotional && unsubscribeUrl ? `
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #A8A29E;">
                You received this announcement because you are a registered customer of MAXYWALK.
                <br>
                <a href="${unsubscribeUrl}" style="color: #78716C; text-decoration: underline;">Unsubscribe</a>
              </p>
              ` : `
              <p style="margin: 10px 0 0 0; font-size: 11px; color: #A8A29E;">
                This transactional email was sent regarding your MAXYWALK account or order.
              </p>
              `}
              
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #A8A29E;">
                &copy; ${new Date().getFullYear()} MAXYWALK. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// 1. CUSTOMER_REGISTERED
export function renderWelcomeEmail({ name = 'Customer', email, siteUrl = 'https://maxywalk.com' }) {
  const cleanName = (name || '').trim();
  const isEmailOrId = cleanName.includes('@') || /\d/.test(cleanName) || /[._]/.test(cleanName) || cleanName.length > 30;
  const validName = !isEmailOrId && cleanName.toLowerCase() !== 'customer' && cleanName.toLowerCase() !== 'valued customer' ? cleanName : '';
  const firstName = validName ? escapeHtml(validName.split(' ')[0]) : '';
  const greeting = firstName ? `Hello ${firstName}, welcome to MAXYWALK.` : 'Welcome to MAXYWALK.';
  const subject = firstName ? `Welcome to MAXYWALK, ${firstName}` : 'Welcome to MAXYWALK — Your Account is Ready';
  const preheader = 'Your MAXYWALK account has been created. Handcrafted pure leather footwear from Avadi, Tamil Nadu.';
  const exploreUrl = `${siteUrl}/shop`;

  const contentHtml = `
    <h2 style="font-family: Georgia, serif; font-size: 22px; color: #1F1E1D; margin: 0 0 16px 0; font-weight: bold;">
      ${greeting}
    </h2>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 16px 0;">
      Thank you for creating an account with us. We are proud to welcome you to our community of handcrafted pure leather footwear lovers.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 20px 0;">
      Every pair of MAXYWALK footwear is handcrafted in Avadi using full-grain leather, built for comfort and durability.
    </p>

    <!-- Key Perks Box -->
    <div style="background-color: #FAF7F2; border-left: 3px solid #D35B22; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
      <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.2px; color: #D35B22; margin: 0 0 8px 0; font-weight: bold;">
        Account Benefits
      </h3>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #57534E; line-height: 1.6;">
        <li>Fast checkout with your saved delivery address</li>
        <li>Live real-time order tracking from workshop to doorstep</li>
        <li>Access to new footwear drops and limited editions</li>
      </ul>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="${exploreUrl}" target="_blank" style="display: inline-block; background-color: #1F1E1D; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 32px; border-radius: 6px; text-decoration: none;">
        Explore Footwear Collection
      </a>
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #78716C; margin: 0;">
      If you have questions about sizing or your order, reach out to us at 
      <a href="mailto:shop.maxywalk@gmail.com" style="color: #D35B22; font-weight: bold; text-decoration: none;">shop.maxywalk@gmail.com</a>.
    </p>
  `;

  const html = masterLayout({
    preheader,
    contentHtml,
    siteUrl,
    isPromotional: false
  });

  const text = `${greeting}

Thank you for creating an account with us. We are proud to welcome you to our community of handcrafted pure leather footwear lovers.

Every pair of MAXYWALK footwear is handcrafted in Avadi using full-grain leather, built for comfort and durability.

Account Benefits:
- Fast checkout with your saved delivery address
- Live real-time order tracking from workshop to doorstep
- Access to new footwear drops and limited editions

Explore Footwear Collection:
${exploreUrl}

If you have questions about sizing or your order, reach out to us at shop.maxywalk@gmail.com.

MAXYWALK FOOTWEAR
Handcrafted Leather Footwear Workshop, Avadi, Chennai, Tamil Nadu 600054, India.`;

  return { subject, html, text };
}

// 2. ORDER_PLACED
export function renderOrderPlacedEmail({ order, customerName = 'Customer', siteUrl = 'https://maxywalk.com' }) {
  const orderId = escapeHtml(order.order_id || order.id || 'MW-ORDER');
  const subject = `Your MAXYWALK Order Confirmation [#${orderId}]`;
  
  let items = [];
  if (Array.isArray(order.items)) {
    items = order.items;
  } else if (typeof order.items === 'string') {
    try { items = JSON.parse(order.items); } catch {}
  }

  let shippingAddr = {};
  const rawAddr = order.shipping_address || order.shippingAddress;
  if (typeof rawAddr === 'object' && rawAddr !== null) {
    shippingAddr = rawAddr;
  } else if (typeof rawAddr === 'string') {
    try { shippingAddr = JSON.parse(rawAddr); } catch {}
  }

  const resolvedName = customerName || shippingAddr.fullName || `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim() || 'Customer';
  const firstName = escapeHtml(resolvedName.split(' ')[0] || 'Customer');
  const total = formatInr(order.total);
  const subtotal = formatInr(order.subtotal || order.total);
  const stateVal = (shippingAddr.state || '').trim().toLowerCase().replace(/\s+/g, '');
  const isTN = stateVal === 'tamilnadu';
  const totalItemQty = items.reduce((sum, item) => sum + (Math.max(Number(item.qty) || 1, 1)), 0);
  const defaultShippingCost = (isTN ? 100 : 250) * Math.max(totalItemQty, 1);
  const shippingCost = order.shippingCost ? formatInr(order.shippingCost) : (order.shipping_cost ? formatInr(order.shipping_cost) : formatInr(defaultShippingCost));
  const viewOrderUrl = `${siteUrl}/account?tab=orders`;
  const paymentMethodLabel = (order.payment_method === 'cod' || order.paymentMethod === 'cod')
    ? 'Cash on Delivery (COD)'
    : (order.payment_status === 'paid' ? 'Paid Online via Razorpay' : 'Online Payment (Razorpay)');

  const itemsHtml = items.map((item) => {
    const imgUrl = getFullImageUrl(item.image, siteUrl);
    const size = item.size || item.selectedSize || 'Standard';
    const color = item.color || item.selectedColor || '';
    const qty = Number(item.qty) || 1;
    const priceNum = Number(item.price) || 0;
    const price = formatInr(priceNum);
    const itemTotal = formatInr(priceNum * qty);

    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E8E2D8; width: 70px; vertical-align: top;">
          <img src="${imgUrl}" alt="${escapeHtml(item.name || 'Product')}" width="64" height="74" style="display: block; border-radius: 8px; border: 1px solid #E8E2D8; object-fit: contain; background: #FAF7F2;">
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #E8E2D8; vertical-align: top;">
          <div style="font-weight: bold; font-size: 14px; color: #1F1E1D;">${escapeHtml(item.name || 'Footwear')}</div>
          <div style="font-size: 12px; color: #78716C; margin-top: 3px;">
            ${color ? escapeHtml(color) + ' &bull; ' : ''}Size ${escapeHtml(size)} &bull; Qty ${qty}
          </div>
          <div style="font-size: 12px; color: #57534E; margin-top: 3px;">${price} each</div>
        </td>
        <td align="right" style="padding: 12px 0; border-bottom: 1px solid #E8E2D8; font-weight: bold; font-size: 14px; color: #1F1E1D; vertical-align: top;">
          ${itemTotal}
        </td>
      </tr>
    `;
  }).join('');

  const contentHtml = `
    <div style="display: inline-block; background-color: #FAF7F2; color: #1F1E1D; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; letter-spacing: 1px; margin-bottom: 12px; border: 1px solid #E8E2D8;">
      Order Confirmation
    </div>
    <h2 style="font-family: Georgia, serif; font-size: 22px; color: #1F1E1D; margin: 0 0 8px 0; font-weight: bold;">
      Thank you for your order, ${firstName}.
    </h2>
    <p style="font-size: 14px; line-height: 1.6; color: #57534E; margin: 0 0 24px 0;">
      We have received order <strong>#${orderId}</strong>. Our workshop in Avadi is preparing your items.
    </p>

    <!-- Order Items Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <thead>
        <tr>
          <th align="left" colspan="2" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #78716C; padding-bottom: 8px; border-bottom: 2px solid #1F1E1D;">Item Summary</th>
          <th align="right" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #78716C; padding-bottom: 8px; border-bottom: 2px solid #1F1E1D;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Pricing Summary -->
    <div style="background-color: #FAF7F2; padding: 18px 20px; border-radius: 12px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; line-height: 1.8;">
        <tr>
          <td style="color: #78716C;">Payment Method</td>
          <td align="right" style="font-weight: bold; color: #1F1E1D;">${escapeHtml(paymentMethodLabel)}</td>
        </tr>
        <tr>
          <td style="color: #78716C;">Subtotal</td>
          <td align="right" style="font-weight: bold; color: #1F1E1D;">${subtotal}</td>
        </tr>
        <tr>
          <td style="color: #78716C;">Shipping Charges</td>
          <td align="right" style="font-weight: bold; color: #1F1E1D;">${shippingCost}</td>
        </tr>
        <tr>
          <td style="padding-top: 10px; border-top: 1px solid #E8E2D8; font-size: 15px; font-weight: bold; color: #1F1E1D;">Order Total</td>
          <td align="right" style="padding-top: 10px; border-top: 1px solid #E8E2D8; font-size: 16px; font-weight: bold; color: #D35B22;">${total}</td>
        </tr>
      </table>
    </div>

    <!-- Shipping Address & Details -->
    <div style="background-color: #FFFFFF; border: 1px solid #E8E2D8; padding: 16px 20px; border-radius: 12px; margin-bottom: 28px;">
      <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #1F1E1D; margin: 0 0 8px 0; font-weight: bold;">
        Delivery Destination
      </h3>
      <p style="font-size: 13px; line-height: 1.6; color: #44403C; margin: 0;">
        <strong>${escapeHtml(resolvedName)}</strong><br>
        ${escapeHtml(shippingAddr.address || '')}<br>
        ${escapeHtml(shippingAddr.city || '')}, ${escapeHtml(shippingAddr.state || '')} - ${escapeHtml(shippingAddr.pincode || '')}<br>
        ${shippingAddr.phone ? 'Phone: ' + escapeHtml(shippingAddr.phone) : ''}
      </p>
    </div>

    <!-- View & Track Order CTA -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${viewOrderUrl}" target="_blank" style="display: inline-block; background-color: #1F1E1D; color: #FFFFFF; font-size: 13px; font-weight: bold; letter-spacing: 1.5px; padding: 14px 36px; border-radius: 6px; text-decoration: none;">
        Track Your Order &rarr;
      </a>
    </div>
  `;

  const html = masterLayout({
    preheader: `Your MAXYWALK Order #${orderId} is confirmed! Total: ${total}.`,
    contentHtml,
    siteUrl
  });

  const itemsText = items.map(i => {
    const s = i.size || i.selectedSize || 'Standard';
    const q = Number(i.qty) || 1;
    const p = formatInr(Number(i.price) || 0);
    return ` - ${i.name || 'Footwear'} (Size ${s}, Qty ${q}) : ${p}`;
  }).join('\n');

  const addrText = `${resolvedName}\n${shippingAddr.address || ''}, ${shippingAddr.city || ''}, ${shippingAddr.state || ''} - ${shippingAddr.pincode || ''}${shippingAddr.phone ? ' | Phone: ' + shippingAddr.phone : ''}`;

  const text = `MAXYWALK Order Confirmation

Thank you for your order, ${resolvedName}.
We have received order #${orderId}. Our workshop in Avadi is preparing your items.

Order Summary:
${itemsText}

Subtotal: ${subtotal}
Shipping Charges: ${shippingCost}
Order Total: ${total}

Payment Method: ${paymentMethodLabel}

Delivery Destination:
${addrText}

Track Your Order:
${viewOrderUrl}

MAXYWALK FOOTWEAR
Handcrafted Leather Footwear Workshop, Avadi, Chennai, Tamil Nadu 600054, India.
Customer Support: shop.maxywalk@gmail.com`;
  return { subject, html, text };
}

// 3. PAYMENT_SUCCESS
export function renderPaymentSuccessEmail({
  order = {},
  amount,
  paymentMethod = 'Online / Razorpay',
  paymentRef,
  customerName = '',
  date = new Date(),
  siteUrl = 'https://maxywalk.com'
}) {
  const orderId = escapeHtml(order.order_id || order.id || 'MW-ORDER');
  const subject = `Payment Successful & Order Receipt — MAXYWALK Order #${orderId}`;

  // Parse items safely
  let items = [];
  if (Array.isArray(order.items)) {
    items = order.items;
  } else if (typeof order.items === 'string') {
    try { items = JSON.parse(order.items); } catch {}
  }

  // Parse shipping address safely
  let shippingAddr = {};
  const rawAddr = order.shipping_address || order.shippingAddress;
  if (typeof rawAddr === 'object' && rawAddr !== null) {
    shippingAddr = rawAddr;
  } else if (typeof rawAddr === 'string') {
    try { shippingAddr = JSON.parse(rawAddr); } catch {}
  }

  const resolvedCustomerName = customerName || shippingAddr.fullName || `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim() || 'Valued Customer';
  const firstName = escapeHtml(resolvedCustomerName.split(' ')[0] || 'Customer');
  const formattedAmount = formatInr(amount || order.total || 0);
  const subtotal = formatInr(order.subtotal || order.total || amount || 0);
  const stateVal = (shippingAddr.state || '').trim().toLowerCase().replace(/\s+/g, '');
  const isTN = stateVal === 'tamilnadu';
  const totalItemQty = items.reduce((sum, item) => sum + (Math.max(Number(item.qty) || 1, 1)), 0);
  const defaultShippingCost = (isTN ? 100 : 250) * Math.max(totalItemQty, 1);
  const shippingCost = order.shippingCost ? formatInr(order.shippingCost) : (order.shipping_cost ? formatInr(order.shipping_cost) : formatInr(defaultShippingCost));
  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const viewOrderUrl = `${siteUrl}/account?tab=orders`;

  const itemsHtml = items.map((item) => {
    const imgUrl = getFullImageUrl(item.image, siteUrl);
    const size = item.size || item.selectedSize || 'Standard';
    const color = item.color || item.selectedColor || '';
    const qty = Number(item.qty) || 1;
    const priceNum = Number(item.price) || 0;
    const price = formatInr(priceNum);
    const itemTotal = formatInr(priceNum * qty);

    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E8E2D8; width: 68px; vertical-align: top;">
          <img src="${imgUrl}" alt="${escapeHtml(item.name || 'Product')}" width="60" height="70" style="display: block; border-radius: 8px; border: 1px solid #E8E2D8; object-fit: contain; background: #FAF7F2;">
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #E8E2D8; vertical-align: top;">
          <div style="font-weight: bold; font-size: 14px; color: #1F1E1D;">${escapeHtml(item.name || 'Footwear')}</div>
          <div style="font-size: 12px; color: #78716C; margin-top: 3px;">
            ${color ? escapeHtml(color) + ' &bull; ' : ''}Size: ${escapeHtml(size)} &bull; Qty: ${qty}
          </div>
          <div style="font-size: 12px; color: #57534E; margin-top: 3px;">${price} each</div>
        </td>
        <td align="right" style="padding: 12px 0; border-bottom: 1px solid #E8E2D8; font-weight: bold; font-size: 14px; color: #1F1E1D; vertical-align: top;">
          ${itemTotal}
        </td>
      </tr>
    `;
  }).join('');

  const contentHtml = `
    <!-- Status Badge & Header -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 52px; height: 52px; line-height: 52px; border-radius: 50%; background-color: #ECFDF5; border: 2px solid #10B981; font-size: 26px; color: #10B981; text-align: center; margin-bottom: 12px;">
        &#10003;
      </div>
      <div>
        <span style="display: inline-block; background-color: #ECFDF5; color: #065F46; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; border: 1px solid #A7F3D0;">
          Payment Successful &bull; Order Confirmed
        </span>
      </div>
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1F1E1D; margin: 14px 0 6px 0; font-weight: bold;">
        Payment Receipt &amp; Tax Invoice
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #57534E; margin: 0;">
        Thank you for your order, <strong>${firstName}</strong>! Your payment has been verified and confirmed.
      </p>
    </div>

    <!-- Official Payment Receipt Box -->
    <div style="background-color: #FAF7F2; border: 1px solid #E8E2D8; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; line-height: 2;">
        <tr>
          <td style="color: #78716C; font-weight: 500;">Order Reference</td>
          <td align="right" style="font-weight: bold; color: #1F1E1D; font-size: 14px;">#${orderId}</td>
        </tr>
        <tr>
          <td style="color: #78716C; font-weight: 500;">Payment Status</td>
          <td align="right" style="font-weight: bold; color: #059669;">
            <span style="font-size: 9px; vertical-align: middle;">&#9679;</span> PAID (Verified via Razorpay)
          </td>
        </tr>
        <tr>
          <td style="color: #78716C; font-weight: 500;">Payment Method</td>
          <td align="right" style="font-weight: bold; color: #1F1E1D;">${escapeHtml(paymentMethod)}</td>
        </tr>
        ${paymentRef ? `
        <tr>
          <td style="color: #78716C; font-weight: 500;">Razorpay Payment ID</td>
          <td align="right" style="font-family: monospace; font-size: 12px; color: #1F1E1D; font-weight: 600;">${escapeHtml(paymentRef)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="color: #78716C; font-weight: 500;">Payment Date &amp; Time</td>
          <td align="right" style="font-weight: bold; color: #1F1E1D;">${formattedDate}</td>
        </tr>
      </table>
    </div>

    <!-- Order Items Summary Table -->
    ${items.length > 0 ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <thead>
        <tr>
          <th align="left" colspan="2" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #78716C; padding-bottom: 8px; border-bottom: 2px solid #1F1E1D;">Item Summary</th>
          <th align="right" style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #78716C; padding-bottom: 8px; border-bottom: 2px solid #1F1E1D;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    ` : ''}

    <!-- Pricing Summary Box -->
    <div style="background-color: #FAF7F2; padding: 18px 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #E8E2D8;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; line-height: 1.9;">
        <tr>
          <td style="color: #78716C;">Subtotal</td>
          <td align="right" style="font-weight: bold; color: #1F1E1D;">${subtotal}</td>
        </tr>
        <tr>
          <td style="color: #78716C;">Shipping Charges</td>
          <td align="right" style="font-weight: bold; color: #059669;">${shippingCost}</td>
        </tr>
        <tr>
          <td style="color: #78716C;">Taxes</td>
          <td align="right" style="color: #78716C; font-size: 12px;">Inclusive of all taxes</td>
        </tr>
        <tr>
          <td style="padding-top: 10px; border-top: 1px solid #E8E2D8; font-size: 15px; font-weight: bold; color: #1F1E1D;">Total Amount Paid</td>
          <td align="right" style="padding-top: 10px; border-top: 1px solid #E8E2D8; font-size: 18px; font-weight: bold; color: #D35B22;">${formattedAmount}</td>
        </tr>
      </table>
    </div>

    <!-- Shipping Destination Box -->
    <div style="background-color: #FFFFFF; border: 1px solid #E8E2D8; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px;">
      <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #1F1E1D; margin: 0 0 8px 0; font-weight: bold;">
        Delivery Destination
      </h3>
      <p style="font-size: 13px; line-height: 1.6; color: #44403C; margin: 0;">
        <strong>${escapeHtml(resolvedCustomerName)}</strong><br>
        ${escapeHtml(shippingAddr.address || '')}${shippingAddr.street ? '<br>' + escapeHtml(shippingAddr.street) : ''}<br>
        ${escapeHtml(shippingAddr.city || '')}${shippingAddr.city && shippingAddr.state ? ', ' : ''}${escapeHtml(shippingAddr.state || '')} - ${escapeHtml(shippingAddr.pincode || '')}<br>
        ${shippingAddr.phone ? 'Phone: ' + escapeHtml(shippingAddr.phone) : ''}
      </p>
    </div>

    <!-- Handcrafted Guarantee -->
    <div style="background-color: #FBF9F5; border-left: 3px solid #D35B22; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
      <p style="font-size: 12px; line-height: 1.6; color: #57534E; margin: 0;">
        <strong>Crafted in Avadi, Chennai:</strong> Our master leather artisans have received your order. Every pair undergoes a 24-point quality inspection before leaving our workshop.
      </p>
    </div>

    <!-- View & Track Order CTA -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${viewOrderUrl}" target="_blank" style="display: inline-block; background-color: #1F1E1D; color: #FFFFFF; font-size: 13px; font-weight: bold; letter-spacing: 1.5px; padding: 14px 36px; border-radius: 6px; text-decoration: none;">
        Track Your Order &rarr;
      </a>
    </div>

    <!-- Support Assistance -->
    <p style="font-size: 12px; line-height: 1.6; color: #78716C; text-align: center; margin: 0;">
      Questions about your order or receipt? Reply directly to this email (<a href="mailto:shop.maxywalk@gmail.com" style="color: #D35B22; font-weight: bold; text-decoration: none;">shop.maxywalk@gmail.com</a>) or contact our team at <strong>+91 94447 43465</strong>.
    </p>
  `;

  const html = masterLayout({
    preheader: `Payment receipt of ${formattedAmount} verified for MAXYWALK Order #${orderId}. Thank you for your purchase!`,
    contentHtml,
    siteUrl
  });

  const text = `MAXYWALK Official Payment Receipt & Order Confirmation
Order #${orderId}
Payment Status: PAID (Verified via Razorpay)
Total Amount Paid: ${formattedAmount}
Payment Method: ${paymentMethod}
${paymentRef ? `Razorpay Ref: ${paymentRef}\n` : ''}Date: ${formattedDate}

Customer: ${resolvedCustomerName}
${shippingAddr.address ? `Shipping: ${shippingAddr.address}, ${shippingAddr.city} - ${shippingAddr.pincode}\n` : ''}
Track your order at: ${viewOrderUrl}
For questions or support, contact shop.maxywalk@gmail.com or +91 94447 43465.`;

  return { subject, html, text };
}

// 4. PAYMENT_FAILED
export function renderPaymentFailedEmail({ order, amount, retryUrl, siteUrl = 'https://maxywalk.com' }) {
  const orderId = escapeHtml(order.order_id || order.id || 'MW-ORDER');
  const subject = `Payment Unsuccessful — MAXYWALK Order #${orderId}`;
  const formattedAmount = formatInr(amount || order.total);
  const checkoutUrl = retryUrl || `${siteUrl}/checkout`;

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #FEF2F2; border: 2px solid #EF4444; font-size: 28px; color: #EF4444; text-align: center;">
        &#10007;
      </div>
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1F1E1D; margin: 16px 0 6px 0; font-weight: bold;">
        Payment Unsuccessful
      </h2>
      <p style="font-size: 14px; color: #57534E; margin: 0;">
        We were unable to complete the payment of <strong>${formattedAmount}</strong> for Order <strong>#${orderId}</strong>.
      </p>
    </div>

    <p style="font-size: 14px; line-height: 1.6; color: #44403C; margin-bottom: 24px;">
      Don't worry — your selected items have not been lost. You can securely retry payment using any UPI, card, or Net Banking via Razorpay.
    </p>

    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${checkoutUrl}" target="_blank" style="display: inline-block; background-color: #D35B22; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 15px 36px; border-radius: 8px; text-decoration: none;">
        Complete Payment Now &rarr;
      </a>
    </div>

    <p style="font-size: 12px; color: #78716C; text-align: center; margin: 0;">
      If your account was debited, the amount will be automatically refunded by your bank within 3–5 business days. For assistance, email <a href="mailto:shop.maxywalk@gmail.com" style="color: #D35B22;">shop.maxywalk@gmail.com</a>.
    </p>
  `;

  const html = masterLayout({
    preheader: `Payment could not be completed for Order #${orderId}. Click to retry securely.`,
    contentHtml,
    siteUrl
  });

  const text = `Payment could not be completed for MAXYWALK Order #${orderId}. Retry payment at: ${checkoutUrl}`;
  return { subject, html, text };
}

// 5. ORDER_PROCESSING
export function renderOrderProcessingEmail({ order, customerName = 'Customer', siteUrl = 'https://maxywalk.com' }) {
  const orderId = escapeHtml(order.order_id || order.id || 'MW-ORDER');
  const subject = `Your MAXYWALK Order Is Being Prepared! — #${orderId}`;
  const firstName = escapeHtml(customerName.split(' ')[0] || 'Customer');
  const viewOrderUrl = `${siteUrl}/account?tab=orders`;

  const contentHtml = `
    <div style="display: inline-block; background-color: #FAF7F2; color: #D35B22; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
      Order In Production
    </div>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1F1E1D; margin: 0 0 16px 0; font-weight: bold;">
      Your Footwear Is in the Workshop, ${firstName}!
    </h2>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 16px 0;">
      Great news! Order <strong>#${orderId}</strong> has been verified and is currently being processed by our crafting team.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 24px 0;">
      Each piece undergoes rigorous material inspection, precision leather cutting, and structural hand-stitching to ensure maximum comfort and durability.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${viewOrderUrl}" target="_blank" style="display: inline-block; background-color: #1F1E1D; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 15px 36px; border-radius: 8px; text-decoration: none;">
        Track Crafting Progress &rarr;
      </a>
    </div>
  `;

  const html = masterLayout({
    preheader: `Order #${orderId} is now being prepared by our master artisans.`,
    contentHtml,
    siteUrl
  });

  const text = `Order #${orderId} is being prepared by our artisans. Track progress at: ${viewOrderUrl}`;
  return { subject, html, text };
}

// 6. ORDER_PACKED
export function renderOrderPackedEmail({ order, customerName = 'Customer', siteUrl = 'https://maxywalk.com' }) {
  const orderId = escapeHtml(order.order_id || order.id || 'MW-ORDER');
  const subject = `Your MAXYWALK Order Is Packed! — #${orderId}`;
  const firstName = escapeHtml(customerName.split(' ')[0] || 'Customer');
  const viewOrderUrl = `${siteUrl}/account?tab=orders`;

  const contentHtml = `
    <div style="display: inline-block; background-color: #FAF7F2; color: #D35B22; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
      Quality Passed &amp; Packed
    </div>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1F1E1D; margin: 0 0 16px 0; font-weight: bold;">
      Your Order Is Packed &amp; Ready, ${firstName}!
    </h2>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 16px 0;">
      Your handcrafted footwear for Order <strong>#${orderId}</strong> has completed finishing and passed our quality check.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 24px 0;">
      It has been securely boxed in our signature packaging and is currently staged for courier handover and dispatch.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${viewOrderUrl}" target="_blank" style="display: inline-block; background-color: #1F1E1D; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 15px 36px; border-radius: 8px; text-decoration: none;">
        View Order Status &rarr;
      </a>
    </div>
  `;

  const html = masterLayout({
    preheader: `Order #${orderId} is packed and ready for dispatch.`,
    contentHtml,
    siteUrl
  });

  const text = `Order #${orderId} is packed and ready for courier pickup. View details at: ${viewOrderUrl}`;
  return { subject, html, text };
}

// 7. ORDER_SHIPPED
export function renderOrderShippedEmail({ order, customerName = 'Customer', trackingInfo = {}, siteUrl = 'https://maxywalk.com' }) {
  const orderId = escapeHtml(order.order_id || order.id || 'MW-ORDER');
  const subject = `Your MAXYWALK Order Has Been Shipped! — #${orderId}`;
  const firstName = escapeHtml(customerName.split(' ')[0] || 'Customer');
  const courier = escapeHtml(trackingInfo.courier || 'Blue Dart / Delhivery');
  const trackingNumber = escapeHtml(trackingInfo.trackingNumber || trackingInfo.tracking_number || order.tracking_number || 'Available in tracking link');
  const trackUrl = trackingInfo.trackingUrl || trackingInfo.track_url || `${siteUrl}/account?tab=orders`;

  const contentHtml = `
    <div style="display: inline-block; background-color: #FAF7F2; color: #D35B22; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
      Dispatched
    </div>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1F1E1D; margin: 0 0 16px 0; font-weight: bold;">
      Your Footwear Is on Its Way, ${firstName}!
    </h2>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 24px 0;">
      Order <strong>#${orderId}</strong> has been handed over to our delivery partner and is en route to your shipping destination.
    </p>

    <!-- Tracking Details Box -->
    <div style="background-color: #FAF7F2; border: 1px solid #E8E2D8; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; line-height: 2;">
        <tr>
          <td style="color: #78716C;">Courier Partner</td>
          <td align="right" style="font-weight: bold; color: #1F1E1D;">${courier}</td>
        </tr>
        <tr>
          <td style="color: #78716C;">AWB / Tracking Number</td>
          <td align="right" style="font-family: monospace; font-size: 13px; font-weight: bold; color: #D35B22;">${trackingNumber}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${trackUrl}" target="_blank" style="display: inline-block; background-color: #1F1E1D; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 15px 36px; border-radius: 8px; text-decoration: none;">
        Track Your Shipment &rarr;
      </a>
    </div>
  `;

  const html = masterLayout({
    preheader: `Order #${orderId} has been shipped via ${courier}. Track live now.`,
    contentHtml,
    siteUrl
  });

  const text = `Order #${orderId} has been shipped via ${courier}. Tracking Number: ${trackingNumber}. Track at: ${trackUrl}`;
  return { subject, html, text };
}

// 8. OUT_FOR_DELIVERY
export function renderOutForDeliveryEmail({ order, customerName = 'Customer', trackingInfo = {}, siteUrl = 'https://maxywalk.com' }) {
  const orderId = escapeHtml(order.order_id || order.id || 'MW-ORDER');
  const subject = `Your MAXYWALK Order Is Out for Delivery! — #${orderId}`;
  const firstName = escapeHtml(customerName.split(' ')[0] || 'Customer');
  const trackUrl = trackingInfo.trackingUrl || `${siteUrl}/account?tab=orders`;

  const contentHtml = `
    <div style="display: inline-block; background-color: #ECFDF5; color: #047857; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
      Arriving Today
    </div>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1F1E1D; margin: 0 0 16px 0; font-weight: bold;">
      Your Package Is Out for Delivery, ${firstName}!
    </h2>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 16px 0;">
      Our delivery associate is in your area and will be delivering Order <strong>#${orderId}</strong> today.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 24px 0;">
      Please ensure someone is available at the delivery destination to receive the package.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${trackUrl}" target="_blank" style="display: inline-block; background-color: #1F1E1D; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 15px 36px; border-radius: 8px; text-decoration: none;">
        Track Live Status &rarr;
      </a>
    </div>
  `;

  const html = masterLayout({
    preheader: `Order #${orderId} is out for delivery today.`,
    contentHtml,
    siteUrl
  });

  const text = `Order #${orderId} is out for delivery today! Track at: ${trackUrl}`;
  return { subject, html, text };
}

// 9. ORDER_DELIVERED
export function renderOrderDeliveredEmail({ order, customerName = 'Customer', deliveryDate = new Date(), siteUrl = 'https://maxywalk.com' }) {
  const orderId = escapeHtml(order.order_id || order.id || 'MW-ORDER');
  const subject = `Your MAXYWALK Order Has Been Delivered! — #${orderId}`;
  const firstName = escapeHtml(customerName.split(' ')[0] || 'Customer');
  const formattedDate = new Date(deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const viewOrderUrl = `${siteUrl}/account?tab=orders`;

  const contentHtml = `
    <div style="display: inline-block; background-color: #ECFDF5; color: #047857; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
      Successfully Delivered
    </div>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1F1E1D; margin: 0 0 16px 0; font-weight: bold;">
      Delivered, ${firstName}! Step into Luxury.
    </h2>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 16px 0;">
      Your package for Order <strong>#${orderId}</strong> was delivered on <strong>${formattedDate}</strong>.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 24px 0;">
      We hope your new handcrafted leather footwear exceeds your expectations. To keep your leather soft and lustrous for years, nourish it periodically with a quality natural leather conditioner.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${viewOrderUrl}" target="_blank" style="display: inline-block; background-color: #1F1E1D; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 15px 36px; border-radius: 8px; text-decoration: none;">
        View Delivered Order &rarr;
      </a>
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #78716C; margin: 0;">
      Questions or sizing support? We are always here at <a href="mailto:shop.maxywalk@gmail.com" style="color: #D35B22;">shop.maxywalk@gmail.com</a>.
    </p>
  `;

  const html = masterLayout({
    preheader: `Order #${orderId} was delivered successfully on ${formattedDate}.`,
    contentHtml,
    siteUrl
  });

  const text = `Your MAXYWALK Order #${orderId} has been delivered. View order at ${viewOrderUrl}`;
  return { subject, html, text };
}

// 10. ORDER_CANCELLED
export function renderOrderCancelledEmail({ order, customerName = 'Customer', cancellationDate = new Date(), reason = '', siteUrl = 'https://maxywalk.com' }) {
  const orderId = escapeHtml(order.order_id || order.id || 'MW-ORDER');
  const subject = `Your MAXYWALK Order Has Been Cancelled — #${orderId}`;
  const firstName = escapeHtml(customerName.split(' ')[0] || 'Customer');
  const formattedDate = new Date(cancellationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const contentHtml = `
    <div style="display: inline-block; background-color: #FEF2F2; color: #B91C1C; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
      Order Cancelled
    </div>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1F1E1D; margin: 0 0 16px 0; font-weight: bold;">
      Order #${orderId} Has Been Cancelled
    </h2>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 16px 0;">
      Hello ${firstName}, your order <strong>#${orderId}</strong> was cancelled on <strong>${formattedDate}</strong>${reason ? ` for the following reason: <em>${escapeHtml(reason)}</em>` : ''}.
    </p>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 24px 0;">
      If you did not request this cancellation or have any inquiries, please contact our customer care team immediately at
      <a href="mailto:shop.maxywalk@gmail.com" style="color: #D35B22; font-weight: bold; text-decoration: none;">shop.maxywalk@gmail.com</a>.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${siteUrl}/shop" target="_blank" style="display: inline-block; background-color: #1F1E1D; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 15px 36px; border-radius: 8px; text-decoration: none;">
        Browse Store &rarr;
      </a>
    </div>
  `;

  const html = masterLayout({
    preheader: `Notice: Order #${orderId} has been cancelled.`,
    contentHtml,
    siteUrl
  });

  const text = `Order #${orderId} was cancelled on ${formattedDate}. For support, email shop.maxywalk@gmail.com.`;
  return { subject, html, text };
}

// 11. NEW_PRODUCT_PUBLISHED (Promotional Announcement)
export function renderNewProductAnnouncementEmail({ product, customerName = 'Valued Customer', siteUrl = 'https://maxywalk.com', unsubscribeUrl = '' }) {
  const prodName = escapeHtml(product.name || 'Handcrafted Footwear');
  const subject = `New Arrival at MAXYWALK — Discover ${prodName}!`;
  const firstName = escapeHtml(customerName.split(' ')[0] || 'Customer');
  const price = formatInr(product.price);
  const origPrice = product.original_price || product.originalPrice ? formatInr(product.original_price || product.originalPrice) : null;
  const description = escapeHtml(product.description || 'A timeless blend of pure full-grain leather, anatomical footbed support, and master craftsmanship.');
  const mainImage = getFullImageUrl(Array.isArray(product.images) ? product.images[0] : product.images, siteUrl);
  const productUrl = `${siteUrl}/product/${product.id}`;
  const shopUrl = `${siteUrl}/shop`;

  const sizes = Array.isArray(product.sizes) ? product.sizes.join(', ') : '';

  const contentHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; background-color: #FAF7F2; color: #D35B22; padding: 4px 14px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; border: 1px solid #E8E2D8;">
        NEW ARRIVAL &bull; LIMITED CRAFT
      </div>
      <h2 style="font-family: Georgia, serif; font-size: 28px; color: #1F1E1D; margin: 0 0 10px 0; font-weight: bold; line-height: 1.3;">
        Introducing ${prodName}
      </h2>
      <p style="font-size: 14px; color: #78716C; margin: 0;">
        Crafted exclusively for discerning footsteps, ${firstName}.
      </p>
    </div>

    <!-- Product Showcase Card -->
    <div style="background-color: #FAF7F2; border-radius: 16px; border: 1px solid #E8E2D8; padding: 20px; text-align: center; margin-bottom: 28px;">
      <a href="${productUrl}" target="_blank" style="text-decoration: none; display: block;">
        <img src="${mainImage}" alt="${prodName}" width="480" style="width: 100%; max-width: 480px; height: auto; max-height: 380px; object-fit: contain; border-radius: 12px; background-color: #FFFFFF; border: 1px solid #E8E2D8; margin-bottom: 16px;">
      </a>

      <div style="padding: 0 8px;">
        <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 16px 0;">
          ${description}
        </p>

        <!-- Pricing Tag -->
        <div style="margin-bottom: 16px;">
          <span style="font-size: 24px; font-weight: bold; color: #D35B22; font-family: Georgia, serif;">
            ${price}
          </span>
          ${origPrice ? `
          <span style="font-size: 15px; color: #A8A29E; text-decoration: line-through; margin-left: 8px;">
            ${origPrice}
          </span>
          ` : ''}
        </div>

        ${sizes ? `
        <div style="font-size: 12px; color: #78716C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">
          Available Sizes: <strong style="color: #1F1E1D;">${escapeHtml(sizes)}</strong>
        </div>
        ` : ''}

        <!-- Dual CTA Buttons -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <a href="${productUrl}" target="_blank" style="display: inline-block; background-color: #1F1E1D; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 15px 32px; border-radius: 8px; text-decoration: none; margin: 4px;">
                View Product Details &rarr;
              </a>
              <a href="${shopUrl}" target="_blank" style="display: inline-block; background-color: #FFFFFF; color: #1F1E1D; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 15px 28px; border-radius: 8px; text-decoration: none; border: 1px solid #1F1E1D; margin: 4px;">
                Shop All Footwear
              </a>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  const html = masterLayout({
    preheader: `New Arrival at MAXYWALK: ${prodName} is now live! Price: ${price}.`,
    contentHtml,
    siteUrl,
    isPromotional: true,
    unsubscribeUrl
  });

  const text = `New Arrival at MAXYWALK: Discover ${prodName}! Price: ${price}. View details at: ${productUrl} (To unsubscribe from announcements, visit ${unsubscribeUrl})`;
  return { subject, html, text };
}

// 12. REFUND_INITIATED
export function renderRefundInitiatedEmail({ order, customerName = 'Customer', amount, refundRef = '', date = new Date(), reason = '', siteUrl = 'https://maxywalk.com' }) {
  const orderId = escapeHtml(order.order_id || order.id || 'MW-ORDER');
  const subject = `Refund Initiated — MAXYWALK Order #${orderId}`;
  const firstName = escapeHtml(customerName.split(' ')[0] || 'Customer');
  const refundAmount = formatInr(amount || order.total || 0);
  const formattedDate = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const contentHtml = `
    <div style="display: inline-block; background-color: #EFF6FF; color: #1D4ED8; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
      Refund Initiated
    </div>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1F1E1D; margin: 0 0 16px 0; font-weight: bold;">
      Refund In Progress, ${firstName}
    </h2>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 16px 0;">
      A refund of <strong>${refundAmount}</strong> for your order <strong>#${orderId}</strong> was initiated on <strong>${formattedDate}</strong>.
    </p>

    <div style="background-color: #FAF7F2; border-radius: 12px; border: 1px solid #E8E2D8; padding: 18px 24px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
        <tr>
          <td style="color: #78716C; padding: 6px 0;">Order Reference:</td>
          <td align="right" style="font-weight: bold; color: #1F1E1D; padding: 6px 0;">#${orderId}</td>
        </tr>
        <tr>
          <td style="color: #78716C; padding: 6px 0;">Refund Amount:</td>
          <td align="right" style="font-weight: bold; color: #D35B22; font-size: 15px; padding: 6px 0;">${refundAmount}</td>
        </tr>
        ${refundRef ? `
        <tr>
          <td style="color: #78716C; padding: 6px 0;">Refund Reference / ARN:</td>
          <td align="right" style="font-family: monospace; color: #1F1E1D; padding: 6px 0;">${escapeHtml(refundRef)}</td>
        </tr>
        ` : ''}
        ${reason ? `
        <tr>
          <td style="color: #78716C; padding: 6px 0;">Reason:</td>
          <td align="right" style="color: #1F1E1D; padding: 6px 0;">${escapeHtml(reason)}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 24px 0;">
      The refund will be credited back to your original payment method (Bank Account / UPI / Card) within <strong>5–7 business days</strong> as per banking norms.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${siteUrl}/account?tab=orders" target="_blank" style="display: inline-block; background-color: #1F1E1D; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 15px 36px; border-radius: 8px; text-decoration: none;">
        View Order Status &rarr;
      </a>
    </div>

    <p style="font-size: 13px; line-height: 1.6; color: #78716C; margin: 0;">
      Need further assistance? Our support desk is available at <a href="mailto:shop.maxywalk@gmail.com" style="color: #D35B22;">shop.maxywalk@gmail.com</a>.
    </p>
  `;

  const html = masterLayout({
    preheader: `Refund of ${refundAmount} initiated for MAXYWALK Order #${orderId}.`,
    contentHtml,
    siteUrl
  });

  const text = `Refund of ${refundAmount} initiated for Order #${orderId}. It will reflect in 5-7 business days. Support: shop.maxywalk@gmail.com`;
  return { subject, html, text };
}

// 13. REFUND_COMPLETED
export function renderRefundCompletedEmail({ order, customerName = 'Customer', amount, refundRef = '', date = new Date(), siteUrl = 'https://maxywalk.com' }) {
  const orderId = escapeHtml(order.order_id || order.id || 'MW-ORDER');
  const subject = `Refund Completed — MAXYWALK Order #${orderId}`;
  const firstName = escapeHtml(customerName.split(' ')[0] || 'Customer');
  const refundAmount = formatInr(amount || order.total || 0);
  const formattedDate = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const contentHtml = `
    <div style="display: inline-block; background-color: #ECFDF5; color: #047857; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
      Refund Completed
    </div>
    <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1F1E1D; margin: 0 0 16px 0; font-weight: bold;">
      Refund Processed Successfully
    </h2>
    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 16px 0;">
      Hello ${firstName}, the refund of <strong>${refundAmount}</strong> for your order <strong>#${orderId}</strong> has been successfully settled on <strong>${formattedDate}</strong>.
    </p>

    <div style="background-color: #FAF7F2; border-radius: 12px; border: 1px solid #E8E2D8; padding: 18px 24px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
        <tr>
          <td style="color: #78716C; padding: 6px 0;">Order ID:</td>
          <td align="right" style="font-weight: bold; color: #1F1E1D; padding: 6px 0;">#${orderId}</td>
        </tr>
        <tr>
          <td style="color: #78716C; padding: 6px 0;">Refund Amount Settled:</td>
          <td align="right" style="font-weight: bold; color: #047857; font-size: 15px; padding: 6px 0;">${refundAmount}</td>
        </tr>
        ${refundRef ? `
        <tr>
          <td style="color: #78716C; padding: 6px 0;">Bank Reference / ARN:</td>
          <td align="right" style="font-family: monospace; color: #1F1E1D; padding: 6px 0;">${escapeHtml(refundRef)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="color: #78716C; padding: 6px 0;">Settlement Date:</td>
          <td align="right" style="color: #1F1E1D; padding: 6px 0;">${formattedDate}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 14px; line-height: 1.7; color: #44403C; margin: 0 0 24px 0;">
      Please check your bank statement or card summary. If you have not seen the funds reflected, please quote reference <strong>${escapeHtml(refundRef || orderId)}</strong> to your bank.
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${siteUrl}/shop" target="_blank" style="display: inline-block; background-color: #1F1E1D; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 15px 36px; border-radius: 8px; text-decoration: none;">
        Return to Shop &rarr;
      </a>
    </div>
  `;

  const html = masterLayout({
    preheader: `Refund of ${refundAmount} settled successfully for MAXYWALK Order #${orderId}.`,
    contentHtml,
    siteUrl
  });

  const text = `Refund of ${refundAmount} for Order #${orderId} has been successfully settled on ${formattedDate}. Support: shop.maxywalk@gmail.com`;
  return { subject, html, text };
}
