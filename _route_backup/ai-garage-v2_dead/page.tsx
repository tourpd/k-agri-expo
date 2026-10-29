"use client";

import { useState } from "react";

export default function AiGarageV2Page() {
  const [dream, setDream] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function createWorld() {
    setLoading(true);
    const res = await fetch("/api/ai-garage-v2/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dream })
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f4f6f1", padding: 24 }}>
      <section style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 42, marginBottom: 8 }}>
          AI Garage V2
        </h1>

        <p style={{ fontSize: 20, lineHeight: 1.5 }}>
          당신은 PV5 안에 어떤 세계를 만들고 싶습니까?
        </p>

        <textarea
          value={dream}
          onChange={(e) => setDream(e.target.value)}
          placeholder="예: 비 오는 날 아이들과 안전하게 잘 수 있고, 아내가 커피를 마시고, 나는 밤에 유튜브 편집을 할 수 있는 작은 이동식 집을 만들고 싶다."
          style={{
            width: "100%",
            minHeight: 160,
            marginTop: 20,
            padding: 18,
            borderRadius: 16,
            border: "1px solid #ccc",
            fontSize: 17,
            lineHeight: 1.5
          }}
        />

        <button
          onClick={createWorld}
          disabled={!dream || loading}
          style={{
            marginTop: 16,
            padding: "14px 22px",
            borderRadius: 14,
            border: 0,
            background: "#15803d",
            color: "white",
            fontWeight: 800,
            fontSize: 17
          }}
        >
          {loading ? "PV5 세계 생성 중..." : "내 PV5 세계 만들기"}
        </button>

        {result && (
          <section style={{ marginTop: 32 }}>
            <div style={card}>
              <h2>🚐 PV5 실제 제원 적용</h2>
              <p>사용 가능 길이: {result.vehicle.usableLengthMm}mm</p>
              <p>사용 가능 폭: {result.vehicle.usableWidthMm}mm</p>
              <p>사용 가능 높이: {result.vehicle.usableHeightMm}mm</p>
            </div>

            <div style={card}>
              <h2>🧩 실제 제품 매칭</h2>
              {result.products.length === 0 ? (
                <p>현재 DB에서 맞는 제품이 부족합니다. 실제 쿠팡 상품 DB를 추가해야 합니다.</p>
              ) : (
                result.products.map((p: any) => (
                  <div key={p.id} style={{ borderTop: "1px solid #ddd", padding: "12px 0" }}>
                    <b>{p.category}</b> — {p.name}
                    <div>{p.price.toLocaleString()}원</div>
                    <div>크기: {p.widthMm} × {p.depthMm} × {p.heightMm}mm</div>
                  </div>
                ))
              )}
              <h3>총 예상 제품가: {result.total.toLocaleString()}원</h3>
            </div>

            <div style={card}>
              <h2>📺 고객 니즈 관련 유튜브 사례</h2>
              {result.youtubeQueries.map((v: any) => (
                <p key={v.url}>
                  <a href={v.url} target="_blank">{v.title}</a>
                </p>
              ))}
            </div>

            <div style={card}>
              <h2>📞 다음 단계</h2>
              <p>이 구성으로 상봉기아 상담 견적서를 생성합니다.</p>
              <button style={{
                padding: "14px 22px",
                borderRadius: 14,
                border: 0,
                background: "#111827",
                color: "white",
                fontWeight: 800
              }}>
                상봉기아 상담 요청
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 18,
  padding: 22,
  marginBottom: 18,
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)"
};
