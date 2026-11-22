import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Provider-independent Email Service Abstraction
 * Currently powered by Gmail SMTP via Nodemailer.
 * Can be swapped for AWS SES, SendGrid, or Resend by changing this provider layer.
 */
class EmailProvider {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE !== 'false';
    const user = (process.env.SMTP_USER || '').trim();
    // Google App Passwords are 16 characters often copied with spaces like "abcd efgh ijkl mnop"
    const pass = (process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');

    if (!user || !pass) {
      console.warn('[EmailProvider] Warning: SMTP_USER or SMTP_PASS is missing in environment. Email sending may be disabled.');
      return;
    }

    const transportConfig = host.includes('gmail.com')
      ? {
          service: 'gmail',
          auth: { user, pass }
        }
      : {
          host,
          port,
          secure,
          auth: { user, pass },
          pool: true,
          maxConnections: 3,
          maxMessages: 100,
          rateLimit: 5,
          tls: {
            rejectUnauthorized: true,
          },
        };

    this.transporter = nodemailer.createTransport(transportConfig);
  }

  async verifyConnection() {
    if (!this.transporter) {
      this.initTransporter();
      if (!this.transporter) {
        throw new Error('SMTP transporter is not initialized. Please verify SMTP_USER and SMTP_PASS.');
      }
    }
    return new Promise((resolve, reject) => {
      this.transporter.verify((err, success) => {
        if (err) {
          console.error('[EmailProvider] SMTP Connection verification failed:', err.message);
          return reject(err);
        }
        resolve(success);
      });
    });
  }

  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const clean = email.trim();
    // Standard RFC 5322 regex for basic validation
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(clean);
  }

  async sendMail({ to, subject, html, text, from = null, fromName = null }) {
    if (!to || !this.isValidEmail(to)) {
      throw new Error(`Invalid recipient email address: "${to}"`);
    }

    if (!subject || typeof subject !== 'string') {
      throw new Error('Email subject is required');
    }

    if (!this.transporter) {
      this.initTransporter();
      if (!this.transporter) {
        throw new Error('SMTP transporter is not configured. Email cannot be delivered.');
      }
    }

    const defaultFrom = process.env.EMAIL_FROM || 'sales.maxywalk@gmail.com';
    const defaultFromName = process.env.EMAIL_FROM_NAME || 'MAXYWALK';
    const sender = `"${fromName || defaultFromName}" <${from || defaultFrom}>`;

    const mailOptions = {
      from: sender,
      to: to.trim().toLowerCase(),
      replyTo: process.env.EMAIL_FROM || 'sales.maxywalk@gmail.com',
      subject: subject.trim(),
      html,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      headers: {
        'X-Entity-Ref-ID': `maxywalk-${Date.now()}`,
        'X-Mailer': 'MAXYWALK Notification Engine'
      }
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (err) {
      console.error(`[EmailProvider] Delivery failed to ${to}:`, err.message);
      // Re-throw with clean message that never prints SMTP passwords
      const safeErr = new Error(`Email delivery failed: ${err.message}`);
      safeErr.code = err.code;
      safeErr.command = err.command;
      safeErr.response = err.response;
      throw safeErr;
    }
  }
}

export const emailProvider = new EmailProvider();
export default emailProvider;
