"use client";

import React, { useMemo, useState } from "react";

type Props = {
  name: string;
  accept?: string;
};

export default function FileUploadBox({ name, accept = "image/*,.pdf" }: Props) {
  const [file, setFile] = useState<File | null>(null);

  const previewUrl = useMemo(() => {
    if (!file) return "";
    if (!file.type.startsWith("image/")) return "";
    return URL.createObjectURL(file);
  }, [file]);

  return (
    <div style={S.wrap}>
      <label style={file ? S.selectDone : S.selectBtn}>
        {file ? "파일 선택 완료" : "파일 선택하기"}
        <input
          type="file"
          name={name}
          accept={accept}
          style={S.hidden}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>

      {file ? (
        <div style={S.doneBox}>
          <div style={S.fileName}>선택한 파일: {file.name}</div>
          <div style={S.fileSize}>
            크기: {(file.size / 1024 / 1024).toFixed(2)}MB
          </div>

          {previewUrl ? (
            <img src={previewUrl} alt="선택한 파일 미리보기" style={S.preview} />
          ) : (
            <div style={S.pdfBox}>PDF/문서 파일이 선택되었습니다.</div>
          )}

          <div style={S.notice}>이제 아래 저장하기를 누르면 업로드됩니다.</div>
        </div>
      ) : (
        <div style={S.empty}>아직 새 파일을 선택하지 않았습니다.</div>
      )}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { display: "grid", gap: 10 },
  hidden: { display: "none" },
  selectBtn: {
    height: 58,
    borderRadius: 14,
    background: "#16a34a",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
    fontWeight: 950,
    cursor: "pointer",
  },
  selectDone: {
    height: 58,
    borderRadius: 14,
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 19,
    fontWeight: 950,
    cursor: "pointer",
  },
  empty: {
    padding: 16,
    borderRadius: 14,
    background: "#fff",
    border: "2px solid #16a34a",
    color: "#111827",
    fontSize: 17,
    fontWeight: 900,
  },
  doneBox: {
    padding: 14,
    borderRadius: 14,
    background: "#ecfdf5",
    border: "2px solid #22c55e",
  },
  fileName: { fontSize: 17, fontWeight: 950, color: "#166534" },
  fileSize: { marginTop: 4, fontSize: 14, fontWeight: 800, color: "#166534" },
  preview: {
    marginTop: 12,
    width: "100%",
    maxHeight: 260,
    objectFit: "contain",
    borderRadius: 12,
    background: "#fff",
  },
  pdfBox: {
    marginTop: 12,
    padding: 18,
    borderRadius: 12,
    background: "#fff",
    color: "#334155",
    fontWeight: 900,
  },
  notice: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 950,
  },
};