"use client";

import { useRouter } from "next/navigation";

export default function FarmerDecisionHub() {
  const router = useRouter();

  const go = (type: string) => {
    switch (type) {
      case "sell":
        router.push("/decision/sell");
        break;
      case "store":
        router.push("/decision/store");
        break;
      case "price":
        router.push("/market");
        break;
      case "diagnosis":
        router.push("/expo");
        break;
    }
  };

  return (
    <section style={{ padding: 20, background: "#fff", borderRadius: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700 }}>
        🌾 농부의 선택
      </h2>

      <p style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
        오늘 이 작물을 어떻게 하시겠습니까?
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
        <button onClick={() => go("sell")} style={{ padding: 12, background: "#ef4444", color: "#fff", borderRadius: 8 }}>
          지금 팔까?
        </button>

        <button onClick={() => go("store")} style={{ padding: 12, background: "#f59e0b", color: "#fff", borderRadius: 8 }}>
          저장할까?
        </button>

        <button onClick={() => go("price")} style={{ padding: 12, background: "#3b82f6", color: "#fff", borderRadius: 8 }}>
          가격 볼까?
        </button>

        <button onClick={() => go("diagnosis")} style={{ padding: 12, background: "#16a34a", color: "#fff", borderRadius: 8 }}>
          진단할까?
        </button>
      </div>
    </section>
  );
}
