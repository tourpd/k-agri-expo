"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Role = "farmer" | "buyer" | "vendor" | "media" | "general";

const ROLE_OPTIONS: Array<{ value: Role; label: string; desc: string }> = [
  { value: "farmer", label: "농민", desc: "작물/지역 기반으로 특판·자재 추천을 받습니다." },
  { value: "buyer", label: "바이어(대량구매)", desc: "대량 견적·상담 중심으로 매칭됩니다." },
  { value: "vendor", label: "업체(판매자)", desc: "부스/제품 등록 및 상담을 운영합니다." },
  { value: "media", label: "기자/미디어", desc: "박람회/브랜드 취재·홍보 목적입니다." },
  { value: "general", label: "일반인", desc: "농업 관심/귀농/스마트팜 등 탐색 위주입니다." },
];

const TAG_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "smartfarm", label: "스마트팜 관심" },
  { value: "return_farm", label: "귀농 준비" },
  { value: "pre_founder", label: "예비 창업자" },
  { value: "investor", label: "투자자" },
  { value: "agri_fan", label: "농업 관심자" },
  { value: "household", label: "주부" },
];

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "fertilizer", label: "비료" },
  { value: "pesticide", label: "농약" },
  { value: "eco", label: "유기농자재" },
  { value: "seed", label: "종자/묘" },
  { value: "machinery", label: "농기계/장비" },
  { value: "smartfarm", label: "스마트팜/시설" },
  { value: "packaging", label: "포장/자재" },
];

const CROP_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "garlic", label: "마늘" },
  { value: "pepper", label: "고추" },
  { value: "onion", label: "양파" },
  { value: "cabbage", label: "배추" },
  { value: "strawberry", label: "딸기" },
  { value: "rice", label: "벼" },
  { value: "fruit", label: "과수" },
];

function toggle(arr: string[], v: string) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export default function OnboardingPage() {
  const supabase = supabaseBrowser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const [role, setRole] = useState<Role>("farmer");
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setMsg("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          window.location.href = "/login?force=1";
          return;
        }

        if (cancelled) return;

        setUserId(user.id);
        setEmail(user.email ?? "");
        setDisplayName((user.email?.split("@")[0] ?? "guest").slice(0, 30));

        const { data: prof, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (prof) {
          if (prof.role === "vendor") {
            window.location.href = "/vendor";
            return;
          }

          if (prof.role === "buyer") {
            window.location.href = "/buyer";
            return;
          }

          window.location.href = "/";
          return;
        }
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
          setMsg(`불러오기 실패: ${message}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function save() {
    if (!userId) {
      setMsg("로그인 정보가 없습니다. 다시 로그인해 주세요.");
      return;
    }

    setSaving(true);
    setMsg("");

    try {
      const payload = {
        user_id: userId,
        role,
        interest_tags: interestTags,
        crops,
        categories,
        region: region || null,
        display_name: displayName || null,
        language: "ko",
      };

      const { error } = await supabase.from("profiles").insert(payload);

      if (error) throw error;

      if (role === "vendor") {
        window.location.href = "/vendor";
        return;
      }

      if (role === "buyer") {
        window.location.href = "/buyer";
        return;
      }

      window.location.href = "/";
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
      setMsg(`저장 실패: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: 28, maxWidth: 900, margin: "0 auto" }}>
        불러오는 중…
      </main>
    );
  }

  return (
    <main style={{ padding: 28, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>가입 정보 설정</h1>
      <p style={{ marginTop: 8, color: "#666" }}>
        한 번만 설정하면, 관심 카테고리/작물에 맞춰 특판·부스를 자동 매칭해 드립니다.
      </p>

      {msg && (
        <div
          style={{
            marginTop: 12,
            border: "1px solid #111",
            padding: 12,
            borderRadius: 12,
            background: "#fafafa",
          }}
        >
          {msg}
        </div>
      )}

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span style={chip()}>user_id: {userId}</span>
        <span style={chip()}>email: {email}</span>
      </div>

      <section style={card()}>
        <h2 style={h2()}>역할 선택(필수)</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {ROLE_OPTIONS.map((r) => (
            <label key={r.value} style={radioCard(role === r.value)}>
              <input
                type="radio"
                name="role"
                checked={role === r.value}
                onChange={() => setRole(r.value)}
              />
              <div>
                <div style={{ fontWeight: 900 }}>{r.label}</div>
                <div style={{ color: "#666", marginTop: 4, fontSize: 13 }}>
                  {r.desc}
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section style={card()}>
        <h2 style={h2()}>관심 태그(선택, 복수)</h2>
        <div style={grid()}>
          {TAG_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setInterestTags((p) => toggle(p, t.value))}
              style={pill(interestTags.includes(t.value))}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section style={card()}>
        <h2 style={h2()}>주 작물(선택, 복수)</h2>
        <div style={grid()}>
          {CROP_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCrops((p) => toggle(p, c.value))}
              style={pill(crops.includes(c.value))}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section style={card()}>
        <h2 style={h2()}>관심 카테고리(선택, 복수)</h2>
        <div style={grid()}>
          {CATEGORY_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategories((p) => toggle(p, c.value))}
              style={pill(categories.includes(c.value))}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section style={card()}>
        <h2 style={h2()}>명찰(표식) 정보</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            <div style={label()}>표시 이름(명찰)</div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={input()}
              placeholder="예) 한국농수산TV"
            />
          </div>
          <div>
            <div style={label()}>지역(선택)</div>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              style={input()}
              placeholder="예) 충남 홍성 / 경기 고양"
            />
          </div>
        </div>

        <div style={{ marginTop: 12, color: "#777", fontSize: 12, lineHeight: 1.6 }}>
          * 이후 채팅/상담/댓글/문의에서 이 정보가 “명찰 배지”로 표시됩니다.
        </div>
      </section>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {saving ? "저장 중…" : "저장하고 시작하기 →"}
        </button>

        <button
          onClick={() => (window.location.href = "/login?force=1")}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #e8e8e8",
            background: "#fff",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          로그인 화면으로
        </button>
      </div>
    </main>
  );
}

function card() {
  return {
    marginTop: 14,
    border: "1px solid #eee",
    borderRadius: 18,
    padding: 16,
    background: "#fff",
  } as const;
}

function h2() {
  return { margin: 0, fontSize: 16, fontWeight: 900 } as const;
}

function label() {
  return { marginBottom: 6, fontSize: 12, fontWeight: 900 } as const;
}

function input() {
  return {
    width: "100%",
    borderRadius: 12,
    border: "1px solid #e9e9e9",
    padding: "10px 12px",
    outline: "none",
    fontSize: 14,
  } as const;
}

function grid() {
  return { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 } as const;
}

function pill(active: boolean) {
  return {
    padding: "10px 12px",
    borderRadius: 999,
    border: active ? "1px solid #111" : "1px solid #e8e8e8",
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#111",
    fontWeight: 900,
    cursor: "pointer",
  } as const;
}

function chip() {
  return {
    border: "1px solid #eee",
    background: "#fafafa",
    borderRadius: 999,
    padding: "8px 10px",
    fontSize: 13,
  } as const;
}

function radioCard(active: boolean) {
  return {
    display: "grid",
    gridTemplateColumns: "20px 1fr",
    gap: 10,
    alignItems: "start",
    border: active ? "1px solid #111" : "1px solid #eee",
    borderRadius: 14,
    padding: 12,
    cursor: "pointer",
    background: active ? "#fafafa" : "#fff",
  } as const;
}