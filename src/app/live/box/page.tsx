"use client";

import { useEffect, useState } from "react";

type Prize = {
  id: string;
  title: string;
  sponsor?: string;
  quantity: number;
  image_url?: string;
};

export default function LiveBoxDrawPage() {
  const [numbers, setNumbers] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState(false);

  const prize: Prize = {
    id: "1",
    title: "켈팍 25L",
    sponsor: "도프",
    quantity: 5,
    image_url: "/test.jpg",
  };

  const startDraw = () => {
    const randoms = Array.from({ length: prize.quantity }).map(() =>
      String(Math.floor(Math.random() * 9999)).padStart(4, "0")
    );

    setNumbers(randoms);
    setIsStarted(true);
  };

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>일반 경품 박스추첨</h1>
        <p style={styles.desc}>
          박스를 열어 당첨번호를 공개하세요
        </p>

        <div style={styles.buttons}>
          <button style={styles.redBtn} onClick={startDraw}>
            박스추첨 시작
          </button>
        </div>
      </div>

      {/* 🔥 상품 영역 (크게) */}
      <div style={styles.productCard}>
        <div style={styles.imageWrap}>
          {prize.image_url ? (
            <img src={prize.image_url} style={styles.image} />
          ) : (
            <span>이미지 없음</span>
          )}
        </div>

        <div style={styles.productInfo}>
          <h2 style={styles.productTitle}>{prize.title}</h2>
          <p>협찬: {prize.sponsor}</p>
          <p>당첨 수량: {prize.quantity}명</p>
        </div>
      </div>

      {/* 🔥 상태 */}
      <div style={styles.status}>
        {!isStarted && "대기중"}
        {isStarted && "추첨 완료 - 당첨번호 공개"}
      </div>

      {/* 🔥 당첨번호 */}
      <div style={styles.grid}>
        {numbers.map((num, i) => (
          <div key={i} style={styles.box}>
            <div style={styles.label}>당첨번호</div>
            <div style={styles.number}>{num}</div>
          </div>
        ))}
      </div>

      {/* 🔥 다음 행동 */}
      {isStarted && (
        <div style={styles.notice}>
          👉 당첨자에게 배송정보 입력 링크를 발송하세요
        </div>
      )}
    </main>
  );
}

const styles: any = {
  page: {
    background: "#020617",
    minHeight: "100vh",
    color: "white",
    padding: 40,
  },
  header: { textAlign: "center" },
  title: { fontSize: 48, fontWeight: 900 },
  desc: { opacity: 0.7 },

  buttons: { marginTop: 20 },
  redBtn: {
    background: "#ef4444",
    padding: "14px 30px",
    borderRadius: 10,
    fontWeight: 900,
  },

  /* 🔥 핵심: 이미지 크게 */
  productCard: {
    marginTop: 40,
    display: "flex",
    gap: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  imageWrap: {
    width: 400,
    height: 300,
    background: "#111",
    borderRadius: 20,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  productInfo: {},
  productTitle: { fontSize: 32, fontWeight: 900 },

  status: {
    marginTop: 30,
    textAlign: "center",
    fontWeight: 900,
    fontSize: 20,
  },

  grid: {
    marginTop: 40,
    display: "flex",
    justifyContent: "center",
    gap: 20,
  },

  box: {
    background: "#facc15",
    padding: 30,
    borderRadius: 20,
    textAlign: "center",
    width: 160,
  },

  label: { fontSize: 14 },
  number: { fontSize: 40, fontWeight: 900 },

  notice: {
    marginTop: 40,
    textAlign: "center",
    fontWeight: 900,
    fontSize: 18,
    color: "#22c55e",
  },
};