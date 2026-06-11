"use client";

import { useMemo, useState } from "react";

type PremiumKey =
  | "pd_shoot"
  | "super_farmer_review"
  | "ai_sales"
  | "processor_matching"
  | "export_matching";

function onlyNumber(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function formatPhone(value: string) {
  const n = onlyNumber(value).slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 7) return `${n.slice(0, 3)}-${n.slice(3)}`;
  return `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}`;
}

function formatComma(value: string) {
  const n = onlyNumber(value);
  if (!n) return "";
  return Number(n).toLocaleString();
}

export default function AgriRegisterPage() {
  const [form, setForm] = useState({
    product_name: "",
    variety_name: "",
    producer_name: "",
    producer_region: "",
    phone: "",
    storage_location: "",
    total_quantity: "",
    expected_price: "",
    harvest_date: "",
    large_quantity: "",
    medium_quantity: "",
    small_quantity: "",
    storage_method: "저온저장",
    storage_period: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [premium, setPremium] = useState<Record<PremiumKey, boolean>>({
    pd_shoot: false,
    super_farmer_review: false,
    ai_sales: false,
    processor_matching: false,
    export_matching: false,
  });

  const totalFiles = useMemo(
    () => photos.length + videos.length + documents.length,
    [photos.length, videos.length, documents.length]
  );

  function addFiles(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File[]>>
  ) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setter((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  function togglePremium(key: PremiumKey) {
    setPremium((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function updateForm(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePhone(value: string) {
    setForm((prev) => ({ ...prev, phone: formatPhone(value) }));
  }

  function updateQuantity(value: string) {
    setForm((prev) => ({ ...prev, total_quantity: formatComma(value) }));
  }

  function updatePrice(value: string) {
    setForm((prev) => ({ ...prev, expected_price: formatComma(value) }));
  }

  function updateLargeQuantity(value: string) {
    setForm((prev) => ({ ...prev, large_quantity: formatComma(value) }));
  }

  function updateMediumQuantity(value: string) {
    setForm((prev) => ({ ...prev, medium_quantity: formatComma(value) }));
  }

  function updateSmallQuantity(value: string) {
    setForm((prev) => ({ ...prev, small_quantity: formatComma(value) }));
  }

  async function submit() {
    if (!form.product_name || !form.producer_name || !form.producer_region) {
      alert("품목, 생산자, 지역은 꼭 입력해주세요.");
      return;
    }

    setSubmitting(true);

    const requestOptions = Object.entries(premium)
      .filter(([, value]) => value)
      .map(([key]) => key)
      .join(",");

    try {

      const fd = new FormData();

      Object.entries(form).forEach(([k,v])=>{
        fd.append(k,String(v ?? ""));
      });

      fd.append("request_options",requestOptions);
      fd.append("youtube_url",youtubeUrl);

      photos.forEach(file=>{
        fd.append("photos",file);
      });

      videos.forEach(file=>{
        fd.append("videos",file);
      });

      documents.forEach(file=>{
        fd.append("documents",file);
      });

      const res = await fetch("/api/agri/register", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        alert(json.error || "농산물 등록 실패");
        return;
      }

      alert("농산물 자산 등록 완료! 관리자 자산센터에서 확인하세요.");
      window.location.href = `/admin/agri-assets/${json.item.id}`;
    } catch (e) {
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-5xl">
        <section className="mb-4 rounded-3xl bg-green-800 p-6 text-white shadow">
          <p className="text-sm font-black text-green-200">K-AGRI AGRI ASSET REGISTER</p>
          <h1 className="mt-2 text-4xl font-black">농산물 자산 등록센터</h1>
          <p className="mt-3 text-lg font-bold text-green-50">
            창고에 있는 농산물을 사진·영상·성적서와 함께 등록하면 K-Agri가 자산카드로 만들고 판매길을 찾아드립니다.
          </p>
        </section>

        <section className="mb-4 grid gap-3 md:grid-cols-4">
          <Mini title="사진" value={`${photos.length}장`} />
          <Mini title="영상" value={`${videos.length}개`} />
          <Mini title="서류" value={`${documents.length}개`} />
          <Mini title="총파일" value={`${totalFiles}개`} />
        </section>

        <section className="mb-4 rounded-2xl border bg-white p-5">
          <h2 className="text-2xl font-black">1. 기본정보</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input label="품목" value={form.product_name} onChange={(v) => updateForm("product_name", v)} placeholder="예: 홍산마늘, 양파, 감귤, 전복" />
            <Input label="품종" value={form.variety_name} onChange={(v) => updateForm("variety_name", v)} placeholder="예: 홍산, 저장양파, 금실" />
            <Input label="생산자" value={form.producer_name} onChange={(v) => updateForm("producer_name", v)} placeholder="예: 이성준" />
            <Input label="지역" value={form.producer_region} onChange={(v) => updateForm("producer_region", v)} placeholder="예: 충남 홍성" />
            <Input label="연락처" value={form.phone} onChange={updatePhone} placeholder="010-2929-3948" inputMode="numeric" />
            <Input label="저장위치" value={form.storage_location} onChange={(v) => updateForm("storage_location", v)} placeholder="예: 홍성 저온창고" />
            <Input label="수확일" value={form.harvest_date} onChange={(v) => updateForm("harvest_date", v)} placeholder="예: 2026-06-11" />
            <SuffixInput label="보유수량" value={form.total_quantity} onChange={updateQuantity} placeholder="170" suffix="톤" />
            <PriceInput label="희망가격" value={form.expected_price} onChange={updatePrice} placeholder="4,600" />
            <SuffixInput label="대 사이즈 수량" value={form.large_quantity} onChange={updateLargeQuantity} placeholder="50" suffix="톤" />
            <SuffixInput label="중 사이즈 수량" value={form.medium_quantity} onChange={updateMediumQuantity} placeholder="80" suffix="톤" />
            <SuffixInput label="소 사이즈 수량" value={form.small_quantity} onChange={updateSmallQuantity} placeholder="40" suffix="톤" />
            <Input label="저장기간" value={form.storage_period} onChange={(v) => updateForm("storage_period", v)} placeholder="예: 3개월 / 9개월 판매 가능" />
            <label>
              <span className="text-sm font-black text-neutral-700">저장방식</span>
              <select
                value={form.storage_method}
                onChange={(e) => updateForm("storage_method", e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border px-4 font-bold"
              >
                <option value="저온저장">저온저장</option>
                <option value="상온저장">상온저장</option>
                <option value="냉동저장">냉동저장</option>
                <option value="수조보관">수조보관</option>
                <option value="기타">기타</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border bg-white p-5">
          <h2 className="text-2xl font-black">2. 사진 업로드</h2>
          <p className="mt-1 font-bold text-neutral-600">
            규격과 관계없이 휴대폰 사진을 그대로 여러 장 올릴 수 있습니다.
          </p>

          <UploadBox
            title="사진 선택"
            accept="image/*"
            multiple
            onChange={(e) => addFiles(e, setPhotos)}
          />

          <FileList files={photos} empty="아직 사진이 없습니다." />
        </section>

        <section className="mb-4 rounded-2xl border bg-white p-5">
          <h2 className="text-2xl font-black">3. 영상 업로드 / 유튜브 링크</h2>
          <p className="mt-1 font-bold text-neutral-600">
            수확영상, 창고영상, 선별영상, 인터뷰 영상 등을 올리거나 유튜브 주소를 입력합니다.
          </p>

          <UploadBox
            title="영상 선택"
            accept="video/*"
            multiple
            onChange={(e) => addFiles(e, setVideos)}
          />

          <div className="mt-3">
            <label className="text-sm font-black text-neutral-700">유튜브 링크</label>
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border px-4 font-bold"
              placeholder="https://youtube.com/..."
            />
          </div>

          <FileList files={videos} empty="아직 영상 파일이 없습니다." />
        </section>

        <section className="mb-4 rounded-2xl border bg-white p-5">
          <h2 className="text-2xl font-black">4. 성적서·서류 업로드</h2>
          <p className="mt-1 font-bold text-neutral-600">
            품질성적서, 잔류농약검사, GAP, 친환경인증, 원산지증명 등 어떤 파일이든 올릴 수 있습니다.
          </p>

          <UploadBox
            title="서류 선택"
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
            multiple
            onChange={(e) => addFiles(e, setDocuments)}
          />

          <FileList files={documents} empty="아직 서류가 없습니다." />
        </section>

        <section className="mb-4 rounded-2xl border bg-white p-5">
          <h2 className="text-2xl font-black">5. 프리미엄 판매 지원</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Check
              checked={premium.pd_shoot}
              onClick={() => togglePremium("pd_shoot")}
              title="조세환 PD 현장촬영 요청"
              desc="현장촬영, 인터뷰, 저장창고 촬영, 유튜브 업로드"
            />
            <Check
              checked={premium.super_farmer_review}
              onClick={() => togglePremium("super_farmer_review")}
              title="슈퍼농부 검수 요청"
              desc="품질, 규격, 실거래가, 판매전략 검수"
            />
            <Check
              checked={premium.ai_sales}
              onClick={() => togglePremium("ai_sales")}
              title="AI 판매대행 요청"
              desc="김치공장, 깐마늘공장, 식자재, 급식, 수출 바이어 추천"
            />
            <Check
              checked={premium.processor_matching}
              onClick={() => togglePremium("processor_matching")}
              title="가공업체 연결 요청"
              desc="깐마늘, 흑마늘, 즙, 분말, 냉동 등 가공 연결"
            />
            <Check
              checked={premium.export_matching}
              onClick={() => togglePremium("export_matching")}
              title="수출바이어 연결 요청"
              desc="일본, 대만, 베트남, 미국 등 해외 판로 검토"
            />
          </div>
        </section>

        <section className="mb-10 rounded-2xl border bg-white p-5">
          <h2 className="text-2xl font-black">등록 후 진행</h2>
          <div className="mt-4 grid gap-2 text-lg font-black md:grid-cols-5">
            <Step label="등록접수" />
            <Step label="AI 자산카드" />
            <Step label="검수" />
            <Step label="바이어 연결" />
            <Step label="거래·정산" />
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-2xl bg-green-700 py-5 text-2xl font-black text-white"
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? "등록중..." : "농산물 자산 등록하기"}
          </button>
        </section>
      </div>
    </main>
  );
}

function Mini({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-xs font-black text-neutral-500">{title}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Input({
  label,
  placeholder,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "text" | "numeric";
}) {
  return (
    <label>
      <span className="text-sm font-black text-neutral-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        className="mt-1 h-12 w-full rounded-xl border px-4 font-bold"
        placeholder={placeholder}
      />
    </label>
  );
}

function SuffixInput({
  label,
  placeholder,
  value,
  onChange,
  suffix,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
}) {
  return (
    <label>
      <span className="text-sm font-black text-neutral-700">{label}</span>
      <div className="mt-1 flex h-12 overflow-hidden rounded-xl border bg-white">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          className="h-full flex-1 px-4 font-bold outline-none"
          placeholder={placeholder}
        />
        <div className="flex h-full items-center border-l bg-neutral-100 px-4 font-black">
          {suffix}
        </div>
      </div>
    </label>
  );
}

function PriceInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-sm font-black text-neutral-700">{label}</span>
      <div className="mt-1 flex h-12 overflow-hidden rounded-xl border bg-white">
        <div className="flex h-full items-center border-r bg-neutral-100 px-4 font-black">
          kg당
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          className="h-full flex-1 px-4 font-bold outline-none"
          placeholder={placeholder}
        />
        <div className="flex h-full items-center border-l bg-neutral-100 px-4 font-black">
          원
        </div>
      </div>
    </label>
  );
}

function UploadBox({
  title,
  accept,
  multiple,
  onChange,
}: {
  title: string;
  accept: string;
  multiple?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="mt-4 flex min-h-32 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-green-600 bg-green-50 p-6 text-center">
      <input type="file" className="hidden" accept={accept} multiple={multiple} onChange={onChange} />
      <div>
        <p className="text-xl font-black text-green-800">{title}</p>
        <p className="mt-1 text-sm font-bold text-green-700">클릭해서 여러 파일을 한 번에 선택하세요.</p>
      </div>
    </label>
  );
}

function FileList({ files, empty }: { files: File[]; empty: string }) {
  if (files.length === 0) {
    return <p className="mt-3 rounded-xl bg-neutral-100 p-3 text-sm font-bold text-neutral-500">{empty}</p>;
  }

  return (
    <div className="mt-3 grid gap-2">
      {files.map((file, i) => (
        <div key={`${file.name}-${i}`} className="rounded-xl border bg-neutral-50 px-3 py-2 text-sm font-bold">
          {i + 1}. {file.name} / {(file.size / 1024 / 1024).toFixed(2)}MB
        </div>
      ))}
    </div>
  );
}

function Check({
  checked,
  onClick,
  title,
  desc,
}: {
  checked: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left ${
        checked ? "border-green-700 bg-green-50" : "bg-white"
      }`}
    >
      <p className="text-lg font-black">{checked ? "✓ " : "□ "}{title}</p>
      <p className="mt-1 text-sm font-bold text-neutral-600">{desc}</p>
    </button>
  );
}

function Step({ label }: { label: string }) {
  return (
    <div className="rounded-xl bg-neutral-100 p-3 text-center">
      {label}
    </div>
  );
}
