import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

/**
 * 기업 API에서 "이 사람이 볼 수 있는 범위"를 정합니다.
 *
 * - 관리자: 전부 (isAdmin = true)
 * - 입점기업: 자기 vendor_id 와 자기 부스(booth_id)만
 * - 그 외: null (로그인 필요)
 *
 * 예전에는 서명 없는 kagri_vendor_session 쿠키를 그대로 믿어서
 * 쿠키를 만들어 넣으면 다른 기업 행세를 할 수 있었습니다.
 */
export type VendorScope = {
  isAdmin: boolean;
  userId: string | null;
  email: string | null;
  vendorIds: string[];
  boothIds: string[];
};

function uniq(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((v) => String(v ?? "").trim()).filter(Boolean)));
}

export async function getVendorScope(): Promise<VendorScope | null> {
  if (await isAdminAuthenticated()) {
    return { isAdmin: true, userId: null, email: null, vendorIds: [], boothIds: [] };
  }

  let userId = "";
  let email: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? "";
    email = data.user?.email ?? null;
  } catch {
    return null;
  }
  if (!userId) return null;

  const admin = createSupabaseAdminClient();

  const vendorRes = await admin.from("vendors").select("vendor_id").eq("user_id", userId);
  const vendorIds = uniq(
    (vendorRes.error ? [] : vendorRes.data ?? []).map((r: { vendor_id?: string | null }) => r.vendor_id)
  );

  const boothQueries = [
    admin.from("booths").select("booth_id").eq("vendor_user_id", userId),
    admin.from("booths").select("booth_id").eq("owner_user_id", userId),
  ];
  if (vendorIds.length) {
    boothQueries.push(admin.from("booths").select("booth_id").in("vendor_id", vendorIds));
  }

  const boothIds: string[] = [];
  for (const q of boothQueries) {
    const { data, error } = await q;
    if (!error && Array.isArray(data)) {
      for (const row of data as Array<{ booth_id?: string | null }>) {
        if (row.booth_id) boothIds.push(String(row.booth_id));
      }
    }
  }

  const scope: VendorScope = {
    isAdmin: false,
    userId,
    email,
    vendorIds,
    boothIds: uniq(boothIds),
  };

  if (!scope.vendorIds.length && !scope.boothIds.length) return null;
  return scope;
}

/** 이 범위가 해당 부스를 다룰 수 있는지 */
export function canAccessBooth(scope: VendorScope, boothId: string | null | undefined): boolean {
  if (scope.isAdmin) return true;
  const id = String(boothId ?? "").trim();
  return !!id && scope.boothIds.includes(id);
}

/** 이 범위가 해당 리드(vendor_id / booth_id)를 다룰 수 있는지 */
export function canAccessVendorRow(
  scope: VendorScope,
  row: { vendor_id?: string | null; booth_id?: string | null }
): boolean {
  if (scope.isAdmin) return true;
  const vendorId = String(row.vendor_id ?? "").trim();
  if (vendorId && scope.vendorIds.includes(vendorId)) return true;
  return canAccessBooth(scope, row.booth_id);
}

export function scopeDenied(message = "입점기업 로그인이 필요합니다.", status = 401) {
  return NextResponse.json({ ok: false, success: false, error: message }, { status });
}
