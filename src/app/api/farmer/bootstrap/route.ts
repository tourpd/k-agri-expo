import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const region = String(body?.region ?? "").trim();
    const email = String(body?.email ?? "").trim();

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: "name and email is required" },
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
        email,
        role: "farmer",
        display_name: name,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return NextResponse.json(
        { ok: false, error: profileError.message },
        { status: 500 }
      );
    }

    const { error: farmerError } = await admin.from("farmers").upsert(
      {
        user_id: user.id,
        name,
        phone,
        region,
        email,
        status: "active",
      },
      { onConflict: "user_id" }
    );

    if (farmerError) {
      return NextResponse.json(
        { ok: false, error: farmerError.message },
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