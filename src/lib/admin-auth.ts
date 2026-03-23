import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "kagri_admin_session";

export function getAdminEnv() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const sessionToken = process.env.ADMIN_SESSION_TOKEN;

  if (!username || !password || !sessionToken) {
    throw new Error(
      "ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_SESSION_TOKEN 환경변수가 필요합니다."
    );
  }

  return { username, password, sessionToken };
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const { sessionToken } = getAdminEnv();

  return session === sessionToken;
}