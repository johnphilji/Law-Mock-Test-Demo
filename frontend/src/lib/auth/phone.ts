/**
 * Normalizes phone numbers to standard format (e.g. +91XXXXXXXXXX for India).
 * Supports 10-digit Indian numbers, prefixed +91, or international E.164.
 */
export function normalizePhoneNumber(rawPhone: string): { valid: boolean; normalized?: string; error?: string } {
  if (!rawPhone) {
    return { valid: false, error: "Phone number is required." };
  }

  // Strip spaces, dashes, parentheses
  const cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, "").trim();

  // If 10 digits starting with 6, 7, 8, or 9 (Indian mobile)
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return { valid: true, normalized: `+91${cleaned}` };
  }

  // If already starts with +91 and 10 digits
  if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
    return { valid: true, normalized: cleaned };
  }

  // If starts with 91 and 10 digits
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return { valid: true, normalized: `+${cleaned}` };
  }

  // General E.164 pattern: + followed by 7 to 15 digits
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) {
    return { valid: true, normalized: cleaned };
  }

  return { valid: false, error: "Please enter a valid 10-digit mobile number." };
}
