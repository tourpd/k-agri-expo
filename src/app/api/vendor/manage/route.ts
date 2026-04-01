import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();

    if (!isAdmin) {
      return NextResponse.json(
        { ok: false, error: "관리자 권한이 없습니다." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const action = safeText(body?.action);
    const vendorUserId = safeText(body?.vendorUserId);

    if (!action || !vendorUserId) {
      return NextResponse.json(
        { ok: false, error: "action, vendorUserId가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // 승인
    if (action === "approve") {
      const { data: vendorRow, error: vendorError } = await supabase
        .from("vendors")
        .select("id,email,company_name")
        .eq("user_id", vendorUserId)
        .maybeSingle();

      if (vendorError || !vendorRow) {
        return NextResponse.json(
          { ok: false, error: vendorError?.message || "vendor를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      const { data: appRow } = await supabase
        .from("vendor_applications")
        .select("*")
        .eq("user_id", vendorUserId)
        .maybeSingle();

      await supabase
        .from("vendors")
        .update({
          status: "active",
          verify_status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("user_id", vendorUserId);

      // booth가 없으면 생성
      const { data: boothExisting } = await supabase
        .from("booths")
        .select("booth_id")
        .eq("owner_user_id", vendorUserId)
        .maybeSingle();

      if (!boothExisting?.booth_id) {
        const boothPayload = {
          owner_user_id: vendorUserId,
          vendor_user_id: vendorUserId,
          vendor_id: vendorRow.id,
          name: appRow?.company_name || vendorRow.company_name || "참가 업체",
          category_primary: appRow?.category_primary || "기타",
          region: "대한민국",
          contact_name: appRow?.owner_name || null,
          phone: appRow?.phone || null,
          email: appRow?.email || vendorRow.email || null,
          intro: appRow?.intro || "입점 승인된 업체입니다.",
          description: appRow?.intro || "입점 승인된 업체입니다.",
          status: "active",
          is_published: true,
          created_at: new Date().toISOString(),
        };

        const { error: boothInsertError } = await supabase.from("booths").insert(boothPayload);

        if (boothInsertError) {
          return NextResponse.json(
            { ok: false, error: boothInsertError.message || "booth 생성에 실패했습니다." },
            { status: 500 }
          );
        }
      } else {
        await supabase
          .from("booths")
          .update({
            vendor_id: vendorRow.id,
            vendor_user_id: vendorUserId,
            status: "active",
            is_published: true,
          })
          .eq("booth_id", boothExisting.booth_id);
      }

      await supabase
        .from("vendor_applications")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("user_id", vendorUserId);

      return NextResponse.json({
        ok: true,
        message: "업체 승인 및 booth 생성이 완료되었습니다.",
      });
    }

    // 반려
    if (action === "reject") {
      await supabase
        .from("vendors")
        .update({
          status: "paused",
          verify_status: "rejected",
        })
        .eq("user_id", vendorUserId);

      await supabase
        .from("vendor_applications")
        .update({
          status: "rejected",
        })
        .eq("user_id", vendorUserId);

      return NextResponse.json({
        ok: true,
        message: "업체 신청이 반려되었습니다.",
      });
    }

    // 비활성화
    if (action === "deactivate") {
      const { error } = await supabase.rpc("soft_delete_vendor_bundle", {
        p_user_id: vendorUserId,
        p_deleted_by: "admin",
      });

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message || "업체 비활성화에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "업체가 비활성화되었습니다.",
      });
    }

    // 완전삭제
    if (action === "hard_delete") {
      const { error: bundleError } = await supabase.rpc("hard_delete_vendor_bundle", {
        p_user_id: vendorUserId,
      });

      if (bundleError) {
        return NextResponse.json(
          { ok: false, error: bundleError.message || "연결 데이터 정리에 실패했습니다." },
          { status: 500 }
        );
      }

      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(vendorUserId);

      if (authDeleteError) {
        return NextResponse.json(
          { ok: false, error: authDeleteError.message || "Auth 삭제에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "업체와 계정이 완전삭제되었습니다.",
      });
    }

    return NextResponse.json(
      { ok: false, error: "유효하지 않은 action입니다." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[admin/vendors/manage][POST]", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "관리 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}