"use client";

import React from "react";
import type {
  ApplicationMethod,
  ProductSpecShape,
} from "@/types/expo-product-spec";

type Props = {
  value: ProductSpecShape;
  onChange: (next: ProductSpecShape) => void;
};

const APPLICATION_METHOD_OPTIONS: Array<{
  value: ApplicationMethod;
  label: string;
}> = [
  { value: "foliar", label: "엽면시비" },
  { value: "drench", label: "관주" },
  { value: "soaking", label: "침지처리" },
  { value: "soil", label: "토양처리" },
  { value: "mixed", label: "혼합사용" },
];

function safeText(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function safeNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function safeBoolean(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function stringToNullableNumber(v: string): number | null {
  const cleaned = v.trim();
  if (!cleaned) return null;
  const n = Number(cleaned.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function safeStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function isApplicationMethod(value: string): value is ApplicationMethod {
  return (
    value === "foliar" ||
    value === "drench" ||
    value === "soaking" ||
    value === "soil" ||
    value === "mixed"
  );
}

function safeApplicationMethods(v: unknown): ApplicationMethod[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (item): item is ApplicationMethod =>
      typeof item === "string" && isApplicationMethod(item)
  );
}

export default function ProductSpecEditor({ value, onChange }: Props) {
  function patch(next: Partial<ProductSpecShape>) {
    onChange({
      ...value,
      ...next,
    });
  }

  function handleToggleMethod(method: ApplicationMethod, checked: boolean) {
    const currentMethods: ApplicationMethod[] = safeApplicationMethods(
      value.application_methods
    );

    const nextMethods: ApplicationMethod[] = checked
      ? Array.from(new Set<ApplicationMethod>([...currentMethods, method]))
      : currentMethods.filter((item) => item !== method);

    onChange({
      ...value,
      application_methods: nextMethods,
      foliar_allowed: nextMethods.includes("foliar"),
      drench_allowed: nextMethods.includes("drench"),
      soaking_allowed: nextMethods.includes("soaking"),
    });
  }

  return (
    <section style={S.wrap}>
      <div style={S.title}>제품 상세 사용기준</div>
      <div style={S.desc}>
        업체가 직접 입력한 정보가 AI 응답과 사용량 계산의 기준이 됩니다.
      </div>

      <div style={S.block}>
        <div style={S.blockTitle}>사용 방식</div>

        <div style={S.checkGrid}>
          {APPLICATION_METHOD_OPTIONS.map((option) => {
            const methods = safeApplicationMethods(value.application_methods);

            return (
              <label key={option.value} style={S.checkItem}>
                <input
                  type="checkbox"
                  checked={methods.includes(option.value)}
                  onChange={(e) =>
                    handleToggleMethod(option.value, e.target.checked)
                  }
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>

        <label style={S.labelWrap}>
          <div style={S.label}>사용 방식 상세</div>
          <input
            style={S.input}
            value={safeText(value.application_method_detail)}
            onChange={(e) =>
              patch({ application_method_detail: e.target.value })
            }
            placeholder="예: 엽면시비 위주, 필요시 관주 병행"
          />
        </label>
      </div>

      <div style={S.block}>
        <div style={S.blockTitle}>희석 / 기준량</div>

        <div style={S.grid3}>
          <label style={S.labelWrap}>
            <div style={S.label}>희석 문구</div>
            <input
              style={S.input}
              value={safeText(value.dilution_ratio_text)}
              onChange={(e) => patch({ dilution_ratio_text: e.target.value })}
              placeholder="예: 물 500L당 500ml"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>기준 물량(L)</div>
            <input
              style={S.input}
              inputMode="numeric"
              value={safeNumber(value.base_water_liter) ?? ""}
              onChange={(e) =>
                patch({ base_water_liter: stringToNullableNumber(e.target.value) })
              }
              placeholder="500"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>기준 제품량</div>
            <input
              style={S.input}
              inputMode="numeric"
              value={safeNumber(value.base_product_amount) ?? ""}
              onChange={(e) =>
                patch({
                  base_product_amount: stringToNullableNumber(e.target.value),
                })
              }
              placeholder="500"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>기준 단위</div>
            <input
              style={S.input}
              value={safeText(value.base_product_unit)}
              onChange={(e) => patch({ base_product_unit: e.target.value })}
              placeholder="ml"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>기준 면적(평)</div>
            <input
              style={S.input}
              inputMode="numeric"
              value={safeNumber(value.base_area_pyeong) ?? ""}
              onChange={(e) =>
                patch({ base_area_pyeong: stringToNullableNumber(e.target.value) })
              }
              placeholder="300"
            />
          </label>
        </div>
      </div>

      <div style={S.block}>
        <div style={S.blockTitle}>주기 / 최적 시점</div>

        <div style={S.grid3}>
          <label style={S.labelWrap}>
            <div style={S.label}>사용 간격(일)</div>
            <input
              style={S.input}
              inputMode="numeric"
              value={safeNumber(value.interval_days) ?? ""}
              onChange={(e) =>
                patch({ interval_days: stringToNullableNumber(e.target.value) })
              }
              placeholder="7"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>최대 횟수</div>
            <input
              style={S.input}
              inputMode="numeric"
              value={safeNumber(value.max_cycles) ?? ""}
              onChange={(e) =>
                patch({ max_cycles: stringToNullableNumber(e.target.value) })
              }
              placeholder="3"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>최적 시점</div>
            <input
              style={S.input}
              value={safeText(value.best_timing_text)}
              onChange={(e) => patch({ best_timing_text: e.target.value })}
              placeholder="예: 병해충 초기"
            />
          </label>
        </div>
      </div>

      <div style={S.block}>
        <div style={S.blockTitle}>대상 작물 / 생육 단계</div>

        <label style={S.labelWrap}>
          <div style={S.label}>대상 작물</div>
          <input
            style={S.input}
            value={safeStringArray(value.target_crops).join(", ")}
            onChange={(e) =>
              patch({
                target_crops: e.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
            placeholder="예: 고추, 딸기, 오이"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>생육 단계</div>
          <input
            style={S.input}
            value={safeStringArray(value.growth_stages).join(", ")}
            onChange={(e) =>
              patch({
                growth_stages: e.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
            placeholder="예: 육묘기, 활착기, 생육기"
          />
        </label>
      </div>

      <div style={S.block}>
        <div style={S.blockTitle}>어린 모종 / 침지처리</div>

        <div style={S.checkGrid}>
          <label style={S.checkItem}>
            <input
              type="checkbox"
              checked={safeBoolean(value.seedling_allowed)}
              onChange={(e) => patch({ seedling_allowed: e.target.checked })}
            />
            <span>어린 모종 사용 가능</span>
          </label>

          <label style={S.checkItem}>
            <input
              type="checkbox"
              checked={safeBoolean(value.soaking_allowed)}
              onChange={(e) => patch({ soaking_allowed: e.target.checked })}
            />
            <span>침지처리 가능</span>
          </label>
        </div>

        <div style={S.grid2}>
          <label style={S.labelWrap}>
            <div style={S.label}>모종 희석 기준</div>
            <input
              style={S.input}
              value={safeText(value.seedling_ratio_text)}
              onChange={(e) => patch({ seedling_ratio_text: e.target.value })}
              placeholder="예: 일반 대비 1/2"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>모종 간격(일)</div>
            <input
              style={S.input}
              inputMode="numeric"
              value={safeNumber(value.seedling_interval_days) ?? ""}
              onChange={(e) =>
                patch({
                  seedling_interval_days: stringToNullableNumber(e.target.value),
                })
              }
              placeholder="7"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>모종 주의사항</div>
            <input
              style={S.input}
              value={safeText(value.seedling_notes)}
              onChange={(e) => patch({ seedling_notes: e.target.value })}
              placeholder="예: 신엽 과량 금지"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>침지 희석 기준</div>
            <input
              style={S.input}
              value={safeText(value.soaking_ratio_text)}
              onChange={(e) => patch({ soaking_ratio_text: e.target.value })}
              placeholder="예: 물 20L당 20ml"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>침지 시간(분)</div>
            <input
              style={S.input}
              inputMode="numeric"
              value={safeNumber(value.soaking_duration_minutes) ?? ""}
              onChange={(e) =>
                patch({
                  soaking_duration_minutes: stringToNullableNumber(e.target.value),
                })
              }
              placeholder="10"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>침지 대상</div>
            <input
              style={S.input}
              value={safeText(value.soaking_target)}
              onChange={(e) => patch({ soaking_target: e.target.value })}
              placeholder="예: 모종 뿌리"
            />
          </label>
        </div>

        <label style={S.labelWrap}>
          <div style={S.label}>침지 주의사항</div>
          <textarea
            style={S.textarea}
            value={safeText(value.soaking_notes)}
            onChange={(e) => patch({ soaking_notes: e.target.value })}
            placeholder="예: 장시간 침지 금지"
          />
        </label>
      </div>

      <div style={S.block}>
        <div style={S.blockTitle}>엽면 / 관주 상세</div>

        <div style={S.grid2}>
          <label style={S.labelWrap}>
            <div style={S.label}>엽면 대상 부위</div>
            <input
              style={S.input}
              value={safeStringArray(value.foliar_target_parts).join(", ")}
              onChange={(e) =>
                patch({
                  foliar_target_parts: e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
              placeholder="예: 잎앞면, 잎뒷면"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>엽면 사용법</div>
            <input
              style={S.input}
              value={safeText(value.foliar_method_text)}
              onChange={(e) => patch({ foliar_method_text: e.target.value })}
              placeholder="예: 잎 뒷면 위주 살포"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>관주 사용법</div>
            <input
              style={S.input}
              value={safeText(value.drench_method_text)}
              onChange={(e) => patch({ drench_method_text: e.target.value })}
              placeholder="예: 충분 관수 후 관주"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>관주 물량 문구</div>
            <input
              style={S.input}
              value={safeText(value.drench_water_volume_text)}
              onChange={(e) =>
                patch({ drench_water_volume_text: e.target.value })
              }
              placeholder="예: 300평 기준 500L"
            />
          </label>
        </div>
      </div>

      <div style={S.block}>
        <div style={S.blockTitle}>혼용 / 약해 / 보호장비</div>

        <div style={S.checkGrid}>
          <label style={S.checkItem}>
            <input
              type="checkbox"
              checked={value.mixable === true}
              onChange={(e) => patch({ mixable: e.target.checked })}
            />
            <span>혼용 가능</span>
          </label>
        </div>

        <div style={S.grid2}>
          <label style={S.labelWrap}>
            <div style={S.label}>혼용 가능 자재</div>
            <input
              style={S.input}
              value={safeStringArray(value.mixable_with).join(", ")}
              onChange={(e) =>
                patch({
                  mixable_with: e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
              placeholder="예: 영양제, 칼슘제"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>혼용 금지 자재</div>
            <input
              style={S.input}
              value={safeStringArray(value.non_mixable_with).join(", ")}
              onChange={(e) =>
                patch({
                  non_mixable_with: e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
              placeholder="예: 강알칼리제"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>혼용 주의 문구</div>
            <input
              style={S.input}
              value={safeText(value.mix_notes)}
              onChange={(e) => patch({ mix_notes: e.target.value })}
              placeholder="예: 소면적 테스트 후 혼용"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>약해 경고</div>
            <input
              style={S.input}
              value={safeText(value.phytotoxicity_warning)}
              onChange={(e) =>
                patch({ phytotoxicity_warning: e.target.value })
              }
              placeholder="예: 고온기 과량 살포 주의"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>보호장비</div>
            <input
              style={S.input}
              value={safeStringArray(value.protective_equipment).join(", ")}
              onChange={(e) =>
                patch({
                  protective_equipment: e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
              placeholder="예: 장갑, 보안경, 마스크"
            />
          </label>
        </div>

        <label style={S.labelWrap}>
          <div style={S.label}>공통 주의사항</div>
          <textarea
            style={S.textarea}
            value={safeText(value.precautions)}
            onChange={(e) => patch({ precautions: e.target.value })}
            placeholder="예: 고온 시간대 살포 주의"
          />
        </label>
      </div>

      <div style={S.block}>
        <div style={S.blockTitle}>AI 요약 / 검증 상태</div>

        <div style={S.grid2}>
          <label style={S.labelWrap}>
            <div style={S.label}>AI 요약문</div>
            <input
              style={S.input}
              value={safeText(value.ai_summary)}
              onChange={(e) => patch({ ai_summary: e.target.value })}
              placeholder="AI가 고객에게 보여줄 요약"
            />
          </label>

          <label style={S.labelWrap}>
            <div style={S.label}>검증 상태</div>
            <input
              style={S.input}
              value={safeText(value.verified_status, "draft")}
              onChange={(e) => patch({ verified_status: e.target.value })}
              placeholder="draft / verified"
            />
          </label>
        </div>

        <label style={S.checkItem}>
          <input
            type="checkbox"
            checked={safeBoolean(value.ai_enabled)}
            onChange={(e) => patch({ ai_enabled: e.target.checked })}
          />
          <span>AI 응답에 이 데이터 사용</span>
        </label>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    border: "1px solid #dbeafe",
    background: "#f8fbff",
  },
  title: {
    fontSize: 20,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.8,
    marginBottom: 16,
    whiteSpace: "pre-wrap",
  },
  block: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#111827",
    marginBottom: 12,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
  },
  checkGrid: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  checkItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
  },
  labelWrap: {
    display: "block",
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 900,
    color: "#111827",
  },
  input: {
    width: "100%",
    height: 46,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: "0 12px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: 12,
    fontSize: 14,
    lineHeight: 1.8,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },
};