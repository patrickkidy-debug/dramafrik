/**
 * Met les numéros au format international : "77 123 45 67" → "+221771234567".
 * Ainsi un même client retrouve toujours son compte, quelle que soit la façon dont il tape son numéro.
 */
export function normalizePhone(raw: string, countryCode = process.env.DEFAULT_COUNTRY_CODE || "221") {
  const t = raw.trim();
  let digits = t.replace(/\D/g, "");
  if (t.startsWith("+")) return "+" + digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (countryCode && !digits.startsWith(countryCode)) digits = countryCode + digits;
  return "+" + digits;
}

export function isValidPhone(phone: string) {
  return /^\+\d{8,15}$/.test(phone);
}
