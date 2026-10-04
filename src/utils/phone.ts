// Phone Number Format Generalisation
// Changing all forms of phone number (e.g. 999-999-9999 or (999) 999-9999 or etc. into +19999999999)
export function normalizeUSPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  let normalized = digits;

  // Allow +1 / 1 at the beginning
  if (digits.length === 11 && digits.startsWith("1")) {
    normalized = digits.slice(1);
  }

  if (normalized.length !== 10) {
    return null;
  }

  return `+1${normalized}`;
}