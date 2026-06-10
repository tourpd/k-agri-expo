import HealthGongguLandingTemplate from "@/components/expo/health/HealthGongguLandingTemplate";

export const dynamic = "force-dynamic";

export default function JointHealthPage() {
  return (
    <HealthGongguLandingTemplate
      backHref="/expo"
      productName="MSM 프리미엄 로얄 관절 부스터"
      brandText="한국농수산TV 농민 건강 공동구매"
      headline={`농사는 계속해야 하는데\n관절은 예전 같지 않습니다.`}
      subHeadline="하우스 작업, 밭일, 운반 작업, 쪼그려 앉는 작업이 많은 농민을 위한 관절·연골 건강 공동구매입니다."
      heroImage="/images/msm-banner.png"
      productImage="/images/health/joint/product.png"
      regularPrice={75000}
      salePrice={49900}
      unitText="1병 기준 · 800mg × 60정 · 전국 무료배송"
      joinCount={73}
      goalCount={100}
      bankName="기업은행"
      bankAccount="486-072683-04-011"
      bankHolder="한국농수산TV"
      apiUrl="/api/health/joint-order"
      benefits={[
        "관절·연골 건강 도움",
        "전국 무료배송",
        "하루 1회 간편 섭취",
        "농민 공동구매 특가",
      ]}
      problems={[
        {
          title: "쪼그려 앉는 작업",
          desc: "고추, 마늘, 양파, 딸기 농사는 무릎과 허리에 부담이 큽니다.",
          image: "/images/health/joint/problem-knee.png",
        },
        {
          title: "반복되는 운반 작업",
          desc: "상자, 비료, 농자재를 옮기는 일이 많아 관절 관리가 중요합니다.",
          image: "/images/health/joint/problem-carry.png",
        },
        {
          title: "농사는 멈추기 어렵습니다",
          desc: "몸이 불편해도 농번기에는 쉬기 어렵기 때문에 평소 관리가 필요합니다.",
          image: "/images/health/joint/problem-greenhouse.png",
        },
        {
          title: "부부가 함께 챙기는 건강",
          desc: "부모님, 배우자와 함께 드시기 위해 여러 병 신청하는 농가가 많습니다.",
          image: "/images/health/joint/problem-couple.png",
        },
      ]}
      specs={[
        { label: "제품명", value: "MSM 프리미엄 로얄 관절 부스터" },
        { label: "구성", value: "800mg × 60정" },
        { label: "섭취방법", value: "1일 1회, 1회 2정" },
        { label: "기능성", value: "관절 및 연골 건강에 도움을 줄 수 있음" },
        { label: "제조사", value: "한미양행" },
        { label: "배송", value: "전국 무료배송" },
      ]}
      reviews={[
        {
          name: "충남 부여 고추농가",
          text: "쪼그려 앉는 일이 많아서 무릎이 늘 신경 쓰였는데, 농민 공동구매라 믿고 신청했습니다.",
        },
        {
          name: "경북 구미 시설농가",
          text: "하루 2정이라 챙겨 먹기 편합니다. 부부가 같이 먹으려고 3병 신청했습니다.",
        },
        {
          name: "전남 나주 양파농가",
          text: "농사는 계속해야 하니까 관절 관리는 미리 해야겠다는 생각이 들었습니다.",
        },
        {
          name: "강원 원주 밭작물 농가",
          text: "한국농수산TV에서 공동구매한다니 믿고 주문합니다. 부모님 드리려고 추가 신청했습니다.",
        },
        {
          name: "경남 진주 딸기농가",
          text: "농번기에는 몸이 제일 중요해서 가족용으로 넉넉하게 주문했습니다.",
        },
      ]}
    />
  );
}