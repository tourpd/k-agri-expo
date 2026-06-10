export type CustomerProfile = {
  primaryCustomer: string;
  painPoints: string[];
  purchaseMotives: string[];
  crmTags: string[];
};

export function inferCustomerProfile({
  industry,
  productText,
}: {
  industry: string;
  productText: string;
}): CustomerProfile {
  const text = productText.toLowerCase();

  if (industry === "machinery" || /트랙터|로타리|파종기|수확기|농기계/.test(text)) {
    return {
      primaryCustomer: "대면적 농가, 고령농, 작업시간과 인건비를 줄이고 싶은 농가",
      painPoints: ["인건비", "작업시간", "고장 불안", "보조사업", "A/S 신뢰"],
      purchaseMotives: ["작업 효율", "투자 회수", "내구성", "비교 실험"],
      crmTags: ["농기계관심", "보조사업관심", "대면적농가", "작업시간단축"],
    };
  }

  if (industry === "health" || /관절|근력|혈당|건강|부모님/.test(text)) {
    return {
      primaryCustomer: "중장년층, 부모님 건강 선물 고객, 농작업 피로가 큰 농민",
      painPoints: ["무릎", "허리", "피로", "부모님 건강", "노후 걱정"],
      purchaseMotives: ["가족 선물", "건강 관리", "후기", "재구매"],
      crmTags: ["건강관심", "부모님선물", "중장년", "재구매가능"],
    };
  }

  return {
    primaryCustomer: "농업인, 작물 재배 농가, 현장 문제를 해결하려는 농민",
    painPoints: ["병해충", "수확 손실", "품질 저하", "옆집 비교", "농사 실패 불안"],
    purchaseMotives: ["손해 회피", "공동구매", "현장 사례", "전문가 추천"],
    crmTags: ["농자재관심", "병해충관심", "공동구매대상", "라이브방송대상"],
  };
}
