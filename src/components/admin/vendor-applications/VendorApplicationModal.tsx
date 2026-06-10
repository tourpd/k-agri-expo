"use client";

export default function VendorApplicationModal({
  open,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel,
  danger = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="text-xl font-black">{title}</div>

        {description ? (
          <div className="mt-3 whitespace-pre-line text-sm font-bold leading-6 text-neutral-600">
            {description}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border px-4 py-2 text-sm font-black"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-black text-white ${
              danger ? "bg-red-600" : "bg-green-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}