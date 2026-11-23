import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Provider-independent Email Service Abstraction
 * Primary Provider: Resend (Official SDK)
 * Fallback Provider: Gmail SMTP via Nodemailer
 */
class EmailProvider {
  constructor() {
    this.resend = null;
    this.smtpTransporter = null;
    this.initProviders();
  }

  initProviders() {
    const resendKey = (process.env.RESEND_API_KEY || '').trim();
    if (resendKey) {
      try {
        this.resend = new Resend(resendKey);
      } catch (err) {
        console.warn('[EmailProvider] Warning: Failed to initialize Resend client:', err.message);
      }
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE !== 'false';
    const user = (process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || '').trim();
    // Google App Passwords are 16 characters often copied with spaces like "nqmo qwyn lmhb yplb"
    const pass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASS || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');

    if (user && pass) {
      try {
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

        this.smtpTransporter = nodemailer.createTransport(transportConfig);
      } catch (err) {
        console.warn('[EmailProvider] Warning: Failed to initialize SMTP transporter:', err.message);
      }
    }
  }

  getActiveProvider() {
    const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASS || process.env.EMAIL_PASS || '').trim();
    const resendKey = (process.env.RESEND_API_KEY || '').trim();

    if (smtpUser && smtpPass) {
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
    // Standard RFC 5322 regex
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(clean);
  }

  async sendMail({ to, subject, html, text, from = null, replyTo = null, fromName = null }) {
    if (!to || !this.isValidEmail(to)) {
      throw new Error(`Invalid recipient email address: "${to}"`);
    }

    if (!subject || typeof subject !== 'string') {
      throw new Error('Email subject is required');
    }

    const cleanTo = to.trim().toLowerCase();
    const cleanSubject = subject.trim();
    const defaultFromName = process.env.EMAIL_FROM_NAME || 'MAXYWALK';
    const defaultFromEmail = process.env.EMAIL_FROM || 'shop.maxywalk@gmail.com';
    const sender = from || (defaultFromEmail.includes('<') ? defaultFromEmail : `"${fromName || defaultFromName}" <${defaultFromEmail}>`);
    const resolvedReplyTo = replyTo || process.env.EMAIL_REPLY_TO || defaultFromEmail;

    // 1. PRIMARY: SMTP Transporter (Authenticated Gmail SMTP with Google App Password)
    if (this.smtpTransporter) {
      try {
        return await this.sendViaSmtp({ to: cleanTo, subject: cleanSubject, html, text, sender, replyTo: resolvedReplyTo });
      } catch (smtpErr) {
        console.error(`[EmailProvider] SMTP delivery error to ${cleanTo}:`, smtpErr.message);
        if (!this.resend && (process.env.RESEND_API_KEY || '').trim()) {
          this.resend = new Resend(process.env.RESEND_API_KEY.trim());
        }
        if (!this.resend) throw smtpErr;
      }
    }

    // 2. FALLBACK or PRIMARY if no SMTP: Resend
    const resendKey = (process.env.RESEND_API_KEY || '').trim();
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

    throw new Error('No email provider configured. Please set RESEND_API_KEY or SMTP credentials in your environment variables.');
  }

  async sendViaSmtp({ to, subject, html, text, sender, replyTo }) {
    const mailOptions = {
      from: sender,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      replyTo: replyTo || undefined,
      headers: {
        'X-Entity-Ref-ID': `maxywalk-${Date.now()}`,
        'X-Mailer': 'MAXYWALK Notification Engine'
      }
    };

    const info = await this.smtpTransporter.sendMail(mailOptions);
    return {
      success: true,
      provider: 'smtp',
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  }
}

export const emailProvider = new EmailProvider();
export default emailProvider;
