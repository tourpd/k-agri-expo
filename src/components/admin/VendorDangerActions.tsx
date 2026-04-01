"use client";

import React, { useMemo, useState } from "react";

type DeleteMode = "soft" | "hard";

type VendorDangerActionsProps = {
  userId: string;
  vendorName: string;
  vendorEmail?: string | null;
  onDone?: () => void;
};

export default function VendorDangerActions({
  userId,
  vendorName,
  vendorEmail,
  onDone,
}: VendorDangerActionsProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DeleteMode>("soft");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const titleText = useMemo(() => {
    return mode === "soft" ? "업체 비활성화" : "업체 완전삭제";
  }, [mode]);

  const descText = useMemo(() => {
    if (mode === "soft") {
      return "업체를 비활성화합니다. 부스/상품/콘텐츠는 운영상 숨김 처리되며, 나중에 복구할 수 있습니다.";
    }
    return "업체와 연결된 부스/콘텐츠/연결정보를 정리한 뒤 계정까지 완전삭제합니다. 이 작업은 되돌릴 수 없습니다.";
  }, [mode]);

  async function runDelete() {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/vendors/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          mode,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "삭제 처리에 실패했습니다.");
      }

      setMsg(json?.message || "처리가 완료되었습니다.");

      setTimeout(() => {
        setOpen(false);
        setMsg("");
        onDone?.();
      }, 800);
    } catch (error: any) {
      setMsg(error?.message || "삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={S.row}>
        <button
          type="button"
          style={S.softBtn}
          onClick={() => {
            setMode("soft");
            setMsg("");
            setOpen(true);
          }}
        >
          비활성화
        </button>

        <button
          type="button"
          style={S.hardBtn}
          onClick={() => {
            setMode("hard");
            setMsg("");
            setOpen(true);
          }}
        >
          완전삭제
        </button>
      </div>

      {open ? (
        <div style={S.backdrop} onClick={() => !loading && setOpen(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalKicker}>{mode === "soft" ? "SOFT DELETE" : "HARD DELETE"}</div>
            <h3 style={S.modalTitle}>{titleText}</h3>

            <div style={S.infoBox}>
              <div style={S.infoLabel}>업체명</div>
              <div style={S.infoValue}>{vendorName || "-"}</div>

              <div style={{ ...S.infoLabel, marginTop: 10 }}>이메일</div>
              <div style={S.infoValue}>{vendorEmail || "-"}</div>

              <div style={{ ...S.infoLabel, marginTop: 10 }}>user_id</div>
              <div style={S.mono}>{userId}</div>
            </div>

            <p style={S.desc}>{descText}</p>

            {mode === "hard" ? (
              <div style={S.warnBox}>
                경고: 완전삭제는 booth / vendor / 연결 데이터 정리 후 계정까지 삭제합니다.
                되돌릴 수 없습니다.
              </div>
            ) : (
              <div style={S.tipBox}>
                비활성화는 운영 화면에서 숨김 처리하는 용도이며, 복구 가능한 방식입니다.
              </div>
            )}

            {msg ? <div style={S.msg}>{msg}</div> : null}

            <div style={S.footer}>
              <button
                type="button"
                style={S.cancelBtn}
                onClick={() => !loading && setOpen(false)}
                disabled={loading}
              >
                취소
              </button>

              <button
                type="button"
                style={mode === "soft" ? S.confirmSoftBtn : S.confirmHardBtn}
                onClick={runDelete}
                disabled={loading}
              >
                {loading
                  ? mode === "soft"
                    ? "비활성화 중..."
                    : "삭제 중..."
                  : mode === "soft"
                  ? "업체 비활성화"
                  : "업체 완전삭제"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const S: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  softBtn: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  hardBtn: {
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#b91c1c",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 620,
    background: "#fff",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 24px 60px rgba(15,23,42,0.24)",
  },
  modalKicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  modalTitle: {
    margin: "10px 0 0",
    fontSize: 28,
    fontWeight: 950,
    color: "#0f172a",
  },
  infoBox: {
    marginTop: 18,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    borderRadius: 16,
    padding: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  infoValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: 800,
    color: "#0f172a",
  },
  mono: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    wordBreak: "break-all",
    lineHeight: 1.6,
  },
  desc: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#334155",
  },
  warnBox: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    padding: 14,
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 700,
  },
  tipBox: {
    marginTop: 12,
    borderRadius: 14,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: 14,
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 700,
  },
  msg: {
    marginTop: 14,
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: "12px 14px",
    color: "#334155",
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 700,
  },
  footer: {
    marginTop: 20,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    flexWrap: "wrap",
  },
  cancelBtn: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  confirmSoftBtn: {
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  confirmHardBtn: {
    border: "1px solid #b91c1c",
    background: "#b91c1c",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
};