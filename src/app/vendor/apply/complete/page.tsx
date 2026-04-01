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

function getBoothLabel(boothType: string) {
  switch (boothType) {
    case "free":
      return "무료 체험";
    case "basic":
      return "일반 부스";
    case "premium":
      return "프리미엄 부스";
    default:
      return "-";
  }
}

function getDurationLabel(durationKey: string) {
  switch (durationKey) {
    case "1m":
      return "1개월";
    case "3m":
      return "3개월";
    default:
      return "-";
  }
}

function getProductLabel(boothType: string, durationKey: string) {
  const booth = getBoothLabel(boothType);
  const duration = getDurationLabel(durationKey);
  if (booth === "-" || duration === "-") return "-";
  return `${booth} · ${duration}`;
}

export default async function VendorApplyCompletePage({
  searchParams,
}: CompletePageProps) {
  const params = await Promise.resolve(searchParams ?? {});

  const applicationCode = params.application_code?.trim() || "";
  const applicationId = params.application_id?.trim() || "";
  const displayApplicationNo = applicationCode || applicationId || "-";

  const companyName = params.company_name?.trim() || "-";
  const boothType = params.booth_type?.trim() || "";
  const durationKey = params.duration_key?.trim() || "";
  const amountKrw = Number(params.amount_krw ?? "0");
  const phone = params.phone?.trim() || "";

  const boothLabel = getBoothLabel(boothType);
  const durationLabel = getDurationLabel(durationKey);
  const productLabel = getProductLabel(boothType, durationKey);
  const isFree = amountKrw === 0;

  const copyAccountText = `${OPERATIONS.bankName} ${OPERATIONS.accountNumber} / 예금주 ${OPERATIONS.accountHolder}`;
  const copyApplicationText = `신청번호 ${displayApplicationNo} / 회사명 ${companyName} / 신청상품 ${productLabel} / 금액 ${formatKrw(amountKrw)}`;

  const statusHref = (() => {
    const search = new URLSearchParams();

    if (applicationCode) {
      search.set("application_code", applicationCode);
    } else if (applicationId) {
      search.set("application_id", applicationId);
    }

    if (phone.length > 0) {
      search.set("phone", phone);
    }

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
          <div
            className={`text-sm font-black ${
              isFree ? "text-emerald-100" : "text-slate-300"
            }`}
          >
            APPLICATION COMPLETE
          </div>

          <h1 className="mt-3 text-4xl font-black">
            {isFree
              ? "무료 체험 신청이 접수되었습니다"
              : "입점 신청이 접수되었습니다"}
          </h1>

          <p
            className={`mt-4 text-base leading-8 ${
              isFree ? "text-emerald-50" : "text-slate-200"
            }`}
          >
            {isFree
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
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">신청번호</div>
              <div className="mt-1 break-all text-xl font-black">
                {displayApplicationNo}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">회사명</div>
              <div className="mt-1 text-xl font-black">{companyName}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">부스 유형</div>
              <div className="mt-1 text-xl font-black">{boothLabel}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">신청 기간</div>
              <div className="mt-1 text-xl font-black">{durationLabel}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <div className="text-sm font-bold text-slate-500">신청 상품</div>
              <div className="mt-1 text-xl font-black">{productLabel}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <div className="text-sm font-bold text-slate-500">
                {isFree ? "결제 금액" : "입금 금액"}
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-700">
                {formatKrw(amountKrw)}
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

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-900">
              신청정보 저장: {displayApplicationNo} / {companyName}
            </div>

            <Link
              href={statusHref}
              className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
            >
              신청 상태 확인
            </Link>
          </div>
        </section>

        {isFree ? (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-lg">
            <div className="text-sm font-black text-emerald-700">
              FREE TRIAL GUIDE
            </div>
            <h2 className="mt-2 text-2xl font-black">무료 체험 진행 안내</h2>

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
              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm font-bold text-slate-500">은행명</div>
                <div className="mt-1 text-xl font-black">
                  {OPERATIONS.bankName}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm font-bold text-slate-500">계좌번호</div>
                <div className="mt-1 text-xl font-black">
                  {OPERATIONS.accountNumber}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm font-bold text-slate-500">예금주</div>
                <div className="mt-1 text-xl font-black">
                  {OPERATIONS.accountHolder}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <div className="text-sm font-bold text-slate-500">입금 금액</div>
                <div className="mt-1 text-2xl font-black text-emerald-700">
                  {formatKrw(amountKrw)}
                </div>
              </div>
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
            </div>
          </section>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="text-sm font-black text-emerald-700">NEXT STEP</div>
          <h2 className="mt-2 text-2xl font-black">다음 진행 절차</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {isFree ? (
              <>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-black text-emerald-700">01</div>
                  <div className="mt-2 text-lg font-black">신청 접수</div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    무료 체험 신청이 정상 접수되었습니다.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-black text-emerald-700">02</div>
                  <div className="mt-2 text-lg font-black">운영 검토</div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    관리자가 신청 내용을 확인합니다.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-black text-emerald-700">03</div>
                  <div className="mt-2 text-lg font-black">부스 진행</div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    승인 완료 후 부스 생성 또는 연결이 진행됩니다.
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-black text-emerald-700">01</div>
                  <div className="mt-2 text-lg font-black">입금 진행</div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    위 계좌로 정확한 금액을 입금해 주세요.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-black text-emerald-700">02</div>
                  <div className="mt-2 text-lg font-black">관리자 확인</div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    관리자가 입금 확인 후 신청을 승인합니다.
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-black text-emerald-700">03</div>
                  <div className="mt-2 text-lg font-black">부스 생성/오픈</div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    승인 완료 후 부스가 자동 생성되거나 연결됩니다.
                  </div>
                </div>
              </>
            )}
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