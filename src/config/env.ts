import ms, { type StringValue } from 'ms';
import z from 'zod';

// Environment Configuration Constants
const NODE_ENV_VALUES = ['development', 'test', 'production'] as const;
const DEFAULT_NODE_ENV = 'development';
const PORT_RANGE = {
  MIN: 1,
  MAX: 65535,
} as const;
const DEFAULT_PORT = 5000;
const DEFAULT_RATE_LIMIT_WINDOW_MINUTES = 15;
const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_AUTH_RATE_LIMIT_WINDOW_MINUTES = 15;
const DEFAULT_AUTH_RATE_LIMIT_MAX = 10;
const DEFAULT_REFRESH_RATE_LIMIT_WINDOW_MINUTES = 15;
const DEFAULT_REFRESH_RATE_LIMIT_MAX = 20;
const JWT_SECRET_MIN = 32;
const DEFAULT_JWT_ACCESS_EXPIRES_IN = '15m';
const DEFAULT_JWT_REFRESH_EXPIRES_IN = '7d';
const DEFAULT_CLIENT_URLS = [
  'http://localhost:3000',
  'http://localhost:5173',
] as const;
const DEFAULT_PASSWORD_RESET_EXPIRES_MINUTES = 15;
const DEFAULT_PASSWORD_RESET_EMAIL_RATE_LIMIT_WINDOW_MINUTES = 60;
const DEFAULT_PASSWORD_RESET_EMAIL_RATE_LIMIT_MAX = 3;
const DEFAULT_EMAIL_FROM_NAME = 'Story Arc';
const DEFAULT_EMAIL_FROM_ADDRESS = 'noreply@storyarc.com';
const DEFAULT_EMAIL_VERIFICATION_EXPIRES_HOURS = 24;
const DEFAULT_RESEND_VERIFICATION_EMAIL_RATE_LIMIT_WINDOW_MINUTES = 60;
const DEFAULT_RESEND_VERIFICATION_EMAIL_RATE_LIMIT_MAX = 3;

// utility fn
const emptyStringToUndefined = (val: unknown) => {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return val;
};

const parseCommaSeparatedUrls = (val: unknown) => {
  const str = emptyStringToUndefined(val);
  if (typeof str !== 'string') return str;
  return str.split(',').map(url => url.trim());
};

const envSchema = z.object({
  NODE_ENV: z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .toLowerCase()
      .pipe(
        z.enum(NODE_ENV_VALUES, {
          error: `NODE_ENV must be one of ${NODE_ENV_VALUES.join(', ')}`,
        }),
      )
      .default(DEFAULT_NODE_ENV),
  ),
  PORT: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ error: 'Port must be a number' })
      .int({ error: 'Port should not a fraction number' })
      .min(PORT_RANGE.MIN, { error: `Port must be at least ${PORT_RANGE.MIN}` })
      .max(PORT_RANGE.MAX, {
        error: `Port shouldn't larger than ${PORT_RANGE.MAX}`,
      })
      .default(DEFAULT_PORT),
  ),
  MONGODB_URI: z.preprocess(
    emptyStringToUndefined,
    z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'Mongodb uri is required'
            : 'Mongodb uri must be a string type',
      })
      .refine(
        value =>
          value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
        { error: 'MONGODB_URI must start with mongodb:// or mongodb+srv://' },
      ),
  ),
  CLIENT_URLS: z.preprocess(
    parseCommaSeparatedUrls,
    z
      .array(
        z
          .url({
            error:
              'Each origin in CLIENT_URLS must be a valid URL (e.g. http://localhost:3000)',
          })
          .transform(url => new URL(url).origin),
        {
          error: 'CLIENT_URLS must be a comma-separated list of valid URLs',
        },
      )
      .min(1, {
        error: 'At least one CORS origin must be provided in CLIENT_URLS',
      })
      .transform(urls => [...new Set(urls)])
      .default([...DEFAULT_CLIENT_URLS]),
  ),
  RATE_LIMIT_WINDOW_MINUTES: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ error: 'RATE_LIMIT_WINDOW_MINUTES must be a number' })
      .int({ error: 'RATE_LIMIT_WINDOW_MINUTES must be an integer' })
      .positive({ error: 'RATE_LIMIT_WINDOW_MINUTES must be greater than 0' })
      .default(DEFAULT_RATE_LIMIT_WINDOW_MINUTES),
  ),
  RATE_LIMIT_MAX: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ error: 'RATE_LIMIT_MAX must be a number' })
      .int({ error: 'RATE_LIMIT_MAX must be an integer' })
      .positive({ error: 'RATE_LIMIT_MAX must be greater than 0' })
      .default(DEFAULT_RATE_LIMIT_MAX),
  ),
  AUTH_RATE_LIMIT_WINDOW_MINUTES: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ error: 'AUTH_RATE_LIMIT_WINDOW_MINUTES must be a number' })
      .int({ error: 'AUTH_RATE_LIMIT_WINDOW_MINUTES must be an integer' })
      .positive({
        error: 'AUTH_RATE_LIMIT_WINDOW_MINUTES must be greater than 0',
      })
      .default(DEFAULT_AUTH_RATE_LIMIT_WINDOW_MINUTES),
  ),
  AUTH_RATE_LIMIT_MAX: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ error: 'AUTH_RATE_LIMIT_MAX must be a number' })
      .int({ error: 'AUTH_RATE_LIMIT_MAX must be an integer' })
      .positive({ error: 'AUTH_RATE_LIMIT_MAX must be greater than 0' })
      .default(DEFAULT_AUTH_RATE_LIMIT_MAX),
  ),
  REFRESH_RATE_LIMIT_WINDOW_MINUTES: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ error: 'REFRESH_RATE_LIMIT_WINDOW_MINUTES must be a number' })
      .int({ error: 'REFRESH_RATE_LIMIT_WINDOW_MINUTES must be an integer' })
      .positive({
        error: 'REFRESH_RATE_LIMIT_WINDOW_MINUTES must be greater than 0',
      })
      .default(DEFAULT_REFRESH_RATE_LIMIT_WINDOW_MINUTES),
  ),
  REFRESH_RATE_LIMIT_MAX: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ error: 'REFRESH_RATE_LIMIT_MAX must be a number' })
      .int({ error: 'REFRESH_RATE_LIMIT_MAX must be an integer' })
      .positive({ error: 'REFRESH_RATE_LIMIT_MAX must be greater than 0' })
      .default(DEFAULT_REFRESH_RATE_LIMIT_MAX),
  ),
  // openssl rand -base64 32
  JWT_ACCESS_SECRET: z.preprocess(
    emptyStringToUndefined,
    z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'JWT_ACCESS_SECRET is required'
            : 'JWT_ACCESS_SECRET must be a string type',
      })
      .min(JWT_SECRET_MIN, {
        error: `JWT_ACCESS_SECRET must be at least ${JWT_SECRET_MIN} characters`,
      }),
  ),
  JWT_REFRESH_SECRET: z.preprocess(
    emptyStringToUndefined,
    z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'JWT_REFRESH_SECRET is required'
            : 'JWT_REFRESH_SECRET must be a string type',
      })
      .min(JWT_SECRET_MIN, {
        error: `JWT_REFRESH_SECRET must be at least ${JWT_SECRET_MIN} characters`,
      }),
  ),
  JWT_ACCESS_EXPIRES_IN: z.preprocess(
    emptyStringToUndefined,
    z
      .string({ error: 'JWT_ACCESS_EXPIRES_IN must be a string' })
      .regex(/^\d+(ms|s|m|h|d|w|y)$/, {
        error:
          'JWT_ACCESS_EXPIRES_IN must be a valid duration string like "15m" or "7d"',
      })
      .default(DEFAULT_JWT_ACCESS_EXPIRES_IN),
  ),
  JWT_REFRESH_EXPIRES_IN: z.preprocess(
    emptyStringToUndefined,

    z
      .string({ error: 'JWT_REFRESH_EXPIRES_IN must be a string' })
      .regex(/^\d+(ms|s|m|h|d|w|y)$/, {
        error:
          'JWT_REFRESH_EXPIRES_IN must be a valid duration string like "15m" or "7d"',
      })
      .default(DEFAULT_JWT_REFRESH_EXPIRES_IN),
  ),
  BREVO_API_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().optional(),
  ),
  EMAIL_FROM_NAME: z.preprocess(
    emptyStringToUndefined,
    z.string().default(DEFAULT_EMAIL_FROM_NAME),
  ),
  EMAIL_FROM_ADDRESS: z.preprocess(
    emptyStringToUndefined,
    z.string().default(DEFAULT_EMAIL_FROM_ADDRESS),
  ),
  PASSWORD_RESET_EXPIRES_MINUTES: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ error: 'PASSWORD_RESET_EXPIRES_MINUTES must be a number' })
      .int({ error: 'PASSWORD_RESET_EXPIRES_MINUTES must be an integer' })
      .positive({
        error: 'PASSWORD_RESET_EXPIRES_MINUTES must be greater than 0',
      })
      .default(DEFAULT_PASSWORD_RESET_EXPIRES_MINUTES),
  ),
  PASSWORD_RESET_EMAIL_RATE_LIMIT_WINDOW_MINUTES: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({
        error:
          'PASSWORD_RESET_EMAIL_RATE_LIMIT_WINDOW_MINUTES must be a number',
      })
      .int({
        error:
          'PASSWORD_RESET_EMAIL_RATE_LIMIT_WINDOW_MINUTES must be an integer',
      })
      .positive({
        error:
          'PASSWORD_RESET_EMAIL_RATE_LIMIT_WINDOW_MINUTES must be greater than 0',
      })
      .default(DEFAULT_PASSWORD_RESET_EMAIL_RATE_LIMIT_WINDOW_MINUTES),
  ),
  PASSWORD_RESET_EMAIL_RATE_LIMIT_MAX: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ error: 'PASSWORD_RESET_EMAIL_RATE_LIMIT_MAX must be a number' })
      .int({ error: 'PASSWORD_RESET_EMAIL_RATE_LIMIT_MAX must be an integer' })
      .positive({
        error: 'PASSWORD_RESET_EMAIL_RATE_LIMIT_MAX must be greater than 0',
      })
      .default(DEFAULT_PASSWORD_RESET_EMAIL_RATE_LIMIT_MAX),
  ),
  EMAIL_VERIFICATION_EXPIRES_HOURS: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({ error: 'EMAIL_VERIFICATION_EXPIRES_HOURS must be a number' })
      .int({ error: 'EMAIL_VERIFICATION_EXPIRES_HOURS must be an integer' })
      .positive({
        error: 'EMAIL_VERIFICATION_EXPIRES_HOURS must be greater than 0',
      })
      .default(DEFAULT_EMAIL_VERIFICATION_EXPIRES_HOURS),
  ),
  RESEND_VERIFICATION_EMAIL_RATE_LIMIT_WINDOW_MINUTES: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({
        error:
          'RESEND_VERIFICATION_EMAIL_RATE_LIMIT_WINDOW_MINUTES must be a number',
      })
      .int({
        error:
          'RESEND_VERIFICATION_EMAIL_RATE_LIMIT_WINDOW_MINUTES must be an integer',
      })
      .positive({
        error:
          'RESEND_VERIFICATION_EMAIL_RATE_LIMIT_WINDOW_MINUTES must be greater than 0',
      })
      .default(DEFAULT_RESEND_VERIFICATION_EMAIL_RATE_LIMIT_WINDOW_MINUTES),
  ),
  RESEND_VERIFICATION_EMAIL_RATE_LIMIT_MAX: z.preprocess(
    emptyStringToUndefined,
    z.coerce
      .number({
        error: 'RESEND_VERIFICATION_EMAIL_RATE_LIMIT_MAX must be a number',
      })
      .int({
        error: 'RESEND_VERIFICATION_EMAIL_RATE_LIMIT_MAX must be an integer',
      })
      .positive({
        error:
          'RESEND_VERIFICATION_EMAIL_RATE_LIMIT_MAX must be greater than 0',
      })
      .default(DEFAULT_RESEND_VERIFICATION_EMAIL_RATE_LIMIT_MAX),
  ),
  GOOGLE_CLIENT_ID: z.preprocess(
    emptyStringToUndefined,
    z.string({ error: 'GOOGLE_CLIENT_ID must be a string' }).optional(),
  ),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errors = result.error.issues
    .map(iss => `  •  ${iss.path.join('.')}: ${iss.message}`)
    .join('\n');
  console.error(`❌ Invalid environment variables: \n${errors}\n`);
  process.exit(1);
}

const data = result.data;

type ParseEnv = z.infer<typeof envSchema>;

type Env = Readonly<
  ParseEnv & {
    COOKIE_ACCESS_TOKEN_MAX_AGE: number;
    COOKIE_REFRESH_TOKEN_MAX_AGE: number;
    isDevelopment: boolean;
    isProduction: boolean;
  }
>;

export const env: Env = Object.freeze({
  ...data,
  COOKIE_ACCESS_TOKEN_MAX_AGE: ms(data.JWT_ACCESS_EXPIRES_IN as StringValue),
  COOKIE_REFRESH_TOKEN_MAX_AGE: ms(data.JWT_REFRESH_EXPIRES_IN as StringValue),
  isDevelopment: data.NODE_ENV === 'development',
  isProduction: data.NODE_ENV === 'production',
});
