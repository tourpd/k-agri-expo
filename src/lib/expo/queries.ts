import { ExpoHomeData } from "@/types/expo";

export async function getExpoHomeData(): Promise<ExpoHomeData> {
  return {
    heroItems: [
      {
        id: "hero-1",
        title: "🔥 EXPO 한정 특가",
        subtitle: "싹쓰리충 / 멸규니 최대 30% 할인",
        imageUrl:
          "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600&auto=format&fit=crop",
        buttonText: "특가 보러가기",
        secondaryButtonText: "상담 신청",
        targetType: "deal",
        targetUrl: "/expo/deals",
        audienceType: "all",
        isActive: true,
        priority: 1,
      },
      {
        id: "hero-2",
        title: "🚀 이달의 신제품 공개",
        subtitle: "한국농수산TV 단독 런칭 제품을 먼저 만나보세요",
        imageUrl:
          "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1600&auto=format&fit=crop",
        buttonText: "신제품 보기",
        secondaryButtonText: "제품 상담",
        targetType: "event",
        targetUrl: "/expo/new",
        audienceType: "all",
        isActive: true,
        priority: 2,
      },
      {
        id: "hero-3",
        title: "📺 라이브 방송 예정",
        subtitle: "대표가 직접 설명하는 박람회 라이브",
        imageUrl:
          "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=1600&auto=format&fit=crop",
        buttonText: "라이브 예약",
        secondaryButtonText: "미리보기",
        targetType: "live",
        targetUrl: "/expo/live",
        audienceType: "all",
        isActive: true,
        priority: 3,
      },
      {
        id: "hero-4",
        title: "⚠️ 총채벌레 긴급 대응",
        subtitle: "지금 많이 찾는 병해충 대응 솔루션을 확인하세요",
        imageUrl:
          "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?q=80&w=1600&auto=format&fit=crop",
        buttonText: "해결방법 보기",
        secondaryButtonText: "상담 요청",
        targetType: "crm_form",
        targetUrl: "/expo/problem/thrips",
        audienceType: "farmer",
        isActive: true,
        priority: 4,
      },
      {
        id: "hero-5",
        title: "🌍 해외 비료/자재 공급 연결",
        subtitle: "인도 · 인도네시아 · 태국 공급사와 연결합니다",
        imageUrl:
          "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?q=80&w=1600&auto=format&fit=crop",
        buttonText: "해외관 보기",
        secondaryButtonText: "수입 상담",
        targetType: "external",
        targetUrl: "/expo/global",
        audienceType: "buyer",
        isActive: true,
        priority: 5,
      },
    ],
    actions: [
      {
        key: "deals",
        title: "농민 특가",
        description: "지금 바로 확인",
        href: "/expo/deals",
        icon: "🔥",
      },
      {
        key: "consult",
        title: "농사 AI 상담",
        description: "문제 해결 시작",
        href: "/expo/consult",
        icon: "📞",
      },
      {
        key: "new",
        title: "신제품 보기",
        description: "이달의 제품",
        href: "/expo/new",
        icon: "🚀",
      },
      {
        key: "join",
        title: "기업 참가 신청",
        description: "부스 입점 문의",
        href: "/expo/join",
        icon: "🏢",
      },
    ],
    explore: [
      {
        key: "crop",
        title: "작물별",
        items: [
          { label: "마늘", href: "/expo/crop/garlic" },
          { label: "고추", href: "/expo/crop/pepper" },
          { label: "딸기", href: "/expo/crop/strawberry" },
          { label: "오이", href: "/expo/crop/cucumber" },
          { label: "벼", href: "/expo/crop/rice" },
        ],
      },
      {
        key: "problem",
        title: "문제별",
        items: [
          { label: "병해충", href: "/expo/problem" },
          { label: "비대불량", href: "/expo/problem/enlargement" },
          { label: "생육부진", href: "/expo/problem/growth" },
          { label: "토양문제", href: "/expo/problem/soil" },
        ],
      },
      {
        key: "season",
        title: "시기별",
        items: [
          { label: "정식기", href: "/expo/season/planting" },
          { label: "생육기", href: "/expo/season/growing" },
          { label: "수확기", href: "/expo/season/harvest" },
        ],
      },
      {
        key: "category",
        title: "카테고리별",
        items: [
          { label: "비료", href: "/expo/category/fertilizer" },
          { label: "영양제", href: "/expo/category/nutrient" },
          { label: "친환경", href: "/expo/category/eco" },
          { label: "농기계", href: "/expo/category/machine" },
        ],
      },
      {
        key: "brand",
        title: "브랜드관",
        items: [
          { label: "도프", href: "/expo/brand/dof" },
          { label: "대풍기계", href: "/expo/brand/daepoong" },
          { label: "한국농수산TV", href: "/expo/brand/kaftv" },
        ],
      },
      {
        key: "global",
        title: "해외관",
        items: [
          { label: "인도", href: "/expo/global/india" },
          { label: "인도네시아", href: "/expo/global/indonesia" },
          { label: "태국", href: "/expo/global/thailand" },
        ],
      },
    ],
    stats: {
      todayConsultCount: 128,
      hotLeadCount: 32,
      liveNowCount: 2,
      endingDealsCount: 5,
    },
    recommendedVideos: [
      {
        id: "video-1",
        title: "총채벌레 대응 핵심 정리",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1200&auto=format&fit=crop",
        href: "/expo/video/1",
        boothHref: "/expo/brand/kaftv",
      },
      {
        id: "video-2",
        title: "마늘 비대기 관리 포인트",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop",
        href: "/expo/video/2",
        boothHref: "/expo/crop/garlic",
      },
      {
        id: "video-3",
        title: "이달의 신제품 미리보기",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1200&auto=format&fit=crop",
        href: "/expo/video/3",
        boothHref: "/expo/new",
      },
    ],
  };
}