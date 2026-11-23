import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Production-ready Gmail SMTP & Transactional Email Automation
 * Communicates via authenticated Gmail SMTP using a Google App Password.
 * Event-driven: Dispatches immediately inside serverless request lifecycle without cron jobs.
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const user = (process.env.SMTP_USER || 'shop.maxywalk@gmail.com').trim();
    // 16-character Google App Passwords may have spaces like "nqmo qwyn lmhb yplb"
    const pass = (process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE !== 'false';

    if (!user || !pass) {
      console.warn('[EmailService] SMTP_USER or SMTP_PASS not set. Email delivery will be skipped.');
      return;
    }

    try {
      const transportConfig = host.includes('gmail.com')
        ? {
            service: 'gmail',
            auth: { user, pass },
            pool: true,
            maxConnections: 3,
            maxMessages: 100,
            rateLimit: 5,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000
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
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000
          };

      this.transporter = nodemailer.createTransport(transportConfig);
    } catch (err) {
      console.error('[EmailService] Failed to create SMTP transporter:', err.message);
    }
  }

  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email.trim());
  }

  async verifyConnection() {
    if (!this.transporter) {
      this.initTransporter();
    }
    if (!this.transporter) {
      throw new Error('SMTP transporter is not initialized. Please verify SMTP_USER and SMTP_PASS environment variables.');
    }
    return this.transporter.verify();
  }

  async sendEmail({ to, subject, html, text, from = null, replyTo = null, fromName = null }) {
    if (!to || !this.isValidEmail(to)) {
      throw new Error(`Invalid recipient email address: "${to}"`);
    }
    if (!subject || typeof subject !== 'string') {
      throw new Error('Email subject is required');
    }

    const cleanTo = to.trim().toLowerCase();
    const cleanSubject = subject.trim();
    const defaultFromName = process.env.EMAIL_FROM_NAME || 'MAXYWALK';
    const defaultFromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'shop.maxywalk@gmail.com';
    const sender = from || (defaultFromEmail.includes('<') ? defaultFromEmail : `"${fromName || defaultFromName}" <${defaultFromEmail}>`);
    const resolvedReplyTo = replyTo || process.env.EMAIL_REPLY_TO || defaultFromEmail;

    // Check if Resend is configured as an alternative provider
    const resendKey = (process.env.RESEND_API_KEY || '').trim();
    if (resendKey) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const { data, error } = await resend.emails.send({
          from: sender,
          to: [cleanTo],
          subject: cleanSubject,
          html,
          text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          reply_to: resolvedReplyTo
        });

        if (!error && data?.id) {
          return {
            success: true,
            provider: 'resend',
            messageId: data.id
          };
        }
        console.warn('[EmailService] Resend returned error, falling back to Gmail SMTP:', error?.message);
      } catch (rErr) {
        console.warn('[EmailService] Resend failed, falling back to Gmail SMTP:', rErr.message);
      }
    }

    // Deliver via Gmail SMTP
    if (!this.transporter) {
      this.initTransporter();
    }
    if (!this.transporter) {
      throw new Error('No email provider configured. Please set SMTP_USER and SMTP_PASS (or RESEND_API_KEY) in environment variables.');
    }

    const mailOptions = {
      from: sender,
      to: cleanTo,
      subject: cleanSubject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      replyTo: resolvedReplyTo,
      headers: {
        'X-Entity-Ref-ID': `maxywalk-${Date.now()}`,
        'X-Mailer': 'MAXYWALK Gmail Automation Engine'
      }
    };

    const info = await this.transporter.sendMail(mailOptions);
    return {
      success: true,
      provider: 'smtp',
      messageId: info.messageId,
      response: info.response
    };
  }
}

export const emailService = new EmailService();
export default emailService;
