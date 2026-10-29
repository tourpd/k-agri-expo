const fs = require("fs");

const master = JSON.parse(fs.readFileSync("data/pv5/json/pv5_master.json", "utf8"));
const rules = JSON.parse(fs.readFileSync("data/pv5/json/recommendation_rules.json", "utf8"));

const user = {
  job: "마늘농가",
  farm_size: "10000평 이상",
  hobby: "캠핑",
  family: "3~4인",
  budget: "5000~7000만원"
};

let vehicle = null;
const options = [];

for (const rule of rules.rules) {
  const key = Object.keys(rule.condition)[0];
  if (user[key] === rule.condition[key]) {
    if (rule.recommend) vehicle = master.vehicles.find(v => v.id === rule.recommend);
    if (rule.option) options.push(rule.option);
  }
}

console.log(`
# K-AGRI AI 차량 추천 결과

## 입력 정보
- 직업: ${user.job}
- 재배 규모: ${user.farm_size}
- 취미: ${user.hobby}
- 가족 구성: ${user.family}
- 예산: ${user.budget}

## 추천 차량
${vehicle ? vehicle.name : "추천 차량 없음"}

## 추천 옵션
${options.length ? options.map(o => `- ${o}`).join("\n") : "- 기본형"}

## 추천 이유
${user.job}이고 재배 규모가 크기 때문에 작업성과 적재성이 중요합니다.
또한 ${user.hobby} 활용까지 고려하면 농작업과 여가를 함께 지원할 수 있는 차량 구성이 필요합니다.

## AI 이미지 프롬프트
${vehicle ? vehicle.name : "PV5"}를 기반으로 한 ${user.job} 전용 ${user.hobby} 겸용 농장차 디자인.
적재함에는 공구함, 캐노피, 캠핑 장비, 농작업 장비가 정돈되어 있는 현실적인 한국 농촌형 차량.
`);
