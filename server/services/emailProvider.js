import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Multi-path dotenv loader ensuring environment variables load regardless of working directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

/**
 * Provider-independent Email Service Abstraction
 * Primary Provider: Authenticated Gmail SMTP via Nodemailer
 * Fallback Provider: Resend (Official SDK)
 */
class EmailProvider {
  constructor() {
    this.resend = null;
  }

  getCredentials() {
    const user = (process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || 'shop.maxywalk@gmail.com').trim();
    const pass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASS || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE !== 'false';
    const resendKey = (process.env.RESEND_API_KEY || '').trim();

    return { user, pass, host, port, secure, resendKey };
  }

  createTransporter() {
    const { user, pass, host, port, secure } = this.getCredentials();
    if (!user || !pass) {
      return null;
    }

    try {
      // In serverless environments (Vercel / Lambda), pool: false is critical
      // to prevent dead socket reuse after container freezing.
      const transportConfig = host.includes('gmail.com')
        ? {
            service: 'gmail',
            auth: { user, pass },
            pool: false,
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 20000,
            tls: {
              rejectUnauthorized: false
            }
          }
        : {
            host,
            port,
            secure,
            auth: { user, pass },
            pool: false,
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 20000,
            tls: {
              rejectUnauthorized: false
            }
          };

      return nodemailer.createTransport(transportConfig);
    } catch (err) {
      console.warn('[EmailProvider] Warning: Failed to create SMTP transporter:', err.message);
      return null;
    }
  }

  getActiveProvider() {
    const { user, pass, resendKey } = this.getCredentials();
    if (user && pass) {
      return 'smtp';
    }
    if (resendKey) {
      return 'resend';
    }
    return 'none';
  }

  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const clean = email.trim();
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(clean);
  }

  async verifyConnection() {
    const transporter = this.createTransporter();
    if (!transporter) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in environment variables.');
    }
    return await transporter.verify();
  }

  async sendMail({ to, toName = null, subject, html, text, from = null, replyTo = null, fromName = null }) {
    if (!to || !this.isValidEmail(to)) {
      throw new Error(`Invalid recipient email address: "${to}"`);
    }

    if (!subject || typeof subject !== 'string') {
      throw new Error('Email subject is required');
    }

    const cleanTo = to.trim().toLowerCase();
    const formattedTo = toName ? `"${toName.replace(/"/g, '')}" <${cleanTo}>` : cleanTo;
    const cleanSubject = subject.trim();
    const defaultFromName = process.env.EMAIL_FROM_NAME || 'MAXYWALK';
    const defaultFromEmail = process.env.EMAIL_FROM || 'shop.maxywalk@gmail.com';
    const sender = from || (defaultFromEmail.includes('<') ? defaultFromEmail : `"${fromName || defaultFromName}" <${defaultFromEmail}>`);
    const resolvedReplyTo = replyTo || process.env.EMAIL_REPLY_TO || defaultFromEmail;

    const { user, pass, resendKey } = this.getCredentials();

    // 1. PRIMARY: Authenticated Gmail SMTP with Nodemailer
    if (user && pass) {
      try {
        return await this.sendViaSmtp({ to: formattedTo, subject: cleanSubject, html, text, sender, replyTo: resolvedReplyTo });
      } catch (smtpErr) {
        console.error(`[EmailProvider] SMTP delivery error to ${cleanTo}:`, smtpErr.message);
        if (!resendKey) {
          throw smtpErr;
        }
        console.warn('[EmailProvider] Falling back to Resend after SMTP error...');
      }
    }

    // 2. FALLBACK or PRIMARY if no SMTP: Resend
    if (resendKey) {
      if (!this.resend) {
        this.resend = new Resend(resendKey);
      }

      const payload = {
        from: sender,
        to: [cleanTo],
        subject: cleanSubject,
        html,
        text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        headers: {
          'X-Entity-Ref-ID': `maxywalk-${Date.now()}`
        }
      };

      if (resolvedReplyTo) {
        payload.reply_to = resolvedReplyTo;
      }

      const { data, error } = await this.resend.emails.send(payload);

      if (error) {
        throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
      }

      return {
        success: true,
        provider: 'resend',
        messageId: data?.id || `resend-${Date.now()}`
      };
    }

    throw new Error('No email provider configured. Please set SMTP_USER and SMTP_PASS (or RESEND_API_KEY) in environment variables.');
  }

  async sendViaSmtp({ to, subject, html, text, sender, replyTo }, isRetry = false) {
    const transporter = this.createTransporter();
    if (!transporter) {
      throw new Error('SMTP transporter could not be created. Check SMTP credentials.');
    }

    const { user } = this.getCredentials();
    const mailOptions = {
      from: sender,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      replyTo: replyTo || undefined,
      headers: {
        'List-Unsubscribe': `<mailto:${user || 'shop.maxywalk@gmail.com'}?subject=Unsubscribe>`,
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'X-Entity-Ref-ID': `mw-${Date.now()}`
      }
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      return {
        success: true,
        provider: 'smtp',
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (err) {
      // If a handshake timeout or socket closure occurred, retry once with a fresh socket
      if (!isRetry) {
        console.warn(`[EmailProvider] SMTP attempt 1 failed (${err.message}), retrying once with clean connection...`);
        await new Promise((resolve) => setTimeout(resolve, 800));
        return await this.sendViaSmtp({ to, subject, html, text, sender, replyTo }, true);
      }
      throw err;
    }
  }
}

export const emailProvider = new EmailProvider();
export default emailProvider;
