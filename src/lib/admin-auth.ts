import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE_NAME = "kagri_admin_session";

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

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!raw) return null;

    // 로그인 API에서 base64url로 저장하므로 여기서도 동일하게 읽어야 함
    const decoded = Buffer.from(raw, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded);

    const email =
      typeof parsed?.email === "string" ? parsed.email.trim().toLowerCase() : "";

    if (!email) return null;

    return {
      email,
      role: typeof parsed?.role === "string" ? parsed.role : undefined,
      issuedAt:
        typeof parsed?.issuedAt === "number"
          ? parsed.issuedAt
          : typeof parsed?.ts === "number"
          ? parsed.ts
          : undefined,
      version: typeof parsed?.version === "string" ? parsed.version : undefined,
    };
  } catch (error) {
    console.error("[admin-auth] getAdminSession decode error:", error);
    return null;
  }
}

export async function isAdminAuthenticated() {
  const session = await getAdminSession();
  if (!session?.email) return false;

  try {
    const { adminEmail } = getAdminEnv();
    return session.email === adminEmail;
  } catch (error) {
    console.error("[admin-auth] isAdminAuthenticated env error:", error);
    return false;
  }
}

export async function requireAdminUser() {
  const session = await getAdminSession();

  if (!session?.email) {
    redirect("/admin/login");
  }

  const { adminEmail } = getAdminEnv();

  if (session.email !== adminEmail) {
    redirect("/admin/login");
  }

  return session;
}