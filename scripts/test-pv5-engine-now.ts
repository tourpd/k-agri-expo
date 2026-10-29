import { generateDesign } from "../src/lib/ai-garage/pv5-engine";

const result = generateDesign({
  dream: "나는 한국농수산TV PD다. 아내와 전국 농가를 다니며 유튜브 촬영을 하고, 밤에는 차박도 하고 싶다. 커피도 마시고 편집도 해야 한다.",
  people: "부부",
  work: "농업 유튜브 촬영",
  hobby: "캠핑 차박 커피",
  budget: "7000만원"
});

console.log(JSON.stringify(result, null, 2));
