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

// utility fn
const emptyStringToUndefined = (val: unknown) => {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return val;
};

const envSchema = z.object({
  NODE_ENV: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z.enum(NODE_ENV_VALUES, {
        error: `NODE_ENV must be one of ${NODE_ENV_VALUES.join(', ')}`,
      }),
    )
    .default(DEFAULT_NODE_ENV),
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
  MONGODB_URI: z
    .string({
      error: iss =>
        iss.input === undefined
          ? 'Mongodb uri is required'
          : 'Mongodb uri must be a string type',
    })
    .trim()
    .min(1, { error: 'MongoDB uri cannot be empty' })
    .refine(
      value =>
        value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
      { error: 'MONGODB_URI must start with mongodb:// or mongodb+srv://' },
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
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errors = result.error.issues
    .map(iss => `  •  ${iss.path.join('.')}: ${iss.message}`)
    .join('\n');
  console.error(`❌ Invalid environment variables: \n${errors}\n`);
  process.exit(1);
}

export const env = Object.freeze(result.data);
