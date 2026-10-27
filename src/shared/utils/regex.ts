/**
 * Escapes special regular expression characters in a string
 * to prevent ReDoS (Regular Expression Denial of Service) and Regex Injection.
 */
export const escapeRegex = (text: string): string => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};
