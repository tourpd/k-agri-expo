"use client";

import React from "react";

type Props = {
  mixable?: boolean | null;

  mixableWith?: string[] | null;
  nonMixableWith?: string[] | null;
  mixNotes?: string | null;

  phytotoxicityWarning?: string | null;
  precautions?: string | null;

  seedlingAllowed?: boolean | null;
  seedlingRatioText?: string | null;
  seedlingIntervalDays?: number | null;
  seedlingNotes?: string | null;

  soakingAllowed?: boolean | null;
  soakingRatioText?: string | null;
  soakingDurationMinutes?: number | null;
  soakingTarget?: string | null;
  soakingNotes?: string | null;
};

function safeText(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function safeArray(v: unknown) {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function safeNumber(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function joinList(values: string[]) {
  return values.length > 0 ? values.join(" / ") : "";
}

export default function ProductRiskGuide({
  mixable,
  mixableWith,
  nonMixableWith,
  mixNotes,
  phytotoxicityWarning,
  precautions,
  seedlingAllowed,
  seedlingRatioText,
  seedlingIntervalDays,
  seedlingNotes,
  soakingAllowed,
  soakingRatioText,
  soakingDurationMinutes,
  soakingTarget,
  soakingNotes,
}: Props) {
  const goodMixList = safeArray(mixableWith);
  const badMixList = safeArray(nonMixableWith);

  const hasAnyContent =
    typeof mixable === "boolean" ||
    goodMixList.length > 0 ||
    badMixList.length > 0 ||
    !!safeText(mixNotes) ||
    !!safeText(phytotoxicityWarning) ||
    !!safeText(precautions) ||
    typeof seedlingAllowed === "boolean" ||
    !!safeText(seedlingRatioText) ||
    safeNumber(seedlingIntervalDays) !== null ||
    !!safeText(seedlingNotes) ||
    typeof soakingAllowed === "boolean" ||
    !!safeText(soakingRatioText) ||
    safeNumber(soakingDurationMinutes) !== null ||
    !!safeText(soakingTarget) ||
    !!safeText(soakingNotes);

  if (!hasAnyContent) {
    return null;
  }

  return (
    <section style={S.wrap}>
      <div style={S.header}>
        <h3 style={S.title}>혼용 / 약해 / 특수 처리 가이드</h3>
        <div style={S.desc}>
          구매 전 꼭 확인해야 하는 주의 정보를 한 번에 보여드립니다.
        </div>
      </div>

      <div style={S.grid}>
        <div style={S.goodCard}>
          <div style={S.cardTitleGreen}>혼용 가능</div>

          <div style={S.statusLine}>
            {mixable === true
              ? "혼용 가능으로 입력됨"
              : mixable === false
              ? "혼용 가능으로 체크되지 않음"
              : "혼용 가능 여부 미입력"}
          </div>

          {goodMixList.length > 0 ? (
            <div style={S.block}>
              <div style={S.blockLabel}>함께 사용 가능 계열</div>
              <div style={S.blockText}>{joinList(goodMixList)}</div>
            </div>
          ) : null}

          {safeText(mixNotes) ? (
            <div style={S.block}>
              <div style={S.blockLabel}>혼용 참고</div>
              <div style={S.blockText}>{safeText(mixNotes)}</div>
            </div>
          ) : null}
        </div>

        <div style={S.dangerCard}>
          <div style={S.cardTitleRed}>혼용 금지 / 주의</div>

          {badMixList.length > 0 ? (
            <div style={S.block}>
              <div style={S.blockLabel}>특히 피해야 할 계열</div>
              <div style={S.blockTextStrong}>{joinList(badMixList)}</div>
            </div>
          ) : (
            <div style={S.statusLine}>
              혼용 금지 계열 입력 없음
            </div>
          )}

          {safeText(phytotoxicityWarning) ? (
            <div style={S.block}>
              <div style={S.blockLabel}>약해 주의</div>
              <div style={S.blockTextStrong}>
                {safeText(phytotoxicityWarning)}
              </div>
            </div>
          ) : null}

          {safeText(precautions) ? (
            <div style={S.block}>
              <div style={S.blockLabel}>추가 주의사항</div>
              <div style={S.blockText}>{safeText(precautions)}</div>
            </div>
          ) : null}
        </div>

        <div style={S.neutralCard}>
          <div style={S.cardTitleBlue}>어린 모종 사용</div>

          <div style={S.statusLine}>
            {seedlingAllowed === true
              ? "어린 모종 사용 가능"
              : seedlingAllowed === false
              ? "어린 모종 전용 사용 아님"
              : "어린 모종 사용 여부 미입력"}
          </div>

          {safeText(seedlingRatioText) ? (
            <div style={S.block}>
              <div style={S.blockLabel}>어린 모종 희석 기준</div>
              <div style={S.blockText}>{safeText(seedlingRatioText)}</div>
            </div>
          ) : null}

          {safeNumber(seedlingIntervalDays) !== null ? (
            <div style={S.block}>
              <div style={S.blockLabel}>어린 모종 사용 간격</div>
              <div style={S.blockText}>
                {seedlingIntervalDays}일 간격
              </div>
            </div>
          ) : null}

          {safeText(seedlingNotes) ? (
            <div style={S.block}>
              <div style={S.blockLabel}>모종 주의사항</div>
              <div style={S.blockText}>{safeText(seedlingNotes)}</div>
            </div>
          ) : null}
        </div>

        <div style={S.neutralCard}>
          <div style={S.cardTitleBlue}>침지 처리</div>

          <div style={S.statusLine}>
            {soakingAllowed === true
              ? "침지 처리 가능"
              : soakingAllowed === false
              ? "침지 처리용 아님"
              : "침지 처리 여부 미입력"}
          </div>

          {safeText(soakingTarget) ? (
            <div style={S.block}>
              <div style={S.blockLabel}>침지 대상</div>
              <div style={S.blockText}>{safeText(soakingTarget)}</div>
            </div>
          ) : null}

          {safeText(soakingRatioText) ? (
            <div style={S.block}>
              <div style={S.blockLabel}>침지 희석 기준</div>
              <div style={S.blockText}>{safeText(soakingRatioText)}</div>
            </div>
          ) : null}

          {safeNumber(soakingDurationMinutes) !== null ? (
            <div style={S.block}>
              <div style={S.blockLabel}>침지 시간</div>
              <div style={S.blockText}>
                약 {soakingDurationMinutes}분
              </div>
            </div>
          ) : null}

          {safeText(soakingNotes) ? (
            <div style={S.block}>
              <div style={S.blockLabel}>침지 참고</div>
              <div style={S.blockText}>{safeText(soakingNotes)}</div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    marginTop: 18,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    padding: 18,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
    color: "#111827",
  },
  desc: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#64748b",
    wordBreak: "keep-all",
    whiteSpace: "pre-wrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  goodCard: {
    borderRadius: 16,
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    padding: 14,
  },
  dangerCard: {
    borderRadius: 16,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    padding: 14,
  },
  neutralCard: {
    borderRadius: 16,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    padding: 14,
  },
  cardTitleGreen: {
    fontSize: 16,
    fontWeight: 900,
    color: "#166534",
    marginBottom: 8,
  },
  cardTitleRed: {
    fontSize: 16,
    fontWeight: 900,
    color: "#b91c1c",
    marginBottom: 8,
  },
  cardTitleBlue: {
    fontSize: 16,
    fontWeight: 900,
    color: "#1d4ed8",
    marginBottom: 8,
  },
  statusLine: {
    fontSize: 14,
    fontWeight: 800,
    color: "#334155",
    lineHeight: 1.7,
  },
  block: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px dashed rgba(100,116,139,0.35)",
  },
  blockLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
    marginBottom: 6,
  },
  blockText: {
    fontSize: 14,
    lineHeight: 1.8,
    color: "#1f2937",
    fontWeight: 700,
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },
  blockTextStrong: {
    fontSize: 14,
    lineHeight: 1.8,
    color: "#991b1b",
    fontWeight: 900,
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },
};