export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Accepts 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX */
export const isKenyanPhone = (v: string) =>
  /^(?:\+?254|0)[71]\d{8}$/.test(v.replace(/[\s-]/g, ''));

export const isEmailOrPhone = (v: string) => isEmail(v) || isKenyanPhone(v);

export const validatePassword = (v: string): string | undefined => {
  if (v.length < 8) return 'Use at least 8 characters';
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Include a letter and a number';
  return undefined;
};

/** 0 (empty) – 4 (strong) */
export const passwordStrength = (v: string): number => {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
  return Math.max(1, s);
};
