import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type OrderType = "general" | "photodoctor" | "live";

export type CommissionInput = {
  orderType: OrderType;
  orderId?: string | null;
  productId?: string | null;
  vendorId?: string | null;
  brandId?: string | null;
};

export type CommissionResult = {
  commissionRate: number;
  ruleId: string | null;
  ruleTitle: string;
  scopeType: string;
};

function normalizeRate(v: unknown) {
  const n = Number(v || 0);

  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n > 0 && n <= 1) return n;
  if (n > 1 && n <= 100) return n / 100;

  return 0;
}

function defaultRate(orderType: OrderType) {
  if (orderType === "photodoctor") return 0.5;
  if (orderType === "live") return 0.3;
  return 0.18;
}

export async function getCommissionRate(
  input: CommissionInput
): Promise<CommissionResult> {
  const supabase = createSupabaseAdminClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("commission_rules")
    .select(
      "id, scope_type, order_type, order_id, product_id, vendor_id, brand_id, commission_rate, title, priority, starts_at, ends_at, is_active"
    )
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return {
      commissionRate: defaultRate(input.orderType),
      ruleId: null,
      ruleTitle: "기본 수수료",
      scopeType: "default",
    };
  }

  const matched = data.find((rule: any) => {
    if (rule.starts_at && rule.starts_at > now) return false;
    if (rule.ends_at && rule.ends_at < now) return false;

    if (rule.scope_type === "order") {
      return input.orderId && rule.order_id === input.orderId;
    }

    if (rule.scope_type === "product") {
      return input.productId && rule.product_id === input.productId;
    }

    if (rule.scope_type === "brand") {
      return input.brandId && rule.brand_id === input.brandId;
    }

    if (rule.scope_type === "vendor") {
      return input.vendorId && rule.vendor_id === input.vendorId;
    }

    if (rule.scope_type === "source") {
      return rule.order_type === input.orderType;
    }

    return false;
  });

  if (!matched) {
    return {
      commissionRate: defaultRate(input.orderType),
      ruleId: null,
      ruleTitle: "기본 수수료",
      scopeType: "default",
    };
  }

  const rate = normalizeRate(matched.commission_rate);

  return {
    commissionRate: rate || defaultRate(input.orderType),
    ruleId: matched.id,
    ruleTitle: matched.title || "수수료 규칙",
    scopeType: matched.scope_type,
  };
}

export function calculateRevenueAmounts({
  orderAmount,
  commissionRate,
}: {
  orderAmount: number;
  commissionRate: number;
}) {
  const safeAmount = Math.max(Number(orderAmount || 0), 0);
  const safeRate = normalizeRate(commissionRate);

  const platformFeeAmount = Math.round(safeAmount * safeRate);
  const vendorSettlementAmount = Math.max(safeAmount - platformFeeAmount, 0);

  return {
    platformFeeRate: safeRate,
    platformFeeAmount,
    vendorSettlementAmount,
  };
}