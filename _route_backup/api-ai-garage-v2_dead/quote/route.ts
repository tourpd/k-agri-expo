import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type Product = {
  id: string;
  category: string;
  name: string;
  price: number;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  keywords: string[];
};

type Vehicle = {
  id: string;
  name: string;
  usableLengthMm: number;
  usableWidthMm: number;
  usableHeightMm: number;
  maxPayloadKg: number;
};

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function scoreProduct(text: string, product: Product) {
  return product.keywords.reduce((score, keyword) => {
    return text.includes(keyword) ? score + 1 : score;
  }, 0);
}

export async function POST(req: Request) {
  const body = await req.json();
  const dream = String(body.dream || "");

  const root = process.cwd();
  const vehicle = readJson<Vehicle>(
    path.join(root, "data/ai-garage-v2/vehicles/pv5-specs.json")
  );
  const products = readJson<Product[]>(
    path.join(root, "data/ai-garage-v2/products/coupang-products.json")
  );

  const matched = products
    .map((p) => ({
      ...p,
      score: scoreProduct(dream, p),
      fits:
        p.depthMm <= vehicle.usableLengthMm &&
        p.widthMm <= vehicle.usableWidthMm &&
        p.heightMm <= vehicle.usableHeightMm
    }))
    .filter((p) => p.score > 0 && p.fits)
    .sort((a, b) => b.score - a.score);

  const total = matched.reduce((sum, p) => sum + p.price, 0);

  const youtubeQueries = [
    `${dream} PV5 차박`,
    `${dream} 캠핑카 세팅`,
    `${dream} 밴라이프`,
    `${dream} 차량 개조`
  ].map((q) => ({
    title: q,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
  }));

  return NextResponse.json({
    dream,
    vehicle,
    products: matched,
    total,
    youtubeQueries
  });
}
