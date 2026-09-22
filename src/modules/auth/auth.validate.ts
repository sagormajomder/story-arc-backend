import { VALIDATIONS } from '@src/shared/utils/constants.js';
import z from 'zod';

export const registerSchema = z.object({
  body: z.object({
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
