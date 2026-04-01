"use client";

import React, { useEffect, useState } from "react";

export default function VendorInquiryPage() {

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {

    const res = await fetch("/api/vendor/inquiries");
    const data = await res.json();

    setItems(data);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {

    await fetch("/api/vendor/inquiries/update", {
      method: "POST",
      body: JSON.stringify({
        inquiry_id: id,
        status,
      }),
    });

    load();
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div style={{ padding: 30 }}>불러오는 중...</div>;

  return (
    <main style={wrap}>

      <h1 style={title}>상담 요청 관리</h1>

      {items.length === 0 && (
        <div style={empty}>
          아직 상담 요청이 없습니다.
        </div>
      )}

      {items.map((i) => (

        <div key={i.inquiry_id} style={card}>

          <div style={row}>
            <b>부스</b>
            {i.booths?.name}
          </div>

          <div style={row}>
            <b>문의내용</b>
            {i.message}
          </div>

          <div style={row}>
            <b>전화</b>
            {i.phone}
          </div>

          <div style={row}>
            <b>이메일</b>
            {i.email}
          </div>

          <div style={row}>
            <b>상태</b>
            {i.status}
          </div>

          <div style={btnRow}>

            <button
              onClick={() => updateStatus(i.inquiry_id, "contacted")}
              style={btn}
            >
              연락완료
            </button>

            <button
              onClick={() => updateStatus(i.inquiry_id, "closed")}
              style={btnGhost}
            >
              종료
            </button>

          </div>

        </div>
      ))}
    </main>
  );
}

const wrap: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: 30,
};

const title: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  marginBottom: 20,
};

const empty: React.CSSProperties = {
  padding: 20,
  border: "1px solid #eee",
  borderRadius: 10,
};

const card: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 16,
  marginBottom: 14,
};

const row: React.CSSProperties = {
  marginBottom: 8,
};

const btnRow: React.CSSProperties = {
  marginTop: 10,
  display: "flex",
  gap: 10,
};

const btn: React.CSSProperties = {
  padding: "8px 12px",
  background: "#111",
  color: "#fff",
  borderRadius: 6,
};

const btnGhost: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
};