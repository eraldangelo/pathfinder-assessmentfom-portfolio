export const normalizeWhitespace = (value: string) => value.trim().replace(/\s+/g, ' ');

export const normalizeEmail = (value: string) => normalizeWhitespace(value).toLowerCase();

export const normalizeDigits = (value: string) => value.replace(/\D/g, '');

export const normalizePhilippineMobile = (value: string) => {
  let digits = normalizeDigits(value);
  if (!digits) return '';

  if (digits.startsWith('63') && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length >= 11) digits = digits.slice(1);
  if (digits.length > 10) digits = digits.slice(-10);

  return digits.length === 10 && digits.startsWith('9') ? digits : '';
};

export const normalizeNameForDuplicateKey = (value: string) =>
  normalizeWhitespace(
    normalizeWhitespace(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' '),
  );

export const normalizeIsoDate = (value: string) => value.trim();
