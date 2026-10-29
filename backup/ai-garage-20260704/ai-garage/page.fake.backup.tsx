"use client";

import { useMemo, useState } from "react";

const VEHICLES = [
  { id: "pv5_openbed", name: "PV5 Openbed", price: 49800000 },
  { id: "pv5_cargo", name: "PV5 Cargo", price: 47000000 },
  { id: "pv5_passenger", name: "PV5 Passenger", price: 52000000 },
];

const COLORS = ["화이트", "블랙", "그레이", "카키", "베이지", "브라운"];

const ITEMS = {
  "책상": { w: 1200, d: 600, h: 720, price: 350000, days: 1, weight: 25 },
  "32인치 모니터": { w: 720, d: 80, h: 430, price: 280000, days: 0, weight: 6 },
  "냉장고": { w: 500, d: 550, h: 700, price: 1200000, days: 1, weight: 35 },
  "전동어닝": { w: 3000, d: 2500, h: 200, price: 2800000, days: 2, weight: 30 },
  "태양광": { w: 1200, d: 700, h: 50, price: 2900000, days: 2, weight: 20 },
  "카메라 수납함": { w: 900, d: 500, h: 500, price: 1000000, days: 1, weight: 18 },
  "LED 조명": { w: 800, d: 80, h: 80, price: 300000, days: 1, weight: 4 },
  "침대": { w: 1900, d: 1100, h: 350, price: 2500000, days: 3, weight: 55 },
};

export default function AIGaragePage() {
  const [vehicle, setVehicle] = useState(VEHICLES[0]);
  const [color, setColor] = useState("화이트");
  const [purpose, setPurpose] = useState("이동사무실");
  const [selected, setSelected] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    "안녕하세요. 차량 색상과 용도를 고른 뒤 필요한 물건을 말해주세요.",
  ]);

  const total = useMemo(() => {
    return vehicle.price + selected.reduce((sum, name) => sum + ITEMS[name as keyof typeof ITEMS].price, 0);
  }, [vehicle, selected]);

  const days = useMemo(() => {
    return 14 + selected.reduce((sum, name) => sum + ITEMS[name as keyof typeof ITEMS].days, 0);
  }, [selected]);

  const weight = useMemo(() => {
    return selected.reduce((sum, name) => sum + ITEMS[name as keyof typeof ITEMS].weight, 0);
  }, [selected]);

  function addItem(name: string) {
    if (!ITEMS[name as keyof typeof ITEMS]) return;
    if (selected.includes(name)) return;
    setSelected([...selected, name]);
    setMessages(m => [...m, `${name}을 추가했습니다. 비용과 제작기간을 다시 계산했습니다.`]);
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, `나: ${text}`]);

    const found = Object.keys(ITEMS).find(item => text.includes(item));
    if (found) {
      addItem(found);
    } else {
      setMessages(m => [...m, "AI: 지금은 책상, 32인치 모니터, 냉장고, 전동어닝, 태양광, 카메라 수납함, LED 조명, 침대를 추가할 수 있습니다."]);
    }
    setInput("");
  }

  return (
    <main style={S.page}>
      <header style={S.header}>
        <div>
          <h1 style={S.title}>K-AGRI AI Garage</h1>
          <p style={S.sub}>대화하면서 내 차를 레고처럼 꾸미는 공간</p>
        </div>
        <button style={S.green}>견적 문의하기</button>
      </header>

      <section style={S.grid}>
        <aside style={S.panel}>
          <h2 style={S.h2}>1. 차량</h2>
          {VEHICLES.map(v => (
            <button key={v.id} onClick={() => setVehicle(v)} style={vehicle.id === v.id ? S.activeBtn : S.btn}>
              {v.name}
            </button>
          ))}

          <h2 style={S.h2}>2. 색상</h2>
          <div style={S.colors}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} style={color === c ? S.activeSmall : S.small}>{c}</button>
            ))}
          </div>

          <h2 style={S.h2}>3. 용도</h2>
          {["농업", "캠핑", "낚시", "이동사무실", "유튜브 스튜디오", "커피차", "과일상점"].map(p => (
            <button key={p} onClick={() => setPurpose(p)} style={purpose === p ? S.activeBtn : S.btn}>{p}</button>
          ))}
        </aside>

        <section style={S.panel}>
          <h2 style={S.h2}>AI 대화</h2>
          <div style={S.chat}>
            {messages.map((m, i) => <p key={i} style={S.msg}>{m}</p>)}
          </div>
          <div style={S.row}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="예: 책상 넣어줘, 냉장고 추가" style={S.input} />
            <button onClick={send} style={S.green}>전송</button>
          </div>

          <h2 style={S.h2}>추천 아이템</h2>
          <div style={S.itemGrid}>
            {Object.keys(ITEMS).map(name => (
              <button key={name} onClick={() => addItem(name)} style={S.item}>
                {name}<br />
                <span>{ITEMS[name as keyof typeof ITEMS].price.toLocaleString()}원</span>
              </button>
            ))}
          </div>
        </section>

        <section style={S.panel}>
          <h2 style={S.h2}>차량 미리보기</h2>
          <div style={S.preview}>
            <div style={S.vehicleName}>{vehicle.name} / {color} / {purpose}</div>
            <div style={S.carBox}>
              {selected.length === 0 ? <span style={S.empty}>빈 공간</span> : selected.map((name, i) => (
                <div key={name} style={{ ...S.block, left: 20 + (i % 3) * 145, top: 55 + Math.floor(i / 3) * 95 }}>
                  {name}
                </div>
              ))}
            </div>
            <p style={S.dim}>실측 기준 공간: 길이 2,860mm × 폭 1,565mm</p>
          </div>
        </section>

        <aside style={S.panel}>
          <h2 style={S.h2}>실시간 견적</h2>
          <Line label="차량" value={vehicle.price} />
          {selected.map(name => <Line key={name} label={name} value={ITEMS[name as keyof typeof ITEMS].price} />)}
          <hr style={S.hr} />
          <Line label="총 예상 금액" value={total} strong />
          <p style={S.info}>예상 제작기간: {days}일</p>
          <p style={S.info}>추가 중량: {weight}kg</p>
          <p style={S.info}>남은 적재 여유: {Math.max(0, 700 - weight)}kg</p>
        </aside>
      </section>
    </main>
  );
}

function Line({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <div style={strong ? S.strongLine : S.line}><span>{label}</span><b>{value.toLocaleString()}원</b></div>;
}

const S: Record<string, any> = {
  page: { padding: 24, background: "#f7faf7", minHeight: "100vh", color: "#111" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { margin: 0, fontSize: 32, color: "#14532d" },
  sub: { margin: "6px 0 0", color: "#555" },
  grid: { display: "grid", gridTemplateColumns: "260px 360px 1fr 300px", gap: 16 },
  panel: { background: "#fff", border: "1px solid #d9e5d9", borderRadius: 16, padding: 16, boxShadow: "0 4px 14px rgba(0,0,0,.04)" },
  h2: { fontSize: 17, margin: "8px 0 12px", color: "#14532d" },
  btn: { width: "100%", padding: 12, marginBottom: 8, border: "1px solid #ddd", borderRadius: 10, background: "#fff", textAlign: "left", cursor: "pointer" },
  activeBtn: { width: "100%", padding: 12, marginBottom: 8, border: "1px solid #2f7d32", borderRadius: 10, background: "#eaf6ea", textAlign: "left", cursor: "pointer", fontWeight: 700 },
  colors: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  small: { padding: 10, border: "1px solid #ddd", borderRadius: 10, background: "#fff" },
  activeSmall: { padding: 10, border: "1px solid #2f7d32", borderRadius: 10, background: "#eaf6ea", fontWeight: 700 },
  green: { padding: "12px 18px", border: 0, borderRadius: 10, background: "#2f7d32", color: "#fff", fontWeight: 700, cursor: "pointer" },
  chat: { height: 250, overflow: "auto", background: "#f4f7f4", borderRadius: 12, padding: 12, marginBottom: 10 },
  msg: { margin: "0 0 10px", lineHeight: 1.45 },
  row: { display: "flex", gap: 8 },
  input: { flex: 1, padding: 12, border: "1px solid #ddd", borderRadius: 10 },
  itemGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  item: { padding: 10, border: "1px solid #ddd", borderRadius: 10, background: "#fff", textAlign: "left", cursor: "pointer" },
  preview: { textAlign: "center" },
  vehicleName: { fontWeight: 800, marginBottom: 14 },
  carBox: { position: "relative", height: 440, border: "3px solid #333", borderRadius: 24, background: "repeating-linear-gradient(0deg,#f0f0f0,#f0f0f0 24px,#e2e2e2 25px)", overflow: "hidden" },
  empty: { position: "absolute", top: "45%", left: 0, right: 0, color: "#777", fontSize: 24 },
  block: { position: "absolute", width: 125, height: 70, background: "#d9ead3", border: "2px solid #2f7d32", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  dim: { color: "#555", marginTop: 12 },
  line: { display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #eee" },
  strongLine: { display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: 20, color: "#14532d" },
  hr: { border: 0, borderTop: "1px solid #ddd", margin: "14px 0" },
  info: { margin: "10px 0", fontWeight: 700 },
};
