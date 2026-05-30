"use client";

import { useRef } from "react";

type Props = {
  label: string;
  desc?: string;
  buttonText?: string;
  accept?: string;
  disabled?: boolean;
  previewUrl?: string | null;
  onChange: (file: File | undefined) => void;
};

export default function UploadBox({
  label,
  desc,
  buttonText = "파일 선택",
  accept = "*",
  disabled = false,
  previewUrl,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-3xl border border-dashed border-green-300 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-extrabold text-stone-900">
            {label}
          </p>

          {desc ? (
            <p className="mt-2 text-base font-bold leading-relaxed text-stone-600">
              {desc}
            </p>
          ) : null}
        </div>

        {previewUrl ? (
          <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
            <img
              src={previewUrl}
              alt="preview"
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex-1 rounded-2xl bg-green-700 px-5 py-4 text-lg font-extrabold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {buttonText}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
    </div>
  );
}