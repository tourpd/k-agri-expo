export function generateSmsMessages(productName: string) {
  return [
    `[한국농수산TV]\n병해충 급증\n${productName} 공동구매 진행중`,
    `[한국농수산TV]\n지금 방제가 수확량을 결정합니다.\n${productName}`,
    `[한국농수산TV]\n최근 피해 증가\n${productName} 확인`,
    `[한국농수산TV]\n농민들이 찾는 이유\n${productName}`,
    `[한국농수산TV]\n공동구매 마감 전 확인\n${productName}`
  ];
}