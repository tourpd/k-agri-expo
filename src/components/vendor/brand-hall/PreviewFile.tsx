"use client";

type Props = {
  url: string;
  label?: string;
  onDelete?: () => void;
};

export default function PreviewFile({
  url,
  label = "미리보기",
  onDelete,
}: Props) {
  const lower = url.toLowerCase();

  const isPdf = lower.includes(".pdf");
  const isImage =
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".webp") ||
    lower.includes(".gif");

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
        <p className="text-lg font-extrabold text-stone-900">
          {label}
        </p>

        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl bg-red-50 px-3 py-2 text-sm font-extrabold text-red-600"
          >
            삭제
          </button>
        ) : null}
      </div>

      <div className="p-4">
        {isImage ? (
          <div className="overflow-hidden rounded-2xl bg-stone-50">
            <img
              src={url}
              alt={label}
              className="max-h-[420px] w-full object-contain"
            />
          </div>
        ) : null}

        {isPdf ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[140px] items-center justify-center rounded-2xl bg-red-50 text-center text-lg font-extrabold text-red-700 ring-1 ring-red-100"
          >
            PDF 파일 열기
          </a>
        ) : null}

        {!isImage && !isPdf ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[140px] items-center justify-center rounded-2xl bg-stone-100 text-center text-lg font-extrabold text-stone-800"
          >
            파일 열기
          </a>
        ) : null}
      </div>
    </div>
  );
}