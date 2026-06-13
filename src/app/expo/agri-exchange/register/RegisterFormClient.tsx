"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function RegisterFormClient({
  createAsset,
}: {
  createAsset: (formData: FormData) => Promise<void>;
}) {
  const [qty, setQty] = useState("30");
  const [price, setPrice] = useState("4000");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const totalValue = useMemo(() => {
    const q = Number(qty || 0);
    const p = Number(price || 0);
    if (!Number.isFinite(q) || !Number.isFinite(p)) return 0;
    return q * p;
  }, [qty, price]);

  const youtubeId = getYoutubeId(youtubeUrl);

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-4 text-black">
      <div className="mx-auto max-w-[1500px]">
        <Link href="/expo" className="inline-flex rounded-xl bg-black px-5 py-3 font-black text-white">
          ← K-Agri Expo
        </Link>

        <form action={createAsset} className="mt-5 border border-black bg-white">
          <div className="border-b border-black p-5">
            <p className="font-black text-green-700">K-AGRI 농산물거래소 ASSET REGISTRATION</p>
            <h1 className="mt-1 text-4xl font-black">내 농산물 자산 등록카드</h1>
            <p className="mt-2 font-bold text-gray-700">
              사진·성적서·유튜브·창고상태·규격별 가격까지 한 번에 등록합니다.
            </p>
          </div>

          <Section title="1. 기본 정보">
            <Row label="자산명">
              <Input name="asset_name" placeholder="경북 영천 마늘 30톤" required />
            </Row>
            <Grid>
              <Cell label="품목"><Input name="product_name" placeholder="마늘" /></Cell>
              <Cell label="품종"><Input name="variety_name" placeholder="대서, 홍산" /></Cell>
              <Cell label="생산자"><Input name="producer_name" placeholder="김용식" /></Cell>
              <Cell label="산지"><Input name="producer_region" placeholder="경북 영천" /></Cell>
              <Cell label="수확일"><Input name="harvest_date" type="date" placeholder="" /></Cell>
              <Cell label="등급"><Input name="main_grade" placeholder="특, 상, 중" /></Cell>
            </Grid>
          </Section>

          <Section title="2. 재고 · 규격 · 가격">
            <Grid>
              <Cell label="규격"><Input name="size_spec" placeholder="대서 대과" /></Cell>
              <Cell label="총수량">
                <input name="total_quantity" value={qty} onChange={(e) => setQty(e.target.value)} type="number" className="w-full p-3 font-bold outline-none" />
              </Cell>
              <Cell label="단위">
                <select name="unit" className="w-full bg-white p-3 font-black outline-none">
                  <option value="톤">톤</option>
                  <option value="kg">kg</option>
                  <option value="박스">박스</option>
                  <option value="망">망</option>
                  <option value="포대">포대</option>
                </select>
              </Cell>
              <Cell label="희망단가">
                <input name="expected_price" value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="w-full p-3 font-bold outline-none" />
              </Cell>
              <Cell label="예상금액">
                <div className="p-3 font-black text-green-700">
                  {totalValue.toLocaleString("ko-KR")}원
                </div>
              </Cell>
              <Cell label="거래상태">
                <select name="status" className="w-full bg-white p-3 font-black outline-none">
                  <option value="거래가능">거래가능</option>
                  <option value="상담중">상담중</option>
                  <option value="예약중">예약중</option>
                </select>
              </Cell>
            </Grid>
          </Section>

          <Section title="3. 저장 · 창고 인증 · 품질">
            <Grid>
              <Cell label="보관위치"><Input name="storage_location" placeholder="영천 저온창고" /></Cell>
              <Cell label="저장방식"><Input name="storage_method" placeholder="저온저장" /></Cell>
              <Cell label="창고인증">
                <label className="flex items-center gap-2 p-3 font-black text-green-700">
                  <input type="checkbox" name="live_certified" />
                  LIVE 창고인증 가능
                </label>
              </Cell>
              <Cell label="품질점수"><div className="p-3 font-black text-gray-500">자동 산정 예정</div></Cell>
              <Cell label="AI판매점수"><div className="p-3 font-black text-gray-500">자동 산정 예정</div></Cell>
              <Cell label="추천채널"><div className="p-3 font-black">K-Agri 농산물거래소</div></Cell>
            </Grid>
            <textarea
              name="storage_status"
              className="h-24 w-full border-t border-black p-4 font-bold outline-none"
              placeholder="예: 3도 저온창고 보관, 선별 완료, 박스 포장 가능, 즉시 출하 가능"
            />
          </Section>

          <Section title="4. 사진 · 영상 · 성적서 업로드">
            <div className="grid border-t border-black md:grid-cols-3">
              <UploadBox
                title="농산물 사진 업로드"
                name="photos"
                accept="image/*"
                multiple
                desc="마늘, 박스, 창고, 선별상태 사진을 여러 장 올리세요."
              />

              <div className="border-b border-black p-4 md:border-r">
                <div className="font-black">유튜브 영상 링크</div>
                <input
                  name="youtube_url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="mt-3 w-full border border-black p-3 font-bold"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-black">
                  {youtubeId ? (
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-black text-white">
                      영상 미리보기
                    </div>
                  )}
                </div>
              </div>

              <UploadBox
                title="성적서 / 인증서 업로드"
                name="documents"
                accept="image/*,.pdf"
                multiple
                desc="잔류농약검사, GAP, 성적서, 인증서 파일을 올리세요."
              />
            </div>
          </Section>

          <Section title="5. 규격별 재고 · 가격 분석">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <Th>규격</Th><Th>재고</Th><Th>예상단가</Th><Th>예상가치</Th><Th>추천판매처</Th>
                  </tr>
                </thead>
                <tbody>
                  {["대", "중", "소"].map((v) => (
                    <tr key={v}>
                      <Td>{v}</Td>
                      <Td><input name={`spec_${v}_stock`} className="w-full p-2 outline-none" placeholder="10톤" /></Td>
                      <Td><input name={`spec_${v}_price`} className="w-full p-2 outline-none" placeholder="4,000원" /></Td>
                      <Td><input name={`spec_${v}_value`} className="w-full p-2 outline-none" placeholder="40,000,000원" /></Td>
                      <Td><input name={`spec_${v}_channel`} className="w-full p-2 outline-none" placeholder="급식·식자재·가공공장" /></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="6. 메모 · 거래 조건">
            <textarea
              name="memo"
              className="h-28 w-full border-t border-black p-4 font-bold outline-none"
              placeholder="포장 가능 여부, 출하 가능일, 선별 상태, 거래 조건 등을 입력하세요."
            />
          </Section>

          <div className="sticky bottom-0 flex gap-3 border-t border-black bg-white p-4">
            <button className="flex-1 rounded-xl bg-green-700 px-6 py-5 text-2xl font-black text-white">
              농산물 자산 등록
            </button>
            <Link href="/expo/agri-exchange/market" className="rounded-xl bg-black px-6 py-5 text-2xl font-black text-white">
              거래소 보기
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

function getYoutubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&?/]+)/);
  return m?.[1] ?? "";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-b border-black"><div className="bg-gray-100 px-4 py-3 font-black">{title}</div>{children}</section>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid border-t border-black md:grid-cols-[180px_1fr]"><div className="border-b border-black bg-gray-50 p-3 font-black md:border-r">{label}</div><div className="border-b border-black">{children}</div></div>;
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid border-t border-black md:grid-cols-3">{children}</div>;
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-[110px_1fr] border-b border-black md:border-r"><div className="bg-gray-50 p-3 font-black">{label}</div><div className="border-l border-black">{children}</div></div>;
}

function Input({ name, placeholder, type = "text", required = false }: { name: string; placeholder: string; type?: string; required?: boolean }) {
  return <input name={name} type={type} placeholder={placeholder} required={required} className="w-full p-3 font-bold outline-none" />;
}

function UploadBox({ title, name, accept, multiple, desc }: { title: string; name: string; accept: string; multiple?: boolean; desc: string }) {
  return (
    <div className="border-b border-black p-4 md:border-r">
      <div className="font-black">{title}</div>
      <label className="mt-3 flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-green-700 bg-green-50 text-center font-black text-green-800">
        <span className="text-3xl">＋</span>
        <span>파일 선택</span>
        <span className="mt-2 px-4 text-sm text-gray-600">{desc}</span>
        <input name={name} type="file" accept={accept} multiple={multiple} className="hidden" />
      </label>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border border-black p-2 text-left font-black">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border border-black p-2 font-bold">{children}</td>;
}
