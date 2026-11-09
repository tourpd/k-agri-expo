import { NextResponse } from "next/server";
import { companies } from "@/lib/materials/organic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 기업 영업 명단 — 공시 자재 회사 675곳 (제품 수 많은 순)
 * 관리자 전용 (/api/admin 은 proxy에서 관리자 세션 확인)
 * GET ?format=csv 로 엑셀용 CSV
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rows = companies();
  if (url.searchParams.get("format") === "csv") {
    const head = ["회사", "전화", "제품수", "충해", "병해", "병해충", "토양·생육", "대표제품", "주소"];
    const lines = rows.map((r) => [
      r.company,
      r.phone,
      r.products,
      r.kinds["충해관리용"] ?? 0,
      r.kinds["병해관리용"] ?? 0,
      r.kinds["병해충관리용"] ?? 0,
      (r.kinds["토양개량 및 작물생육용"] ?? 0) + (r.kinds["작물생육용"] ?? 0) + (r.kinds["토양개량용"] ?? 0),
      r.sample.join(" / "),
      r.addr,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = "﻿" + [head.join(","), ...lines].join("\n");
    return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=organic-companies.csv" } });
  }
  return NextResponse.json({ ok: true, count: rows.length, companies: rows });
}
