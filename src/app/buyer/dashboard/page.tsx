"use client";

import { useState } from "react";

export default function BuyerDashboard() {
  const [demand, setDemand] = useState({
    category: "",
    crop: "",
    quantity: "",
    note: "",
  });

  async function submitDemand() {
    await fetch("/api/buyer/demand", {
      method: "POST",
      body: JSON.stringify(demand),
    });

    alert("요청 등록 완료");
  }

  return (
    <div>
      <h1>바이어 대시보드</h1>

      <h2>구매 요청</h2>

      <select onChange={(e) => setDemand({ ...demand, category: e.target.value })}>
        <option>비료</option>
        <option>농약</option>
        <option>농기계</option>
      </select>

      <input placeholder="작물"
        onChange={(e) => setDemand({ ...demand, crop: e.target.value })} />

      <input placeholder="물량"
        onChange={(e) => setDemand({ ...demand, quantity: e.target.value })} />

      <textarea placeholder="요청사항"
        onChange={(e) => setDemand({ ...demand, note: e.target.value })} />

      <button onClick={submitDemand}>요청 등록</button>
    </div>
  );
}