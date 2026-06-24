"use client";

import { useState } from "react";

const crops = ["마늘", "양파", "오이", "고추", "토마토", "딸기"];
const regions = ["전남", "경북", "충남", "경남", "강원", "제주"];

export default function FarmerDecisionHero() {
  const [form, setForm] = useState({
    crop: "마늘",
    region: "",
    inventory_status: "",
    sell_plan: "",
    price_outlook: "",
    note: "",
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/expo/farmer-decision/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    setResult(json.result || json);
    setLoading(false);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 16px" }}>
      <section style={{ maxWidth: 960, margin: "0 auto", borderRadius: 30, background: "#fff", padding: 34, boxShadow: "0 24px 70px rgba(15,23,42,0.10)", border: "1px solid #dcfce7" }}>
        <div style={{ color: "#15803d", fontWeight: 950 }}>K-AGRI FARMER DECISION 2.0</div>

        <h1 style={{ margin: "16px 0 10px", fontSize: "clamp(36px,6vw,64px)", lineHeight: 1.06, letterSpacing: "-0.06em", fontWeight: 950 }}>
          농민의 선택은<br />
          <span style={{ color: "#15803d" }}>전국 농민의 데이터</span>로 만듭니다
        </h1>

        <p style={{ color: "#475569", fontSize: 19, fontWeight: 800 }}>
          지금 내 작물 상황을 남기면, 작목별 농민 심리지수로 쌓입니다.
        </p>

        <form onSubmit={submit} style={{ marginTop: 28, display: "grid", gap: 22 }}>
          <Box title="1. 작목 선택">
            <Buttons items={crops} value={form.crop} onClick={(v: string) => set("crop", v)} />
          </Box>

          <Box title="2. 지역 선택">
            <Buttons items={regions} value={form.region} onClick={(v: string) => set("region", v)} />
          </Box>

          <Box title="3. 현재 보유 물량은?">
            <Buttons items={["많다", "비슷하다", "적다", "거의 없다"]} value={form.inventory_status} onClick={(v: string) => set("inventory_status", v)} />
          </Box>

          <Box title="4. 판매 계획은?">
            <Buttons items={["즉시 판매", "7월 판매", "저장", "결정 못함"]} value={form.sell_plan} onClick={(v: string) => set("sell_plan", v)} />
          </Box>

          <Box title="5. 가격 전망은?">
            <Buttons items={["상승", "보합", "하락", "모르겠다"]} value={form.price_outlook} onClick={(v: string) => set("price_outlook", v)} />
          </Box>

          <textarea
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="현장 분위기나 하고 싶은 말을 남겨주세요."
            style={{ minHeight: 110, borderRadius: 18, border: "1px solid #d1d5db", padding: 16, fontSize: 17 }}
          />

          <button type="submit" style={{ height: 60, border: 0, borderRadius: 999, background: "#15803d", color: "#fff", fontSize: 20, fontWeight: 950, cursor: "pointer" }}>
            {loading ? "저장 중..." : "내 선택 남기기"}
          </button>
        </form>

        {result ? (
          <div style={{ marginTop: 28, borderRadius: 24, background: "#f0fdf4", padding: 24, border: "1px solid #bbf7d0" }}>
            <div style={{ color: "#15803d", fontWeight: 950 }}>참여 완료</div>
            <h2 style={{ margin: "10px 0", fontSize: 34, fontWeight: 950 }}>
              {result.crop} 농민 심리지수 {result.sentiment_score}점
            </h2>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#475569" }}>
              이 데이터가 쌓이면 작목별·지역별 출하 판단의 근거가 됩니다.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Box({ title, children }: any) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Buttons({ items, value, onClick }: any) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {items.map((item: string) => (
        <button
          key={item}
          type="button"
          onClick={() => onClick(item)}
          style={{
            border: "1px solid #bbf7d0",
            background: value === item ? "#15803d" : "#f0fdf4",
            color: value === item ? "#fff" : "#166534",
            borderRadius: 999,
            padding: "12px 18px",
            fontSize: 17,
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
