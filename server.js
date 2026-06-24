const express = require("express");
const app = express();

app.use(express.json());

// =========================
// EXPO MARKET ENGINE
// =========================

function predictMarket(poll) {

  const sellPressure = poll.sellAll + (poll.sellHalf * 0.5);
  const storePressure = poll.store;
  const uncertainty = poll.undecided;

  const netPressure = sellPressure - storePressure;

  let state = "";
  let priceSignal = "";
  let action = "";

  if (netPressure >= 20) {
    state = "SUPPLY_OVERFLOW";
    priceSignal = "하락 압력 강함";
    action = "즉시 분할 매도";
  } else if (netPressure >= 5) {
    state = "WEAK_SUPPLY";
    priceSignal = "약한 하락";
    action = "부분 매도";
  } else if (netPressure > -5) {
    state = "BALANCED";
    priceSignal = "횡보";
    action = "분할 전략";
  } else {
    state = "SHORTAGE_EXPECTATION";
    priceSignal = "상승 가능성";
    action = "저장 유지";
  }

  if (uncertainty >= 20) {
    action += " (리스크 높음)";
  }

  return {
    state,
    netPressure,
    priceSignal,
    action
  };
}

// =========================
// API
// =========================

app.get("/api/market", (req, res) => {

  const poll = {
    sellAll: Number(req.query.sellAll || 0),
    sellHalf: Number(req.query.sellHalf || 0),
    store: Number(req.query.store || 0),
    undecided: Number(req.query.undecided || 0)
  };

  const result = predictMarket(poll);

  res.json(result);
});

// =========================
// ROOT
// =========================

app.get("/", (req, res) => {
  res.send("EXPO ENGINE RUNNING");
});

app.listen(3000, () => {
  console.log("SERVER RUNNING ON 3000");
});
