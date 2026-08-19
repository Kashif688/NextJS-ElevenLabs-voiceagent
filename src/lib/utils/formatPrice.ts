/**
 * Formats any price input (numeric, formatted string, string with/without $, or with leading comma)
 * into a clean USD formatted string (e.g. 1099 -> "$1,099", "1099" -> "$1,099", ",099" -> "$1,099").
 */
export function formatPrice(input?: string | number, defaultFallback: string = '$1,099'): string {
  if (input === undefined || input === null || input === '') {
    return defaultFallback;
  }

  let str = String(input).trim();
  if (!str) return defaultFallback;

  // Handle leading comma edge cases (e.g. ",099" or "$,099")
  if (str.startsWith(',')) {
    str = '1' + str;
  } else if (str.startsWith('$,')) {
    str = '$1' + str.substring(2);
  }

  // Extract all numeric digits
  const cleanDigits = str.replace(/[^0-9]/g, '');
  if (!cleanDigits) {
    return str.startsWith('$') ? str : `$${str}`;
  }

  const num = parseInt(cleanDigits, 10);
  if (isNaN(num)) return str;

  return `$${num.toLocaleString('en-US')}`;
}
