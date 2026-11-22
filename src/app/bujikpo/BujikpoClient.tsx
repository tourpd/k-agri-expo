/* eslint-disable */
// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";

/**
 * 서리방지 부직포 계산기 (화면 + 계산)
 * 한국농수산TV 쿠팡리뷰 코너 영상에서 링크로 들어오는 페이지.
 * 가격·순위는 2026-11-22 쿠팡 기준 어림값.
 */
const CSS = ".bjk{--bg:#f3f6f1;\n  --card:#ffffff;\n  --ink:#16221c;\n  --sub:#55645b;\n  --line:#d5ddd4;\n  --teal:#0a8f8a;        \n  --teal-ink:#ffffff;\n  --yellow:#ffd21f;\n  --soil:#6b4a2b;\n  --warn:#b3261e;\n  --tint:#e3f3f1;\n  --display:\"Do Hyeon\",\"Noto Sans KR\",sans-serif;\n  --body:\"Noto Sans KR\",\"Apple SD Gothic Neo\",\"Malgun Gothic\",sans-serif;}\n.bjk *{box-sizing:border-box}\n.bjk{color:var(--ink);font-family:var(--body);font-size:18px;line-height:1.55}\n.bjk{max-width:640px;margin:0 auto;padding:4px 0 24px;display:flex;flex-direction:column;gap:18px}\n.bjk header .brand{font-weight:700;color:var(--teal);font-size:15px}\n.bjk h1{font-family:var(--display);font-weight:400;font-size:40px;line-height:1.15;margin:4px 0 6px;text-wrap:balance}\n.bjk header p{margin:0;color:var(--sub)}\n.bjk h2{font-family:var(--display);font-weight:400;font-size:26px;margin:0 0 12px;text-wrap:balance}\n.bjk section{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 16px}\n.bjk .tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}\n.bjk .tabs button{font:inherit;font-weight:700;padding:14px 8px;border-radius:10px;border:2px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}\n.bjk .tabs button small{display:block;font-weight:500;font-size:14px;margin-top:2px;opacity:.9}\n.bjk .tabs button[aria-pressed=\"true\"]{background:var(--teal);border-color:var(--teal);color:var(--teal-ink)}\n.bjk .fields{display:flex;flex-direction:column;gap:12px}\n.bjk .field{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}\n.bjk .field label{font-weight:700;flex:1 1 140px}\n.bjk .field small{display:block;font-weight:400;color:var(--sub);font-size:14px}\n.bjk .step{display:flex;align-items:center;gap:6px}\n.bjk .step button{width:48px;height:48px;border-radius:10px;border:2px solid var(--line);background:var(--card);color:var(--ink);font-size:26px;font-weight:700;cursor:pointer;line-height:1}\n.bjk .step input{width:92px;height:48px;border:2px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font:inherit;font-weight:700;font-size:22px;text-align:center;font-variant-numeric:tabular-nums}\n.bjk .step .unit{min-width:26px;color:var(--sub);font-weight:700}\n.bjk select{width:100%;height:52px;border:2px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font:inherit;font-weight:700;padding:0 10px}\n.bjk button:focus-visible,.bjk input:focus-visible,.bjk select:focus-visible,.bjk a:focus-visible,.bjk summary:focus-visible{outline:3px solid var(--yellow);outline-offset:2px}\n.bjk details{margin-top:14px;border-top:1px solid var(--line);padding-top:12px}\n.bjk summary{cursor:pointer;font-weight:700;color:var(--teal)}\n.bjk details .fields{margin-top:12px}\n.bjk .result{background:var(--teal);color:var(--teal-ink);border-color:var(--teal)}\n.bjk .result h2{color:var(--teal-ink)}\n.bjk .big{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.bjk .tile{background:rgba(255,255,255,.14);border-radius:12px;padding:12px}\n.bjk .tile .k{font-size:15px;font-weight:700;opacity:.92}\n.bjk .tile .v{font-family:var(--display);font-size:46px;line-height:1.1;font-variant-numeric:tabular-nums}\n.bjk .tile .v span{font-size:22px;margin-left:2px}\n.bjk .tile .d{font-size:14px;opacity:.92}\n.bjk .how{margin:12px 0 0;font-size:15px;opacity:.95}\n.bjk .msg{background:var(--card);color:var(--warn);border-radius:10px;padding:10px 12px;margin-top:10px;font-weight:700;font-size:15px}\n.bjk .msg[hidden]{display:none}\n.bjk .pin{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}\n.bjk .pin figure{margin:0;border:2px solid var(--line);border-radius:12px;padding:8px;text-align:center}\n.bjk .pin figure.good{border-color:var(--teal);background:var(--tint)}\n.bjk .pin figcaption{font-weight:900;font-size:17px}\n.bjk .pin .no{color:var(--warn)}\n.bjk .pin .yes{color:var(--teal)}\n.bjk .pin svg{width:100%;height:auto;display:block}\n.bjk ol.steps{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;counter-reset:s}\n.bjk ol.steps li{counter-increment:s;display:grid;grid-template-columns:36px 1fr;gap:10px;align-items:start}\n.bjk ol.steps li::before{content:counter(s);font-family:var(--display);font-size:22px;width:36px;height:36px;border-radius:50%;background:var(--yellow);color:#16221c;display:grid;place-items:center}\n.bjk ol.steps b{display:block}\n.bjk ol.steps span{color:var(--sub);font-size:16px}\n.bjk .src{margin:12px 0 0;color:var(--sub);font-size:14px}\n.bjk .disc{font-size:14px;color:var(--sub);margin:0 0 12px;padding:10px 12px;border:1px dashed var(--line);border-radius:10px}\n.bjk .prod{display:flex;flex-direction:column;gap:10px}\n.bjk .prod a{display:grid;grid-template-columns:44px 1fr auto;gap:10px;align-items:center;text-decoration:none;color:var(--ink);border:2px solid var(--line);border-radius:12px;padding:12px}\n.bjk .prod a:hover{border-color:var(--teal)}\n.bjk .rank{font-family:var(--display);font-size:24px;width:44px;height:44px;border-radius:10px;background:var(--tint);color:var(--teal);display:grid;place-items:center}\n.bjk .pname{font-weight:700}\n.bjk .pmeta{font-size:14px;color:var(--sub)}\n.bjk .pcost{text-align:right;font-weight:900;font-variant-numeric:tabular-nums;white-space:nowrap}\n.bjk .pcost small{display:block;font-weight:500;color:var(--teal);font-size:14px}\n.bjk .note{font-size:14px;color:var(--sub);margin:12px 0 0}\n.bjk footer{color:var(--sub);font-size:15px;text-align:center}\n.bjk footer b{color:var(--ink);font-size:20px}\n@media (max-width:380px){.bjk h1{font-size:34px}.bjk .tile .v{font-size:38px}.bjk .step input{width:76px}}\n.bjk .yak{display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;padding:14px 16px;border-radius:14px;background:#0f172a;color:#fff;text-decoration:none}\n.bjk .yak img{border-radius:999px;border:2px solid #86efac;object-fit:cover}\n.bjk .yak b{display:block;font-size:18px}\n.bjk .yak small{display:block;font-size:14px;color:#cbd5e1;line-height:1.5}\n.bjk .yak i{font-style:normal;font-size:26px;font-weight:900}";

const BODY = "<header>\n  <div class=\"brand\">한국농수산TV · K-Agri Expo</div>\n  <h1>서리방지 부직포 계산기</h1>\n  <p>내 밭 크기만 넣으면 부직포 몇 롤, 핀 몇 개가 필요한지 바로 나옵니다</p>\n</header>\n\n<section aria-labelledby=\"h-in\">\n  <h2 id=\"h-in\">1. 내 밭 넣기</h2>\n  <div class=\"tabs\">\n    <button type=\"button\" id=\"tab-ridge\" aria-pressed=\"true\">두둑으로 넣기<small>두둑마다 따로 덮을 때</small></button>\n    <button type=\"button\" id=\"tab-pyeong\" aria-pressed=\"false\">평수로 넣기<small>밭 전체를 덮거나 평수만 알 때</small></button>\n  </div>\n\n  <div class=\"fields\" id=\"box-ridge\">\n    <div class=\"field\"><label for=\"rw\">두둑 폭</label>\n      <div class=\"step\"><button type=\"button\" data-t=\"rw\" data-d=\"-0.1\" aria-label=\"두둑 폭 줄이기\">−</button><input id=\"rw\" inputmode=\"decimal\" value=\"1.2\"><button type=\"button\" data-t=\"rw\" data-d=\"0.1\" aria-label=\"두둑 폭 늘리기\">+</button><span class=\"unit\">m</span></div></div>\n    <div class=\"field\"><label for=\"rl\">두둑 길이</label>\n      <div class=\"step\"><button type=\"button\" data-t=\"rl\" data-d=\"-5\" aria-label=\"두둑 길이 줄이기\">−</button><input id=\"rl\" inputmode=\"decimal\" value=\"50\"><button type=\"button\" data-t=\"rl\" data-d=\"5\" aria-label=\"두둑 길이 늘리기\">+</button><span class=\"unit\">m</span></div></div>\n    <div class=\"field\"><label for=\"rn\">두둑 수</label>\n      <div class=\"step\"><button type=\"button\" data-t=\"rn\" data-d=\"-1\" aria-label=\"두둑 수 줄이기\">−</button><input id=\"rn\" inputmode=\"numeric\" value=\"5\"><button type=\"button\" data-t=\"rn\" data-d=\"1\" aria-label=\"두둑 수 늘리기\">+</button><span class=\"unit\">줄</span></div></div>\n  </div>\n\n  <div class=\"fields\" id=\"box-pyeong\" hidden>\n    <div class=\"field\"><label for=\"py\">덮을 면적<small>1평은 약 3.3㎡</small></label>\n      <div class=\"step\"><button type=\"button\" data-t=\"py\" data-d=\"-10\" aria-label=\"면적 줄이기\">−</button><input id=\"py\" inputmode=\"decimal\" value=\"100\"><button type=\"button\" data-t=\"py\" data-d=\"10\" aria-label=\"면적 늘리기\">+</button><span class=\"unit\">평</span></div></div>\n  </div>\n\n  <div class=\"fields\" style=\"margin-top:14px\">\n    <div><label for=\"roll\" style=\"font-weight:700;display:block;margin-bottom:6px\">살 부직포 규격 (폭 × 길이)</label>\n      <select id=\"roll\">\n        <option value=\"1.4,50\">폭 1.4m × 길이 50m</option>\n        <option value=\"1.6,50\" selected>폭 1.6m × 길이 50m</option>\n        <option value=\"1.4,100\">폭 1.4m × 길이 100m</option>\n        <option value=\"2,100\">폭 2m × 길이 100m</option>\n        <option value=\"2.1,100\">폭 2.1m × 길이 100m</option>\n      </select></div>\n    <div><label for=\"ptype\" style=\"font-weight:700;display:block;margin-bottom:6px\">쓸 핀 종류</label>\n      <select id=\"ptype\">\n        <option value=\"2,102\" selected>일자 핀 (못 모양) · 한 자리에 2개</option>\n        <option value=\"1,75\">ㄷ자 철핀 (다리 두 개) · 한 자리에 1개</option>\n      </select></div>\n  </div>\n\n  <details>\n    <summary>핀 간격과 여유분 바꾸기</summary>\n    <div class=\"fields\">\n      <div class=\"field\"><label for=\"gap\">핀 간격<small>한두 걸음. 바람 센 밭은 줄이세요</small></label>\n        <div class=\"step\"><button type=\"button\" data-t=\"gap\" data-d=\"-0.5\" aria-label=\"핀 간격 줄이기\">−</button><input id=\"gap\" inputmode=\"decimal\" value=\"1\"><button type=\"button\" data-t=\"gap\" data-d=\"0.5\" aria-label=\"핀 간격 늘리기\">+</button><span class=\"unit\">m</span></div></div>\n      <div class=\"field\"><label for=\"side\">양옆 여유<small>두둑 폭에 더하는 길이 (양쪽 합)</small></label>\n        <div class=\"step\"><button type=\"button\" data-t=\"side\" data-d=\"-0.1\" aria-label=\"양옆 여유 줄이기\">−</button><input id=\"side\" inputmode=\"decimal\" value=\"0.3\"><button type=\"button\" data-t=\"side\" data-d=\"0.1\" aria-label=\"양옆 여유 늘리기\">+</button><span class=\"unit\">m</span></div></div>\n    </div>\n  </details>\n</section>\n\n<section class=\"result\" aria-labelledby=\"h-out\" aria-live=\"polite\">\n  <h2 id=\"h-out\">2. 이만큼 필요합니다</h2>\n  <div class=\"big\">\n    <div class=\"tile\"><div class=\"k\">부직포</div><div class=\"v\"><b id=\"o-rolls\">0</b><span>롤</span></div><div class=\"d\" id=\"o-len\"></div></div>\n    <div class=\"tile\"><div class=\"k\">고정핀</div><div class=\"v\"><b id=\"o-pins\">0</b><span>개</span></div><div class=\"d\" id=\"o-pack\"></div></div>\n  </div>\n  <p class=\"how\" id=\"o-how\"></p>\n  <div class=\"msg\" id=\"o-msg\" hidden></div>\n</section>\n\n<section aria-labelledby=\"h-pin\">\n  <h2 id=\"h-pin\">3. 핀은 이렇게 꽂으세요</h2>\n  <div class=\"pin\">\n    <figure>\n      <svg viewBox=\"0 0 160 110\" role=\"img\" aria-label=\"핀을 직각으로 꽂은 모습\">\n        <rect x=\"0\" y=\"62\" width=\"160\" height=\"48\" fill=\"var(--soil)\" opacity=\".85\"/>\n        <rect x=\"0\" y=\"56\" width=\"160\" height=\"6\" fill=\"var(--line)\"/>\n        <line x1=\"80\" y1=\"40\" x2=\"80\" y2=\"100\" stroke=\"var(--ink)\" stroke-width=\"5\" stroke-linecap=\"round\"/>\n        <line x1=\"66\" y1=\"40\" x2=\"94\" y2=\"40\" stroke=\"var(--ink)\" stroke-width=\"5\" stroke-linecap=\"round\"/>\n        <path d=\"M110 50 l0 -22 m-7 8 l7 -8 l7 8\" fill=\"none\" stroke=\"var(--warn)\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n      </svg>\n      <figcaption class=\"no\">직각 ✕ 핀이 올라옵니다</figcaption>\n    </figure>\n    <figure class=\"good\">\n      <svg viewBox=\"0 0 160 110\" role=\"img\" aria-label=\"핀 두 개를 45도로 꽂은 모습\">\n        <rect x=\"0\" y=\"62\" width=\"160\" height=\"48\" fill=\"var(--soil)\" opacity=\".85\"/>\n        <rect x=\"0\" y=\"56\" width=\"160\" height=\"6\" fill=\"var(--line)\"/>\n        <line x1=\"40\" y1=\"44\" x2=\"82\" y2=\"96\" stroke=\"var(--ink)\" stroke-width=\"5\" stroke-linecap=\"round\"/>\n        <line x1=\"120\" y1=\"44\" x2=\"78\" y2=\"96\" stroke=\"var(--ink)\" stroke-width=\"5\" stroke-linecap=\"round\"/>\n        <text x=\"80\" y=\"30\" text-anchor=\"middle\" font-size=\"20\" font-weight=\"900\" fill=\"var(--teal)\" font-family=\"var(--body)\">45도</text>\n      </svg>\n      <figcaption class=\"yes\">45도로 두 개 ○</figcaption>\n    </figure>\n  </div>\n  <ol class=\"steps\">\n    <li><div><b>45도로 비스듬히 (일자 핀은 한 자리에 두 개)</b><span>직각으로 꽂으면 땅이 얼었다 녹으면서 핀이 솟아오릅니다</span></div></li>\n    <li><div><b>한두 걸음에 한 자리씩</b><span>부직포 양쪽 가장자리를 따라 꽂습니다</span></div></li>\n    <li><div><b>꽂은 뒤 발로 꼭 밟기</b><span>핀 머리가 땅에 붙도록 눌러 줍니다</span></div></li>\n    <li><div><b>부직포 위에 흙 조금 올리기</b><span>바람이 세면 핀 자리가 찢어집니다. 삽으로 군데군데 올려 주세요</span></div></li>\n  </ol>\n  <p class=\"src\">한국농수산TV 홍산마늘 편 현장에서 알려 드린 방법입니다</p>\n</section>\n\n<section aria-labelledby=\"h-buy\">\n  <h2 id=\"h-buy\">4. 쿠팡리뷰 순위 TOP 5</h2>\n  <p class=\"disc\">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다</p>\n  <div class=\"prod\" id=\"prod\"></div>\n  <p class=\"note\">예상 금액은 위에서 나온 롤 수만큼 살 때의 어림값입니다. 2026년 11월 22일 쿠팡에서 본 1㎡당 값으로 계산했고, 값과 파는 규격은 제품마다 다르고 수시로 바뀝니다. 살 때 쿠팡 화면의 값과 두께(g)·폭·길이를 꼭 확인하세요. 핀 값은 개당 일자 핀 약 102원, ㄷ자 철핀 약 75원으로 어림했습니다.</p>\n</section>\n\n<a class=\"yak\" href=\"/yakbaksa\"><img src=\"/doctor-q-face.png\" alt=\"닥터Q\" width=\"52\" height=\"52\"><span><b>약·영양제는 약박사에게</b><small>제품 고르고 평수만 넣으면 몇 병, 물 몇 통인지 바로 나옵니다</small></span><i>›</i></a>";

function init() {

  var AFF = 'https://link.coupang.com/re/AFFSDP?lptag=AF5886979';
  var PRODUCTS = [
    {rank:1, meta:'두께 40g · 1㎡당 약 238원 · 만족 89%', per:238, p:'9750594711', i:'29196259909', v:'86005605421'},
    {rank:2, meta:'1㎡당 약 263원 · 만족 93%',            per:263, p:'7759726001', i:'20922592787', v:'87989421078'},
    {rank:3, meta:'1㎡당 약 247원 · 만족 94%',            per:247, p:'8951895818', i:'26150771974', v:'93130743713'},
    {rank:4, meta:'두께 18g(얇음) · 1㎡당 약 153원 · 만족 81%', per:153, p:'9065362414', i:'26620270805', v:'93593237309'},
    {rank:5, meta:'두께 40g · 1㎡당 약 293원 · 만족 90%', per:293, p:'9737523462', i:'29142404494', v:'96065923221'}
  ];
  var OVERLAP = 0.1;   // 여러 장 이어 덮을 때 겹치는 폭(m)
  var END = 0;         // 양끝 여유 없음: 두둑 길이 그대로
  var mode = 'ridge';

  function $(id){return document.getElementById(id);}
  function num(id){var x = parseFloat(String($(id).value).replace(',', '.')); return isFinite(x) ? x : 0;}
  function won(n){return Math.round(n/100)*100;}
  function fmt(n){return Math.round(n).toLocaleString('ko-KR');}
  function r1(n){return Math.round(n*10)/10;}

  function calc(){
    var roll = $('roll').value.split(',');
    var rollW = parseFloat(roll[0]), rollL = parseFloat(roll[1]);
    var gap = Math.max(0.3, num('gap') || 1);
    var pt = $('ptype').value.split(','), per = parseInt(pt[0],10), pprice = parseFloat(pt[1]);
    var side = Math.max(0, num('side'));
    var total = 0, spots = 0, how = '', msg = '';

    if (mode === 'ridge'){
      var w = num('rw'), len = num('rl'), n = Math.round(num('rn'));
      if (w <= 0 || len <= 0 || n <= 0) return null;
      var cover = w + side;
      var strips = cover <= rollW ? 1 : Math.ceil((cover - OVERLAP) / (rollW - OVERLAP));
      var stripLen = len + END;
      total = n * strips * stripLen;
      spots = n * strips * 2 * (Math.ceil(stripLen / gap) + 1);
      how = '두둑 한 줄을 폭 ' + r1(cover) + 'm로 덮습니다 (두둑 ' + r1(w) + 'm + 양옆 여유 ' + r1(side) + 'm). ' +
            '한 줄에 부직포 ' + strips + '장, 길이는 두둑 길이 그대로 ' + r1(stripLen) + 'm씩입니다.';
      if (strips > 1) msg = '고른 부직포 폭(' + rollW + 'm)이 두둑보다 좁아 한 줄에 ' + strips + '장을 겹쳐 덮어야 합니다. 더 넓은 규격을 골라 보세요.';
    } else {
      var py = num('py');
      if (py <= 0) return null;
      var area = py * 3.3058;
      total = area * 1.1 / rollW;
      spots = 2 * (Math.ceil(total / gap) + 1);
      how = fmt(py) + '평은 약 ' + fmt(area) + '㎡입니다. 겹치는 부분과 자투리로 10%를 더해 계산했습니다. 밭 전체를 덮을 때의 양입니다.';
    }
    var rolls = Math.ceil(total / rollL - 1e-9);
    return {rolls:rolls, total:total, pins:spots*per, per:per, pprice:pprice, rollW:rollW, rollL:rollL, how:how, msg:msg, gap:gap};
  }

  function render(){
    var r = calc();
    var box = $('prod');
    if (!r){
      $('o-rolls').textContent = '0'; $('o-pins').textContent = '0';
      $('o-len').textContent = ''; $('o-pack').textContent = '';
      $('o-how').textContent = '밭 크기를 숫자로 넣어 주세요.';
      $('o-msg').hidden = true;
    } else {
      $('o-rolls').textContent = fmt(r.rolls);
      $('o-pins').textContent = fmt(r.pins);
      $('o-len').textContent = '필요 길이 ' + fmt(Math.ceil(r.total)) + 'm · ' + r.rollW + 'm×' + r.rollL + 'm 롤';
      $('o-pack').textContent = '100개 묶음으로 ' + Math.ceil(r.pins/100) + '묶음 · 양쪽 가장자리 ' + r1(r.gap) + 'm마다 ' + r.per + '개씩 · 약 ' + fmt(won(r.pins * r.pprice)) + '원';
      $('o-how').textContent = r.how;
      $('o-msg').textContent = r.msg; $('o-msg').hidden = !r.msg;
    }
    var bought = r ? r.rolls * r.rollW * r.rollL : 0;
    box.textContent = '';
    PRODUCTS.forEach(function(p){
      var a = document.createElement('a');
      a.href = AFF + '&pageKey=' + p.p + '&itemId=' + p.i + '&vendorItemId=' + p.v;
      a.target = '_blank'; a.rel = 'noopener sponsored';
      var rk = document.createElement('div'); rk.className = 'rank'; rk.textContent = p.rank;
      var mid = document.createElement('div');
      var nm = document.createElement('div'); nm.className = 'pname'; nm.textContent = '쿠팡리뷰 ' + p.rank + '위 부직포';
      var mt = document.createElement('div'); mt.className = 'pmeta'; mt.textContent = p.meta;
      mid.appendChild(nm); mid.appendChild(mt);
      var c = document.createElement('div'); c.className = 'pcost';
      c.textContent = bought ? '약 ' + fmt(won(bought * p.per)) + '원' : '';
      var s = document.createElement('small'); s.textContent = '쿠팡에서 보기 ›';
      c.appendChild(s);
      a.appendChild(rk); a.appendChild(mid); a.appendChild(c);
      box.appendChild(a);
    });
  }

  function setMode(m){
    mode = m;
    $('tab-ridge').setAttribute('aria-pressed', m === 'ridge');
    $('tab-pyeong').setAttribute('aria-pressed', m === 'pyeong');
    $('box-ridge').hidden = m !== 'ridge';
    $('box-pyeong').hidden = m !== 'pyeong';
    render();
  }
  $('tab-ridge').addEventListener('click', function(){setMode('ridge');});
  $('tab-pyeong').addEventListener('click', function(){setMode('pyeong');});

  document.querySelectorAll('.step button').forEach(function(b){
    b.addEventListener('click', function(){
      var id = b.getAttribute('data-t'), d = parseFloat(b.getAttribute('data-d'));
      var v = Math.max(0, Math.round((num(id) + d) * 10) / 10);
      $(id).value = v; render();
    });
  });
  ['rw','rl','rn','py','gap','side'].forEach(function(id){$(id).addEventListener('input', render);});
  $('roll').addEventListener('change', render);
  $('ptype').addEventListener('change', render);
  render();

}

export default function BujikpoClient() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.ready) return;
    el.dataset.ready = "1";
    init();
  }, []);
  return (
    <>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Do+Hyeon&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" precedence="default" />
      <style>{CSS}</style>
      <div ref={ref} className="bjk" dangerouslySetInnerHTML={{ __html: BODY }} />
    </>
  );
}
