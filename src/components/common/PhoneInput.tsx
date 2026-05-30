"use client";

import {
  formatPhoneInput,
  parsePhoneInput,
} from "@/lib/formatters";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
};

export default function PhoneInput({
  value,
  onChange,
  placeholder = "010-0000-0000",
  className,
  disabled = false,
  required = false,
  name,
}: PhoneInputProps) {
  return (
    <input
      name={name}
      value={formatPhoneInput(value)}
      onChange={(e) => {
        onChange(parsePhoneInput(e.target.value));
      }}
      inputMode="numeric"
      autoComplete="tel"
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={
        className ||
        "h-14 w-full rounded-2xl border-2 border-slate-300 px-4 text-lg font-bold outline-none focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-400"
      }
    />
  );
}