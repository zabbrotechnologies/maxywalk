import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

/**
 * Production-ready Gmail SMTP & Transactional Email Automation
 * Communicates via authenticated Gmail SMTP using a Google App Password.
 * Event-driven: Dispatches immediately inside serverless request lifecycle.
 */
class EmailService {
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
      console.warn('[EmailService] SMTP_USER or SMTP_PASS not set.');
      return null;
    }

    try {
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
      console.error('[EmailService] Failed to create SMTP transporter:', err.message);
      return null;
    }
  }

  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email.trim());
  }

  async verifyConnection() {
    const transporter = this.createTransporter();
    if (!transporter) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in environment variables.');
    }
    return await transporter.verify();
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

    const { user, pass, resendKey } = this.getCredentials();

    // 1. Primary: Gmail SMTP
    if (user && pass) {
      const transporter = this.createTransporter();
      if (transporter) {
        const mailOptions = {
          from: sender,
          to: cleanTo,
          subject: cleanSubject,
          html,
          text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          replyTo: resolvedReplyTo
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          return {
            success: true,
            provider: 'smtp',
            messageId: info.messageId,
            response: info.response
          };
        } catch (smtpErr) {
          console.warn('[EmailService] SMTP attempt 1 failed, retrying once...', smtpErr.message);
          try {
            await new Promise((r) => setTimeout(r, 800));
            const freshTransporter = this.createTransporter();
            const info = await freshTransporter.sendMail(mailOptions);
            return {
              success: true,
              provider: 'smtp',
              messageId: info.messageId,
              response: info.response
            };
          } catch (retryErr) {
            if (!resendKey) throw retryErr;
            console.warn('[EmailService] SMTP failed, falling back to Resend...');
          }
        }
      }
    }

    // 2. Fallback: Resend
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
      } catch (rErr) {
        console.warn('[EmailService] Resend failed:', rErr.message);
      }
    }

    throw new Error('No email provider configured. Please set SMTP_USER and SMTP_PASS (or RESEND_API_KEY) in environment variables.');
  }
}

export const emailService = new EmailService();
export default emailService;
