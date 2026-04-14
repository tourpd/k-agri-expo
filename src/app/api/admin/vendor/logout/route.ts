import { NextResponse } from "next/server";
import { VENDOR_COOKIE_NAME } from "@/lib/vendor-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({
    success: true,
    redirectTo: "/vendor/login",
  });

  res.cookies.set(VENDOR_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}