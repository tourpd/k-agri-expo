"use client";

import { useEffect, useMemo, useState } from "react";

type MediaItem = {
  bucket: string;
  path: string;
  url: string;
  name: string;
  updated_at?: string | null;
  created_at?: string | null;
  size?: number;
  mimetype?: string;
};

export default function AdminMediaPage() {
  const [kind, setKind] = useState<"media" | "docs">("media");
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  const title = useMemo(
    () => (kind === "media" ? "이미지 업로드 관리자" : "문서 업로드 관리자"),
    [kind]
  );

  const loadItems = async () => {
    setListLoading(true);
    try {
      const res = await fetch(`/api/admin/media/list?kind=${kind}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "목록을 불러오지 못했습니다.");
        return;
      }

      setItems(data.items || []);
    } catch {
      setErrorText("목록 조회 중 네트워크 오류가 발생했습니다.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [kind]);

  const uploadFile = async () => {
    if (!file) {
      setErrorText("업로드할 파일을 선택해 주세요.");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorText("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "업로드에 실패했습니다.");
        return;
      }

      setMessage("업로드되었습니다.");
      setFile(null);
      await loadItems();
    } catch {
      setErrorText("업로드 중 네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (path: string) => {
    const ok = window.confirm("정말 삭제하시겠습니까?");
    if (!ok) return;

    setErrorText("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/media/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind,
          path,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "삭제에 실패했습니다.");
        return;
      }

      setMessage("삭제되었습니다.");
      await loadItems();
    } catch {
      setErrorText("삭제 중 네트워크 오류가 발생했습니다.");
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("URL이 복사되었습니다.");
    } catch {
      setErrorText("URL 복사에 실패했습니다.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-black text-emerald-700">MEDIA CMS</div>
              <h1 className="mt-2 text-3xl font-black">{title}</h1>
              <p className="mt-2 text-slate-600">
                이미지, PDF, 문서를 업로드하고 공개 URL을 복사해서 이벤트/부스/문서 관리에 사용합니다.
              </p>
            </div>

            <div className="w-full max-w-xs">
              <label className="mb-2 block text-sm font-bold">업로드 종류</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as "media" | "docs")}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="media">이미지 / 미디어</option>
                <option value="docs">문서 / PDF</option>
              </select>
            </div>
          </div>

          {message ? (
            <div className="mt-4 rounded-xl bg-emerald-100 px-4 py-3 font-bold text-emerald-700">
              {message}
            </div>
          ) : null}

          {errorText ? (
            <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700">
              {errorText}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-bold">파일 선택</label>
              <input
                type="file"
                accept={kind === "media" ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              />
              <div className="mt-2 text-sm text-slate-500">
                {kind === "media"
                  ? "이미지 파일 업로드용입니다."
                  : "PDF, 워드, 엑셀, 파워포인트, 텍스트 파일 업로드용입니다."}
              </div>
            </div>

            <button
              type="button"
              onClick={uploadFile}
              disabled={loading}
              className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-60"
            >
              {loading ? "업로드 중..." : "업로드"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black">업로드 파일 목록</h2>
            <div className="text-sm font-bold text-slate-500">
              {listLoading ? "불러오는 중..." : `총 ${items.length.toLocaleString()}개`}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-3 py-3">파일명</th>
                  <th className="px-3 py-3">타입</th>
                  <th className="px-3 py-3">크기</th>
                  <th className="px-3 py-3">수정시각</th>
                  <th className="px-3 py-3">작업</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      업로드된 파일이 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.path} className="border-b border-slate-100 align-top">
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.path}</div>
                      </td>
                      <td className="px-3 py-3">{item.mimetype || "-"}</td>
                      <td className="px-3 py-3">
                        {item.size ? `${(item.size / 1024).toFixed(1)} KB` : "-"}
                      </td>
                      <td className="px-3 py-3">
                        {item.updated_at
                          ? new Date(item.updated_at).toLocaleString("ko-KR")
                          : "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                          >
                            열기
                          </a>

                          <button
                            type="button"
                            onClick={() => copyUrl(item.url)}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                          >
                            URL 복사
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteItem(item.path)}
                            className="rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}