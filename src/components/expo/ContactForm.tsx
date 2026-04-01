"use client";

import { useState } from "react";

export default function ContactForm({ boothId }: { boothId: string }) {

  const [done, setDone] = useState(false);

  async function submit(e: any) {
    e.preventDefault();

    const form = new FormData(e.target);

    await fetch("/api/expo/contact", {
      method: "POST",
      body: JSON.stringify({
        booth_id: boothId,
        name: form.get("name"),
        phone: form.get("phone"),
        message: form.get("message"),
      }),
    });

    setDone(true);
  }

  if (done) {
    return <div>상담 요청이 접수되었습니다.</div>;
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 16 }}>

      <input name="name" placeholder="이름" required />

      <input name="phone" placeholder="전화번호" required />

      <textarea name="message" placeholder="문의 내용" />

      <button type="submit">상담 요청</button>

    </form>
  );
}