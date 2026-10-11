import { VALIDATIONS } from '@src/shared/utils/constants.js';
import {
  emptyPasswordToUndefined,
  emptyStringToUndefined,
} from '@src/shared/utils/transformers.js';
import z from 'zod';

// ============================================================================
// Reusable Field Validators
// ============================================================================

const emailField = z.preprocess(
  emptyStringToUndefined,
  z
    .string({
      error: iss =>
        iss.input === undefined
          ? 'Email is Required'
          : 'Email must be a string',
    })
    .toLowerCase()
    .pipe(
      z.email({
        pattern: VALIDATIONS.EMAIL_REGEX_PATTERN,
        error: 'Please provide valid email address',
      }),
    ),
);

const createStrongPasswordSchema = (fieldName = 'Password') =>
  z.preprocess(
    emptyPasswordToUndefined,
    z
      .string({
        error: iss =>
          iss.input === undefined
            ? `${fieldName} is required`
            : `${fieldName} must be a string`,
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
  );

const createTokenSchema = (tokenName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string({
      error: iss =>
        iss.input === undefined
          ? `${tokenName} is required`
          : `${tokenName} must be a string`,
    }),
  );

// ============================================================================
// Auth Schemas
// ============================================================================

export const registerSchema = z.object({
  body: z.strictObject({
    fullName: z.preprocess(
      emptyStringToUndefined,
      z
        .string({
          error: iss =>
            iss.input === undefined
              ? 'Full Name is Required'
              : 'Full Name must be a string',
        })
        .min(VALIDATIONS.FULLNAME_MIN_LENGTH, {
          error: `Full name should be at least ${VALIDATIONS.FULLNAME_MIN_LENGTH} characters`,
        })
        .max(VALIDATIONS.FULLNAME_MAX_LENGTH, {
          error: `Full Name can't exceed ${VALIDATIONS.FULLNAME_MAX_LENGTH} characters`,
        }),
    ),
    email: emailField,
    password: createStrongPasswordSchema('Password'),
    profileImage: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .pipe(z.url({ error: 'Profile image must be a valid URL' }))
        .default(VALIDATIONS.DEFAULT_PROFILE_IMAGE),
    ),
  }),
});

export type RegisterDto = z.infer<typeof registerSchema>['body'];

export const loginSchema = z.object({
  body: z.strictObject({
    email: emailField,
    password: z.preprocess(
      emptyPasswordToUndefined,
      z
        .string({
          error: iss =>
            iss.input === undefined
              ? 'Password is required'
              : 'Password must be a string',
        })
        .min(VALIDATIONS.PASSWORD_MIN_LENGTH, {
          error: `Password Must be at least ${VALIDATIONS.PASSWORD_MIN_LENGTH} characters`,
        }),
    ),
  }),
});

export type LoginDto = z.infer<typeof loginSchema>['body'];

export const forgotPasswordSchema = z.object({
  body: z.strictObject({
    email: emailField,
  }),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>['body'];

export const resetPasswordSchema = z.object({
  body: z.strictObject({
    token: createTokenSchema('Reset token'),
    newPassword: createStrongPasswordSchema('New password'),
  }),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>['body'];

export const verifyEmailSchema = z.object({
  body: z.strictObject({
    token: createTokenSchema('Verification token'),
  }),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>['body'];

export const resendVerificationSchema = forgotPasswordSchema;

export type ResendVerificationDto = z.infer<
  typeof resendVerificationSchema
>['body'];

export const googleLoginSchema = z.object({
  body: z
    .strictObject({
      idToken: z.preprocess(
        emptyStringToUndefined,
        z.string({ error: 'Google ID token must be a string' }).optional(),
      ),
      accessToken: z.preprocess(
        emptyStringToUndefined,
        z.string({ error: 'Google access token must be a string' }).optional(),
      ),
    })
    .refine(data => Boolean(data.idToken || data.accessToken), {
      message: 'Either Google idToken or accessToken is required',
    }),
});

export type GoogleLoginDto = z.infer<typeof googleLoginSchema>['body'];
