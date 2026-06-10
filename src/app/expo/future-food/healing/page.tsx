"use client";

import { useState } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const pages = [
  "/images/healing-page-1.png",
  "/images/healing-page-2.png",
  "/images/healing-page-3.png",
];

export default function HealingPage() {
  const [page, setPage] = useState(0);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f5f1",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/expo/future-food"
          style={{
            display: "inline-block",
            marginBottom: "20px",
            color: "#0b6b3a",
            fontWeight: 800,
            textDecoration: "none",
            fontSize: "18px",
          }}
        >
          ← 미래식량관으로
        </Link>

        <img
          src={pages[page]}
          alt={`생산형 치유농업 ${page + 1}`}
          style={{
            width: "100%",
            borderRadius: "20px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            display: "block",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
            gap: "12px",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              flex: 1,
              height: "56px",
              borderRadius: "12px",
              border: "none",
              fontSize: "18px",
              fontWeight: 800,
              background: page === 0 ? "#d9d9d9" : "#ffffff",
              color: "#111",
              cursor: page === 0 ? "default" : "pointer",
            }}
          >
            ◀ 이전
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "120px",
              fontWeight: 900,
              fontSize: "18px",
            }}
          >
            페이지 {page + 1} / {pages.length}
          </div>

          <button
            onClick={() =>
              page === pages.length - 1
                ? setPage(0)
                : setPage((p) => Math.min(pages.length - 1, p + 1))
            }
            style={{
              flex: 1,
              height: "56px",
              borderRadius: "12px",
              border: "none",
              fontSize: "18px",
              fontWeight: 800,
              background: "#0b6b3a",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {page === pages.length - 1 ? "🏠 처음으로" : "다음 ▶"}
          </button>
        </div>
      </div>
    </main>
  );
}