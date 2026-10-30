import { NextResponse } from "next/server";
import { convertNewsToContent } from "@/lib/newsToContent";

export const dynamic = "force-dynamic";

// 예전에는 http://localhost:3000 을 불러서 실제 사이트에서는 항상 실패했습니다.
// 같은 사이트 주소로 부르고, 실패하면 빈 목록을 돌려줘 화면이 깨지지 않게 합니다.
export async function GET(req: Request) {
  try {
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/api/agri-news`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json([]);
    const news = await res.json();
    return NextResponse.json(convertNewsToContent(news));
  } catch (error) {
    console.error("[api/problem-news] error:", error);
    return NextResponse.json([]);
  }
}
