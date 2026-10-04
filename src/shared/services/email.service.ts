import { env } from '@src/config/env.js';
import { logger } from '@src/shared/utils/logger.js';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface ISendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IEmailService {
  sendEmail(options: ISendEmailOptions): Promise<void>;
}

export class NodemailerEmailService implements IEmailService {
  private transporter: Transporter | null = null;

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) return this.transporter;

    const testAccount = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info('📧 Using Ethereal test email account for development');
    return this.transporter;
  }

  async sendEmail(options: ISendEmailOptions): Promise<void> {
    const transporter = await this.getTransporter();

    const info = await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`📧 Email preview URL: ${previewUrl}`);
    }
  }
}

export class BrevoEmailService implements IEmailService {
  private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';

  async sendEmail(options: ISendEmailOptions): Promise<void> {
    if (!env.BREVO_API_KEY) {
      throw new Error(
        'BREVO_API_KEY is not configured in environment variables',
      );
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: env.EMAIL_FROM_NAME,
          email: env.EMAIL_FROM_ADDRESS,
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(
        { status: response.status, body: errorBody },
        'Brevo email sending failed',
      );
      throw new Error(`Email sending failed with status ${response.status}`);
    }

    logger.info({ to: options.to }, '📧 Email sent via Brevo');
  }
}

function createEmailService(): IEmailService {
  if (env.isProduction) {
    return new BrevoEmailService();
  }
  return new NodemailerEmailService();
}

export const emailService = createEmailService();
