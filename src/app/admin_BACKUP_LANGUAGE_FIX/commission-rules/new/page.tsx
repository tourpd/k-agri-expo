import Link from "next/link";
import { createCommissionRule } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function Help({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded border border-slate-300 bg-slate-50 p-3">
      <div className="text-sm font-black text-slate-900">
        {title}
      </div>

      <div className="mt-1 text-xs font-bold text-slate-600">
        {desc}
      </div>
    </div>
  );
}

function Input({
  name,
  label,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string | number;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-black text-slate-900">
        {label}
      </label>

      <input
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-11 w-full rounded border border-slate-300 px-3 text-sm font-bold"
      />
    </div>
  );
}

export default function NewCommissionRulePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex items-end justify-between border-b-2 border-slate-300 pb-4">
          <div>
            <h1 className="text-3xl font-black">
              수수료 규칙 추가
            </h1>

            <p className="mt-2 text-sm font-bold text-slate-600">
              업체·브랜드·상품·라이브별 수수료 정책을 등록합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/commission-rules"
              className="inline-flex h-10 items-center justify-center rounded border border-slate-300 bg-white px-4 text-sm font-black"
            >
              목록
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Help
            title="우선순위"
            desc="숫자가 낮을수록 먼저 적용됩니다."
          />

          <Help
            title="수수료 입력"
            desc="0.18 또는 18 둘 다 가능합니다."
          />

          <Help
            title="권장 구조"
            desc="상품(10) → 브랜드(20) → 업체(30) → 기본(100)"
          />

          <Help
            title="라이브 특가"
            desc="scope=source / order_type=live"
          />
        </div>

        <form
          action={createCommissionRule}
          className="space-y-5 rounded border border-slate-300 bg-white p-5"
        >
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-black">
                규칙 범위
              </label>

              <select
                name="scope_type"
                className="h-11 w-full rounded border border-slate-300 px-3 text-sm font-bold"
                defaultValue="source"
              >
                <option value="source">수익원 기본</option>
                <option value="vendor">업체별</option>
                <option value="brand">브랜드별</option>
                <option value="product">상품별</option>
                <option value="order">주문별</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black">
                수익원 타입
              </label>

              <select
                name="order_type"
                className="h-11 w-full rounded border border-slate-300 px-3 text-sm font-bold"
                defaultValue="general"
              >
                <option value="general">일반</option>
                <option value="photodoctor">포토닥터</option>
                <option value="live">라이브</option>
              </select>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              name="title"
              label="규칙명"
              placeholder="도프 특별계약"
            />

            <Input
              name="commission_rate"
              label="수수료율"
              placeholder="18 또는 0.18"
            />
          </section>

          <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              name="vendor_id"
              label="업체 ID"
              placeholder="vendor uuid"
            />

            <Input
              name="brand_id"
              label="브랜드 ID"
              placeholder="brand uuid"
            />

            <Input
              name="product_id"
              label="상품 ID"
              placeholder="product uuid"
            />

            <Input
              name="order_id"
              label="주문 ID"
              placeholder="order uuid"
            />
          </section>

          <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Input
              name="priority"
              label="우선순위"
              defaultValue={100}
            />

            <Input
              name="starts_at"
              label="시작일"
              placeholder="2026-01-01"
            />

            <Input
              name="ends_at"
              label="종료일"
              placeholder="2026-12-31"
            />
          </section>

          <div className="space-y-2">
            <label className="text-sm font-black">
              메모
            </label>

            <textarea
              name="memo"
              rows={5}
              placeholder="계약 메모"
              className="w-full rounded border border-slate-300 p-3 text-sm font-bold"
            />
          </div>

          <div className="flex items-center gap-3 rounded border border-slate-300 bg-slate-50 p-4">
            <input
              type="hidden"
              name="is_active"
              value="false"
            />

            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked
              className="h-5 w-5"
            />

            <div className="text-sm font-black">
              즉시 활성화
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <Link
              href="/admin/commission-rules"
              className="inline-flex h-11 items-center justify-center rounded border border-slate-300 bg-white px-5 text-sm font-black"
            >
              취소
            </Link>

            <button className="inline-flex h-11 items-center justify-center rounded bg-slate-950 px-6 text-sm font-black text-white">
              수수료 규칙 저장
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}