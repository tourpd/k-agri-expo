import { NextResponse } from "next/server";

const PV5 = {
  name: "PV5 Cargo High Roof",
  image: "/mobility/pv5/reference/pv5-cargo-highroof.png",
  interior: { length: 3100, width: 1565, height: 1815 }
};

const ITEMS = [
  { label: "부부 차박 침실", w: 1900, d: 1200, h: 120, price: 1200000, image: "/mobility/pv5/products/bed.png" },
  { label: "편집 워크스테이션", w: 900, d: 500, h: 700, price: 850000, image: "/mobility/pv5/products/desk.png" },
  { label: "촬영장비 수납", w: 800, d: 450, h: 500, price: 900000, image: "/mobility/pv5/products/storage.png" },
  { label: "냉장 보관", w: 585, d: 350, h: 335, price: 169000, image: "/mobility/pv5/products/fridge.png" },
  { label: "커피 존", w: 600, d: 400, h: 700, price: 700000, image: "/mobility/pv5/products/coffee.png" }
];

function layout() {
  return [
    { ...ITEMS[0], x: 80, y: 80 },
    { ...ITEMS[1], x: 2050, y: 80 },
    { ...ITEMS[2], x: 80, y: 1320 },
    { ...ITEMS[3], x: 950, y: 1320 },
    { ...ITEMS[4], x: 1600, y: 1320 }
  ];
}

export async function POST(req: Request) {
  const body = await req.json();
  const placed = layout();
  const custom = placed.reduce((s, x) => s + x.price, 0);
  const labor = Math.round(custom * 0.45);
  const vehicle = 53000000;

  return NextResponse.json({
    title: "한국농수산TV 이동형 방송국",
    vehicle: PV5.name,
    vehicle_image: PV5.image,
    dream: body.dream || "",
    interior: PV5.interior,
    placed_items: placed,
    estimate: {
      vehicle,
      custom,
      labor,
      total: vehicle + custom + labor
    }
  });
}
