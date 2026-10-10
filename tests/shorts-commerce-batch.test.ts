import test from "node:test";
import assert from "node:assert/strict";
import { buildDailyShortsCommerce } from "../src/lib/content-commerce/batch.ts";
import type { Product } from "../src/lib/content-commerce/coupang.ts";

const products: Product[] = [
 {id:"a",name:"토양 산도 측정기",crops:["마늘"],keywords:["토양 산도"],approved:true,link:"https://link.coupang.com/test"},
 {id:"b",name:"관수 타이머",crops:["마늘"],keywords:["관수"],approved:true,link:"https://link.coupang.com/other"},
];
test("다섯 편까지만 처리하고 주제 일치 상품만 추천", () => {
 const briefs=Array.from({length:6}, (_,i)=>({id:String(i+1),crop:"마늘",topic:i===0?"토양 산도 확인":"일반 생육 현황"}));
 const result=buildDailyShortsCommerce(briefs,products,[]);
 assert.equal(result.length,5);
 assert.deepEqual(result[0].affiliateProducts.map(p=>p.id),["a"]);
 assert.equal(result[1].affiliateProducts.length,0);
 assert.equal(result[0].requiresReview,true);
});
