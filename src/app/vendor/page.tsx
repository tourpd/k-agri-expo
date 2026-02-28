'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { submitVendorDocs, fetchMyDocs, getSignedDocUrl, DocType, VendorDocRowSafe } from './uploadDoc';

export default function VendorPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // ✅ vendors row 존재 여부 = 활성 업체(승인됨)
  const [isActiveVendor, setIsActiveVendor] = useState(false);

  // 인증 입력값
  const [bizType, setBizType] = useState<'individual' | 'corporation'>('individual');
  const [companyName, setCompanyName] = useState('');
  const [ceoName, setCeoName] = useState('');
  const [bizNo, setBizNo] = useState('');

  const [bizFile, setBizFile] = useState<File | null>(null);
  const [corpFile, setCorpFile] = useState<File | null>(null);

  const [docs, setDocs] = useState<VendorDocRowSafe[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) {
        // 로그인 안 되어있으면 로그인 페이지로
        router.replace('/login?next=/vendor');
        return;
      }
      setUserId(u.id);
      setEmail(u.email ?? null);

      await refreshAll(u.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshAll(uid?: string) {
    const vuid = uid ?? userId;
    if (!vuid) return;

    // 1) docs 갱신
    const myDocs = await fetchMyDocs(supabase, vuid);
    setDocs(myDocs);

    // 2) vendors row 존재 여부 확인(활성 업체)
    const { data: vRow, error: vErr } = await supabase
      .from('vendors')
      .select('user_id')
      .eq('user_id', vuid)
      .maybeSingle();

    if (vErr) {
      console.error('vendors check error:', vErr);
      setIsActiveVendor(false);
      return;
    }
    setIsActiveVendor(Boolean(vRow?.user_id));
  }

  async function handleSubmitDocs() {
    if (!userId) return alert('로그인이 필요합니다.');
    if (!bizFile) return alert('사업자등록증(필수)을 업로드해 주세요.');
    if (bizType === 'corporation' && !corpFile) {
      // 정책상 “권장/필수”는 대표님이 결정
      return alert('법인 유형이면 법인등기(선택/필수 여부는 정책대로)를 업로드해 주세요.');
    }

    setLoading(true);
    try {
      await submitVendorDocs({
        supabase,
        userId,
        bizType,
        companyName,
        ceoName,
        bizNo,
        bizFile,
        corpFile: bizType === 'corporation' ? corpFile : null,
      });

      await refreshAll();
      alert('인증 서류 제출이 완료되었습니다. (심사 대기)');
    } catch (e: any) {
      console.error(e);
      alert(`제출 실패: ${e?.message ?? String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview(docId: string, filePath: string) {
    try {
      const url = await getSignedDocUrl(supabase, filePath);
      window.open(url, '_blank');
    } catch (e: any) {
      console.error(e);
      alert(`미리보기 실패: ${e?.message ?? String(e)}`);
    }
  }

  // 참고: docs 안의 승인여부(사업자등록증 approved)
  const verifiedByDoc = useMemo(
    () => docs.some((d) => d.doc_type === 'business_license' && d.status === 'approved'),
    [docs]
  );

  // ✅ 최종적으로 “활성 업체”는 vendors row 기준(승인 API에서 upsert됨)
  const verified = isActiveVendor || verifiedByDoc;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>업체 대시보드</h1>
      <div style={{ color: '#666', marginBottom: 16 }}>
        여기서 내 부스/제품 등록을 하게 됩니다. (LIVE 특판 포함)
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ padding: '6px 10px', border: '1px solid #eee', borderRadius: 999, fontSize: 13 }}>
          user_id: {userId ?? '-'}
        </span>
        <span style={{ padding: '6px 10px', border: '1px solid #eee', borderRadius: 999, fontSize: 13 }}>
          email: {email ?? '-'}
        </span>
        <span
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            fontSize: 13,
            border: '1px solid #eee',
            background: verified ? '#e7ffef' : '#fff7e6',
          }}
        >
          인증상태: {verified ? '✅ 승인(활성 업체)' : '⏳ 미인증/심사중'}
        </span>
      </div>

      {/* ✅ STEP3: 사업자 인증 섹션 */}
      <section style={{ border: '1px solid #eee', borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900 }}>사업자 인증(신뢰도)</h2>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              borderRadius: 999,
              background: verified ? '#e7ffef' : '#f2f2f2',
              border: '1px solid #eaeaea',
              fontSize: 13,
            }}
          >
            {verified ? '🟢 승인(활성 업체)' : '⚪ 미승인'}
          </span>
        </div>

        {!verified ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 800 }}>사업자 유형</label>
                <select
                  value={bizType}
                  onChange={(e) => setBizType(e.target.value as any)}
                  style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #ddd', marginTop: 6 }}
                >
                  <option value="individual">개인사업자</option>
                  <option value="corporation">법인사업자</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 800 }}>상호(회사명)</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="예) 한국농수산TV"
                  style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #ddd', marginTop: 6 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 800 }}>대표자명</label>
                <input
                  value={ceoName}
                  onChange={(e) => setCeoName(e.target.value)}
                  placeholder="예) 조세환"
                  style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #ddd', marginTop: 6 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 800 }}>사업자번호</label>
                <input
                  value={bizNo}
                  onChange={(e) => setBizNo(e.target.value)}
                  placeholder="예) 123-45-67890"
                  style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #ddd', marginTop: 6 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 800 }}>사업자등록증(필수)</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => setBizFile(e.target.files?.[0] ?? null)} />
                <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>이미지 또는 PDF 권장</div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 800 }}>법인등기(법인만, 선택)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={bizType !== 'corporation'}
                  onChange={(e) => setCorpFile(e.target.files?.[0] ?? null)}
                />
                <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>법인 유형이면 추가 업로드 권장</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                onClick={handleSubmitDocs}
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid #111',
                  background: '#111',
                  color: '#fff',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                {loading ? '제출 중...' : '인증 서류 제출(검토 요청)'}
              </button>
              <span style={{ fontSize: 12, color: '#666', alignSelf: 'center' }}>
                * 승인 전에는 “부스/제품 등록(공개)”은 가능하되, LIVE 특판/대량거래/바이어 전용 기능은 승인 후 활성화(권장)
              </span>
            </div>
          </>
        ) : (
          <div style={{ padding: 12, borderRadius: 12, border: '1px solid #e8ffe8', background: '#f3fff6', color: '#1b5e20' }}>
            ✅ 승인 완료되었습니다. 이제 부스/제품 등록 및 운영 기능을 사용할 수 있습니다.
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>내 제출 내역</div>
          {docs.length === 0 ? (
            <div style={{ fontSize: 13, color: '#888' }}>아직 제출한 서류가 없습니다.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {docs.map((d) => (
                <div
                  key={d.id}
                  style={{
                    border: '1px solid #eee',
                    borderRadius: 12,
                    padding: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 13 }}>
                      {d.doc_type === 'business_license' ? '사업자등록증' : '법인등기'}
                      <span style={{ marginLeft: 8, fontWeight: 700, color: '#666' }}>({d.status})</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#777', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.file_path}
                    </div>
                    {d.status === 'rejected' && d.reject_reason ? (
                      <div style={{ fontSize: 12, color: '#b00020', marginTop: 4 }}>반려사유: {d.reject_reason}</div>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handlePreview(d.id, d.file_path)}
                      style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #ddd', background: '#fff' }}
                    >
                      보기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => refreshAll()}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #ddd', background: '#fff', fontWeight: 800 }}
            >
              새로고침
            </button>
          </div>
        </div>
      </section>

      {/* ✅ 다음 단계: “부스/제품 등록” 잠금장치(테이블 몰라도 가능) */}
      <section style={{ border: '1px solid #eee', borderRadius: 16, padding: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>부스/제품 등록</h2>

        {!verified ? (
          <div style={{ padding: 12, borderRadius: 12, border: '1px solid #ffe8c2', background: '#fff8e9', color: '#6b4e00' }}>
            ⏳ 현재는 심사중입니다. 승인 후에 “LIVE 특판/바이어 전용” 기능이 열립니다.
            <div style={{ marginTop: 8, fontSize: 13 }}>
              지금은 <b>서류 제출</b>만 완료해 주세요. (관리자 승인 후 자동 활성)
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/booth')}
              style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #111', background: '#111', color: '#fff', fontWeight: 900 }}
            >
              부스 관리로 이동
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #ddd', background: '#fff', fontWeight: 900 }}
            >
              대시보드로 이동
            </button>
            <span style={{ alignSelf: 'center', fontSize: 12, color: '#666' }}>
              * 제품 등록 테이블명은 아직 몰라도 됩니다. 다음 단계에서 BoothsListClient.tsx 기준으로 연결합니다.
            </span>
          </div>
        )}
      </section>
    </div>
  );
}