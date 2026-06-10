import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CompleteSearchParams = {
  application_code?: string;
  application_id?: string;
  company_name?: string;
  booth_type?: string;
  duration_key?: string;
  amount_krw?: string;
  phone?: string;

  plan_type?: string;
  plan_name?: string;
  billing_cycle?: string;
  billing_label?: string;
  product_limit?: string;
};

type CompletePageProps = {
  searchParams?: CompleteSearchParams | Promise<CompleteSearchParams>;
};

const OPERATIONS = {
  bankName: "기업은행",
  accountNumber: "466-072683-04-011",
  accountHolder: "한국농수산TV",
  contactPhone: "010-8216-1253",
  contactEmail: "tourpd70@gmail.com",
};

function formatKrw(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function normalizePlanType(planType: string, planName: string, amountKrw: number) {
  const v = planType.trim().toLowerCase();
  if (["free", "bronze", "silver", "gold", "enterprise"].includes(v)) return v;

  if (planName.includes("엔터프라이즈")) return "enterprise";
  if (planName.includes("브론즈")) return "bronze";
  if (planName.includes("실버")) return "silver";
  if (planName.includes("골드")) return "gold";
  if (planName.includes("무료")) return "free";

  if (amountKrw === 0) return "free";
  return "";
}

function getPlanLabel(planType: string, fallback: string) {
  switch (planType) {
    case "free":
      return "무료 체험";
    case "bronze":
      return "브론즈";
    case "silver":
      return "실버";
    case "gold":
      return "골드";
    case "enterprise":
      return "엔터프라이즈";
    default:
      return fallback || "-";
  }
}

function getBillingLabel(planType: string, billingCycle: string, fallback: string) {
  if (planType === "free") return "30일 무료체험";
  if (planType === "enterprise") return "별도 협의";
  if (billingCycle === "yearly") return "1년 계약 일시불 · 20% 할인";
  if (billingCycle === "monthly") return "월결제";
  return fallback || "-";
}

function getProductLimit(planType: string, fallback: string) {
  if (fallback) return fallback;

  switch (planType) {
    case "free":
      return "제품 1개";
    case "bronze":
      return "제품 5개";
    case "silver":
      return "제품 10개";
    case "gold":
      return "제품 20개";
    case "enterprise":
      return "제품 무제한";
    default:
      return "-";
  }
}

export default async function VendorApplyCompletePage({
  searchParams,
}: CompletePageProps) {
  const params = await Promise.resolve(searchParams ?? {});

  const applicationCode = params.application_code?.trim() || "";
  const applicationId = params.application_id?.trim() || "";
  const displayApplicationNo = applicationCode || applicationId || "-";

  const companyName = params.company_name?.trim() || "-";
  const amountKrw = Number(params.amount_krw ?? "0");
  const phone = params.phone?.trim() || "";

  const planNameParam = params.plan_name?.trim() || "";
  const rawPlanType = params.plan_type?.trim() || "";
  const planType = normalizePlanType(rawPlanType, planNameParam, amountKrw);

  const billingCycle = params.billing_cycle?.trim() || "";
  const billingLabelParam = params.billing_label?.trim() || "";
  const productLimitParam = params.product_limit?.trim() || "";

  const planLabel = getPlanLabel(planType, planNameParam);
  const billingLabel = getBillingLabel(planType, billingCycle, billingLabelParam);
  const productLimit = getProductLimit(planType, productLimitParam);

  const isEnterprise = planType === "enterprise";
  const isFree = planType === "free";

  const displayAmount = isEnterprise ? "별도 협의" : formatKrw(amountKrw);
  const displayProductLabel =
    planType === "enterprise"
      ? "엔터프라이즈 · 별도 협의"
      : `${planLabel} · ${billingLabel}`;

  const copyAccountText = `${OPERATIONS.bankName} ${OPERATIONS.accountNumber} / 예금주 ${OPERATIONS.accountHolder}`;
  const copyApplicationText = `신청번호 ${displayApplicationNo} / 회사명 ${companyName} / 신청상품 ${displayProductLabel} / 금액 ${displayAmount}`;

  const statusHref = (() => {
    const search = new URLSearchParams();

    if (applicationCode) search.set("application_code", applicationCode);
    else if (applicationId) search.set("application_id", applicationId);

    if (phone) search.set("phone", phone);

    const qs = search.toString();
    return qs ? `/vendor/order-status?${qs}` : "/vendor/order-status";
  })();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-8">
        <section
          className={`rounded-3xl p-8 text-white shadow-2xl ${
            isFree ? "bg-emerald-700" : "bg-slate-900"
          }`}
        >
          <div className="text-sm font-black text-slate-300">
            APPLICATION COMPLETE
          </div>

          <h1 className="mt-3 text-4xl font-black">
            {isFree ? "무료 체험 신청이 접수되었습니다" : "입점 신청이 접수되었습니다"}
          </h1>

          <p className="mt-4 text-base leading-8 text-slate-200">
            {isFree || isEnterprise
              ? "운영팀이 신청 내용을 확인한 뒤 부스 진행 절차를 안내드립니다. 신청번호와 연락처는 꼭 저장해 주세요."
              : "아래 안내에 따라 입금해 주시면 관리자가 확인 후 부스 진행을 시작합니다. 신청번호와 연락처는 꼭 저장해 주세요."}
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="text-sm font-black text-emerald-700">
            APPLICATION INFO
          </div>
          <h2 className="mt-2 text-2xl font-black">신청 내역</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoBox label="신청번호" value={displayApplicationNo} />
            <InfoBox label="회사명" value={companyName} />
            <InfoBox label="신청 플랜" value={planLabel} />
            <InfoBox label="결제 방식" value={billingLabel} />

            <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <div className="text-sm font-bold text-slate-500">신청 상품</div>
              <div className="mt-1 text-xl font-black">{displayProductLabel}</div>
              <div className="mt-2 text-base font-black text-emerald-700">
                {productLimit}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <div className="text-sm font-bold text-slate-500">
                {isFree || isEnterprise ? "결제 금액" : "입금 금액"}
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-700">
                {displayAmount}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-8 text-slate-700">
            <div>
              <b>신청번호 보관:</b> 나중에 신청 상태 확인할 때 필요합니다.
            </div>
            <div>
              <b>회사명/연락처 유지:</b> 신청 시 입력한 연락처 기준으로 조회할 수 있습니다.
            </div>
            <div>
              <b>최종 확인:</b> 신청 상품과 금액이 맞는지 다시 확인해 주세요.
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-900">
            신청정보 저장: {displayApplicationNo} / {companyName}
          </div>
        </section>

        {isFree || isEnterprise ? (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-lg">
            <div className="text-sm font-black text-emerald-700">
              REVIEW GUIDE
            </div>
            <h2 className="mt-2 text-2xl font-black">진행 안내</h2>

            <div className="mt-5 rounded-2xl bg-white p-5 text-sm leading-8 text-slate-700">
              <div>
                <b>1.</b> 운영팀이 신청 내용을 확인합니다.
              </div>
              <div>
                <b>2.</b> 검토 후 벤더 부스 개설 절차가 진행됩니다.
              </div>
              <div>
                <b>3.</b> 추가 확인이 필요하면 등록하신 연락처로 안내드립니다.
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-lg">
            <div className="text-sm font-black text-amber-700">
              BANK TRANSFER GUIDE
            </div>
            <h2 className="mt-2 text-2xl font-black">입금 안내</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoBox label="은행명" value={OPERATIONS.bankName} white />
              <InfoBox label="계좌번호" value={OPERATIONS.accountNumber} white />
              <InfoBox label="예금주" value={OPERATIONS.accountHolder} white />
              <InfoBox label="입금 금액" value={displayAmount} white green />
            </div>

            <div className="mt-5 rounded-2xl bg-white p-5 text-sm leading-8 text-slate-700">
              <div>
                <b>입금자명:</b> 회사명 또는 담당자명으로 맞춰 주세요.
              </div>
              <div>
                <b>입금 기한:</b> 신청 후 가능한 빠르게 입금해 주세요.
              </div>
              <div>
                <b>확인 방법:</b> 관리자가 입금 확인 후 신청 상태를 승인 처리합니다.
              </div>
              <div>
                <b>주의:</b> 다른 이름으로 입금하면 확인이 지연될 수 있습니다.
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-8 text-slate-700">
              <div>
                <b>계좌 정보:</b> {copyAccountText}
              </div>
              <div>
                <b>신청 정보:</b> {copyApplicationText}
              </div>
            </div>
          </section>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="text-sm font-black text-emerald-700">NEXT STEP</div>
          <h2 className="mt-2 text-2xl font-black">다음 진행 절차</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <StepCard
              no="01"
              title={isFree || isEnterprise ? "신청 접수" : "입금 진행"}
              desc={
                isFree || isEnterprise
                  ? "신청이 정상 접수되었습니다."
                  : "위 계좌로 정확한 금액을 입금해 주세요."
              }
            />
            <StepCard
              no="02"
              title="관리자 확인"
              desc="관리자가 신청 내용을 확인합니다."
            />
            <StepCard
              no="03"
              title="부스 생성/오픈"
              desc="승인 완료 후 부스가 자동 생성되거나 연결됩니다."
            />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="text-sm font-black text-emerald-700">SUPPORT</div>
          <h2 className="mt-2 text-2xl font-black">문의 안내</h2>

          <div className="mt-4 space-y-2 text-base leading-8 text-slate-700">
            <div>
              <b>문의 전화:</b> {OPERATIONS.contactPhone}
            </div>
            <div>
              <b>문의 이메일:</b> {OPERATIONS.contactEmail}
            </div>
            <div>
              신청 내용 수정이나 입금 반영이 늦는 경우 위 연락처로 문의해 주세요.
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={statusHref}
              className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white hover:bg-emerald-700"
            >
              신청 상태 확인
            </Link>

            <Link
              href="/vendor/apply"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-900 hover:bg-slate-50"
            >
              다시 신청하기
            </Link>

            <Link
              href="/expo"
              className="rounded-2xl px-5 py-3 font-medium text-slate-500 hover:text-slate-800"
            >
              엑스포 메인으로 →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoBox({
  label,
  value,
  white,
  green,
}: {
  label: string;
  value: string;
  white?: boolean;
  green?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 ${white ? "bg-white" : "bg-slate-50"}`}>
      <div className="text-sm font-bold text-slate-500">{label}</div>
      <div
        className={`mt-1 break-all text-xl font-black ${
          green ? "text-emerald-700" : "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function StepCard({
  no,
  title,
  desc,
}: {
  no: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="text-sm font-black text-emerald-700">{no}</div>
      <div className="mt-2 text-lg font-black">{title}</div>
      <div className="mt-2 text-sm leading-7 text-slate-600">{desc}</div>
    </div>
  );
}