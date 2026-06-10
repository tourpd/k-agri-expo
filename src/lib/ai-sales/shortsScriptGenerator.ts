export function generateShortsScripts(productName: string) {
  return [
    {
      title: "아줌마 버전",
      script:
        `아줌마!\n왜 고추가 작어?\n몰러~\n그걸 안쳤잖여!\n뭘?\n${productName}!!\n(고추 커진 화면)\n지금 공동구매 진행중`
    },

    {
      title: "술자리 버전",
      script:
        `김씨는 농사가 왜 저리 잘돼?\n몰러?\n뭘 몰러?\n${productName} 쳤잖여!\n(작물 비교 화면)\n지금 신청하세요`
    },

    {
      title: "긴급특보 버전",
      script:
        `총채벌레 경보!\n지금 방제 안하면 늦습니다.\n${productName}\n공동구매 시작`
    },

    {
      title: "수확량 버전",
      script:
        `수확량이 줄었다고요?\n원인은 이미 밭에 있습니다.\n${productName}\n지금 확인하세요`
    }
  ];
}