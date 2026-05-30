export function formatWonInput(value: string | number | null | undefined) {
  const digits = String(value || "").replace(/[^\d]/g, "");

  if (!digits) return "";

  return Number(digits).toLocaleString("ko-KR");
}

export function parseWonInput(value: string | number | null | undefined) {
  const digits = String(value || "").replace(/[^\d]/g, "");

  return Number(digits || 0);
}

export function formatWon(value: number | string | null | undefined) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

export function formatPhoneInput(value: string | null | undefined) {
  const digits = String(value || "")
    .replace(/[^\d]/g, "")
    .slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(
    3,
    7
  )}-${digits.slice(7)}`;
}

export function parsePhoneInput(value: string | null | undefined) {
  return String(value || "").replace(/[^\d]/g, "");
}

export function formatPhone(value: string | null | undefined) {
  return formatPhoneInput(value);
}

export function csvToArray(value: string | null | undefined) {
  return String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function arrayToCsv(value: unknown) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(", ");
}

export function formatDateTime(
  value: string | null | undefined
) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString("ko-KR");
  } catch {
    return "-";
  }
}