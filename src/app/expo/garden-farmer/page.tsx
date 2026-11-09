import Link from "next/link";
import type { CSSProperties } from "react";
import { IMAGES } from "./images";

export const dynamic = "force-dynamic";

const PRODUCTS = [
  {
    id: "ssakthree",
    badge: "가정·베란다 해충 박멸 1위",
    bg: "#ef4444",
    title: "도프 싹쓰리충 & 싹쓰리충 골드",
    target: "뿌리파리 · 응애 · 진딧물 · 총채벌레",
    image: IMAGES.ssakthree,
    problem: "화분에 날파리가 날아다니고 잎 뒤에 미세한 벌레가 갉아먹을 때",
    solution: "냄새 없는 친환경 천연 식물 추출물 — 실내 분무 즉각 살충",
    spec: "500ml 즉시분무용 스프레이 / 100ml 고농축",
    priceNormal: "18,000원",
    secretPrice: "12,000원 (공구가)",
  },
  {
    id: "flowernara",
    badge: "꽃대 폭발 & 광합성 활력",
    bg: "#ec4899",
    title: "플라워나라 & 칼스타 골드 (개화·비대)",
    target: "반려화초 · 제라늄 · 칼라디움 · 베란다 과채",
    image: IMAGES.flowernara,
    problem: "꽃봉오리가 맺히지 않고 떨어지거나 잎 끝이 타들어가며 마를 때",
    solution: "고순도 칼슘 + 미량요소 + 천연 아미노산 복합 영양 공급",
    spec: "500ml 스프레이형 / 250ml 앰플형",
    priceNormal: "16,000원",
    secretPrice: "11,000원 (공구가)",
  },
  {
    id: "farmplus",
    badge: "텃밭 풍년 수확 필수재",
    bg: "#16a34a",
    title: "주말농장플러스 & 추비한방 (유기농 비료)",
    target: "상추 · 깻잎 · 고추 · 방울토마토 · 대파",
    image: IMAGES.farmplus,
    problem: "모종 심은 후 웃자라기만 하고 잎이 얇아 뜯어먹을 게 없을 때",
    solution: "완효성 유기질 알비료 + 천연 발근 유기산 베이스",
    spec: "1kg 소포장 지퍼백 / 500g 텃밭 전용",
    priceNormal: "15,000원",
    secretPrice: "9,900원 (공구가)",
  },
  {
    id: "blueberry",
    badge: "산성 토양 맞춤 프리미엄",
    bg: "#3b82f6",
    title: "블루베리 한방 & 박멸킹 (가정 원예용)",
    target: "블루베리 · 수국 · 진달래 · 관상수",
    image: IMAGES.blueberry,
    problem: "일반 흙에 심어 잎이 누렇게 변하고 성장이 완전히 멈췄을 때",
    solution: "산도(pH) 조절 유기 황 성분 + 전용 뿌리 발근 영양원",
    spec: "1kg 알비료 / 500ml 관주용",
    priceNormal: "20,000원",
    secretPrice: "13,500원 (공구가)",
  },
  {
    id: "dalaout",
    badge: "화분 흙 속 달팽이·유충 차단",
    bg: "#8b5cf6",
    title: "달아웃 플러스 (달팽이·민달팽이 퇴치)",
    target: "실내 화분 흙 · 상추 텃밭 잎 갉아먹음",
    image: IMAGES.dalaout,
    problem: "새벽마다 상추와 새싹에 구멍이 숭숭 뚫리고 끈적한 자국이 남을 때",
    solution: "유기농업자재 공시 안전 유인제 — 아이·반려견 안심 성분",
    spec: "300g 용기형 과립제",
    priceNormal: "14,000원",
    secretPrice: "9,000원 (공구가)",
  },
];

export default function GardenFarmerPage() {
  return (
    <div style={styles.page}>
      {/* 최상단 브랜딩 히어로 섹션 */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroKicker}>DOPE × GARDEN FARMER × K-AGRI EXPO</div>
          <h1 style={styles.heroTitle}>
            베란다 정원 & 주말 텃밭
            <br />
            <span style={{ color: "#86efac" }}>가든파머(Garden Farmer) 공식관</span>
          </h1>
          <p style={styles.heroDesc}>
            대리점 눈치 보는 가격 파괴 대신, <strong>엑스포 단독 소포장 기획전</strong>으로 진행됩니다.
            <br />
            실내에서도 냄새 없고 안전한 도프 정품 소포장 자재를 만나보세요.
          </p>
          <div style={styles.heroBadges}>
            <span style={styles.badge}>🌱 100% 냄새 없는 실내 친환경</span>
            <span style={styles.badge}>👶 유아 · 반려동물 안심 성분</span>
            <span style={styles.badge}>📦 아파트·텃밭 전용 소포장</span>
            <span style={styles.badge}>🤫 대리점 비공개 시크릿 공구가</span>
          </div>
        </div>
        <div style={styles.heroImageWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMAGES.banner}
            alt="가든파머 텃밭 매대 실물"
            style={styles.heroImg}
          />
        </div>
      </section>

      {/* 시각적 증상별 해결 카드 (글자 대신 사진과 직관적 아이콘) */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionKicker}>PROBLEM & SOLUTION</div>
          <h2 style={styles.sectionTitle}>눈으로 보고 바로 찾는 식집사 고민 해결</h2>
          <p style={styles.sectionSubtitle}>내 화분과 텃밭에 맞는 증상을 선택하세요</p>
        </div>

        <div style={styles.sympGrid}>
          <div style={styles.sympCard}>
            <div style={styles.sympIcon}>🦟</div>
            <h3 style={styles.sympTitle}>화분 날파리·뿌리파리</h3>
            <p style={styles.sympDesc}>흙 속에 알을 까서 뿌리를 갉아먹는 날벌레</p>
            <div style={styles.sympTag}>➔ 싹쓰리충 즉시 분무</div>
          </div>
          <div style={styles.sympCard}>
            <div style={styles.sympIcon}>🍂</div>
            <h3 style={styles.sympTitle}>잎마름 & 잎 노랑 현상</h3>
            <p style={styles.sympDesc}>햇빛 부족과 칼슘/미량요소 결핍</p>
            <div style={styles.sympTag}>➔ 플라워나라·칼스타</div>
          </div>
          <div style={styles.sympCard}>
            <div style={styles.sympIcon}>🥬</div>
            <h3 style={styles.sympTitle}>상추·대파 웃자람</h3>
            <p style={styles.sympDesc}>빛이 약해 줄기만 길어지고 힘없이 쓰러짐</p>
            <div style={styles.sympTag}>➔ 추비한방·주말농장플러스</div>
          </div>
          <div style={styles.sympCard}>
            <div style={styles.sympIcon}>🐌</div>
            <h3 style={styles.sympTitle}>새싹 갉아먹는 달팽이</h3>
            <p style={styles.sympDesc}>화분 흙이나 텃밭 잎을 구멍 내는 연체동물</p>
            <div style={styles.sympTag}>➔ 달아웃플러스 과립</div>
          </div>
        </div>
      </section>

      {/* 실물 제품 사진 쇼룸 (홈쇼핑 스타일 비주얼 카드) */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionKicker}>REAL PRODUCTS SHOWCASE</div>
          <h2 style={styles.sectionTitle}>도프 가든파머 정품 라인업 실물관</h2>
          <p style={styles.sectionSubtitle}>현장 실제 사진으로 포장과 규격을 확인하고 주문하세요</p>
        </div>

        <div style={styles.productGrid}>
          {PRODUCTS.map((prod) => (
            <div key={prod.id} style={styles.prodCard}>
              <div style={{ ...styles.prodBadge, background: prod.bg }}>{prod.badge}</div>

              {/* 실물 제품 사진 컨테이너 */}
              <div style={styles.prodImgWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prod.image}
                  alt={prod.title}
                  style={styles.prodImg}
                />
              </div>

              <div style={styles.prodBody}>
                <h3 style={styles.prodTitle}>{prod.title}</h3>
                <div style={styles.prodTarget}>{prod.target}</div>

                <div style={styles.infoBox}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>💡 언제 쓰나요:</span>
                    <span style={styles.infoVal}>{prod.problem}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>✨ 효능 포인트:</span>
                    <span style={styles.infoVal}>{prod.solution}</span>
                  </div>
                </div>

                <div style={styles.specBox}>
                  <span>규격: <strong>{prod.spec}</strong></span>
                </div>

                {/* 대리점 갈등 없는 시크릿 가격표 */}
                <div style={styles.priceRow}>
                  <div>
                    <span style={styles.priceNormalLabel}>정상가 {prod.priceNormal}</span>
                    <div style={styles.priceSecret}>엑스포 시크릿 공구가</div>
                  </div>
                  <div style={styles.priceVal}>{prod.secretPrice}</div>
                </div>

                {/* 직접 문의 및 주문 폼으로 앵커 이동 */}
                <a
                  href="#order-form"
                  style={styles.orderBtn}
                >
                  시크릿 혜택으로 신청하기 ➔
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      
      {/* 닥터Q 홈가든 분무기 물량 & 희석 계산기 (실제 약박사 엔진 기반) */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionKicker}>EASY DILUTION CALCULATOR</div>
          <h2 style={styles.sectionTitle}>🧪 내 분무기엔 몇 ml? 3초 희석 계산표</h2>
          <p style={styles.sectionSubtitle}>
            1,000배, 500배 복잡한 계산 없이 가정용 분무기 용량만 보고 바로 타세요
          </p>
        </div>

        <div style={{ background: "#ffffff", border: "2px solid #e2e8f0", borderRadius: 20, padding: "24px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #cbd5e1" }}>
                <th style={{ padding: "14px 10px", color: "#334155", fontWeight: 800 }}>가정용 분무기 크기</th>
                <th style={{ padding: "14px 10px", color: "#16a34a", fontWeight: 800 }}>1,000배 희석 (평상시 영양)</th>
                <th style={{ padding: "14px 10px", color: "#0284c7", fontWeight: 800 }}>500배 희석 (벌레·병해 긴급)</th>
                <th style={{ padding: "14px 10px", color: "#64748b", fontWeight: 800 }}>추천 제품</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px 10px", fontWeight: 700 }}>작은 분무기 (500ml)</td>
                <td style={{ padding: "14px 10px", color: "#16a34a", fontWeight: 800 }}>0.5ml (스포이드 10방울)</td>
                <td style={{ padding: "14px 10px", color: "#0284c7", fontWeight: 800 }}>1ml (스포이드 20방울)</td>
                <td style={{ padding: "14px 10px", color: "#475569" }}>홈그린 활력제</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fcfdfe" }}>
                <td style={{ padding: "14px 10px", fontWeight: 700 }}>중형 분무기 (1L / 1,000ml)</td>
                <td style={{ padding: "14px 10px", color: "#16a34a", fontWeight: 800 }}>1ml (생수 뚜껑 1/5)</td>
                <td style={{ padding: "14px 10px", color: "#0284c7", fontWeight: 800 }}>2ml (생수 뚜껑 1/3)</td>
                <td style={{ padding: "14px 10px", color: "#475569" }}>플라워나라 / 칼스타</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px 10px", fontWeight: 700 }}>압축 분무기 (2L)</td>
                <td style={{ padding: "14px 10px", color: "#16a34a", fontWeight: 800 }}>2ml (생수 뚜껑 1/3)</td>
                <td style={{ padding: "14px 10px", color: "#0284c7", fontWeight: 800 }}>4ml (생수 뚜껑 절반)</td>
                <td style={{ padding: "14px 10px", color: "#475569" }}>싹쓰리충 / 박멸킹</td>
              </tr>
              <tr style={{ background: "#fcfdfe" }}>
                <td style={{ padding: "14px 10px", fontWeight: 700 }}>텃밭용 분무기 (10L / 반말)</td>
                <td style={{ padding: "14px 10px", color: "#16a34a", fontWeight: 800 }}>10ml (전용 뚜껑 1컵)</td>
                <td style={{ padding: "14px 10px", color: "#0284c7", fontWeight: 800 }}>20ml (전용 뚜껑 2컵)</td>
                <td style={{ padding: "14px 10px", color: "#475569" }}>주말농장플러스 / 텃밭애</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <Link
              href="/yakbaksa"
              style={{
                display: "inline-block",
                background: "#0f172a",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 14,
                padding: "10px 22px",
                borderRadius: 10,
                textDecoration: "none",
              }}
            >
              🔍 내 밭 평수별 정밀 계산기(약박사 전문관) 바로가기 ➔
            </Link>
          </div>
        </div>
      </section>

      {/* 가든파머 전용 원클릭 공구 및 문의 신청 창구 */}
      <section id="order-form" style={styles.formSection}>
        <div style={styles.formCard}>
          <div style={styles.formKicker}>DIRECT ORDER & INQUIRY</div>
          <h2 style={styles.formTitle}>🏡 가든파머 공식 부스 주문 · 공구 신청</h2>
          <p style={styles.formDesc}>
            대리점 판매망 보호를 위해 본 할인가격은 <strong>한국농수산TV 엑스포 회원 전용 비공개 혜택</strong>으로 처리됩니다.
            <br />
            아래 정보를 남겨주시면 담당자가 10분 내로 주문 및 발송 절차를 안내해 드립니다.
          </p>

          <form action="/api/expo/farmer-decision/submit" method="POST" style={styles.form}>
            <input type="hidden" name="form_type" value="garden_farmer_order" />

            <div style={styles.fieldGrid}>
              <div style={styles.field}>
                <label style={styles.label}>주문자 성함 *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="예: 홍길동"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>휴대폰 번호 *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="예: 010-1234-5678"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>재배 형태 *</label>
                <select name="type" style={styles.select}>
                  <option value="veranda">아파트 베란다 화분 / 관엽식물</option>
                  <option value="weekend_farm">주말농장 / 텃밭 (10~50평)</option>
                  <option value="rooftop">옥상 텃밭 / 마당 정원</option>
                  <option value="large">농가 소규모 하우스</option>
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>신청 희망 상품 *</label>
                <select name="product" style={styles.select}>
                  <option value="all_set">[강력추천] 가든파머 초보 식집사 3종 스타터 키트</option>
                  <option value="ssakthree">도프 싹쓰리충 (해충·뿌리파리 전용)</option>
                  <option value="flowernara">플라워나라 & 칼스타 골드 (꽃·잎 영양제)</option>
                  <option value="farmplus">주말농장플러스 & 추비한방 (텃밭 비료)</option>
                  <option value="dalaout">달아웃 플러스 (달팽이 퇴치제)</option>
                  <option value="counsel">내 화분 상태 보고 상담 후 결정</option>
                </select>
              </div>
            </div>

            <div style={styles.fieldFull}>
              <label style={styles.label}>배송받으실 주소 또는 궁금한 점</label>
              <textarea
                name="memo"
                rows={3}
                placeholder="배송 주소(시/군/구/상세주소) 또는 현재 화분 증상을 남겨주세요."
                style={styles.textarea}
              />
            </div>

            <div style={styles.agreeRow}>
              <input type="checkbox" id="agree" required defaultChecked style={{ marginRight: 8 }} />
              <label htmlFor="agree" style={{ fontSize: 13, color: "#475569" }}>
                엑스포 특별 공구 혜택 안내 및 배송 안내를 위한 개인정보 처리에 동의합니다.
              </label>
            </div>

            <button type="submit" style={styles.submitBtn}>
              가든파머 시크릿 특가 혜택으로 신청하기 (무료 접수) ➔
            </button>
          </form>
        </div>
      </section>

      {/* 한국농수산TV 가든파머 영상 연동 */}
      <section style={styles.videoSection}>
        <div style={styles.videoInner}>
          <div style={styles.videoKicker}>YOUTUBE LECTURE</div>
          <h2 style={styles.videoTitle}>한국농수산TV 〈가든파머 텃밭학교〉</h2>
          <p style={styles.videoDesc}>
            흙 만들기부터 병해충 방제까지! 조PD가 현장에서 직접 검증한 베란다·텃밭 노하우를 영상으로 만나보세요.
          </p>
          <a
            href="https://www.youtube.com/@tourpd"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.youtubeBtn}
          >
            유튜브 가든파머 실전 강의 보기 🎬
          </a>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "20px 16px 80px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif",
  },
  hero: {
    background: "linear-gradient(135deg, #14532d 0%, #15803d 100%)",
    borderRadius: 24,
    padding: "40px 32px",
    color: "#fff",
    marginBottom: 48,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    boxShadow: "0 10px 30px -10px rgba(22, 101, 52, 0.4)",
  },
  heroContent: {
    flex: "1 1 500px",
  },
  heroKicker: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.1em",
    color: "#86efac",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: "clamp(26px, 4vw, 38px)",
    fontWeight: 900,
    lineHeight: 1.3,
    marginBottom: 16,
  },
  heroDesc: {
    fontSize: "clamp(15px, 2vw, 17px)",
    lineHeight: 1.6,
    color: "#dcfce7",
    marginBottom: 20,
  },
  heroBadges: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(4px)",
    padding: "6px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
  },
  heroImageWrap: {
    flex: "0 0 280px",
    display: "flex",
    justifyContent: "center",
  },
  heroImg: {
    width: "100%",
    maxWidth: 280,
    borderRadius: 16,
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
    border: "2px solid rgba(255,255,255,0.2)",
    objectFit: "cover",
  },
  section: {
    marginBottom: 56,
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: 32,
  },
  sectionKicker: {
    fontSize: 12,
    fontWeight: 800,
    color: "#16a34a",
    letterSpacing: "0.08em",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: "clamp(22px, 3vw, 30px)",
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: "#64748b",
  },
  sympGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
  },
  sympCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: "24px 20px",
    textAlign: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.04)",
  },
  sympIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  sympTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: "#1e293b",
    marginBottom: 8,
  },
  sympDesc: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.5,
    marginBottom: 12,
  },
  sympTag: {
    display: "inline-block",
    background: "#f0fdf4",
    color: "#16a34a",
    fontWeight: 800,
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 8,
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 24,
  },
  prodCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  },
  prodBadge: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 800,
    padding: "6px 14px",
    textAlign: "center",
  },
  prodImgWrap: {
    width: "100%",
    height: 240,
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderBottom: "1px solid #f1f5f9",
  },
  prodImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    padding: 10,
  },
  prodBody: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  prodTitle: {
    fontSize: 19,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 6,
  },
  prodTarget: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: 700,
    marginBottom: 16,
  },
  infoBox: {
    background: "#f8fafc",
    border: "1px solid #f1f5f9",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 14,
    fontSize: 13,
  },
  infoRow: {
    marginBottom: 6,
    display: "flex",
    gap: 6,
  },
  infoLabel: {
    color: "#64748b",
    flexShrink: 0,
    fontWeight: 700,
  },
  infoVal: {
    color: "#1e293b",
    lineHeight: 1.4,
  },
  specBox: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
  },
  priceRow: {
    borderTop: "1px dashed #e2e8f0",
    paddingTop: 14,
    marginBottom: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceNormalLabel: {
    fontSize: 12,
    color: "#94a3b8",
    textDecoration: "line-through",
    display: "block",
  },
  priceSecret: {
    fontSize: 12,
    fontWeight: 800,
    color: "#dc2626",
  },
  priceVal: {
    fontSize: 20,
    fontWeight: 900,
    color: "#16a34a",
  },
  orderBtn: {
    display: "block",
    textAlign: "center",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: 15,
    padding: "14px 16px",
    borderRadius: 12,
    textDecoration: "none",
    boxShadow: "0 4px 10px rgba(22, 163, 74, 0.25)",
  },
  formSection: {
    marginBottom: 56,
  },
  formCard: {
    background: "#ffffff",
    border: "2px solid #86efac",
    borderRadius: 24,
    padding: "40px 32px",
    boxShadow: "0 10px 30px -5px rgba(22, 101, 52, 0.1)",
  },
  formKicker: {
    fontSize: 12,
    fontWeight: 800,
    color: "#16a34a",
    letterSpacing: "0.1em",
    marginBottom: 8,
    textAlign: "center",
  },
  formTitle: {
    fontSize: "clamp(22px, 3vw, 28px)",
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 12,
    textAlign: "center",
  },
  formDesc: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 1.6,
    textAlign: "center",
    maxWidth: 700,
    margin: "0 auto 32px",
  },
  form: {
    maxWidth: 800,
    margin: "0 auto",
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  fieldFull: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
  },
  input: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    outline: "none",
  },
  select: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    background: "#fff",
    outline: "none",
  },
  textarea: {
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    outline: "none",
    resize: "vertical",
  },
  agreeRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 24,
  },
  submitBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: 14,
    padding: "18px 24px",
    fontSize: 17,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 6px 15px rgba(22, 101, 52, 0.3)",
  },
  videoSection: {
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    borderRadius: 24,
    padding: "40px 24px",
    color: "#ffffff",
    textAlign: "center",
  },
  videoInner: {
    maxWidth: 600,
    margin: "0 auto",
  },
  videoKicker: {
    fontSize: 12,
    fontWeight: 800,
    color: "#38bdf8",
    letterSpacing: "0.1em",
    marginBottom: 10,
  },
  videoTitle: {
    fontSize: "clamp(22px, 3vw, 28px)",
    fontWeight: 900,
    marginBottom: 12,
  },
  videoDesc: {
    fontSize: 15,
    color: "#cbd5e1",
    lineHeight: 1.6,
    marginBottom: 20,
  },
  youtubeBtn: {
    display: "inline-block",
    background: "#ef4444",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: 15,
    padding: "12px 28px",
    borderRadius: 999,
    textDecoration: "none",
  },
};
