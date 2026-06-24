export function calculateFarmerScore(input: {
  crop: string;
  region: string;
  problem: string;
}) {
  let score = 0;

  const { crop, region, problem } = input;

  if (["양파","마늘","고추"].some(v => crop.includes(v))) score += 30;
  if (["노균","탄저","흰가루"].some(v => problem.includes(v))) score += 35;
  if (region.includes("전남")) score += 20;
  if (region.includes("경남")) score += 15;

  const m = new Date().getMonth() + 1;
  if (m >= 5 && m <= 9) score += 15;

  return {
    score,
    level:
      score >= 80 ? "CRITICAL" :
      score >= 60 ? "HIGH" :
      score >= 40 ? "MED" : "LOW"
  };
}
