import { NextRequest } from "next/server";
import { POST as createExpoOrder } from "../orders/create/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 기존 /api/expo/order 호출 호환용 라우트
 * 실제 주문 생성 로직은 /api/expo/orders/create 로 통일한다.
 */
export async function POST(req: NextRequest) {
  return createExpoOrder(req);
}