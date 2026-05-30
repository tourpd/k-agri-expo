"use client";

import { useMemo, useState } from "react";

type Cause = {
  name: string;
  probability: number;
  reason?: string;
};

type RecommendItem = {
  product_name: string;
  recommend_label?: string | null;
  recommend_reason?: string | null;
  button_text?: string | null;
  button_link?: string | null;
};

type DiagnosisResult = {
  diagnosis?: string;
  final_judgement?: string;
  confidence?: number;
  crop?: string;
  diagnosis_id?: string;
  possible_causes?: Cause[];
  symptoms?: string[];
  do_now?: string[];
  do_not?: string[];
  must_check?: string[];
  recommended_items?: RecommendItem[];
};

export default function PhotoDoctorClient() {
  const [image, setImage] = useState<File | null>(null);
  const [crop, setCrop] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const preview = useMemo(() => {
    if (!image) return "";
    return URL.createObjectURL(image);
  }, [image]);

  async function submit() {
    if (!image) {
      alert("사진을 올려주세요.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("image", image);
      formData.append("crop", crop);

      const res = await fetch("/api/vision", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json?.ok) {
        alert(json?.error || "진단 실패");
        return;
      }

      setResult(json);
    } catch (e) {
      console.error(e);
      alert("포토닥터 진단 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.wrap}>
      <div style={S.uploadCard}>
        <div style={S.field}>
          <div style={S.label}>작물명</div>

          <input
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            placeholder="예: 고추, 토마토, 마늘"
            style={S.input}
          />
        </div>

        <div style={S.field}>
          <div style={S.label}>작물 사진 업로드</div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setImage(e.target.files?.[0] || null)
            }
            style={S.file}
          />
        </div>

        {preview ? (
          <div style={S.previewWrap}>
            <img
              src={preview}
              alt="preview"
              style={S.preview}
            />
          </div>
        ) : null}

        <button
          onClick={submit}
          disabled={loading}
          style={S.submitBtn}
        >
          {loading
            ? "AI가 작물 상태를 분석중입니다..."
            : "포토닥터 진단 시작"}
        </button>
      </div>

      {result ? (
        <div style={S.resultCard}>
          <div style={S.resultHeader}>
            <div style={S.resultBadge}>
              진단 결과
            </div>

            <div style={S.resultTitle}>
              {result.final_judgement ||
                result.diagnosis}
            </div>

            <div style={S.resultSub}>
              진단 신뢰도{" "}
              {result.confidence || 0}%
            </div>
          </div>

          {result.possible_causes?.length ? (
            <div style={S.section}>
              <div style={S.sectionTitle}>
                가능성이 높은 원인
              </div>

              <div style={S.causeList}>
                {result.possible_causes.map(
                  (item, idx) => (
                    <div
                      key={`${item.name}-${idx}`}
                      style={S.causeItem}
                    >
                      <div style={S.causeTop}>
                        <div style={S.causeName}>
                          {idx + 1}. {item.name}
                        </div>

                        <div style={S.percent}>
                          {item.probability}%
                        </div>
                      </div>

                      <div style={S.reason}>
                        {item.reason}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : null}

          {result.do_now?.length ? (
            <div style={S.section}>
              <div style={S.sectionTitle}>
                지금 바로 할 일
              </div>

              <div style={S.tipList}>
                {result.do_now.map((item, idx) => (
                  <div
                    key={`${item}-${idx}`}
                    style={S.tipItem}
                  >
                    ✅ {item}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {result.recommended_items?.length ? (
            <div style={S.recommendWrap}>
              <div style={S.recommendTitle}>
                🌱 추천 대응 자재
              </div>

              <div style={S.recommendDesc}>
                진단 결과 기반으로 연결되는
                대응 자재입니다.
              </div>

              <div style={S.recommendList}>
                {result.recommended_items.map(
                  (item, idx) => (
                    <a
                      key={`${item.product_name}-${idx}`}
                      href={item.button_link || "#"}
                      style={S.recommendBtn}
                    >
                      <div>
                        <div style={S.recommendName}>
                          {item.product_name}
                        </div>

                        {item.recommend_reason ? (
                          <div
                            style={
                              S.recommendReason
                            }
                          >
                            {
                              item.recommend_reason
                            }
                          </div>
                        ) : null}
                      </div>

                      <div style={S.arrow}>
                        →
                      </div>
                    </a>
                  )
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 20,
  },

  uploadCard: {
    background: "#ffffff",
    borderRadius: 28,
    padding: 24,
    border: "1px solid #e5e7eb",
  },

  field: {
    marginTop: 14,
  },

  label: {
    marginBottom: 10,
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
  },

  input: {
    width: "100%",
    height: 58,
    borderRadius: 16,
    border: "1px solid #d1d5db",
    padding: "0 16px",
    fontSize: 16,
    fontWeight: 700,
    boxSizing: "border-box",
  },

  file: {
    width: "100%",
    fontSize: 15,
  },

  previewWrap: {
    marginTop: 20,
  },

  preview: {
    width: "100%",
    maxHeight: 480,
    objectFit: "cover",
    borderRadius: 24,
    border: "1px solid #e5e7eb",
  },

  submitBtn: {
    width: "100%",
    height: 72,
    borderRadius: 20,
    border: "none",
    marginTop: 24,
    background: "#16a34a",
    color: "#ffffff",
    fontSize: 22,
    fontWeight: 950,
    cursor: "pointer",
  },

  resultCard: {
    background: "#ffffff",
    borderRadius: 28,
    padding: 24,
    border: "1px solid #e5e7eb",
  },

  resultHeader: {},

  resultBadge: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 900,
    fontSize: 13,
  },

  resultTitle: {
    marginTop: 16,
    fontSize: 32,
    lineHeight: 1.45,
    fontWeight: 950,
    color: "#111827",
  },

  resultSub: {
    marginTop: 10,
    color: "#64748b",
    fontWeight: 800,
  },

  section: {
    marginTop: 30,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 950,
    color: "#111827",
  },

  causeList: {
    marginTop: 16,
    display: "grid",
    gap: 12,
  },

  causeItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
  },

  causeTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },

  causeName: {
    fontWeight: 950,
    fontSize: 18,
  },

  percent: {
    fontWeight: 950,
    color: "#16a34a",
  },

  reason: {
    marginTop: 8,
    lineHeight: 1.7,
    color: "#4b5563",
    fontWeight: 600,
  },

  tipList: {
    marginTop: 14,
    display: "grid",
    gap: 10,
  },

  tipItem: {
    borderRadius: 14,
    background: "#f8fafc",
    padding: 14,
    fontWeight: 700,
    lineHeight: 1.6,
  },

  recommendWrap: {
    marginTop: 34,
    padding: 22,
    borderRadius: 22,
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
  },

  recommendTitle: {
    fontSize: 24,
    fontWeight: 950,
    color: "#166534",
  },

  recommendDesc: {
    marginTop: 10,
    lineHeight: 1.7,
    color: "#374151",
    fontWeight: 700,
  },

  recommendList: {
    marginTop: 18,
    display: "grid",
    gap: 12,
  },

  recommendBtn: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderRadius: 18,
    background: "#ffffff",
    border: "2px solid #15803d",
    textDecoration: "none",
    color: "#111827",
  },

  recommendName: {
    fontSize: 20,
    fontWeight: 950,
    color: "#166534",
  },

  recommendReason: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#4b5563",
    fontWeight: 700,
  },

  arrow: {
    fontSize: 28,
    fontWeight: 950,
    color: "#166534",
  },
};