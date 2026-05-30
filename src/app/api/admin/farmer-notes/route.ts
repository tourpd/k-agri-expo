// src/app/api/admin/farmer-notes/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safe(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const phone = safe(searchParams.get("phone"));

    if (!phone) {
      return NextResponse.json({
        success: false,
        message: "phone required",
      });
    }

    const { data, error } = await supabase
      .from("farmer_notes")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      notes: data || [],
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      message: e?.message || "load error",
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const phone = safe(body.phone);
    const farmer_name = safe(body.farmer_name);
    const note = safe(body.note);

    if (!phone) {
      return NextResponse.json({
        success: false,
        message: "phone required",
      });
    }

    if (!note) {
      return NextResponse.json({
        success: false,
        message: "note required",
      });
    }

    const { data, error } = await supabase
      .from("farmer_notes")
      .insert({
        phone,
        farmer_name,
        note,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      note: data,
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      message: e?.message || "save error",
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const id = safe(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({
        success: false,
        message: "id required",
      });
    }

    const { error } = await supabase
      .from("farmer_notes")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      message: e?.message || "delete error",
    });
  }
}