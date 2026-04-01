"use client";

import Link from "next/link";
import React from "react";

type Hall = {
  hallId: string;
  title: string;
  subtitle: string;
  hint: string;
};

const HALLS: Hall[] = [
  { hallId: "agri-inputs", title: "농자재관", subtitle: "비료/영양제/방제/자재", hint: "특가 딜이 가장 많이 모입니다." },
  { hallId: "machinery", title: "농기계관", subtitle: "기계/부품/작업기", hint: "기계 사진/카탈로그 중심" },
  { hallId: "seeds", title: "종자관", subtitle: "종자/육묘/묘목", hint: "품종/성적서/PDF 중심" },
  { hallId: "smartfarm", title: "스마트팜관", subtitle: "센서/관수/ICT", hint: "영상 데모 + 설치 상담" },
];

export default function ExpoMapClient() {
  return (
    <section style={{ marginTop: 14 }}>
      <div style={panel}>
        <div style={panelTitle}>전시관 선택</div>
        <div style={panelSub}>아래 전시관을 터치하면 부스 모형도로 이동합니다.</div>

        <div style={grid}>
          {HALLS.map((h) => (
            <Link key={h.hallId} href={`/expo/hall/${h.hallId}`} style={hallCard}>
              <div style={hallTitle}>{h.title}</div>
              <div style={hallSub}>{h.subtitle}</div>
              <div style={hallHint}>👉 {h.hint}</div>
            </Link>
          ))}
        </div>

        <div style={note}>
          ※ “진짜 박람회 지도 이미지(일러스트)”를 넣고 싶으시면, 이 영역을 이미지로 깔고
          <b> 투명 버튼(핫스팟)</b>을 위에 얹는 방식으로 바로 구현 가능합니다.
        </div>
      </div>
    </section>
  );
}

const panel: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 16,
  background: "#fff",
};

const panelTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 950,
};

const panelSub: React.CSSProperties = {
  marginTop: 6,
  fontSize: 16,
  color: "#666",
  lineHeight: 1.6,
};

const grid: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 12,
};

const hallCard: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 14,
  background: "#fafafa",
  textDecoration: "none",
  color: "#111",
  minHeight: 120,
};

const hallTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 950,
};

const hallSub: React.CSSProperties = {
  marginTop: 8,
  fontSize: 16,
  color: "#222",
  lineHeight: 1.6,
  fontWeight: 800,
};

const hallHint: React.CSSProperties = {
  marginTop: 10,
  fontSize: 15,
  color: "#6b7280",
  lineHeight: 1.6,
  fontWeight: 900,
};

const note: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 16,
  border: "1px solid #f3f4f6",
  background: "#fff",
  color: "#6b7280",
  fontSize: 14,
  lineHeight: 1.7,
};