import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signSession, verifySession } from "@/lib/security/signed-session";

export const ADMIN_COOKIE_NAME = "kagri_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12; // 12시간

export type AdminSession = {
  email: string;
  role?: string;
  issuedAt?: number;
  version?: string;
};

export function getAdminEnv() {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL 환경변수가 설정되지 않았습니다.");
  }

  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
  }

  return {
    adminEmail,
    adminPassword,
  };
}

/** 로그인 성공 시 쿠키에 넣을 서명된 토큰을 만듭니다. */
export async function createAdminSessionToken(email: string): Promise<string> {
  return signSession(
    {
      email: email.trim().toLowerCase(),
      role: "admin",
      issuedAt: Date.now(),
      version: "AUTH_SIGNED_v2",
    },
    ADMIN_SESSION_MAX_AGE,
    "admin"
  );
}

/**
 * 쿠키 값(토큰)이 진짜 관리자 세션인지 확인합니다.
 * 서명 위조·만료·관리자 이메일 불일치는 모두 null.
 * proxy와 서버 코드가 함께 씁니다.
 */
export async function verifyAdminToken(
  token: string | undefined | null
): Promise<AdminSession | null> {
  const payload = await verifySession(token, "admin");
  if (!payload) return null;

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!email) return null;

  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!adminEmail || email !== adminEmail) return null;

  return {
    email,
    role: typeof payload.role === "string" ? payload.role : "admin",
    issuedAt: typeof payload.issuedAt === "number" ? payload.issuedAt : undefined,
    version: typeof payload.version === "string" ? payload.version : undefined,
  };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    return await verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  } catch (error) {
    console.error("[admin-auth] getAdminSession error:", error);
    return null;
  }
}

export async function isAdminAuthenticated() {
  const session = await getAdminSession();
  return !!session?.email;
}

export async function requireAdminUser() {
  const session = await getAdminSession();

  if (!session?.email) {
    redirect("/admin-login");
  }

  return session;
}
