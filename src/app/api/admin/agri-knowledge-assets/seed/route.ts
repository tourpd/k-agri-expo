import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rows = [
  {
    asset_type: "안이영자료",
    title: "풋고추 밀양지역 품질향상과 병충해 방제",
    crop: "풋고추",
    disease_name: "병충해 종합관리",
    source_name: "안이영 소장 자료",
    source_person: "안이영",
    summary: "시설 풋고추 품질향상과 병충해 방제 교육자료",
    keywords: "풋고추,시설고추,품질향상,병충해",
    use_for: "작물영양관, 병해충솔루션관, 쇼츠 대본, 농민교육 콘텐츠",
    priority: 1,
  },
  {
    asset_type: "병해충정보",
    title: "2026 농작물 병해충 발생정보 제5호",
    crop: "공통",
    disease_name: "병해충 발생정보",
    source_name: "농촌진흥청",
    source_person: "농촌진흥청",
    summary: "시기별 병해충 경보와 방제 참고자료",
    keywords: "병해충,농진청,발생정보,방제",
    use_for: "포토닥터, 병해충 경보, 농민 문자알림, 뉴스 콘텐츠",
    priority: 1,
  },
  {
    asset_type: "안이영자료",
    title: "마늘 재배기술 교육자료",
    crop: "마늘",
    disease_name: "마늘 생육관리",
    source_name: "안이영 소장 자료",
    source_person: "안이영",
    summary: "마늘 재배, 종구, 토양관리, 병해충 관리 교육자료",
    keywords: "마늘,홍산마늘,종구,토양,생육",
    use_for: "홍산마늘 판매페이지, 유튜브 대본, 농민교육",
    priority: 1,
  },
  {
    asset_type: "작물교육",
    title: "양파 저장·출하·가격대응 자료",
    crop: "양파",
    disease_name: "",
    source_name: "K-Agri 현장자료",
    source_person: "조세환 PD",
    summary: "양파 가격폭락, 저장, 출하, 가공전환 대응자료",
    keywords: "양파,가격폭락,저장,출하,가공",
    use_for: "농산물 거래소, KFFR 원료기회, 작가실",
    priority: 2,
  },
  {
    asset_type: "병해충정보",
    title: "고추 탄저병·역병 경보자료",
    crop: "고추",
    disease_name: "탄저병, 역병",
    source_name: "병해충정보",
    source_person: "농업기술센터",
    summary: "고추 주요 병해충 발생 시기와 방제 포인트",
    keywords: "고추,탄저병,역병,방제",
    use_for: "포토닥터, 쇼츠, 문자알림",
    priority: 2,
  }
];

export async function POST() {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("agri_knowledge_assets").insert(rows);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, inserted: rows.length });
}
