import { NextResponse } from "next/server";
import { problemForDiagnosis } from "@/lib/problems/diagnosis";
import { getProblem } from "@/lib/problems/catalog";
import { findAnswerProducts } from "@/lib/problems/products";

export const runtime = "nodejs";

const ALLOW = ["https://plant-doctor-app.vercel.app", "https://kagri-expo.com", "https://www.kagri-expo.com"];

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const ok = ALLOW.includes(origin) || /^https:\/\/plant-doctor[\w-]*\.vercel\.app$/.test(origin);
  return ok ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
}

export function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: { ...cors(req), "Access-Control-Allow-Methods": "GET", "Access-Control-Allow-Headers": "content-type" } });
}

/**
 * 포토닥터가 결과 화면 안에서 처방 카드를 그릴 때 쓰는 API
 * GET /api/dx?crop=토마토&dx=칼슘 결핍
 * → { ok, problem:{slug,title,actions,url}, products:[{name,company,feature,yakbaksa_url,phone}] }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const hit = problemForDiagnosis({ crop: url.searchParams.get("crop") ?? "", dx: url.searchParams.get("dx") ?? "", obs: url.searchParams.get("obs") ?? "" });
  if (!hit) return NextResponse.json({ ok: false, error: "맞는 처방을 찾지 못했습니다." }, { status: 404, headers: cors(req) });
  const p = getProblem(hit.slug)!;
  const products = await findAnswerProducts(p, 3);
  const origin = url.origin;
  return NextResponse.json(
    {
      ok: true,
      problem: { slug: p.slug, title: p.title, summary: p.summary, actions: p.actions, principle: p.principle, url: `${origin}/p/${p.slug}?src=photodoctor` },
      products: products.map((x) => ({
        name: x.name,
        company: x.brandName,
        feature: x.shortDescription,
        yakbaksa_url: x.href.startsWith("/yakbaksa") ? `${origin}${x.href}&from=${p.slug}` : `${origin}${x.href}`,
        phone: x.phone,
        source: x.sourceLabel ?? null,
      })),
    },
    { headers: { ...cors(req), "Cache-Control": "public, max-age=300" } },
  );
}
