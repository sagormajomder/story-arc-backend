export interface IEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface IRenderEmailLayoutOptions {
  heading: string;
  greetingName: string;
  bodyHtml: string;
  primaryButton?: {
    text: string;
    url: string;
  };
  secondaryButton?: {
    text: string;
    url: string;
  };
  noticeHtml?: string;
  fallbackUrl?: string;
}

export const renderEmailLayout = (
  options: IRenderEmailLayoutOptions,
): string => {
  const primaryButtonHtml = options.primaryButton
    ? `<a href="${options.primaryButton.url}"
          style="background-color: #4F46E5; color: white; padding: 12px 32px;
                 text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;${
                   options.secondaryButton ? ' margin-right: 10px;' : ''
                 }">
         ${options.primaryButton.text}
       </a>`
    : '';

  const secondaryButtonHtml = options.secondaryButton
    ? `<a href="${options.secondaryButton.url}"
          style="background-color: #6B7280; color: white; padding: 12px 24px;
                 text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
         ${options.secondaryButton.text}
       </a>`
    : '';

  const buttonsHtml =
    primaryButtonHtml || secondaryButtonHtml
      ? `<div style="text-align: center; margin: 30px 0;">
           ${primaryButtonHtml}
           ${secondaryButtonHtml}
         </div>`
      : '';

  const fallbackHtml = options.fallbackUrl
    ? `<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
       <p style="color: #888; font-size: 12px;">
         If the button doesn't work, copy and paste this link into your browser:<br/>
         <a href="${options.fallbackUrl}" style="color: #4F46E5;">${options.fallbackUrl}</a>
       </p>`
    : '';

  const noticeHtml = options.noticeHtml || '';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #4F46E5;">${options.heading}</h2>
      <p>Hi ${options.greetingName},</p>
      ${options.bodyHtml}
      ${buttonsHtml}
      ${noticeHtml}
      ${fallbackHtml}
    </div>
  `;
};

export const getVerificationEmailTemplate = (params: {
  fullName: string;
  verificationUrl: string;
  expiresHours: number;
}): IEmailTemplate => ({
  subject: 'Verify your email address - Story Arc',
  html: renderEmailLayout({
    heading: 'Welcome to Story Arc!',
    greetingName: params.fullName,
    bodyHtml: `<p>Thank you for signing up. Please verify your email address to activate your account and log in:</p>`,
    primaryButton: {
      text: 'Verify Email Address',
      url: params.verificationUrl,
    },
    noticeHtml: `
      <p>This link will expire in <strong>${params.expiresHours} hours</strong>.</p>
      <p>If you didn't create an account with Story Arc, please ignore this email.</p>
    `,
    fallbackUrl: params.verificationUrl,
  }),
  text: `Hi ${params.fullName},\n\nPlease verify your email address using this link: ${params.verificationUrl}\n\nThis link expires in ${params.expiresHours} hours.\n\nIf you didn't create an account, please ignore this email.`,
});

export const getAccountAlreadyExistsEmailTemplate = (params: {
  fullName: string;
  loginUrl: string;
  forgotPasswordUrl: string;
}): IEmailTemplate => ({
  subject: 'Account Notice - Story Arc',
  html: renderEmailLayout({
    heading: 'Account Already Exists',
    greetingName: params.fullName,
    bodyHtml: `
      <p>Someone attempted to create a new Story Arc account using this email address. However, an active account already exists for this email.</p>
      <p>If this was you, you can log in directly or reset your password if you've forgotten it:</p>
    `,
    primaryButton: {
      text: 'Log In',
      url: params.loginUrl,
    },
    secondaryButton: {
      text: 'Forgot Password',
      url: params.forgotPasswordUrl,
    },
    noticeHtml: `<p>If you did not initiate this request, you can safely ignore this email. Your account is secure.</p>`,
  }),
  text: `Hi ${params.fullName},\n\nSomeone attempted to register with this email address, but an account already exists.\n\nLog in: ${params.loginUrl}\nReset password: ${params.forgotPasswordUrl}\n\nIf this was not you, you can safely ignore this email.`,
});

export const getGoogleAccountNoticeEmailTemplate = (params: {
  fullName: string;
  loginUrl: string;
}): IEmailTemplate => ({
  subject: 'Account Notice - Story Arc',
  html: renderEmailLayout({
    heading: 'Account Notice',
    greetingName: params.fullName,
    bodyHtml: `
      <p>Someone attempted to register a password-based account using this email address. However, this email is already registered using <strong>Google Sign-In</strong>.</p>
      <p>Please log in using your Google account:</p>
    `,
    primaryButton: {
      text: 'Log in with Google',
      url: params.loginUrl,
    },
    noticeHtml: `<p>If you did not make this request, you can safely ignore this message.</p>`,
  }),
  text: `Hi ${params.fullName},\n\nSomeone attempted to register with this email, but this account is already registered using Google Sign-In.\n\nPlease log in with Google at: ${params.loginUrl}\n\nIf this was not you, you can safely ignore this email.`,
});

export const getGoogleAccountPasswordResetNoticeEmailTemplate = (params: {
  fullName: string;
  loginUrl: string;
}): IEmailTemplate => ({
  subject: 'Password Reset Notice - Story Arc',
  html: renderEmailLayout({
    heading: 'Password Reset Request',
    greetingName: params.fullName,
    bodyHtml: `
      <p>We received a request to reset your password. However, your account is registered using <strong>Google Sign-In</strong> and does not use a password.</p>
      <p>Please log in using your Google account:</p>
    `,
    primaryButton: {
      text: 'Log in with Google',
      url: params.loginUrl,
    },
    noticeHtml: `<p>If you did not make this request, you can safely ignore this message.</p>`,
  }),
  text: `Hi ${params.fullName},\n\nWe received a request to reset your password. However, this account is registered using Google Sign-In and does not use a password.\n\nPlease log in with Google at: ${params.loginUrl}\n\nIf you did not make this request, you can safely ignore this email.`,
});

export const getPasswordResetEmailTemplate = (params: {
  fullName: string;
  resetUrl: string;
  expiresMinutes: number;
}): IEmailTemplate => ({
  subject: 'Password Reset Request - Story Arc',
  html: renderEmailLayout({
    heading: 'Password Reset Request',
    greetingName: params.fullName,
    bodyHtml: `<p>We received a request to reset your password. Click the button below to set a new password:</p>`,
    primaryButton: {
      text: 'Reset Password',
      url: params.resetUrl,
    },
    noticeHtml: `
      <p>This link will expire in <strong>${params.expiresMinutes} minutes</strong>.</p>
      <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
    `,
    fallbackUrl: params.resetUrl,
  }),
  text: `Hi ${params.fullName},\n\nReset your password using this link: ${params.resetUrl}\n\nThis link expires in ${params.expiresMinutes} minutes.\n\nIf you didn't request this, please ignore this email.`,
});

export const getRegistrationSuccessEmailTemplate = (params: {
  fullName: string;
  loginUrl: string;
}): IEmailTemplate => ({
  subject: 'Welcome to Story Arc - Registration Successful',
  html: renderEmailLayout({
    heading: 'Welcome to Story Arc!',
    greetingName: params.fullName,
    bodyHtml: `
      <p>Congratulations! Your email address has been verified and your Story Arc account is now fully active.</p>
      <p>You can now log in to start discovering books, building your reading lists, and sharing reviews with the community.</p>
    `,
    primaryButton: {
      text: 'Log In to Your Account',
      url: params.loginUrl,
    },
    noticeHtml: `<p>If you have any questions or need assistance, feel free to reach out to our support team.</p>`,
  }),
  text: `Hi ${params.fullName},\n\nCongratulations! Your email address has been verified and your Story Arc account is now active.\n\nYou can log in here: ${params.loginUrl}\n\nIf you have any questions, feel free to reach out to our support team.`,
});

export const getPasswordResetSuccessEmailTemplate = (params: {
  fullName: string;
  loginUrl: string;
}): IEmailTemplate => ({
  subject: 'Password Reset Successful - Story Arc',
  html: renderEmailLayout({
    heading: 'Password Reset Successful',
    greetingName: params.fullName,
    bodyHtml: `
      <p>Your password for Story Arc has been successfully updated.</p>
      <p>All active sessions have been signed out for your security. You can now log in using your new password:</p>
    `,
    primaryButton: {
      text: 'Log In',
      url: params.loginUrl,
    },
    noticeHtml: `<p style="color: #DC2626; font-weight: bold;">Security Notice: If you did not make this change, please contact our support team immediately or reset your password to secure your account.</p>`,
  }),
  text: `Hi ${params.fullName},\n\nYour password for Story Arc has been successfully reset. All active sessions have been signed out for security.\n\nYou can log in with your new password here: ${params.loginUrl}\n\nSecurity Notice: If you did not make this change, please contact our support team immediately.`,
});

