import { env } from '@src/config/env.js';
import {
  getAccountAlreadyExistsEmailTemplate,
  getGoogleAccountLinkedSecurityEmailTemplate,
  getGoogleAccountNoticeEmailTemplate,
  getGoogleAccountPasswordResetNoticeEmailTemplate,
  getGoogleWelcomeEmailTemplate,
  getPasswordResetEmailTemplate,
  getPasswordResetSuccessEmailTemplate,
  getRegistrationSuccessEmailTemplate,
  getVerificationEmailTemplate,
} from '@src/modules/auth/auth.email-templates.js';
import {
  emailService,
  type IEmailService,
} from '@src/shared/services/email.service.js';

export interface IAuthMailer {
  sendVerificationEmail(
    email: string,
    fullName: string,
    rawToken: string,
  ): Promise<void>;
  sendAccountAlreadyExistsEmail(
    email: string,
    fullName: string,
  ): Promise<void>;
  sendGoogleAccountNoticeEmail(
    email: string,
    fullName: string,
  ): Promise<void>;
  sendGoogleAccountPasswordResetNoticeEmail(
    email: string,
    fullName: string,
  ): Promise<void>;
  sendPasswordResetEmail(
    email: string,
    fullName: string,
    rawToken: string,
  ): Promise<void>;
  sendRegistrationSuccessEmail(
    email: string,
    fullName: string,
  ): Promise<void>;
  sendPasswordResetSuccessEmail(
    email: string,
    fullName: string,
  ): Promise<void>;
  sendGoogleWelcomeEmail(
    email: string,
    fullName: string,
  ): Promise<void>;
  sendGoogleAccountLinkedSecurityEmail(
    email: string,
    fullName: string,
  ): Promise<void>;
}

export class AuthMailer implements IAuthMailer {
  constructor(private readonly emailSvc: IEmailService = emailService) {}

  private getClientUrl(): string {
    return env.CLIENT_URLS[0] ?? 'http://localhost:3000';
  }

  async sendVerificationEmail(
    email: string,
    fullName: string,
    rawToken: string,
  ): Promise<void> {
    const verificationUrl = `${this.getClientUrl()}/verify-email#token=${rawToken}`;
    const template = getVerificationEmailTemplate({
      fullName,
      verificationUrl,
      expiresHours: env.EMAIL_VERIFICATION_EXPIRES_HOURS,
    });

    await this.emailSvc.sendEmail({
      to: email,
      ...template,
    });
  }

  async sendAccountAlreadyExistsEmail(
    email: string,
    fullName: string,
  ): Promise<void> {
    const clientUrl = this.getClientUrl();
    const template = getAccountAlreadyExistsEmailTemplate({
      fullName,
      loginUrl: `${clientUrl}/login`,
      forgotPasswordUrl: `${clientUrl}/forgot-password`,
    });

    await this.emailSvc.sendEmail({
      to: email,
      ...template,
    });
  }

  async sendGoogleAccountNoticeEmail(
    email: string,
    fullName: string,
  ): Promise<void> {
    const template = getGoogleAccountNoticeEmailTemplate({
      fullName,
      loginUrl: `${this.getClientUrl()}/login`,
    });

    await this.emailSvc.sendEmail({
      to: email,
      ...template,
    });
  }

  async sendGoogleAccountPasswordResetNoticeEmail(
    email: string,
    fullName: string,
  ): Promise<void> {
    const template = getGoogleAccountPasswordResetNoticeEmailTemplate({
      fullName,
      loginUrl: `${this.getClientUrl()}/login`,
    });

    await this.emailSvc.sendEmail({
      to: email,
      ...template,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    rawToken: string,
  ): Promise<void> {
    const resetUrl = `${this.getClientUrl()}/reset-password#token=${rawToken}`;
    const template = getPasswordResetEmailTemplate({
      fullName,
      resetUrl,
      expiresMinutes: env.PASSWORD_RESET_EXPIRES_MINUTES,
    });

    await this.emailSvc.sendEmail({
      to: email,
      ...template,
    });
  }

  async sendRegistrationSuccessEmail(
    email: string,
    fullName: string,
  ): Promise<void> {
    const template = getRegistrationSuccessEmailTemplate({
      fullName,
      loginUrl: `${this.getClientUrl()}/login`,
    });

    await this.emailSvc.sendEmail({
      to: email,
      ...template,
    });
  }

  async sendPasswordResetSuccessEmail(
    email: string,
    fullName: string,
  ): Promise<void> {
    const template = getPasswordResetSuccessEmailTemplate({
      fullName,
      loginUrl: `${this.getClientUrl()}/login`,
    });

    await this.emailSvc.sendEmail({
      to: email,
      ...template,
    });
  }

  async sendGoogleWelcomeEmail(
    email: string,
    fullName: string,
  ): Promise<void> {
    const template = getGoogleWelcomeEmailTemplate({
      fullName,
      loginUrl: `${this.getClientUrl()}/login`,
    });

    await this.emailSvc.sendEmail({
      to: email,
      ...template,
    });
  }

  async sendGoogleAccountLinkedSecurityEmail(
    email: string,
    fullName: string,
  ): Promise<void> {
    const template = getGoogleAccountLinkedSecurityEmailTemplate({
      fullName,
      loginUrl: `${this.getClientUrl()}/login`,
    });

    await this.emailSvc.sendEmail({
      to: email,
      ...template,
    });
  }
}

export const authMailer = new AuthMailer();
