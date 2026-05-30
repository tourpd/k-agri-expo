"use client";

import { useEffect, useMemo, useState } from "react";

type Rule = {
  id?: string;

  diagnosis_keyword: string;
  crop_name: string;
  issue_type: string;

  season: string;
  farming_type: string;

  product_name: string;
  product_id: string;
  product_slug: string;
  booth_id: string;

  recommend_order: number;
  exposure_priority: number;

  recommend_label: string;
  recommend_reason: string;
  usage_summary: string;

  button_text: string;
  button_link: string;

  is_featured: boolean;
  is_active: boolean;
};

const EMPTY_FORM: Rule = {
  diagnosis_keyword: "",
  crop_name: "",
  issue_type: "insect",

  season: "",
  farming_type: "",

  product_name: "",
  product_id: "",
  product_slug: "",
  booth_id: "",

  recommend_order: 1,
  exposure_priority: 100,

  recommend_label: "",
  recommend_reason: "",
  usage_summary: "",

  button_text: "구매하기",
  button_link: "",

  is_featured: false,
  is_active: true,
};

function asRule(item: Partial<Rule>): Rule {
  return {
    ...EMPTY_FORM,
    ...item,

    diagnosis_keyword: item.diagnosis_keyword || "",
    crop_name: item.crop_name || "",
    issue_type: item.issue_type || "insect",

    season: item.season || "",
    farming_type: item.farming_type || "",

    product_name: item.product_name || "",
    product_id: item.product_id || "",
    product_slug: item.product_slug || "",
    booth_id: item.booth_id || "",

    recommend_order: Number(item.recommend_order ?? 1),
    exposure_priority: Number(item.exposure_priority ?? 100),

    recommend_label: item.recommend_label || "",
    recommend_reason: item.recommend_reason || "",
    usage_summary: item.usage_summary || "",

    button_text: item.button_text || "구매하기",
    button_link: item.button_link || "",

    is_featured: item.is_featured === true,
    is_active: item.is_active !== false,
  };
}

export default function AdminPhotoDoctorRecommendRulesPage() {
  const [items, setItems] = useState<Rule[]>([]);
  const [form, setForm] = useState<Rule>(EMPTY_FORM);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeItems = useMemo(
    () => items.filter((item) => item.is_active),
    [items]
  );

  function patch(next: Partial<Rule>) {
    setForm((prev) => ({
      ...prev,
      ...next,
    }));
  }

  async function load() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/photodoctor-recommend-rules", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "불러오기 실패");
        return;
      }

      setItems((json.items || []).map(asRule));
    } catch {
      alert("추천규칙 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!form.diagnosis_keyword.trim()) {
      alert("진단 키워드를 입력하세요.");
      return;
    }

    if (!form.product_name.trim()) {
      alert("추천 자재명을 입력하세요.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        recommend_order: Number(form.recommend_order || 1),
        exposure_priority: Number(form.exposure_priority || 100),

        button_link:
          form.button_link ||
          `/photodoctor/buy?product=${encodeURIComponent(
            form.product_name
          )}&source=photodoctor`,
      };

      const res = await fetch("/api/admin/photodoctor-recommend-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "저장 실패");
        return;
      }

      alert("✅ 저장 완료");

      setForm(asRule(json.item || EMPTY_FORM));
      load();
    } catch {
      alert("저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id?: string) {
    if (!id) return;

    if (!confirm("삭제하시겠습니까?")) return;

    try {
      const res = await fetch(
        `/api/admin/photodoctor-recommend-rules?id=${id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "삭제 실패");
        return;
      }

      alert("삭제 완료");

      load();

      if (form.id === id) {
        setForm(EMPTY_FORM);
      }
    } catch {
      alert("삭제 실패");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={S.wrap}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>🌱 포토닥터 추천규칙 관리자</h1>

          <p style={S.desc}>
            포토닥터 진단 결과와 K-Agri Expo 추천 자재를 연결합니다.
          </p>
        </div>

        <div style={S.headerBtns}>
          <button type="button" style={S.addBtn} onClick={() => setForm(EMPTY_FORM)}>
            + 새 규칙
          </button>

          <a href="/expo" target="_blank" style={S.blackBtn}>
            EXPO 보기
          </a>
        </div>
      </div>

      <div style={S.layout}>
        <section style={S.card}>
          <h2 style={S.cardTitle}>
            {form.id ? "추천규칙 수정" : "새 추천규칙"}
          </h2>

          <div style={S.sectionTitle}>① 진단 조건</div>

          <Field
            label="진단 키워드"
            value={form.diagnosis_keyword}
            placeholder="예: 총채벌레, 흰가루병, 탄저병"
            onChange={(v) => patch({ diagnosis_keyword: v })}
          />

          <Field
            label="작물명"
            value={form.crop_name}
            placeholder="비워두면 모든 작물 / 예: 고추, 딸기, 마늘"
            onChange={(v) => patch({ crop_name: v })}
          />

          <SelectField
            label="진단 유형"
            value={form.issue_type}
            onChange={(v) => patch({ issue_type: v })}
            options={[
              ["insect", "충해"],
              ["fungus", "곰팡이병"],
              ["nutrient", "영양장해"],
              ["soil", "토양·뿌리"],
              ["growth", "생육장해"],
              ["etc", "기타"],
            ]}
          />

          <div style={S.twoCol}>
            <Field
              label="시기/계절"
              value={form.season}
              placeholder="비워두면 전체 / 예: 봄, 여름, 5월, 장마"
              onChange={(v) => patch({ season: v })}
            />

            <SelectField
              label="재배 유형"
              value={form.farming_type}
              onChange={(v) => patch({ farming_type: v })}
              options={[
                ["", "전체"],
                ["organic", "유기농"],
                ["eco", "친환경"],
                ["general", "일반 관행"],
                ["facility", "시설재배"],
                ["openfield", "노지재배"],
              ]}
            />
          </div>

          <div style={S.sectionTitle}>② 추천 자재</div>

          <Field
            label="추천 자재명"
            value={form.product_name}
            placeholder="예: 싹쓰리충"
            onChange={(v) => patch({ product_name: v })}
          />

          <div style={S.twoCol}>
            <Field
              label="추천 순서"
              value={String(form.recommend_order)}
              placeholder="1"
              onChange={(v) => patch({ recommend_order: Number(v || 1) })}
            />

            <Field
              label="노출 우선순위"
              value={String(form.exposure_priority)}
              placeholder="숫자가 낮을수록 먼저 노출"
              onChange={(v) => patch({ exposure_priority: Number(v || 100) })}
            />
          </div>

          <Field
            label="추천 라벨"
            value={form.recommend_label}
            placeholder="예: 친환경 살충제, 유기농자재 살균제"
            onChange={(v) => patch({ recommend_label: v })}
          />

          <TextAreaField
            label="추천 이유"
            value={form.recommend_reason}
            placeholder="예: 총채벌레 진단 시 우선 추천하는 친환경 살충제입니다."
            onChange={(v) => patch({ recommend_reason: v })}
          />

          <TextAreaField
            label="간단 사용 요약"
            value={form.usage_summary}
            placeholder="예: 초기 발생 시 엽면 전체에 충분히 살포. 고온기에는 아침·저녁 사용 권장."
            onChange={(v) => patch({ usage_summary: v })}
          />

          <div style={S.sectionTitle}>③ 버튼 연결</div>

          <Field
            label="버튼 문구"
            value={form.button_text}
            placeholder="예: 구매하기"
            onChange={(v) => patch({ button_text: v })}
          />

          <Field
            label="버튼 링크"
            value={form.button_link}
            placeholder="/photodoctor/buy?product=싹쓰리충&source=photodoctor"
            onChange={(v) => patch({ button_link: v })}
          />

          <div style={S.checkGrid}>
            <label style={S.checkWrap}>
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => patch({ is_featured: e.target.checked })}
              />
              <span>우선 노출</span>
            </label>

            <label style={S.checkWrap}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => patch({ is_active: e.target.checked })}
              />
              <span>사용중</span>
            </label>
          </div>

          <button type="button" onClick={save} disabled={saving} style={S.saveBtn}>
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </section>

        <aside style={S.side}>
          <div style={S.sideCard}>
            <h2 style={S.sideTitle}>등록된 추천규칙</h2>

            <div style={S.sideDesc}>
              사용중 {activeItems.length}개 / 전체 {items.length}개
            </div>

            {loading ? <div style={S.loading}>불러오는 중...</div> : null}

            <div style={S.list}>
              {items.map((item) => (
                <div key={item.id} style={S.item}>
                  <div style={S.itemTop}>
                    <div>
                      <div style={S.keyword}>{item.diagnosis_keyword}</div>

                      <div style={S.product}>→ {item.product_name}</div>
                    </div>

                    <div
                      style={{
                        ...S.badge,
                        background: item.is_active ? "#dcfce7" : "#fee2e2",
                        color: item.is_active ? "#166534" : "#991b1b",
                      }}
                    >
                      {item.is_active ? "ON" : "OFF"}
                    </div>
                  </div>

                  <div style={S.meta}>
                    {item.issue_type} · 순서 {item.recommend_order} · 우선{" "}
                    {item.exposure_priority}
                    {item.is_featured ? " · 대표노출" : ""}
                  </div>

                  <div style={S.meta}>
                    작물 {item.crop_name || "전체"} · 시기{" "}
                    {item.season || "전체"} · 유형 {item.farming_type || "전체"}
                  </div>

                  {item.recommend_label ? (
                    <div style={S.smallLabel}>{item.recommend_label}</div>
                  ) : null}

                  <div style={S.rowBtns}>
                    <button
                      type="button"
                      style={S.editBtn}
                      onClick={() => setForm(asRule(item))}
                    >
                      수정
                    </button>

                    <button
                      type="button"
                      style={S.deleteBtn}
                      onClick={() => remove(item.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={S.input}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>

      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={S.textarea}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[][];
  onChange: (v: string) => void;
}) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={S.input}
      >
        {options.map((item) => (
          <option key={item[0]} value={item[0]}>
            {item[1]}
          </option>
        ))}
      </select>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 24,
    color: "#111827",
  },

  header: {
    maxWidth: 1500,
    margin: "0 auto 20px",
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-start",
  },

  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 950,
  },

  desc: {
    marginTop: 8,
    color: "#4b5563",
    fontWeight: 800,
  },

  headerBtns: {
    display: "flex",
    gap: 8,
  },

  addBtn: {
    height: 48,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 950,
    cursor: "pointer",
  },

  blackBtn: {
    height: 48,
    padding: "0 18px",
    borderRadius: 14,
    background: "#111827",
    color: "#ffffff",
    fontWeight: 950,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
  },

  layout: {
    maxWidth: 1500,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 420px",
    gap: 20,
    alignItems: "start",
  },

  card: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  cardTitle: {
    margin: 0,
    fontSize: 26,
    fontWeight: 950,
  },

  sectionTitle: {
    marginTop: 30,
    marginBottom: 16,
    paddingTop: 20,
    borderTop: "1px solid #e5e7eb",
    fontSize: 20,
    fontWeight: 950,
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },

  field: {
    marginTop: 16,
  },

  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 15,
    fontWeight: 950,
  },

  input: {
    width: "100%",
    height: 56,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    boxSizing: "border-box",
    fontSize: 16,
    fontWeight: 800,
  },

  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    padding: 14,
    boxSizing: "border-box",
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.5,
  },

  checkGrid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },

  checkWrap: {
    minHeight: 52,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 14px",
    fontWeight: 950,
  },

  saveBtn: {
    width: "100%",
    height: 68,
    borderRadius: 18,
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    fontSize: 22,
    fontWeight: 950,
    marginTop: 24,
    cursor: "pointer",
  },

  side: {
    position: "sticky",
    top: 20,
  },

  sideCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
  },

  sideTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 950,
  },

  sideDesc: {
    marginTop: 8,
    color: "#64748b",
    fontWeight: 800,
  },

  loading: {
    marginTop: 14,
    fontWeight: 900,
    color: "#4b5563",
  },

  list: {
    marginTop: 16,
    display: "grid",
    gap: 12,
  },

  item: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 14,
  },

  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },

  keyword: {
    fontSize: 18,
    fontWeight: 950,
  },

  product: {
    marginTop: 4,
    color: "#16a34a",
    fontWeight: 950,
  },

  badge: {
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
  },

  meta: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 13,
    fontWeight: 800,
  },

  smallLabel: {
    marginTop: 10,
    display: "inline-flex",
    padding: "5px 10px",
    borderRadius: 999,
    background: "#ecfdf5",
    color: "#047857",
    fontSize: 12,
    fontWeight: 950,
  },

  rowBtns: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr 88px",
    gap: 8,
  },

  editBtn: {
    height: 42,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 950,
    cursor: "pointer",
  },

  deleteBtn: {
    height: 42,
    borderRadius: 12,
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: 950,
    cursor: "pointer",
  },
};