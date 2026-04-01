import { NextResponse } from "next/server";
import {
  createSupabaseServerClient,
  createSupabaseAdminClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const company_name = String(body?.company_name ?? "").trim();
    const contact_name = String(body?.contact_name ?? "").trim();
    const email = String(body?.email ?? "").trim();

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

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        user_id: user.id,
        email,
        role: "vendor",
        display_name: contact_name || company_name,
        company_name,
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
        created_at: new Date().toISOString(),
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