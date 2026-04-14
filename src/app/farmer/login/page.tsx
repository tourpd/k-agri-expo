"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export default function FarmerLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleLogin(payload: { email: string; password: string }) {
    setError("");

    try {
      const res = await fetch("/api/farmer/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "농민 로그인에 실패했습니다.");
      }

      router.push("/farmer/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "농민 로그인에 실패했습니다.");
    }
  }

  return (
    <LoginForm
      titleBadge="FARMER LOGIN"
      title="농민 로그인"
      description={
        "농민 회원 이메일과 비밀번호로 로그인합니다.\n로그인 후 상담, 특가, 신청 내역을 확인할 수 있습니다."
      }
      emailLabel="이메일"
      emailPlaceholder="예: farmer@email.com"
      submitLabel="로그인"
      loadingLabel="로그인 중..."
      error={error}
      onSubmit={handleLogin}
      bottomLeft={<Link href="/farmer/signup">농민 회원가입</Link>}
      bottomRight={<Link href="/login-select">← 로그인 선택으로</Link>}
    />
  );
}