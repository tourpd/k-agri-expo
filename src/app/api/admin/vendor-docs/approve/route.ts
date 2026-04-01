// src/app/api/admin/vendor-docs/approve/route.ts
import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  isAdminEmail,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  doc_id?: string;
};

export async function POST(req: Request) {
  try {
    // ✅ 0) 환경변수 방어
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: "Missing env: NEXT_PUBLIC_SUPABASE_URL" },
        { status: 500 }
      );
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: "Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY" },
        { status: 500 }
      );
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Missing env: SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const doc_id = body.doc_id?.trim();
    if (!doc_id) {
      return NextResponse.json({ error: "doc_id is required" }, { status: 400 });
    }

    // ✅ 1) 요청자 세션 + 어드민 체크
    const supa = await createSupabaseServerClient();
    const { data: authData, error: authErr } = await supa.auth.getUser();

    if (authErr) {
      return NextResponse.json(
        { error: `auth error: ${authErr.message}` },
        { status: 401 }
      );
    }
    if (!authData.user) {
      return NextResponse.json({ error: "not logged in" }, { status: 401 });
    }

    const requesterEmail = authData.user.email ?? null;
    if (!isAdminEmail(requesterEmail)) {
      return NextResponse.json(
        { error: `forbidden (not admin): ${requesterEmail ?? "no-email"}` },
        { status: 403 }
      );
    }

    // ✅ 2) service_role로 실제 처리
    const admin = createSupabaseAdminClient();

    // (a) 승인 대상 문서 조회 (vendor_user_id 필요)
    const { data: docRow, error: docErr } = await admin
      .from("vendor_docs")
      .select("id, vendor_user_id, status, doc_type")
      .eq("id", doc_id)
      .maybeSingle();

    if (docErr) {
      return NextResponse.json({ error: docErr.message }, { status: 500 });
    }
    if (!docRow) {
      return NextResponse.json({ error: "doc not found" }, { status: 404 });
    }
    if (docRow.status !== "pending") {
      return NextResponse.json(
        { error: `not pending (current=${docRow.status})` },
        { status: 409 }
      );
    }

    const vendorUserId = docRow.vendor_user_id as string;

    // (b) vendor_docs 승인 처리 (reject_reason 컬럼은 건드리지 않음)
    const { error: upErr } = await admin
      .from("vendor_docs")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: authData.user.id, // 승인한 관리자 uid
      })
      .eq("id", doc_id);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // ✅ (핵심) vendors 활성화 (없으면 생성)
    // - vendors.status 컬럼이 있어야 함 (SQL 1번에서 추가)
    // - email/회사명 등은 추후 vendor 페이지에서 본인이 채우게 하거나,
    //   vendor_docs 제출 시 vendors에도 같이 기록하도록 확장하면 됩니다.
    const { error: vendorUpsertErr } = await admin
      .from("vendors")
      .upsert(
        {
          user_id: vendorUserId,
          status: "active",
        },
        { onConflict: "user_id" }
      );

    if (vendorUpsertErr) {
      return NextResponse.json({ error: vendorUpsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, doc_id, vendor_user_id: vendorUserId });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed. Use POST." },
    { status: 405 }
  );
}