"use client";

import React, { useMemo, useState } from "react";

export default function EntryPageClient() {
  const [role, setRole] = useState<"farmer" | "buyer">("farmer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [crop, setCrop] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && phone.trim().length > 0 && !loading;
  }, [name, phone, loading]);

  async function submit() {
    setErr(null);
    setLoading(true);

    try {
      const payload = {
        role,
        name: name.trim(),
        phone: phone.trim(),
        region: region.trim(),
        crop: crop.trim(),
      };

      const res = await fetch("/api/expo/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setErr(data?.error ?? `입장 처리 실패 (status=${res.status})`);
        return;
      }

      // ✅ 성공이면 하드 내비게이션(쿠키 반영 100%)
      window.location.href = "/expo";
    } catch (e: any) {
      setErr(e?.message ?? "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "16px 14px 110px" }}>
      <section>
        {/* 역할 */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setRole("farmer")}
            style={{
              height: 44,
              padding: "0 16px",
              borderRadius: 999,
              border: "1px solid #ddd",
              background: role === "farmer" ? "#111" : "#fff",
              color: role === "farmer" ? "#fff" : "#111",
              fontWeight: 800,
            }}
          >
            농민
          </button>
          <button
            type="button"
            onClick={() => setRole("buyer")}
            style={{
              height: 44,
              padding: "0 16px",
              borderRadius: 999,
              border: "1px solid #ddd",
              background: role === "buyer" ? "#111" : "#fff",
              color: role === "buyer" ? "#fff" : "#111",
              fontWeight: 800,
            }}
          >
            바이어
          </button>
        </div>

        {/* 이름 */}
        <label style={{ display: "block", fontWeight: 900, marginBottom: 8 }}>이름(필수)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 조세환"
          autoComplete="off"
          style={{
            width: "100%",
            height: 54,
            borderRadius: 14,
            border: "2px solid #111",
            padding: "0 14px",
            fontSize: 18,
            marginBottom: 14,
          }}
        />

        {/* 전화 */}
        <label style={{ display: "block", fontWeight: 900, marginBottom: 8 }}>전화번호(필수)</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="예: 01012345678"
          inputMode="numeric"
          autoComplete="off"
          style={{
            width: "100%",
            height: 54,
            borderRadius: 14,
            border: "2px solid #111",
            padding: "0 14px",
            fontSize: 18,
            marginBottom: 14,
          }}
        />

        {/* 지역 */}
        <label style={{ display: "block", fontWeight: 900, marginBottom: 8 }}>지역(선택)</label>
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="예: 충남 홍성"
          autoComplete="off"
          style={{
            width: "100%",
            height: 54,
            borderRadius: 14,
            border: "2px solid #111",
            padding: "0 14px",
            fontSize: 18,
            marginBottom: 14,
          }}
        />

        {/* 작물 */}
        <label style={{ display: "block", fontWeight: 900, marginBottom: 8 }}>주요 작물(선택)</label>
        <input
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          placeholder="예: 마늘, 고추"
          autoComplete="off"
          style={{
            width: "100%",
            height: 54,
            borderRadius: 14,
            border: "2px solid #111",
            padding: "0 14px",
            fontSize: 18,
            marginBottom: 16,
          }}
        />

        {err && <div style={{ marginBottom: 12, color: "#c00", fontWeight: 900 }}>{err}</div>}

        <button
          type="button"
          onClick={() => {
            if (!canSubmit) {
              setErr("이름/전화번호는 필수입니다.");
              return;
            }
            void submit();
          }}
          disabled={loading}
          style={{
            width: "100%",
            height: 60,
            borderRadius: 16,
            border: 0,
            background: !canSubmit ? "#999" : "#111",
            color: "#fff",
            fontSize: 20,
            fontWeight: 900,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "처리 중..." : "입장하기"}
        </button>
      </section>
    </main>
  );
}