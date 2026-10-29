import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { calcProductTotal, simpleFitCheck } from "@/lib/ai-garage/product-fit";

export const runtime = "nodejs";

export async function GET() {
  const file = path.join(process.cwd(), "data/mobility/kia/pv5/real-products/coupang-products.json");
  const products = JSON.parse(fs.readFileSync(file, "utf8"));

  const pv5HighRoofInterior = {
    inside_length_mm: 3100,
    inside_width_mm: 1565,
    inside_height_mm: 1815
  };

  return NextResponse.json({
    ok: true,
    basis: "실제 판매 검색가 + 실제/확인된 크기 우선. 미확인 제품은 needs_verification 표시.",
    vehicle_space: pv5HighRoofInterior,
    products,
    fit: simpleFitCheck(pv5HighRoofInterior, products),
    cost: calcProductTotal(products)
  });
}
