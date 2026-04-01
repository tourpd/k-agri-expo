"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

type QuestionItem = {
  question?: string | null;
  label?: string | null;
};

type ConsultResult =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "photodoctor"; message: string; question: string }
  | { kind: "consult"; message: string; question: string }
  | { kind: "error"; message: string };

function safeText(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

export default function ExpoFarmerConsultSection({
  questions = [],
}: {
  questions?: QuestionItem[];
}) {
  const presetQuestions = useMemo(() => {
    const base = (questions ?? [])
      .map((q) => safeText(q?.question || q?.label))
      .filter(Boolean);

    if (base.length > 0) return base.slice(0, 3);

    return [
      "500평에 총채벌레 약 얼마나 타야 하나요?",
      "고추 육묘 뿌리 잘 내리게 하는 제품은?",
      "유기농 마늘 녹병 자재 뭐 있나요?",
    ];
  }, [questions]);

  const [input, setInput] = useState("");
  const [result, setResult] = useState<ConsultResult>({ kind: "idle" });

  async function handleSubmit() {
    const question = input.trim();

    if (!question) {
      setResult({
        kind: "error",
        message: "질문을 먼저 입력해 주세요.",
      });
      return;
    }

    try {
      setResult({ kind: "loading" });

      const res = await fetch("/api/expo/consult", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question_text: question,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setResult({
          kind: "error",
          message: data?.error || "상담 분류 중 오류가 발생했습니다.",
        });
        return;
      }

      if (data.route === "photodoctor") {
        setResult({
          kind: "photodoctor",
          message:
            data.message ||
            "사진 진단이 필요한 문제로 보여 포토닥터 연결이 필요합니다.",
          question,
        });
        return;
      }

      setResult({
        kind: "consult",
        message:
          data.message ||
          "일반 상담으로 분류되어 추천 부스와 특가를 우선 안내합니다.",
        question,
      });
    } catch {
      setResult({
        kind: "error",
        message: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      });
    }
  }

  function applyPreset(question: string) {
    setInput(question);
    setResult({ kind: "idle" });
  }

  return (
    <section style={S.section} className="expo-section" id="consult">
      <div style={S.card} className="expo-ai-card">
        <div style={S.kicker}>FARMER CONSULT FLOW</div>
        <h2 style={S.title}>📞 농사 AI 상담</h2>
        <div style={S.desc}>
          먼저 텍스트로 문제를 듣고, 병해·충해처럼 사진 진단이 필요한 경우에만
          포토닥터로 연결합니다. 일반 자재/영양/시기 상담은 바로 특가와
          카테고리로 이어집니다.
        </div>

        <div style={S.label}>많이 묻는 질문</div>

        <div style={S.presetList}>
          {presetQuestions.map((question, idx) => (
            <button
              key={`${question}-${idx}`}
              type="button"
              onClick={() => applyPreset(question)}
              style={S.presetBtn}
            >
              {question}
            </button>
          ))}
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="예: 고추 잎이 말리고 총채벌레가 보이는데 지금 약을 쳐도 되는지 궁금합니다."
          style={S.textarea}
        />

        <div style={S.actionRow}>
          <button type="button" onClick={handleSubmit} style={S.primaryBtn}>
            {result.kind === "loading" ? "분석 중..." : "상담 시작"}
          </button>
        </div>

        {result.kind !== "idle" ? (
          <div style={S.resultPanel}>
            {result.kind === "loading" && (
              <>
                <div style={S.resultTitle}>질문을 분석하고 있습니다</div>
                <div style={S.resultDesc}>
                  병해충/작물 상태 문제인지, 일반 자재/구매 상담인지 분류 중입니다.
                </div>
              </>
            )}

            {result.kind === "error" && (
              <>
                <div style={S.resultErrorTitle}>상담을 진행할 수 없습니다</div>
                <div style={S.resultDesc}>{result.message}</div>
              </>
            )}

            {result.kind === "photodoctor" && (
              <>
                <div style={S.routeBadgeDanger}>포토닥터 연결 필요</div>
                <div style={S.resultTitle}>사진 진단이 필요한 문제로 보입니다</div>
                <div style={S.resultDesc}>{result.message}</div>

                <div style={S.questionBox}>
                  <div style={S.questionLabel}>입력 질문</div>
                  <div style={S.questionText}>{result.question}</div>
                </div>

                <div style={S.resultActions}>
                  <a
                    href={`https://plant-doctor-app.vercel.app/?source=expo&question=${encodeURIComponent(
                      result.question
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={S.primaryLink}
                  >
                    포토닥터로 이동 →
                  </a>

                  <Link href="/expo/category/eco-input" style={S.secondaryLink}>
                    친환경자재관 보기 →
                  </Link>
                </div>
              </>
            )}

            {result.kind === "consult" && (
              <>
                <div style={S.routeBadgeSafe}>일반 상담 추천</div>
                <div style={S.resultTitle}>일반 자재/구매 상담으로 분류되었습니다</div>
                <div style={S.resultDesc}>{result.message}</div>

                <div style={S.questionBox}>
                  <div style={S.questionLabel}>입력 질문</div>
                  <div style={S.questionText}>{result.question}</div>
                </div>

                <div style={S.recommendGrid}>
                  <Link href="/expo/deals" style={S.recommendCard}>
                    <div style={S.recommendTitle}>🔥 오늘의 특가</div>
                    <div style={S.recommendDesc}>
                      지금 바로 구매 전환이 가능한 특가 품목으로 이동합니다.
                    </div>
                    <div style={S.recommendCta}>특가 보러가기 →</div>
                  </Link>

                  <Link href="/expo/category/fertilizer" style={S.recommendCard}>
                    <div style={S.recommendTitle}>🌱 비료관</div>
                    <div style={S.recommendDesc}>
                      뿌리, 활력, 생육, 비대 관련 상담은 비료관에서 바로 이어집니다.
                    </div>
                    <div style={S.recommendCta}>카테고리 보기 →</div>
                  </Link>

                  <Link href="/expo/category/eco-input" style={S.recommendCard}>
                    <div style={S.recommendTitle}>🍀 친환경자재관</div>
                    <div style={S.recommendDesc}>
                      병해충 예방, 유기농 자재, 친환경 솔루션을 우선 확인할 수 있습니다.
                    </div>
                    <div style={S.recommendCta}>자재관 보기 →</div>
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  section: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "28px 24px 0",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 30,
    padding: 28,
    boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  title: {
    margin: "8px 0 0",
    fontSize: 34,
    lineHeight: 1.1,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 1.8,
    color: "#64748b",
  },
  label: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: 950,
    color: "#111827",
  },
  presetList: {
    marginTop: 12,
    display: "grid",
    gap: 10,
  },
  presetBtn: {
    textAlign: "left",
    padding: "16px 16px",
    borderRadius: 16,
    border: "1px solid #dbe2ea",
    background: "#f8fafc",
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
    cursor: "pointer",
  },
  textarea: {
    marginTop: 18,
    width: "100%",
    minHeight: 140,
    borderRadius: 18,
    border: "1px solid #dbe2ea",
    background: "#fff",
    padding: 16,
    boxSizing: "border-box",
    resize: "vertical",
    fontSize: 15,
    lineHeight: 1.7,
    color: "#111827",
  },
  actionRow: {
    marginTop: 18,
  },
  primaryBtn: {
    border: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 14,
    padding: "14px 20px",
    fontWeight: 950,
    fontSize: 15,
    cursor: "pointer",
  },
  resultPanel: {
    marginTop: 20,
    borderRadius: 22,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    padding: 20,
  },
  resultTitle: {
    fontSize: 24,
    lineHeight: 1.2,
    fontWeight: 950,
    color: "#111827",
  },
  resultErrorTitle: {
    fontSize: 24,
    lineHeight: 1.2,
    fontWeight: 950,
    color: "#b91c1c",
  },
  resultDesc: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 1.8,
    color: "#475569",
  },
  routeBadgeDanger: {
    display: "inline-block",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 950,
  },
  routeBadgeSafe: {
    display: "inline-block",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 950,
  },
  questionBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: 950,
    color: "#64748b",
  },
  questionText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 1.8,
    color: "#111827",
    whiteSpace: "pre-wrap",
  },
  resultActions: {
    marginTop: 18,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryLink: {
    textDecoration: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 14,
    padding: "14px 18px",
    fontWeight: 950,
    fontSize: 15,
    display: "inline-block",
  },
  secondaryLink: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: 14,
    padding: "14px 18px",
    fontWeight: 950,
    fontSize: 15,
    display: "inline-block",
  },
  recommendGrid: {
    marginTop: 18,
    display: "grid",
    gap: 12,
  },
  recommendCard: {
    textDecoration: "none",
    color: "#111827",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    display: "block",
  },
  recommendTitle: {
    fontSize: 17,
    fontWeight: 950,
    color: "#0f172a",
  },
  recommendDesc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#64748b",
  },
  recommendCta: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: 950,
    color: "#0f172a",
  },
};