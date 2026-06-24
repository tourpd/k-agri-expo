"use client";

import { useState } from "react";

export default function FarmerChoiceEntry() {
  const [open, setOpen] = useState(false);

  return (
    <section className="expo-section" style={{ padding: "18px 20px 0" }}>

      <div
        onClick={() => setOpen(!open)}
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          cursor: "pointer",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 12px 30px rgba(0,0,0,.15)"
        }}
      >
        <img
          src="/images/farmers-choice.png"
          alt="농민의 선택"
          style={{ width: "100%", display: "block" }}
        />
      </div>

      {open && (
        <div style={{
          maxWidth: 1160,
          margin: "16px auto 0",
          padding: 20,
          borderRadius: 18,
          background: "#f8fafc"
        }}>
          <h3 style={{ marginBottom: 12 }}>작물 입력</h3>

          <input
            placeholder="예: 고추 / 양파 / 배추"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ddd"
            }}
          />

          <button style={{
            marginTop: 12,
            padding: "10px 16px",
            background: "#047857",
            color: "#fff",
            borderRadius: 10
          }}>
            분석 시작
          </button>
        </div>
      )}

    </section>
  );
}
