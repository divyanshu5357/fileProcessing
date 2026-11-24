const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'qwertyui',
  'admin123',
  'admin1234',
  'welcome1',
  'welcome123',
  'letmein1',
  'iloveyou',
  'abc12345',
]);

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Enforces baseline password complexity across registration and first-time password setup.
 */
export function validatePasswordStrength(
  password: string,
  email?: string
): PasswordValidationResult {
  if (typeof password !== 'string' || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must not exceed 128 characters.' };
  }

  const lower = password.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(lower)) {
    return {
      valid: false,
      message: 'This password is too common. Please choose a stronger password.',
    };
  }

  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigitOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
  if (!hasLetter || !hasDigitOrSymbol) {
    return {
      valid: false,
      message: 'Password must include both letters and at least one number or symbol.',
    };
  }

  if (email && email.includes('@')) {
    const localPart = email.split('@')[0].trim().toLowerCase();
    if (localPart.length >= 4 && lower.includes(localPart)) {
      return {
        valid: false,
        message: 'Password should not contain your email username.',
      };
    }
  }

  return { valid: true };
}
