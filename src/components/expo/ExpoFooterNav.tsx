import Link from "next/link";

export default function ExpoFooterNav() {
  return (
    <footer className="mt-10 border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">사용자 로그인</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-neutral-600">
              <Link href="/login/farmer">농민 로그인</Link>
              <Link href="/login/vendor">기업 로그인</Link>
              <Link href="/login/buyer">바이어 로그인</Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-neutral-900">박람회 바로가기</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-neutral-600">
              <Link href="/expo/deals">농민 특가</Link>
              <Link href="/expo/consult">농사 AI 상담</Link>
              <Link href="/expo/new">신제품 보기</Link>
              <Link href="/expo/join">기업 참가 신청</Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-neutral-900">운영</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-neutral-600">
              <Link href="/admin">관리자 로그인</Link>
              <Link href="/expo/help">이용안내</Link>
              <Link href="/expo/support">고객센터</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-sm text-neutral-500">
          © K-Agri Expo. 농민 · 기업 · 바이어를 연결하는 온라인 박람회
        </div>
      </div>
    </footer>
  );
}