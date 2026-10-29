const fs = require("fs");

const products = [
  {
    sku: "awning_fiamma_f45s_300",
    category: "awning",
    name: "Fiamma F45S 300 어닝",
    width_mm: 3080,
    depth_mm: 120,
    height_mm: 150,
    weight_kg: 24,
    product_price: 1650000,
    install_price: 350000,
    install_days: 1,
    source_status: "needs_verification"
  },
  {
    sku: "fridge_dometic_cfx3_75dz",
    category: "fridge",
    name: "Dometic CFX3 75DZ 차량용 냉장고",
    width_mm: 495,
    depth_mm: 892,
    height_mm: 472,
    weight_kg: 28,
    product_price: 1690000,
    install_price: 0,
    install_days: 0,
    source_status: "needs_verification"
  },
  {
    sku: "desk_custom_mobile_office_1200",
    category: "desk",
    name: "모바일 오피스 맞춤 데스크 1200",
    width_mm: 1200,
    depth_mm: 600,
    height_mm: 720,
    weight_kg: 25,
    product_price: 850000,
    install_price: 250000,
    install_days: 2,
    source_status: "estimate"
  },
  {
    sku: "solar_800w_lifepo4_system",
    category: "solar",
    name: "800W 태양광 + 인산철 배터리 시스템",
    width_mm: 2000,
    depth_mm: 1000,
    height_mm: 80,
    weight_kg: 85,
    product_price: 4100000,
    install_price: 1100000,
    install_days: 2,
    source_status: "estimate"
  },
  {
    sku: "camera_rack_creator_box",
    category: "studio",
    name: "크리에이터 카메라 수납랙",
    width_mm: 900,
    depth_mm: 500,
    height_mm: 1200,
    weight_kg: 35,
    product_price: 1200000,
    install_price: 300000,
    install_days: 2,
    source_status: "estimate"
  }
];

fs.writeFileSync(
  "data/mobility/real-products/products.json",
  JSON.stringify(products, null, 2),
  "utf8"
);

console.log("REAL PRODUCT DB CREATED");
console.log("items:", products.length);
