"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import type {
  ExpoProblemContent,
} from "@/types/expo-home";
import { safeText } from "@/lib/expo/home-utils";

type ProblemCardItem = {
  id: string;
  title: string;
  desc: string;
  link_url: string;
};

export default function ExpoProblemSection({
  contents,
}: {
  contents: ExpoProblemContent[];
}) {
  const fallbackProblemCards: ProblemCardItem[] = [
    {
      id: "p1",
      title: "지금 시기에 꼭 알아야 할 농사 핵심",
      desc: "지금 놓치면 수확에 영향을 주는 중요한 포인트입니다.",
      link_url: "/problems",
    },
    {
      id: "p2",
      title: "수확량이 안 나올 때 가장 먼저 확인할 것",
      desc: "농민이 가장 많이 놓치는 핵심 포인트를 정리했습니다.",
      link_url: "/problems",
    },
  ];

  const displayProblemCards: ProblemCardItem[] =
    contents.length > 0
      ? contents.slice(0, 4).map((item, idx) => ({
          id: item.id,
          title: safeText(item.title, "농민 고민 콘텐츠"),
          desc:
            idx === 0
              ? "지금 시기에 꼭 확인해야 할 핵심 내용입니다."
              : idx === 1
              ? "현장에서 바로 적용할 수 있는 실전 정보입니다."
              : idx === 2
              ? "문제 발생 전에 미리 대비하는 방법입니다."
              : "농사를 망치지 않기 위한 중요한 포인트입니다.",
          link_url: item.link_url,
        }))
      : fallbackProblemCards;

  return (
    <section id="problem" style={S.sectionWrap} className="expo-section">
      
      {/* 🔥 포토닥터 배너 */}
      <div style={S.photoBanner}>
        <div style={S.photoLeft}>
          <div style={S.photoBadge}>PHOTO DOCTOR</div>

          <div style={S.photoMainRow}>
            <div style={S.iconWrap}>
              <Image
                src="/photodoctor_app_icon_1024.png"
                alt="포토닥터 앱"
                width={120}
                height={120}
                style={S.icon}
              />
            </div>

            <div style={S.copyWrap}>
              <h2 style={S.photoTitle}>
                사진 한 장으로 작물 상태 진단
              </h2>

              <div style={S.photoDesc}>
                작물이 이상할 때<br />
                원인을 모를 때<br />
                지금 바로 확인하세요
              </div>
            </div>
          </div>
        </div>

        <div style={S.photoRight}>
          <Link
            href="/ai-consult"
            style={S.photoPrimaryBtn}
          >
            포토닥터 시작 →
          </Link>
        </div>
      </div>

      {/* 🧠 농민 고민 */}
      <div style={S.problemBlock}>
        <div style={S.problemCard} className="expo-problem-card">
          <div style={S.sectionEyebrow}>FARMER PROBLEM</div>

          <h2 style={S.sectionTitle}>
            농민들이 가장 많이 하는 고민
          </h2>

          <div style={S.sectionDesc}>
            먼저 읽고, 필요하면 상담까지 이어지는 구조입니다.
          </div>

          <div style={S.problemList}>
            {displayProblemCards.map((item) => (
              <Link key={item.id} href={item.link_url} style={S.problemItemRich}>
                <div style={S.problemItemLeft}>
                  <div style={S.problemItemTitle}>{item.title}</div>
                  <div style={S.problemItemDesc}>{item.desc}</div>
                </div>

                <div style={S.problemArrow}>읽어보기 →</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= 스타일 ================= */

const S: Record<string, React.CSSProperties> = {
  sectionWrap: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "28px 24px 0",
  },

  photoBanner: {
    borderRadius: 30,
    padding: 28,
    background: "linear-gradient(135deg, #0f172a 0%, #14532d 100%)",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
  },

  photoLeft: {},

  photoRight: {
    display: "flex",
    alignItems: "center",
  },

  photoBadge: {
    fontSize: 12,
    fontWeight: 900,
    color: "#86efac",
  },

  photoMainRow: {
    marginTop: 12,
    display: "flex",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
  },

  iconWrap: {},

  icon: {
    borderRadius: 20,
  },

  copyWrap: {
    minWidth: 240,
  },

  photoTitle: {
    fontSize: 28,
    fontWeight: 950,
    lineHeight: 1.4,
  },

  photoDesc: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 1.8,
    color: "rgba(255,255,255,0.9)",
  },

  photoPrimaryBtn: {
    background: "#fff",
    color: "#0f172a",
    padding: "14px 20px",
    borderRadius: 14,
    textDecoration: "none",
    fontWeight: 900,
  },

  problemBlock: {
    marginTop: 20,
  },

  sectionEyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#16a34a",
  },

  sectionTitle: {
    marginTop: 8,
    fontSize: 26,
    fontWeight: 950,
  },

  sectionDesc: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
  },

  problemCard: {
    borderRadius: 26,
    padding: 26,
    background: "#fff",
    border: "1px solid #e5e7eb",
  },

  problemList: {
    marginTop: 18,
    display: "grid",
    gap: 12,
  },

  problemItemRich: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    background: "#f8fafc",
    textDecoration: "none",
    color: "#0f172a",
  },

  problemItemLeft: {
    flex: 1,
  },

  problemItemTitle: {
    fontWeight: 900,
    fontSize: 15,
  },

  problemItemDesc: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
  },

  problemArrow: {
    fontWeight: 900,
    fontSize: 13,
  },
};