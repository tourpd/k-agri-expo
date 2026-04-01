import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const company_name = String(body?.company_name ?? "").trim();
    const contact_name = String(body?.contact_name ?? "").trim();
    const email = String(body?.email ?? "").trim();

    if (!company_name || !contact_name || !email) {
      return NextResponse.json(
        { ok: false, error: "company_name, contact_name, email is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const admin = getSupabaseAdmin();

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
        email,
        role: "buyer",
        display_name: contact_name,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return NextResponse.json(
        { ok: false, error: profileError.message },
        { status: 500 }
      );
    }

    const { error: buyerError } = await admin.from("buyers").upsert(
      {
        user_id: user.id,
        company_name,
        contact_name,
        email,
        status: "active",
      },
      { onConflict: "user_id" }
    );

    if (buyerError) {
      return NextResponse.json(
        { ok: false, error: buyerError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}