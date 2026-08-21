/**
 * Card Number Validation Utilities
 * Implements ISO/IEC 7812 Luhn algorithm checksum, card brand detection, and formatting.
 */

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb' | 'diners' | 'unknown';

export interface CardBrandInfo {
  brand: CardBrand;
  displayName: string;
  lengths: number[];
  cvvLengths: number[];
}

export const CARD_BRANDS: Record<CardBrand, CardBrandInfo> = {
  visa: {
    brand: 'visa',
    displayName: 'Visa',
    lengths: [13, 16, 19],
    cvvLengths: [3],
  },
  mastercard: {
    brand: 'mastercard',
    displayName: 'Mastercard',
    lengths: [16],
    cvvLengths: [3],
  },
  amex: {
    brand: 'amex',
    displayName: 'American Express',
    lengths: [15],
    cvvLengths: [4],
  },
  discover: {
    brand: 'discover',
    displayName: 'Discover',
    lengths: [16, 19],
    cvvLengths: [3],
  },
  jcb: {
    brand: 'jcb',
    displayName: 'JCB',
    lengths: [16, 17, 18, 19],
    cvvLengths: [3],
  },
  diners: {
    brand: 'diners',
    displayName: 'Diners Club',
    lengths: [14, 16],
    cvvLengths: [3],
  },
  unknown: {
    brand: 'unknown',
    displayName: 'Unknown Card',
    lengths: [12, 13, 14, 15, 16, 17, 18, 19],
    cvvLengths: [3, 4],
  },
};

/**
 * Sanitizes input string to extract only digits.
 * Supports spoken/formatted inputs (e.g., "4111 2222 3333 4444", "4111-2222-3333-4444").
 */
export function sanitizeCardNumber(raw: string | number | undefined | null): string {
  if (!raw) return '';
  return String(raw).replace(/\D/g, '');
}

/**
 * Validates a card number using the Luhn Algorithm (Mod 10 Checksum).
 */
export function validateLuhn(digits: string): boolean {
  if (!digits || digits.length < 12) return false;

  let sum = 0;
  let shouldDouble = false;

  // Loop through digits from right to left
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (isNaN(digit)) return false;

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Detects the card brand based on the Issuer Identification Number (IIN) / BIN prefix.
 */
export function detectCardBrand(digits: string): CardBrandInfo {
  if (!digits) return CARD_BRANDS.unknown;

  // Visa: starts with 4
  if (/^4/.test(digits)) {
    return CARD_BRANDS.visa;
  }

  // American Express: starts with 34 or 37
  if (/^3[47]/.test(digits)) {
    return CARD_BRANDS.amex;
  }

  // Mastercard: starts with 51-55 or 2221-2720
  if (/^(5[1-5]|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)/.test(digits)) {
    return CARD_BRANDS.mastercard;
  }

  // Discover: starts with 6011, 622126-622925, 644-649, 65
  if (/^(6011|65|64[4-9]|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[01][0-9]|92[0-5]))/.test(digits)) {
    return CARD_BRANDS.discover;
  }

  // Diners Club: starts with 300-305, 36, 38
  if (/^(30[0-5]|36|38)/.test(digits)) {
    return CARD_BRANDS.diners;
  }

  // JCB: starts with 3528-3589
  if (/^(352[89]|35[3-8][0-9])/.test(digits)) {
    return CARD_BRANDS.jcb;
  }

  return CARD_BRANDS.unknown;
}

/**
 * Safely masks a card number, showing only the last 4 digits (PCI-safe).
 * e.g., "4111222233334444" -> "**** **** **** 4444"
 */
export function maskCardNumber(digits: string): string {
  const sanitized = sanitizeCardNumber(digits);
  if (sanitized.length < 4) return '****';

  const last4 = sanitized.slice(-4);
  const brand = detectCardBrand(sanitized);

  if (brand.brand === 'amex') {
    return `**** ****** *${last4}`;
  }

  return `**** **** **** ${last4}`;
}

export interface CardValidationResult {
  valid: boolean;
  brand: CardBrand;
  brandName: string;
  maskedCard: string;
  last4: string;
  errorReason?: string;
  message: string;
}

/**
 * Complete validator for card number alone.
 */
export function validateCard(rawCardNumber: string | number): CardValidationResult {
  const digits = sanitizeCardNumber(rawCardNumber);

  if (!digits) {
    return {
      valid: false,
      brand: 'unknown',
      brandName: 'Unknown',
      maskedCard: '****',
      last4: '',
      errorReason: 'EMPTY_CARD_NUMBER',
      message: 'Card number is empty or contains no digits.',
    };
  }

  const brandInfo = detectCardBrand(digits);
  const masked = maskCardNumber(digits);
  const last4 = digits.slice(-4);

  // Check length
  if (!brandInfo.lengths.includes(digits.length)) {
    return {
      valid: false,
      brand: brandInfo.brand,
      brandName: brandInfo.displayName,
      maskedCard: masked,
      last4,
      errorReason: 'INVALID_LENGTH',
      message: `Invalid card number length (${digits.length} digits). A valid ${brandInfo.displayName} card must have ${brandInfo.lengths.join(' or ')} digits.`,
    };
  }

  // Check Luhn algorithm
  const isLuhnValid = validateLuhn(digits);
  if (!isLuhnValid) {
    return {
      valid: false,
      brand: brandInfo.brand,
      brandName: brandInfo.displayName,
      maskedCard: masked,
      last4,
      errorReason: 'CHECKSUM_FAILED',
      message: `The ${brandInfo.displayName} card ending in ${last4} has an invalid checksum. Please check the digits and try again.`,
    };
  }

  return {
    valid: true,
    brand: brandInfo.brand,
    brandName: brandInfo.displayName,
    maskedCard: masked,
    last4,
    message: `Valid ${brandInfo.displayName} card ending in ${last4}.`,
  };
}

/**
 * Optional expiration validator
 */
export function validateExpiry(month: string | number | undefined, year: string | number | undefined): { valid: boolean; message: string } {
  if (!month || !year) {
    return { valid: true, message: 'Expiration date not provided.' };
  }

  const m = parseInt(String(month), 10);
  let y = parseInt(String(year), 10);

  if (isNaN(m) || m < 1 || m > 12) {
    return { valid: false, message: 'Invalid expiration month. Must be between 01 and 12.' };
  }

  // Handle 2-digit years (e.g. 26 -> 2026)
  if (y < 100) {
    y += 2000;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  if (y < currentYear || (y === currentYear && m < currentMonth)) {
    return { valid: false, message: `Card is expired (expired on ${String(m).padStart(2, '0')}/${y}).` };
  }

  if (y > currentYear + 25) {
    return { valid: false, message: 'Expiration year is too far in the future.' };
  }

  return { valid: true, message: 'Expiration date is valid.' };
}
