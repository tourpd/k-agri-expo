/**
 * catalog.ts 의 문제 목록을 expo_problems 에 넣는 SQL 로 뽑습니다.
 *
 * 실행:  npx -y tsx scripts/export-problems-seed.mts > supabase/migrations/20261109_seed_problems.sql
 *
 * on conflict 시 '영상 시작 지점·사진·영상 제목'은 건드리지 않아, DB에서 고친 값이 다시 실행해도 보존됩니다.
 */
import { PROBLEMS } from "../src/lib/problems/catalog";

const q = (v: string | null | undefined) => (v == null ? "null" : `'${v.replace(/'/g, "''")}'`);
const arr = (v: readonly string[] | undefined) =>
  !v || v.length === 0 ? "'{}'" : `array[${v.map((x) => q(x)).join(", ")}]::text[]`;

const rows = PROBLEMS.map((p) =>
  [
    q(p.slug),
    q(p.title),
    q(p.crop),
    arr(p.symptoms),
    q(p.summary),
    q(p.cause),
    arr(p.actions),
    q(p.principle),
    arr(p.productKeywords),
    p.noProducts ? "true" : "false",
    p.seasonal ? "true" : "false",
    q(p.videoUrl),
    arr(p.imageUrls),
    q(p.sourceLabel),
    q(p.videoTitle),
    q(p.videoSource),
    p.videoStart != null ? String(p.videoStart) : "null",
  ].join(", "),
);

console.log(`-- 문제 ${PROBLEMS.length}개를 expo_problems 에 입력 (catalog.ts 에서 자동 생성 — 직접 고치지 마세요)
-- 적용: Supabase → SQL Editor → 붙여넣기 → Run. 20261030_problem_market.sql, 20261109_problem_media_columns.sql 을 먼저 적용하세요.

insert into public.expo_problems
  (slug, title, crop_key, symptom_keys, summary, cause, actions, principle, product_keywords, no_products, seasonal, video_url, image_urls, source_label, video_title, video_source, video_start)
values
${rows.map((r) => `  (${r})`).join(",\n")}
on conflict (slug) do update set
  title = excluded.title,
  crop_key = excluded.crop_key,
  symptom_keys = excluded.symptom_keys,
  summary = excluded.summary,
  cause = excluded.cause,
  actions = excluded.actions,
  principle = excluded.principle,
  product_keywords = excluded.product_keywords,
  no_products = excluded.no_products,
  seasonal = excluded.seasonal,
  source_label = excluded.source_label,
  video_url = coalesce(public.expo_problems.video_url, excluded.video_url),
  video_title = coalesce(public.expo_problems.video_title, excluded.video_title),
  video_source = coalesce(public.expo_problems.video_source, excluded.video_source),
  updated_at = now();
`);
