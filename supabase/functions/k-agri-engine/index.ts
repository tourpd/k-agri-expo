export default {
  fetch: async (req: Request) => {

    const { question } = await req.json();
    const q = question.toLowerCase();

    // ----------------------------
    // 1. CROP DETECTION
    // ----------------------------
    let crop = "onion";
    if (q.includes("마늘")) crop = "garlic";
    if (q.includes("배추")) crop = "cabbage";
    if (q.includes("고구마")) crop = "sweet_potato";

    // ----------------------------
    // 2. REGION DETECTION
    // ----------------------------
    let region = "national";
    if (q.includes("고흥")) region = "goheung";
    if (q.includes("나주")) region = "naju";
    if (q.includes("무안")) region = "muan";

    // ----------------------------
    // 3. SEASON LOGIC (NO DATA)
    // ----------------------------
    const month = new Date().getMonth() + 1;

    let seasonPressure = 0;
    if (month <= 3) seasonPressure = 0.6;   // 공급 부족
    if (month <= 6) seasonPressure = 0.3;
    if (month <= 9) seasonPressure = 0.8;   // 과잉 위험
    if (month <= 12) seasonPressure = 0.5;

    // ----------------------------
    // 4. BEHAVIOR SIGNAL (TEXT ONLY)
    // ----------------------------
    const farmerIntent =
      q.includes("심어") ? 0.7 :
      q.includes("팔") ? 0.6 :
      0.3;

    const urgency =
      q.includes("지금") ? 0.8 :
      q.includes("올해") ? 0.5 :
      0.2;

    // ----------------------------
    // 5. SYNTHETIC MARKET MODEL
    // ----------------------------
    const randomNoise = (Math.random() - 0.5) * 0.3;

    const marketTrend =
      seasonPressure * 0.6 +
      farmerIntent * 0.2 +
      urgency * 0.1 +
      randomNoise;

    // ----------------------------
    // 6. DECISION ENGINE
    // ----------------------------
    let prediction = "STABLE";
    let risk = "MEDIUM";

    if (marketTrend > 0.55) {
      prediction = "UP";
      risk = "LOW";
    }

    if (marketTrend < 0.35) {
      prediction = "DOWN";
      risk = "HIGH";
    }

    // ----------------------------
    // 7. ACTION ENGINE
    // ----------------------------
    let action = "보류";
    if (prediction === "UP") action = "보유";
    if (prediction === "DOWN") action = "분산 출하 또는 판매";

    // ----------------------------
    // 8. RESPONSE
    // ----------------------------
    return new Response(JSON.stringify({
      crop,
      region,
      prediction,
      risk,
      action,
      score: Number((marketTrend * 100).toFixed(1)),
      insight: {
        logic: "synthetic_v1_no_data",
        seasonPressure,
        farmerIntent,
        urgency
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
