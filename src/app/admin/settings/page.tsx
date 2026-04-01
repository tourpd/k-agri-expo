"use client";

import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((res) => {
        setData(res.data);
        setLoading(false);
      });
  }, []);

  async function save() {
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (json.success) {
      alert("저장 완료");
    } else {
      alert("오류: " + json.error);
    }
  }

  if (loading || !data) return <div>로딩중...</div>;

  return (
    <div style={S.wrap}>
      <h1 style={S.title}>⚙️ 운영 설정</h1>

      <div style={S.card}>
        <label>메인 이벤트 ID</label>
        <input
          value={data.main_event_id ?? ""}
          onChange={(e) =>
            setData({ ...data, main_event_id: Number(e.target.value) })
          }
        />

        <label>응모 열림 여부</label>
        <select
          value={String(data.entry_open)}
          onChange={(e) =>
            setData({ ...data, entry_open: e.target.value === "true" })
          }
        >
          <option value="true">열림</option>
          <option value="false">닫힘</option>
        </select>

        <label>당첨 전화 제한 시간 (초)</label>
        <input
          value={data.draw_time_limit_sec ?? 120}
          onChange={(e) =>
            setData({
              ...data,
              draw_time_limit_sec: Number(e.target.value),
            })
          }
        />

        <label>기본 당첨자 수</label>
        <input
          value={data.default_winner_count ?? 1}
          onChange={(e) =>
            setData({
              ...data,
              default_winner_count: Number(e.target.value),
            })
          }
        />

        <label>기본 공개 여부</label>
        <select
          value={String(data.default_public)}
          onChange={(e) =>
            setData({ ...data, default_public: e.target.value === "true" })
          }
        >
          <option value="true">공개</option>
          <option value="false">비공개</option>
        </select>

        <label>공지 문구</label>
        <textarea
          value={data.notice_text ?? ""}
          onChange={(e) =>
            setData({ ...data, notice_text: e.target.value })
          }
        />

        <button style={S.btn} onClick={save}>
          저장
        </button>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 800,
    margin: "0 auto",
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    marginBottom: 20,
  },
  card: {
    background: "#fff",
    padding: 24,
    borderRadius: 16,
    display: "grid",
    gap: 12,
  },
  btn: {
    marginTop: 12,
    padding: "12px 16px",
    borderRadius: 10,
    background: "#111",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
};