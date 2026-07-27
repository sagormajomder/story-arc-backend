import logger from '@src/shared/utils/logger.js';
import z from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z.enum(['development', 'test', 'production'], {
        error: 'NODE_ENV must be one of development, test, or production',
      }),
    )
    .default('development'),
  PORT: z.preprocess(
    val => {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val;
    },
    z.coerce
      .number({ error: 'Port must be a number' })
      .int({ error: 'Port should not a fraction number' })
      .min(1, { error: 'Port must be at least 1' })
      .max(65535, { error: "Port shouldn't larger than 65535" })
      .default(5000),
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
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errors = result.error.issues
    .map(iss => `  •  ${iss.path.join('.')}: ${iss.message}`)
    .join('\n');
  logger.fatal(`❌ Invalid environment variables: \n${errors}\n`);
  process.exit(1);
}

const env = Object.freeze(result.data);

export default env;
