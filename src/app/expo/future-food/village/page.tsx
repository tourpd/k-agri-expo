"use client";

import { useState } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const pages = [
  "/images/village-page-1.png", // 정착마을 + 필요성
  "/images/village-page-2.png", // 왜 구미 옥성인가
  "/images/village-page-3.png", // 청년정착 + 생산단지
  "/images/village-page-4.png", // 공동체 + 최종비전
];

export default function VillagePage() {
  const [page, setPage] = useState(0);

  const isFirst = page === 0;
  const isLast = page === pages.length - 1;

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
          }}
        >
          ← 미래식량관으로
        </Link>

        <img
          src={pages[page]}
          alt={`미래농업 정착마을 ${page + 1}`}
          style={{
            width: "100%",
            borderRadius: "20px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            display: "block",
          }}
        />

        {/* 2페이지에서만 영상 보기 버튼 표시 */}
        {page === 1 && (
          <a
            href="https://youtu.be/lfqadZjXQno"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "16px",
              height: "60px",
              borderRadius: "14px",
              background: "#e62117",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 900,
              fontSize: "20px",
            }}
          >
            ▶ 구미 옥성 유리온실 영상 보기
          </a>
        )}

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          <button
            disabled={isFirst}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            style={{
              flex: 1,
              height: "60px",
              borderRadius: "12px",
              border: "none",
              fontSize: "18px",
              fontWeight: 800,
              opacity: isFirst ? 0.4 : 1,
              cursor: isFirst ? "default" : "pointer",
            }}
          >
            ◀ 이전
          </button>

          <div
            style={{
              width: "120px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "20px",
            }}
          >
            {page + 1} / {pages.length}
          </div>

          {!isLast ? (
            <button
              onClick={() => setPage((p) => p + 1)}
              style={{
                flex: 1,
                height: "60px",
                borderRadius: "12px",
                border: "none",
                background: "#0b6b3a",
                color: "#fff",
                fontSize: "18px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              다음 ▶
            </button>
          ) : (
            <Link
              href="/expo/future-food"
              style={{
                flex: 1,
                height: "60px",
                borderRadius: "12px",
                background: "#0b6b3a",
                color: "#fff",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 900,
              }}
            >
              미래식량관으로
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}