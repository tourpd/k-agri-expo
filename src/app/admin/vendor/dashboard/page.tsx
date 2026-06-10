import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Step = {
  title: string;
  done: boolean;
  href: string;
};

const steps: Step[] = [
  { title: "로고 등록", done: false, href: "/vendor/brand-hall" },
  { title: "대표 배너 등록", done: false, href: "/vendor/brand-hall" },
  { title: "회사 소개 작성", done: false, href: "/vendor/brand-hall" },
  { title: "제품 1개 등록", done: false, href: "/vendor/products/new" },
  { title: "제품 3개 등록", done: false, href: "/vendor/products" },
  { title: "공동구매 등록", done: false, href: "/vendor/events" },
  { title: "샘플 이벤트 등록", done: false, href: "/vendor/events" },
  { title: "브랜드관 공개 요청", done: false, href: "/vendor/brand-hall" },
];

export default function VendorDashboardPage() {
  const doneCount = steps.filter((x) => x.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  return (
    <main className="min-h-screen bg-neutral-100 p-3 md:p-5">
      <section className="mb-3 rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs font-black text-green-700">
              K-AGRI VENDOR CENTER
            </div>
            <h1 className="mt-1 text-3xl font-black">업체 운영 대시보드</h1>
            <p className="mt-2 text-sm font-bold text-neutral-600">
              승인 후 브랜드관을 완성하고, 제품·이벤트·상담을 관리하는 업체 홈입니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <Stat title="완성도" value={`${progress}%`} tone="green" />
            <Stat title="등록제품" value="0개" />
            <Stat title="공동구매" value="0건" tone="amber" />
            <Stat title="상담문의" value="0건" tone="blue" />
            <Stat title="공개상태" value="준비중" tone="red" />
          </div>
        </div>
      </section>

      <section className="mb-3 grid gap-3 xl:grid-cols-[1fr_420px]">
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">다음에 해야 할 일</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <MainAction
              title="브랜드관 꾸미기"
              desc="로고, 배너, 회사소개를 먼저 등록하세요."
              href="/vendor/brand-hall"
            />
            <MainAction
              title="제품 등록하기"
              desc="관별 제품 등록폼으로 제품을 올립니다."
              href="/vendor/products/new"
            />
            <MainAction
              title="공동구매 만들기"
              desc="농민에게 바로 보여줄 판매 이벤트를 만듭니다."
              href="/vendor/events"
            />
            <MainAction
              title="상담 문의 보기"
              desc="농민 문의와 샘플 신청을 확인합니다."
              href="/vendor/leads"
            />
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">브랜드관 공개 체크리스트</h2>

          <div className="mt-4 space-y-2">
            {steps.map((step, index) => (
              <Link
                key={step.title}
                href={step.href}
                className={`flex items-center gap-3 rounded-2xl p-3 ${
                  step.done ? "bg-green-50" : "bg-neutral-50"
                }`}
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white ${
                    step.done ? "bg-green-700" : "bg-neutral-400"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`font-black ${
                    step.done ? "text-green-800" : "text-neutral-800"
                  }`}
                >
                  {step.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between px-2">
          <b className="text-lg">운영 현황</b>
          <span className="text-sm font-black text-neutral-500">
            한 줄에 한 건씩 관리합니다
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <Th>구분</Th>
                <Th>상태</Th>
                <Th>내용</Th>
                <Th>최근 업데이트</Th>
                <Th>관리</Th>
              </tr>
            </thead>
            <tbody>
              <Row
                type="브랜드관"
                status="준비중"
                content="로고·배너·회사소개 등록 필요"
                href="/vendor/brand-hall"
              />
              <Row
                type="제품"
                status="미등록"
                content="관별 제품 등록폼 필요"
                href="/vendor/products/new"
              />
              <Row
                type="공동구매"
                status="미등록"
                content="진행중 공동구매 없음"
                href="/vendor/events"
              />
              <Row
                type="상담"
                status="대기"
                content="농민 문의 없음"
                href="/vendor/leads"
              />
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: string;
  tone?: "neutral" | "red" | "amber" | "green" | "blue";
}) {
  const cls =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "green"
      ? "border-green-200 bg-green-50 text-green-700"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-neutral-200 bg-white text-neutral-900";

  return (
    <div className={`rounded-2xl border p-3 text-center ${cls}`}>
      <div className="text-xs font-black">{title}</div>
      <div className="mt-1 text-lg font-black">{value}</div>
    </div>
  );
}

function MainAction({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border bg-white p-5 shadow-sm hover:bg-green-50"
    >
      <div className="text-xl font-black">{title}</div>
      <div className="mt-2 text-sm font-bold leading-6 text-neutral-600">
        {desc}
      </div>
      <div className="mt-4 inline-flex rounded-2xl bg-green-700 px-4 py-2 text-sm font-black text-white">
        바로가기
      </div>
    </Link>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap border-b px-3 py-3 text-left text-xs font-black text-neutral-700">
      {children}
    </th>
  );
}

function Td({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`whitespace-nowrap border-b px-3 py-3 align-middle ${
        strong ? "font-black text-neutral-950" : "font-bold text-neutral-700"
      }`}
    >
      {children}
    </td>
  );
}

function Row({
  type,
  status,
  content,
  href,
}: {
  type: string;
  status: string;
  content: string;
  href: string;
}) {
  return (
    <tr>
      <Td strong>{type}</Td>
      <Td>
        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
          {status}
        </span>
      </Td>
      <Td>{content}</Td>
      <Td>-</Td>
      <Td>
        <Link
          href={href}
          className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-black text-white"
        >
          관리
        </Link>
      </Td>
    </tr>
  );
}