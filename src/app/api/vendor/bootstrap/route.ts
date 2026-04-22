import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const company_name = safeText(body?.company_name);
    const contact_name = safeText(body?.contact_name);
    const email = safeText(body?.email);

    if (!company_name || !email) {
      return NextResponse.json(
        { ok: false, error: "company_name and email is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "auth user not found" },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        user_id: user.id,
        email,
        role: "vendor",
        display_name: contact_name || company_name,
        company_name,
        updated_at: now,
      },
      {
        onConflict: "user_id",
      }
    );

    if (profileError) {
      return NextResponse.json(
        { ok: false, error: `[profiles] ${profileError.message}` },
        { status: 500 }
      );
    }

    const { error: vendorError } = await admin.from("vendors").upsert(
      {
        user_id: user.id,
        email,
        company_name,
        contact_name: contact_name || company_name,
        status: "none",
        verify_status: "none",
        updated_at: now,
      },
      {
        onConflict: "user_id",
      }
    );

    if (vendorError) {
      return NextResponse.json(
        { ok: false, error: `[vendors] ${vendorError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "참가기업 계정 초기화 완료",
    });
  } catch (error: any) {
    console.error("[vendor/bootstrap][POST]", error);

    return NextResponse.json(
      { ok: false, error: error?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}