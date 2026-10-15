export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Accepts 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX */
export const isKenyanPhone = (v: string) =>
  /^(?:\+?254|0)[71]\d{8}$/.test(v.replace(/[\s-]/g, ''));

export const isEmailOrPhone = (v: string) => isEmail(v) || isKenyanPhone(v);

export const PASSWORD_MIN = 10;

/** Mirrors the server rules (10-128 chars, a letter and a number). The server is the final judge. */
export const validatePassword = (v: string): string | undefined => {
  if (v.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters`;
  if (v.length > 128) return 'Use at most 128 characters';
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Include a letter and a number';
  return undefined;
};

/** 0 (empty) to 4 (strong) */
export const passwordStrength = (v: string): number => {
  if (!v) return 0;
  let s = 0;
  if (v.length >= PASSWORD_MIN) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v) && /[A-Za-z]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v) || v.length >= 14) s++;
  return Math.max(1, s);
};
