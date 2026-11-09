import { NextResponse } from "next/server";

/** 옛 주소 /calc → /yakbaksa (약박사) */
export function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/yakbaksa";
  return NextResponse.redirect(url, 308);
}
