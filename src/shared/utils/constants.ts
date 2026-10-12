export const VALIDATIONS = {
  FULLNAME_MIN_LENGTH: 3,
  FULLNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,
  EMAIL_REGEX_PATTERN:
    /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-.]*)[a-z0-9_+-]@([a-z0-9][a-z0-9.-]*\.)+[a-z]{2,}$/i,
  DEFAULT_PROFILE_IMAGE: 'https://i.ibb.co.com/fzYGmQj8/avatar-placeholder.gif',
  OBJECT_ID_REGEX_PATTERN: /^[0-9a-fA-F]{24}$/,
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
} as const;

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ARGON2_CONFIG = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const COOKIE_CONFIG = {
  ACCESS_TOKEN_NAME: 'accessToken',
  REFRESH_TOKEN_NAME: 'refreshToken',
  ACCESS_COOKIE_PATH: '/api/v1',
  REFRESH_COOKIE_PATH: '/api/v1/auth',
} as const;

export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;
