import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/admin-auth";
import { safeEqualText } from "@/lib/security/signed-session";

/**
 * K-AGRI365 엑스포 출입 관리 (Next 16 proxy)
 *
 * 이전에는 프로젝트 맨 위의 proxy.ts가 src/app 구조에서 인식되지 않아
 * 관리자 화면·관리자 API가 로그인 없이 열려 있었습니다.
 *
 * 1) 관리자 화면  → 서명된 관리자 쿠키가 없으면 /admin/login 으로
 * 2) 관리자 API   → 없으면 401
 * 3) 기업 API     → 관리자 또는 로그인한 입점기업만
 * 4) 점검용 API   → 운영 사이트에서 차단 (404)
 * 5) 비용·문자·로그인 API → IP당 횟수 제한
 */

// ─────────────────────────────────────────────
// 경로 규칙
// ─────────────────────────────────────────────

function startsWithAny(path: string, prefixes: string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

/** 관리자만 보는 화면 */
const ADMIN_PAGES = [
  "/admin",
  "/expo/admin",
  "/expo/crop-nutrition", // 관리자 편집 화면이 공개 주소에 놓여 있었음
  "/photodoctor-recommend-rules", // 추천 규칙 관리 화면
];
const ADMIN_PAGE_EXCEPTIONS = ["/admin/login"];

/** 관리자만 쓰는 API (관리 도구, AI 제작 도구, 영상·작가실 등) */
const ADMIN_APIS = [
  "/api/admin",
  "/api/live/admin",
  "/api/ai",
  "/api/translate",
  "/api/creative-room",
  "/api/kagri-writers-room",
  "/api/ai-sales",
  "/api/studio",
  "/api/pv5",
  "/api/kagri-core",
  "/api/send-sms",
  "/api/farmer/auto-import",
  "/api/vendor/hanmi-products",
];
/** 관리자 API 중 로그인 전에 열려 있어야 하는 것 (자체 확인 있음) */
const ADMIN_API_EXCEPTIONS = [
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/bank/import-notification", // 휴대폰 입금 알림 → 라우트가 토큰 확인
];

/** 관리자 또는 로그인한 입점기업만 쓰는 API (라우트에 로그인 확인이 없던 것들) */
const VENDOR_APIS = [
  "/api/ai/youtube-analyzer",
  "/api/ai/product-analyzer",
  "/api/vendor/ai-growth-files",
  "/api/vendor/ai-growth-interview",
  "/api/vendor/ai-growth-report",
  "/api/vendor/auto-import",
  "/api/vendor/brand-assets",
  "/api/vendor/brand-events",
  "/api/vendor/brand-hall",
  "/api/vendor/brand-products",
  "/api/vendor/catalog-import",
  "/api/vendor/content",
  "/api/vendor/inquiries",
  "/api/vendor/leads",
  "/api/vendor/order-status",
  "/api/vendor/product-deep-analysis",
  "/api/vendor/manage",
  "/api/expo/vendor",
];

/** 점검·디버그용 → 운영에서 차단 */
function isBlockedDebugApi(path: string): boolean {
  if (startsWithAny(path, ["/api/debug", "/api/expo/debug-entry"])) return true;
  if (path.startsWith("/api/kagri-core/") && path.includes("probe")) return true;
  return false;
}

/** IP당 횟수 제한: [경로들, 허용 횟수, 시간(초)] */
const RATE_LIMITS: Array<{ prefixes: string[]; limit: number; windowSec: number; name: string }> = [
  { name: "admin-login", prefixes: ["/api/admin/login", "/api/vendor/login", "/api/login"], limit: 10, windowSec: 600 },
  { name: "sms", prefixes: ["/api/live/join", "/api/live/code", "/api/live/verify"], limit: 10, windowSec: 600 },
  { name: "ai-public", prefixes: ["/api/vision", "/api/ai-consult", "/api/ocr", "/api/vendor/upload-business-license"], limit: 20, windowSec: 600 },
  {
    name: "forms",
    prefixes: ["/api/vendor/apply", "/api/upload-image", "/api/agri/register", "/api/booth-leads", "/api/expo/inquiry", "/api/expo/lead", "/api/lead", "/api/leads", "/api/expo/consult-leads"],
    limit: 30,
    windowSec: 600,
  },
];

// ─────────────────────────────────────────────
// 횟수 제한 (서버 인스턴스별 메모리. 대량 남용을 막는 1차 방어선)
// ─────────────────────────────────────────────

const hits = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

function overLimit(key: string, limit: number, windowSec: number): boolean {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  }
  const cur = hits.get(key);
  if (!cur || cur.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return false;
  }
  cur.count += 1;
  return cur.count > limit;
}

// ─────────────────────────────────────────────
// 신원 확인
// ─────────────────────────────────────────────

async function isAdmin(req: NextRequest): Promise<boolean> {
  return !!(await verifyAdminToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value));
}

async function isVendor(req: NextRequest): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) return false;

  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {
          /* 여기서는 세션을 갱신하지 않음 */
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return false;

    const admin = createClient(url, service, { auth: { persistSession: false } });
    const checks = [
      admin.from("vendors").select("user_id").eq("user_id", user.id).limit(1),
      admin.from("booths").select("booth_id").eq("vendor_user_id", user.id).limit(1),
      admin.from("booths").select("booth_id").eq("owner_user_id", user.id).limit(1),
    ];
    for (const check of checks) {
      const { data, error } = await check;
      if (!error && Array.isArray(data) && data.length > 0) return true;
    }
    return false;
  } catch (error) {
    console.error("[proxy] vendor check error:", error);
    return false;
  }
}

function unauthorized(message = "로그인이 필요합니다.", status = 401) {
  return NextResponse.json({ success: false, ok: false, error: message }, { status });
}

// ─────────────────────────────────────────────
// 본체
// ─────────────────────────────────────────────

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 4) 점검용 API 차단
  if (isBlockedDebugApi(path)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 5) 횟수 제한
  if (path.startsWith("/api/") && req.method !== "GET") {
    for (const rule of RATE_LIMITS) {
      if (startsWithAny(path, rule.prefixes)) {
        if (overLimit(`${rule.name}:${clientIp(req)}`, rule.limit, rule.windowSec)) {
          return unauthorized("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", 429);
        }
        break;
      }
    }
  }

  // 1) 관리자 화면
  if (startsWithAny(path, ADMIN_PAGES) && !startsWithAny(path, ADMIN_PAGE_EXCEPTIONS)) {
    if (await isAdmin(req)) return NextResponse.next();
    const to = req.nextUrl.clone();
    to.pathname = "/admin/login";
    to.search = `?next=${encodeURIComponent(path + req.nextUrl.search)}`;
    return NextResponse.redirect(to);
  }

  // 3) 기업 API (관리자 API 규칙보다 먼저: /api/ai/youtube-analyzer 등)
  if (startsWithAny(path, VENDOR_APIS)) {
    if ((await isAdmin(req)) || (await isVendor(req))) return NextResponse.next();
    return unauthorized("입점기업 로그인이 필요합니다.");
  }

  // 2) 관리자 API
  if (startsWithAny(path, ADMIN_APIS) && !startsWithAny(path, ADMIN_API_EXCEPTIONS)) {
    // Vercel 크론: CRON_SECRET이 설정돼 있으면 Bearer 토큰으로 통과
    if (path === "/api/admin/cron-all") {
      const secret = process.env.CRON_SECRET?.trim() || "";
      const auth = req.headers.get("authorization") || "";
      if (secret && safeEqualText(auth, `Bearer ${secret}`)) return NextResponse.next();
    }
    if (await isAdmin(req)) return NextResponse.next();
    return unauthorized("관리자 로그인이 필요합니다.");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/expo/admin",
    "/expo/admin/:path*",
    "/expo/crop-nutrition",
    "/photodoctor-recommend-rules",
    "/api/:path*",
  ],
};
