// src/app/admin/farmer-crm/[phone]/FarmerNoteBox.tsx
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type FarmerNote = {
  id: string;
  phone: string;
  farmer_name?: string | null;
  note: string;
  created_at?: string | null;
};

type AiSummary = {
  transcript?: string;
  summary: string;
  stage: string;
  next_contact_at: string;
  repurchase_score: number;
  recommended_product?: string;
  action: string;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).replace("T", " ").slice(0, 16);
}

export default function FarmerNoteBox({
  phone,
  farmerName,
}: {
  phone: string;
  farmerName: string;
}) {
  const [notes, setNotes] = useState<FarmerNote[]>([]);
  const [note, setNote] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [aiResult, setAiResult] = useState<AiSummary | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  async function loadNotes() {
    if (!safe(phone)) return;

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(
        `/api/admin/farmer-notes?phone=${encodeURIComponent(phone)}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (!data?.success) {
        setMessage(data?.message || "상담기록을 불러오지 못했습니다.");
        return;
      }

      setNotes(data.notes || []);
    } catch {
      setMessage("상담기록 조회 중 네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  async function saveNote() {
    const text = note.trim();

    if (!text) {
      setMessage("상담 내용을 입력하세요.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const res = await fetch("/api/admin/farmer-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          farmer_name: farmerName,
          note: text,
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        setMessage(data?.message || "상담기록 저장 실패");
        return;
      }

      setNote("");
      setMessage("상담기록이 저장되었습니다.");
      await loadNotes();
    } catch {
      setMessage("상담기록 저장 중 네트워크 오류");
    } finally {
      setSaving(false);
    }
  }

  async function summarizeWithAI() {
    const text = note.trim();

    if (!text) {
      setMessage("AI로 분석할 상담 내용을 먼저 입력하세요.");
      return;
    }

    try {
      setAiLoading(true);
      setMessage("");

      const res = await fetch("/api/admin/farmer-ai-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          farmer_name: farmerName,
          memo: text,
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        setMessage(data?.error || "AI 상담 분석 실패");
        return;
      }

      setAiResult({
        summary: safe(data.summary),
        stage: safe(data.stage) || "상담중",
        next_contact_at: safe(data.next_contact_at),
        repurchase_score: Number(data.repurchase_score || 50),
        recommended_product: safe(data.recommended_product),
        action: safe(data.action),
      });

      setMessage("AI 상담 분석이 완료되었습니다.");
    } catch {
      setMessage("AI 상담 분석 중 네트워크 오류");
    } finally {
      setAiLoading(false);
    }
  }

  async function transcribeAudio() {
    if (!audioFile) {
      setMessage("먼저 상담 녹음파일을 선택하세요.");
      return;
    }

    try {
      setAudioLoading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("phone", phone);
      formData.append("farmer_name", farmerName);

      const res = await fetch("/api/admin/farmer-transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data?.success) {
        setMessage(data?.error || "음성 AI 분석 실패");
        return;
      }

      const transcript = safe(data.transcript);

      setNote(transcript);

      setAiResult({
        transcript,
        summary: safe(data.summary),
        stage: safe(data.stage) || "상담중",
        next_contact_at: safe(data.next_contact_at),
        repurchase_score: Number(data.repurchase_score || 50),
        recommended_product: safe(data.recommended_product),
        action: safe(data.action),
      });

      setMessage("음성파일을 AI가 분석했습니다.");
    } catch {
      setMessage("음성파일 분석 중 네트워크 오류");
    } finally {
      setAudioLoading(false);
    }
  }

  async function applyAiToProfile() {
    if (!aiResult) {
      setMessage("먼저 AI 분석을 실행하세요.");
      return;
    }

    try {
      setApplying(true);
      setMessage("");

      const memoText = [
        aiResult.summary,
        aiResult.recommended_product
          ? `추천상품: ${aiResult.recommended_product}`
          : "",
        aiResult.action ? `다음 행동: ${aiResult.action}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/admin/farmer-profiles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          farmer_name: farmerName,
          stage: aiResult.stage,
          next_contact_at: aiResult.next_contact_at || null,
          repurchase_score: aiResult.repurchase_score,
          memo: memoText,
          last_contact_at: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        setMessage(data?.error || "관리상태 반영 실패");
        return;
      }

      setMessage("AI 분석 내용이 관리상태에 반영되었습니다.");
    } catch {
      setMessage("AI 분석 반영 중 네트워크 오류");
    } finally {
      setApplying(false);
    }
  }

  async function saveNoteAndApplyAI() {
    if (note.trim()) {
      await saveNote();
    }

    if (aiResult) {
      await applyAiToProfile();
    }
  }

  async function deleteNote(id: string) {
    if (!id) return;
    if (!confirm("이 상담기록을 삭제할까요?")) return;

    try {
      setDeletingId(id);
      setMessage("");

      const res = await fetch(
        `/api/admin/farmer-notes?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!data?.success) {
        setMessage(data?.message || "상담기록 삭제 실패");
        return;
      }

      setMessage("상담기록이 삭제되었습니다.");
      await loadNotes();
    } catch {
      setMessage("상담기록 삭제 중 네트워크 오류");
    } finally {
      setDeletingId("");
    }
  }

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  return (
    <section style={S.card}>
      <div style={S.header}>
        <div>
          <h2 style={S.title}>상담기록</h2>
          <p style={S.desc}>
            상담 녹음파일을 올리거나 직접 입력하면 AI가 CRM을 자동 생성합니다.
          </p>
        </div>

        <button type="button" onClick={loadNotes} style={S.reloadBtn}>
          {loading ? "불러오는중" : "새로고침"}
        </button>
      </div>

      <div style={S.audioBox}>
        <div>
          <b style={S.audioTitle}>상담 음성파일 업로드</b>
          <p style={S.audioDesc}>
            휴대폰 통화녹음 또는 음성메모 파일을 올리면 AI가 상담내용을 텍스트로 바꾸고 CRM을 생성합니다.
          </p>
        </div>

        <input
          type="file"
          accept="audio/*,.m4a,.mp3,.wav,.webm,.mp4"
          onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
          style={S.fileInput}
        />

        <button
          type="button"
          onClick={transcribeAudio}
          disabled={audioLoading}
          style={{
            ...S.audioBtn,
            opacity: audioLoading ? 0.65 : 1,
          }}
        >
          {audioLoading ? "음성 분석 중..." : "음성파일로 AI CRM 생성"}
        </button>
      </div>

      <div style={S.inputBox}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="직접 입력도 가능: 예) 5월 30일 통화. 아미65 효과 좋다고 함. 6월 중순 재구매 가능성 있음."
          style={S.textarea}
        />

        <div style={S.actionRow}>
          <button
            type="button"
            onClick={saveNote}
            disabled={saving}
            style={{
              ...S.saveBtn,
              opacity: saving ? 0.65 : 1,
            }}
          >
            {saving ? "저장 중..." : "상담기록 저장"}
          </button>

          <button
            type="button"
            onClick={summarizeWithAI}
            disabled={aiLoading}
            style={{
              ...S.aiBtn,
              opacity: aiLoading ? 0.65 : 1,
            }}
          >
            {aiLoading ? "AI 분석 중..." : "입력내용 AI 분석"}
          </button>
        </div>
      </div>

      {aiResult ? (
        <div style={S.aiBox}>
          <div style={S.aiTitle}>AI CRM 생성 결과</div>

          <div style={S.aiGrid}>
            <Info label="상담요약" value={aiResult.summary} />
            <Info label="추천 단계" value={aiResult.stage} />
            <Info label="다음 연락일" value={aiResult.next_contact_at || "-"} />
            <Info label="재구매 점수" value={`${aiResult.repurchase_score}점`} />
            <Info label="추천상품" value={aiResult.recommended_product || "-"} />
            <Info label="다음 행동" value={aiResult.action} />
          </div>

          {aiResult.transcript ? (
            <div style={S.transcriptBox}>
              <b>음성 변환 내용</b>
              <p>{aiResult.transcript}</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={applyAiToProfile}
            disabled={applying}
            style={{
              ...S.applyBtn,
              opacity: applying ? 0.65 : 1,
            }}
          >
            {applying ? "반영 중..." : "AI CRM을 관리상태에 반영"}
          </button>

          <button
            type="button"
            onClick={saveNoteAndApplyAI}
            disabled={saving || applying}
            style={S.finalBtn}
          >
            상담기록 저장 + AI CRM 반영
          </button>
        </div>
      ) : null}

      {message ? (
        <div
          style={
            message.includes("실패") || message.includes("오류")
              ? S.errorText
              : S.messageText
          }
        >
          {message}
        </div>
      ) : null}

      <div style={S.list}>
        {notes.length === 0 ? (
          <div style={S.empty}>상담기록이 없습니다.</div>
        ) : (
          notes.map((item) => (
            <div key={item.id} style={S.noteItem}>
              <div style={S.noteTop}>
                <div>
                  <b>{shortDate(item.created_at)}</b>
                  <div style={S.noteSub}>
                    {safe(item.farmer_name) || farmerName || "-"} /{" "}
                    {safe(item.phone) || phone}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteNote(item.id)}
                  disabled={deletingId === item.id}
                  style={{
                    ...S.deleteBtn,
                    opacity: deletingId === item.id ? 0.6 : 1,
                  }}
                >
                  {deletingId === item.id ? "삭제중" : "삭제"}
                </button>
              </div>

              <p style={S.noteText}>{item.note}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value?: unknown }) {
  return (
    <div style={S.infoItem}>
      <div style={S.infoLabel}>{label}</div>
      <div style={S.infoValue}>{safe(value) || "-"}</div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 950,
  },
  desc: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: 800,
    color: "#4b5563",
  },
  reloadBtn: {
    minHeight: 38,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    padding: "0 14px",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  },
  audioBox: {
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    display: "grid",
    gap: 10,
  },
  audioTitle: {
    fontSize: 17,
    fontWeight: 950,
    color: "#1d4ed8",
  },
  audioDesc: {
    margin: "6px 0 0",
    fontSize: 13,
    fontWeight: 800,
    color: "#374151",
  },
  fileInput: {
    width: "100%",
    border: "1px solid #bfdbfe",
    borderRadius: 12,
    padding: 10,
    background: "#ffffff",
    fontSize: 14,
    fontWeight: 800,
  },
  audioBtn: {
    minHeight: 46,
    borderRadius: 14,
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "0 16px",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
  inputBox: {
    display: "grid",
    gap: 10,
    marginBottom: 14,
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    borderRadius: 16,
    border: "1px solid #d1d5db",
    padding: 14,
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.6,
    resize: "vertical",
    boxSizing: "border-box",
  },
  actionRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  saveBtn: {
    minHeight: 46,
    borderRadius: 14,
    border: "none",
    background: "#047857",
    color: "#ffffff",
    padding: "0 16px",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
  aiBtn: {
    minHeight: 46,
    borderRadius: 14,
    border: "none",
    background: "#7c3aed",
    color: "#ffffff",
    padding: "0 16px",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
  applyBtn: {
    marginTop: 10,
    width: "100%",
    minHeight: 44,
    borderRadius: 14,
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "0 16px",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
  finalBtn: {
    marginTop: 8,
    width: "100%",
    minHeight: 44,
    borderRadius: 14,
    border: "none",
    background: "#047857",
    color: "#ffffff",
    padding: "0 16px",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
  aiBox: {
    border: "1px solid #ddd6fe",
    background: "#faf5ff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  aiTitle: {
    fontSize: 17,
    fontWeight: 950,
    marginBottom: 10,
    color: "#5b21b6",
  },
  aiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 8,
  },
  infoItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    background: "#ffffff",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 950,
    color: "#6b7280",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
    whiteSpace: "pre-wrap",
  },
  transcriptBox: {
    marginTop: 10,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontWeight: 800,
    whiteSpace: "pre-wrap",
  },
  messageText: {
    marginBottom: 12,
    color: "#047857",
    fontSize: 14,
    fontWeight: 950,
  },
  errorText: {
    marginBottom: 12,
    color: "#dc2626",
    fontSize: 14,
    fontWeight: 950,
  },
  list: {
    display: "grid",
    gap: 10,
  },
  empty: {
    padding: 22,
    textAlign: "center",
    color: "#6b7280",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    fontWeight: 900,
  },
  noteItem: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#f9fafb",
  },
  noteTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  noteSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 850,
    color: "#6b7280",
  },
  deleteBtn: {
    minHeight: 30,
    borderRadius: 10,
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    padding: "0 10px",
    fontSize: 13,
    fontWeight: 950,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  noteText: {
    margin: 0,
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
  },
};