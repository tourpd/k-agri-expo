export default {
  fetch: async (req: Request) => {

    const { crop, region, action, score } = await req.json();

    const basePrice = 100;

    const seasonNoise = (Math.random() - 0.5) * 20;

    let actionImpact = 0;
    if (action === "sold") actionImpact = -10;
    if (action === "held") actionImpact = 5;

    const aiInfluence = score ? (score - 50) * 0.3 : 0;

    const priceChange =
      seasonNoise +
      actionImpact +
      aiInfluence;

    const finalPrice = basePrice + priceChange;

    let outcome = "STABLE";
    if (priceChange > 8) outcome = "UP";
    if (priceChange < -8) outcome = "DOWN";

    return new Response(JSON.stringify({
      crop,
      region,
      action,
      basePrice,
      finalPrice,
      priceChange,
      outcome,
      logic: "simulated_market_v1"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
