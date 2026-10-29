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

const result = {
  user,
  vehicle: null,
  options: [],
  reason: []
};

for (const rule of rules.rules) {
  const key = Object.keys(rule.condition)[0];
  const value = rule.condition[key];

  if (user[key] === value) {
    if (rule.recommend) {
      result.vehicle = master.vehicles.find(v => v.id === rule.recommend);
      result.reason.push(`${key}=${value} 조건으로 ${rule.recommend} 추천`);
    }

    if (rule.option) {
      result.options.push(rule.option);
      result.reason.push(`${key}=${value} 조건으로 ${rule.option} 추가`);
    }
  }
}

console.log(JSON.stringify(result, null, 2));
