"use client";

import Link from "next/link";

export default function InsectJoinPage() {
  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>
        🚀 미래 식량 프로젝트 참여
      </h1>

      <p style={{ marginTop: 10 }}>
        고소애 생산 농가를 모집합니다.
      </p>

      <div style={{ marginTop: 20, background: "#f1f5f9", padding: 16 }}>
        ✔ 한미양행 연계 안정 수매  
        ✔ 교육 제공  
        ✔ 초보 가능  
      </div>

      <div style={{ marginTop: 30 }}>
        <Link href="/insect/apply">
          <button style={{
            width:"100%",
            padding:16,
            fontSize:18,
            fontWeight:900,
            background:"black",
            color:"white"
          }}>
            🔥 지금 신청하기
          </button>
        </Link>
      </div>

    </div>
  );
}