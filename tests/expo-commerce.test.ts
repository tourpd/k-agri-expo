import test from "node:test";
import assert from "node:assert/strict";
import { normalizeExpoProducts, matchExpoProducts, toApprovedAffiliateProduct } from "../src/lib/content-commerce/expo.ts";

test("EXPO 상품 API 응답을 안전하게 정규화", () => {
  const result=normalizeExpoProducts([{product_id:"a1",name:"마늘 토양 측정기",description:"토양 검사",category:"농기구",buy_url:"/expo/booths/a",crops:["마늘"]}]);
  assert.equal(result.length,1);
  assert.equal(result[0].buyUrl,"/expo/booths/a");
  assert.equal(matchExpoProducts("마늘 토양 검사","마늘",result).length,1);
});

test("위험한 프로토콜을 판매 링크로 쓰지 않음", () => {
  const result=normalizeExpoProducts([{product_id:"a2",name:"측정기",buy_url:"javascript:alert(1)"}]);
  assert.equal(result[0].buyUrl,"");
});

test("EXPO 판매 주소를 쿠팡 제휴 주소로 간주하지 않음", () => {
  const result=normalizeExpoProducts([{product_id:"a3",name:"측정기",buy_url:"https://example.com/p"}]);
  assert.equal(toApprovedAffiliateProduct(result[0]),null);
});
