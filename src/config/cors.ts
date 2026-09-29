import { env } from '@src/config/env.js';
import type { CorsOptions } from 'cors';

export const corsOptions: CorsOptions = {
  origin: [...env.CLIENT_URLS],
  credentials: true,
};
