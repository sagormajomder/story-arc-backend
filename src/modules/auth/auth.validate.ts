import { VALIDATIONS } from '@src/shared/utils/constants.js';
import z from 'zod';

export const registerSchema = z.object({
  body: z.strictObject({
    fullName: z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'Full Name is Required'
            : 'Full Name must be a string',
      })
      .trim()
      .min(VALIDATIONS.FULLNAME_MIN_LENGTH, {
        error: `Full name should be at least ${VALIDATIONS.FULLNAME_MIN_LENGTH} characters`,
      })
      .max(VALIDATIONS.FULLNAME_MAX_LENGTH, {
        error: `Full Name can't exceed ${VALIDATIONS.FULLNAME_MAX_LENGTH} characters`,
      }),
    email: z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'Email is Required'
            : 'Email must be a string',
      })
      .trim()
      .toLowerCase()
      .pipe(
        z.email({
          pattern: VALIDATIONS.EMAIL_REGEX_PATTERN,
          error: 'Please provide valid email address',
        }),
      ),
    password: z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'Password is required'
            : 'Password must be a string',
      })
      .min(VALIDATIONS.PASSWORD_MIN_LENGTH, {
        error: `Password Must be at least ${VALIDATIONS.PASSWORD_MIN_LENGTH} characters`,
      })
      .max(VALIDATIONS.PASSWORD_MAX_LENGTH, {
        error: `Password can't exceed ${VALIDATIONS.PASSWORD_MAX_LENGTH} characters`,
      })
      .regex(/[a-z]/, {
        error: 'Password should have at least one lowercase letter',
      })
      .regex(/[A-Z]/, {
        error: 'Password should have at least one uppercase letter',
      })
      .regex(/\d/, {
        error: 'Password should have at least one digit',
      })
      .regex(/[^a-zA-Z0-9]/, {
        error: 'Password should have at least one special characters',
      }),
    profileImage: z
      .string()
      .trim()
      .pipe(z.url({ error: 'Profile image must be a valid URL' }))
      .default(VALIDATIONS.DEFAULT_PROFILE_IMAGE),
  }),
});

export type RegisterDto = z.infer<typeof registerSchema>['body'];

export const loginSchema = z.object({
  body: z.strictObject({
    email: z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'Email is Required'
            : 'Email must be a string',
      })
      .trim()
      .toLowerCase()
      .pipe(
        z.email({
          pattern: VALIDATIONS.EMAIL_REGEX_PATTERN,
          error: 'Please provide valid email address',
        }),
      ),
    password: z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'Password is required'
            : 'Password must be a string',
      })
      .min(VALIDATIONS.PASSWORD_MIN_LENGTH, {
        error: `Password Must be at least ${VALIDATIONS.PASSWORD_MIN_LENGTH} characters`,
      }),
  }),
});

export type LoginDto = z.infer<typeof loginSchema>['body'];

export const forgotPasswordSchema = z.object({
  body: z.strictObject({
    email: z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'Email is Required'
            : 'Email must be a string',
      })
      .trim()
      .toLowerCase()
      .pipe(
        z.email({
          pattern: VALIDATIONS.EMAIL_REGEX_PATTERN,
          error: 'Please provide valid email address',
        }),
      ),
  }),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>['body'];

export const resetPasswordSchema = z.object({
  body: z.strictObject({
    token: z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'Reset token is required'
            : 'Reset token must be a string',
      })
      .trim()
      .min(1, { error: 'Reset token cannot be empty' }),
    newPassword: z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'New password is required'
            : 'New password must be a string',
      })
      .min(VALIDATIONS.PASSWORD_MIN_LENGTH, {
        error: `Password Must be at least ${VALIDATIONS.PASSWORD_MIN_LENGTH} characters`,
      })
      .max(VALIDATIONS.PASSWORD_MAX_LENGTH, {
        error: `Password can't exceed ${VALIDATIONS.PASSWORD_MAX_LENGTH} characters`,
      })
      .regex(/[a-z]/, {
        error: 'Password should have at least one lowercase letter',
      })
      .regex(/[A-Z]/, {
        error: 'Password should have at least one uppercase letter',
      })
      .regex(/\d/, {
        error: 'Password should have at least one digit',
      })
      .regex(/[^a-zA-Z0-9]/, {
        error: 'Password should have at least one special characters',
      }),
  }),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>['body'];

export const verifyEmailSchema = z.object({
  body: z.strictObject({
    token: z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'Verification token is required'
            : 'Verification token must be a string',
      })
      .trim()
      .min(1, { error: 'Verification token cannot be empty' }),
  }),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>['body'];

export const resendVerificationSchema = z.object({
  body: z.strictObject({
    email: z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'Email is Required'
            : 'Email must be a string',
      })
      .trim()
      .toLowerCase()
      .pipe(
        z.email({
          pattern: VALIDATIONS.EMAIL_REGEX_PATTERN,
          error: 'Please provide valid email address',
        }),
      ),
  }),
});

export type ResendVerificationDto =
  z.infer<typeof resendVerificationSchema>['body'];


