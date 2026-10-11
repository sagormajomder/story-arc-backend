/**
 * Converts empty strings or whitespace-only strings to undefined.
 * Commonly used with z.preprocess for request query, params, and body validation.
 */
export const emptyStringToUndefined = (val: unknown): unknown => {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return val;
};

/**
 * Converts empty strings or whitespace-only strings to undefined.
 * Preserves intentional leading and trailing whitespace for password fields.
 */
export const emptyPasswordToUndefined = (val: unknown): unknown => {
  if (typeof val === 'string') {
    return val.trim() === '' ? undefined : val;
  }
  return val;
};
