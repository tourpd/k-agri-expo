export function formatEntryCode(entryNo: number | string) {
  const n = typeof entryNo === "number" ? entryNo : Number(entryNo);

  if (!Number.isFinite(n)) {
    throw new Error("Invalid entryNo");
  }

  return String(n).padStart(6, "0");
}

// 기존 코드 호환용 alias
export const makeEntryCode = formatEntryCode;