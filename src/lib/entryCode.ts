export function makeEntryCode(eventId: number) {
  const now = new Date();

  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  const rand = Math.floor(100000 + Math.random() * 900000);

  return `E${eventId}-${y}${m}${d}-${rand}`;
}