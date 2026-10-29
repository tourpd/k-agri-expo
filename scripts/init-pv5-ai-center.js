const fs = require("fs");

const files = {
  "data/pv5/knowledge/question_categories.json": {
    price: ["가격", "보조금", "리스", "렌트", "유지비"],
    vehicle: ["주행거리", "배터리", "충전", "적재", "옵션"],
    farming: ["마늘", "고추", "과수", "축산", "스마트팜"],
    lifestyle: ["캠핑", "차박", "낚시", "여행", "반려견"],
    business: ["커피차", "과일상점", "푸드트럭", "이동판매", "홍보차"]
  },

  "data/pv5/design/design_types.json": {
    farm: ["홍산마늘형", "고추형", "사과형", "축산형", "스마트팜형"],
    hobby: ["캠핑형", "차박형", "낚시형"],
    business: ["커피차형", "과일상점형", "푸드트럭형", "이동판매형"]
  },

  "data/pv5/json/recommendation_rules.json": {
    rules: [
      { condition: { job: "마늘농가" }, recommend: "pv5_openbed" },
      { condition: { job: "과수농가" }, recommend: "pv5_openbed" },
      { condition: { job: "축산" }, recommend: "pv5_openbed" },
      { condition: { hobby: "캠핑" }, option: "camping_package" },
      { condition: { hobby: "낚시" }, option: "fishing_package" },
      { condition: { business: "커피차" }, recommend: "pv5_cargo" },
      { condition: { business: "과일상점" }, recommend: "pv5_cargo" }
    ]
  }
};

for (const [filePath, data] of Object.entries(files)) {
  fs.mkdirSync(filePath.split("/").slice(0, -1).join("/"), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log("CREATED:", filePath);
}

console.log("PV5 AI Mobility Design Center initialized.");
