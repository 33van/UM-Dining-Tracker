export function normalizeUSPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  let normalized = digits;

  // Allow numbers beginning with US country code 1
  if (digits.length === 11 && digits.startsWith("1")) {
    normalized = digits.slice(1);
  }

  // US phone numbers must have 10 digits
  if (normalized.length !== 10) {
    return null;
  }

  // Convert to E.164
  return `+1${normalized}`;
}