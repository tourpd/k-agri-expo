"use client";

import { useState } from "react";

type GlobalInquiryFormProps = {
  boothId: string;
  boothName?: string;
};

type FormState = {
  country: string;
  language: string;
  quantity: string;
  message: string;
  contact_name: string;
  email: string;
  phone: string;
};

export default function GlobalInquiryForm({
  boothId,
  boothName = "",
}: GlobalInquiryFormProps) {
  const [form, setForm] = useState<FormState>({
    country: "",
    language: "en",
    quantity: "",
    message: boothName
      ? `I would like to inquire about products from ${boothName}.`
      : "",
    contact_name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice("");
    setErrorNotice("");

    if (!boothId) {
      setErrorNotice("boothId가 없습니다.");
      return;
    }

    if (!form.country.trim()) {
      setErrorNotice("Country를 입력해주세요.");
      return;
    }

    if (!form.message.trim()) {
      setErrorNotice("Inquiry message를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/lead/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booth_id: boothId,
          source_type: "global_inquiry",

          country: form.country.trim(),
          language: form.language.trim(),
          quantity: form.quantity.trim(),

          message: form.message.trim(),
          contact_name: form.contact_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "문의 접수에 실패했습니다.");
      }

      setNotice(
        "Your inquiry has been submitted successfully. Our team will review it and contact you."
      );

      setForm({
        country: "",
        language: "en",
        quantity: "",
        message: boothName
          ? `I would like to inquire about products from ${boothName}.`
          : "",
        contact_name: "",
        email: "",
        phone: "",
      });
    } catch (error) {
      setErrorNotice(
        error instanceof Error
          ? error.message
          : "문의 접수 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <div className="text-xs font-bold tracking-wide text-blue-600">
          GLOBAL BUYER INQUIRY
        </div>
        <h3 className="mt-2 text-2xl font-bold text-neutral-900">
          Overseas Buyer Inquiry
        </h3>
        <p className="mt-2 text-sm leading-7 text-neutral-600">
          Please leave your inquiry below. Our team will review your request
          first and connect you after screening.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <div className="mb-2 text-sm font-medium">Country *</div>
            <input
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              placeholder="e.g. India, Thailand, Indonesia"
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-medium">Language</div>
            <select
              value={form.language}
              onChange={(e) => update("language", e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            >
              <option value="en">English</option>
              <option value="ko">Korean</option>
              <option value="vi">Vietnamese</option>
              <option value="th">Thai</option>
              <option value="id">Indonesian</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <div className="mb-2 text-sm font-medium">Estimated Quantity</div>
            <input
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
              placeholder="e.g. 10 tons / 5 containers / MOQ inquiry"
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            />
          </label>

          <label className="block md:col-span-2">
            <div className="mb-2 text-sm font-medium">Inquiry Message *</div>
            <textarea
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              rows={6}
              placeholder="Please describe the product, quantity, destination, and any requirements."
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-medium">Contact Name</div>
            <input
              value={form.contact_name}
              onChange={(e) => update("contact_name", e.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-medium">Email</div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            />
          </label>

          <label className="block md:col-span-2">
            <div className="mb-2 text-sm font-medium">Phone / WhatsApp</div>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+91 ..., +66 ..., WhatsApp available"
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
          Direct vendor contact is not automatic. Our team reviews your request
          first and then arranges the best match.
        </div>

        {notice && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        {errorNotice && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorNotice}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Send Inquiry"}
          </button>
        </div>
      </form>
    </section>
  );
}