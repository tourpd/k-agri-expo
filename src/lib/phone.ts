export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatKoreanPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function normalizeKoreanPhone(value: string) {
  return onlyDigits(value).slice(0, 11);
}