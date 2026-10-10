import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedAffiliateLink, rankProducts, youtubeDescription, type Product } from "../src/lib/content-commerce/coupang.ts";

const products: Product[] = [
  {id:"1",name:"토양 산도 측정기",crops:["마늘","고추"],keywords:["토양 산도","pH"],link:"https://link.coupang.com/example",approved:true},
  {id:"2",name:"관수 타이머",crops:["고추"],keywords:["관수","타이머"],link:"https://link.coupang.com/other",approved:true},
  {id:"3",name:"미검수 상품",crops:["마늘"],keywords:["토양 산도"],link:"https://link.coupang.com/unapproved",approved:false},
  {id:"4",name:"외부 링크",crops:["마늘"],keywords:["토양 산도"],link:"https://example.org/redirect",approved:true}
];

test("쿠팡 이외의 URL과 호스트 위장을 차단", () => {
  assert.equal(isAllowedAffiliateLink("https://link.coupang.com/item"),true);
  assert.equal(isAllowedAffiliateLink("https://link.coupang.com.evil.example/a"),false);
  assert.equal(isAllowedAffiliateLink("javascript:alert(1)"),false);
  assert.equal(isAllowedAffiliateLink("http://link.coupang.com/item"),false);
});

test("주제에 맞는 검수 상품만 추천", () => {
  const result=rankProducts("마늘 토양 산도 확인","마늘",products);
  assert.deepEqual(result.map(p=>p.id),["1"]);
});

test("무관한 상품은 추천하지 않음", () => {
  const result=rankProducts("딸기 잎 색깔 관찰","딸기",products);
  assert.equal(result.length,0);
});

test("상품이 추천되면 제휴 고지를 설명문에 포함", () => {
  const matches=rankProducts("마늘 토양 산도 확인","마늘",products);
  const description=youtubeDescription("마늘 토양 산도 확인",matches);
  assert.match(description,/수수료를 제공받을 수 있습니다/);
  assert.match(description,/https:\/\/link.coupang.com\/example/);
});

test("상품 추천이 없으면 제휴 고지를 넣지 않음", () => {
  const description=youtubeDescription("딸기 관리",[]);
  assert.doesNotMatch(description,/수수료를 제공받을 수 있습니다/);
});
