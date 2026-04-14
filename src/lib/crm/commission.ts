export type CommissionMode =
  | "booth_only"
  | "matched"
  | "negotiated"
  | "export_broker";

export function getDefaultCommissionRate(mode: CommissionMode) {
  switch (mode) {
    case "booth_only":
      return 0.1;
    case "matched":
      return 0.15;
    case "negotiated":
      return 0.2;
    case "export_broker":
      return 0.25;
    default:
      return 0;
  }
}

export function calcCommission(amount: number, rate: number) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const safeRate = Number.isFinite(rate) ? rate : 0;

  const commission = Math.round(safeAmount * safeRate);
  const netRevenue = Math.round(safeAmount - commission);

  return {
    amount: safeAmount,
    rate: safeRate,
    commissionAmount: commission,
    netRevenue,
  };
}