"use client";

import React, { useMemo, useState } from "react";

type Props = {
  productName?: string;

  baseAreaPyeong?: number | null;
  baseWaterLiter?: number | null;
  baseProductAmount?: number | null;
  baseProductUnit?: string | null;

  dilutionRatioText?: string | null;

  recommendedBottleAmount?: number | null;
  recommendedBottleUnit?: string | null;

  recommendedBottleSize?: number | null;
};

function safeNumber(v: unknown) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function safeText(v: unknown, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function formatNumber(v: number) {
  if (!Number.isFinite(v)) return "-";
  if (Math.abs(v) >= 100) {
    return v.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
  }
  if (Math.abs(v) >= 10) {
    return v.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
  }
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function ceilToOneDecimal(v: number) {
  return Math.ceil(v * 10) / 10;
}

export default function ProductDoseCalculator({
  productName = "이 제품",
  baseAreaPyeong,
  baseWaterLiter,
  baseProductAmount,
  baseProductUnit,
  dilutionRatioText,
  recommendedBottleAmount,
  recommendedBottleUnit,
  recommendedBottleSize,
}: Props) {
  const [myArea, setMyArea] = useState("");
  const [calculated, setCalculated] = useState(false);
  const [error, setError] = useState("");

  const area = safeNumber(baseAreaPyeong);
  const water = safeNumber(baseWaterLiter);
  const amount = safeNumber(baseProductAmount);
  const amountUnit = safeText(baseProductUnit, "ml");

  const bottleSize =
    safeNumber(recommendedBottleAmount) ??
    safeNumber(recommendedBottleSize) ??
    null;

  const bottleUnit = safeText(recommendedBottleUnit, amountUnit);

  const canCalculate =
    area !== null &&
    area > 0 &&
    water !== null &&
    water > 0 &&
    amount !== null &&
    amount > 0;

  const parsedArea = useMemo(() => {
    const n = Number(String(myArea).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [myArea]);

  const result = useMemo(() => {
    if (
      !canCalculate ||
      parsedArea === null ||
      area === null ||
      water === null ||
      amount === null
    ) {
      return null;
    }

    const ratio = parsedArea / area;
    const needWater = water * ratio;
    const needAmount = amount * ratio;

    let bottleCount: number | null = null;

    if (bottleSize !== null && bottleSize > 0) {
      bottleCount = needAmount / bottleSize;
    }

    return {
      ratio,
      needWater,
      needAmount,
      bottleCount,
    };
  }, [canCalculate, parsedArea, area, water, amount, bottleSize]);

  function handleAreaChange(value: string) {
    setMyArea(value.replace(/[^\d.]/g, ""));
    setCalculated(false);
    setError("");
  }

  function handleCalculate() {
    setError("");

    if (parsedArea === null) {
      setCalculated(false);
      setError("내 밭 면적을 숫자로 입력해 주세요. 예: 1200");
      return;
    }

    setCalculated(true);
  }

  if (!canCalculate) {
    return (
      <section style={S.wrap}>
        <div style={S.kicker}>사용량 상담 안내</div>
        <h3 style={S.title}>내 밭에 맞는 사용량은 상담으로 안내드립니다</h3>

        <p style={S.desc}>
          {productName}은 작물, 생육 상태, 재배 면적, 병해충 상황에 따라
          사용 기준이 달라질 수 있습니다.
        </p>

        <div style={S.consultBox}>
          정확한 사용량이 궁금하시면 위의 <b>신청하기</b>를 눌러 주세요.
          담당자가 농장 상황을 확인한 뒤 안내드립니다.
        </div>
      </section>
    );
  }

  return (
    <section style={S.wrap}>
      <div style={S.kicker}>내 밭에 얼마나 필요할까?</div>

      <h3 style={S.title}>내 밭 기준 계산기</h3>

      <p style={S.desc}>
        {safeText(dilutionRatioText)
          ? `${productName} 사용 기준: ${dilutionRatioText}`
          : `${productName}의 사용량을 내 밭 면적 기준으로 계산합니다.`}
      </p>

      <div style={S.inputCard}>
        <label style={S.label}>내 밭 면적 입력</label>

        <div style={S.inputRow}>
          <input
            style={S.input}
            value={myArea}
            onChange={(e) => handleAreaChange(e.target.value)}
            placeholder="예: 1200"
            inputMode="decimal"
          />
          <span style={S.unit}>평</span>
        </div>

        <button type="button" style={S.calcBtn} onClick={handleCalculate}>
          계산하기
        </button>
      </div>

      {error ? <div style={S.warningBox}>{error}</div> : null}

      {!error && !calculated ? (
        <div style={S.infoBox}>
          내 밭 면적을 입력하고 <b>계산하기</b>를 누르면 필요한 물량과 제품량이 나옵니다.
        </div>
      ) : null}

      {calculated && result ? (
        <div style={S.resultWrap}>
          <div style={S.resultMain}>
            <div style={S.resultLabel}>내 밭에 필요한 제품량</div>
            <div style={S.resultValueStrong}>
              {formatNumber(result.needAmount)}
              {amountUnit}
            </div>
          </div>

          <div style={S.resultGrid}>
            <div style={S.resultCard}>
              <div style={S.resultLabel}>필요한 물량</div>
              <div style={S.resultValue}>{formatNumber(result.needWater)}L</div>
            </div>

            <div style={S.resultCard}>
              <div style={S.resultLabel}>기준 대비</div>
              <div style={S.resultValue}>{formatNumber(result.ratio)}배</div>
            </div>

            {result.bottleCount !== null ? (
              <div style={S.resultCardFull}>
                <div style={S.resultLabel}>
                  예상 필요 수량
                  {bottleSize
                    ? ` (${formatNumber(bottleSize)}${bottleUnit} 기준)`
                    : ""}
                </div>
                <div style={S.resultValue}>
                  약 {formatNumber(ceilToOneDecimal(result.bottleCount))}병
                </div>
              </div>
            ) : null}
          </div>

          <div style={S.noteBox}>
            실제 사용량은 작물 상태, 생육 단계, 날씨, 살포 장비에 따라 달라질 수 있습니다.
            처음 사용할 때는 담당자 상담 후 사용하는 것이 안전합니다.
          </div>
        </div>
      ) : null}
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    border: "1px solid #bfdbfe",
    background: "#f8fbff",
    borderRadius: 22,
    padding: 20,
    marginTop: 16,
  },
  kicker: {
    display: "inline-flex",
    padding: "6px 12px",
    borderRadius: 999,
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: 15,
    fontWeight: 950,
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 950,
    color: "#111827",
    lineHeight: 1.25,
    wordBreak: "keep-all",
  },
  desc: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 1.8,
    color: "#475569",
    wordBreak: "keep-all",
    whiteSpace: "pre-wrap",
  },
  consultBox: {
    marginTop: 16,
    borderRadius: 18,
    padding: 18,
    background: "#ecfdf5",
    border: "1px solid #86efac",
    color: "#166534",
    fontSize: 18,
    fontWeight: 900,
    lineHeight: 1.8,
    wordBreak: "keep-all",
  },
  inputCard: {
    marginTop: 18,
    borderRadius: 18,
    padding: 16,
    background: "#fff",
    border: "1px solid #dbeafe",
    marginBottom: 14,
  },
  label: {
    display: "block",
    marginBottom: 10,
    fontSize: 18,
    fontWeight: 950,
    color: "#111827",
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  input: {
    width: "100%",
    height: 60,
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: "0 16px",
    fontSize: 21,
    fontWeight: 900,
    outline: "none",
    boxSizing: "border-box",
  },
  unit: {
    flexShrink: 0,
    fontSize: 21,
    fontWeight: 950,
    color: "#111827",
  },
  calcBtn: {
    width: "100%",
    height: 60,
    border: "none",
    borderRadius: 16,
    background: "#2563eb",
    color: "#fff",
    fontSize: 22,
    fontWeight: 950,
    cursor: "pointer",
  },
  infoBox: {
    borderRadius: 16,
    padding: 16,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontSize: 17,
    fontWeight: 800,
    lineHeight: 1.8,
    wordBreak: "keep-all",
  },
  warningBox: {
    borderRadius: 16,
    padding: 16,
    background: "#fff7ed",
    border: "1px solid #fdba74",
    color: "#c2410c",
    fontSize: 17,
    fontWeight: 900,
    lineHeight: 1.8,
    wordBreak: "keep-all",
  },
  resultWrap: {
    display: "grid",
    gap: 12,
  },
  resultMain: {
    borderRadius: 18,
    padding: 18,
    background: "#ecfdf5",
    border: "2px solid #86efac",
    textAlign: "center",
  },
  resultLabel: {
    fontSize: 15,
    fontWeight: 900,
    color: "#64748b",
    marginBottom: 8,
    lineHeight: 1.5,
  },
  resultValueStrong: {
    fontSize: 40,
    fontWeight: 950,
    color: "#15803d",
    lineHeight: 1.15,
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  resultCard: {
    borderRadius: 16,
    padding: 16,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  },
  resultCardFull: {
    gridColumn: "1 / -1",
    borderRadius: 16,
    padding: 16,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  },
  resultValue: {
    fontSize: 27,
    fontWeight: 950,
    color: "#111827",
    lineHeight: 1.3,
  },
  noteBox: {
    borderRadius: 16,
    padding: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#475569",
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.8,
    wordBreak: "keep-all",
  },
};