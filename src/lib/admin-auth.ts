import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE_NAME = "kagri_admin_session";

export type AdminSession = {
  email: string;
};

export function getAdminEnv() {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD || "").trim();

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

    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);

    if (!parsed?.email) return null;

    return {
      email: parsed.email,
    };
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated() {
  const session = await getAdminSession();
  return !!session;
}

export async function requireAdminUser() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const { adminEmail } = getAdminEnv();

  if (session.email.toLowerCase() !== adminEmail) {
    redirect("/admin/login");
  }

  return session;
}