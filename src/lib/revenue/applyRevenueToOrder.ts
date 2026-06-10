import {
  calculateRevenueAmounts,
  getCommissionRate,
  orderTypeLabel,
  type OrderType,
} from "@/lib/revenue/getCommissionRate";

export type ApplyRevenueInput = {
  orderType: OrderType;
  orderAmount: number;

  orderId?: string | null;
  productId?: string | null;
  vendorId?: string | null;
  brandId?: string | null;
};

export type ApplyRevenueResult = {
  platform_fee_rate: number;
  platform_fee_amount: number;
  vendor_settlement_amount: number;

  settlement_status: string;

  applied_commission_rule_id: string | null;
  applied_commission_scope: string;
  applied_commission_title: string;

  applied_order_type: OrderType;
  applied_order_type_label: string;
};

export async function applyRevenueToOrder(
  input: ApplyRevenueInput
): Promise<ApplyRevenueResult> {
  const commission = await getCommissionRate({
    orderType: input.orderType,
    orderId: input.orderId,
    productId: input.productId,
    vendorId: input.vendorId,
    brandId: input.brandId,
  });

  const revenue = calculateRevenueAmounts({
    orderAmount: input.orderAmount,
    commissionRate: commission.commissionRate,
  });

  return {
    platform_fee_rate: revenue.platformFeeRate,
    platform_fee_amount: revenue.platformFeeAmount,
    vendor_settlement_amount: revenue.vendorSettlementAmount,

    settlement_status: "pending",

    applied_commission_rule_id: commission.ruleId,
    applied_commission_scope: commission.scopeType,
    applied_commission_title: commission.ruleTitle,

    applied_order_type: input.orderType,
    applied_order_type_label: orderTypeLabel(input.orderType),
  };
}