# 작가실 지도 (WRITERS_ROOM_MAP)

정리일: 2026-10-16 · 정리: Claude
대상 폴더: ~/projects/k-agri-expo, ~/Desktop/k-agri-discovery-os

## 1. 지금 있는 작가 자료

| # | 작가 / 자료 | 장르 | 위치 | 상태 |
|---|---|---|---|---|
| 1 | 조PD 창작헌법 (33조) | 모든 장르 공통 원칙 | k-agri-expo/K_AGRI_JOPD_CREATIVE_CONSTITUTION.md | 최상위 기준, 완성 |
| 2 | 작가 능력 사전 (Discovery·Research·Evidence·Human·Story·Comedy·Serial) | 공통 능력 정의·합격 기준 | k-agri-discovery-os/K_AGRI_WRITER_CAPABILITY_REGISTRY_V1.md | 설계 문서 |
| 3 | 작가실 현재 작업 기록 | 공통 (Dreaming Writer, K-HOS, Desk) | k-agri-expo/K_AGRI_JOPD_WRITERS_ROOM_CURRENT_WORK.md | 진행 중, K-HOS 문제 기록 |
| 4 | 상봉대리점 웹툰 작가실 (브리프·코미디 엔진·채점표·패널 규칙 01~14) | 직장 시트콤 웹툰 | k-agri-discovery-os/docs/writers_room/sangbong/ | 완성도 높음 |
| 5 | 상봉대리점 캐릭터 시트 8명 + 대본 EP02 v3, EP03 줄거리 | 웹툰 제작 | k-agri-discovery-os/production/sangbong_digital_twin/ (canonical_webtoon_sheets, scripts) | 제작 중 |
| 6 | 상봉대리점 승인 설정 | 웹툰 | k-agri-expo/jopd-studio/writers-room/works/SANGBONG_WEBTOON.json | 4번과 내용 겹침 |
| 7 | 와성원예 웹툰 「박 반장의 농사달력」 (bible·rules·cast·EP01 v2·EP02 v1) | 농업 정보 웹툰 | k-agri-discovery-os/production/webtoon_series/wasung_farm/ | 사장님 검토 대기 |
| 8 | Dreaming Writer 엔진 (story/character/mutation lab, master-writer-education) | 기획·대본 생성 앱 코드 | k-agri-expo/src/lib/jopd-writers-room/ | 앱 내부 프롬프트 |
| 9 | Broadcast DNA 리서처 (프롬프트 V3, 계약서) | 방송 분석 | k-agri-expo/jopd-studio/broadcast-dna/ | 연구 도구 |
| 10 | 작가실 Python 버전 (writer_room v1~v3, story_finder) | 이야기 찾기 | k-agri-discovery-os/writers_room/ | 구버전 다수 |
| 11 | 영업 문구·쇼츠 생성기 | 농자재 광고 카피 | k-agri-expo/src/lib/ai-sales/ (adCopyGenerator, shortsScriptGenerator) | 고정 문장 틀 수준 |
| 12 | 판매왕 PV5 작품 메모 | 영천 농촌 PV5 | k-agri-expo/jopd-studio/writers-room/works/sales-king-yeongcheon-pv5.json | 거의 비어 있음 |
| 13 | 미국 라디오 광고 카피라이터 | 영어 라디오 광고 | Claude 스킬 (us-radio-ad-copywriter) | 2026-10-16 생성 |

## 2. 발견한 문제

1. **기준이 두 폴더에 나뉘어 있음**: 헌법은 k-agri-expo, 능력 사전과 웹툰 규칙은 k-agri-discovery-os에 있어 작가마다 읽는 기준이 다를 수 있음.
2. **상봉대리점 설정이 두 곳에 중복**: docs/writers_room/sangbong 과 works/SANGBONG_WEBTOON.json. 한쪽만 고치면 서로 어긋남.
3. **백업 파일이 많았음**: git 밖 백업 942개는 `_backups_before/`로 정리, git 안 515개는 git에 유지.
4. **영업 카피 생성기가 헌법과 충돌**: "남들은 이미 시작했습니다", "고추 커진 화면" 같은 압박·효과 단정 문구가 헌법 제20조(브랜드는 이야기 안에서 증명)와 검증된 제품 원칙에 맞지 않음.
5. **와성원예 웹툰은 상봉 작가실 규칙을 공유하지 않음**: 웹툰 문법·채점표가 상봉 전용으로만 쓰여 있음.

## 3. 정리 방향: 장르별 작가 + 작품별 설정집

| 층 | 무엇 | 만들 것 |
|---|---|---|
| 공통 | 헌법 + 능력 사전 요약 | 스킬 `jopd-creative-core` |
| 장르 | 웹툰 시트콤 작가 (상봉·와성 공통 문법, 채점표, 패널 규칙) | 스킬 `webtoon-sitcom-writer` |
| 장르 | 쇼츠·영상 대본 작가 (한국농수산TV, Buzz Cast) | 스킬 `shorts-script-writer` — ai-sales 생성기 대체 |
| 장르 | 미국 라디오 광고 카피라이터 | 스킬 `us-radio-ad-copywriter` (완료) |
| 작품 | 상봉대리점 / 와성원예 / 판매왕 PV5 설정집 (캐릭터·승인 설정·금지사항) | 각 작품 폴더의 bible 한 곳에만 둠 |

원칙: 작가 실력은 스킬 한 곳, 작품 설정은 작품 폴더 한 곳. 같은 내용을 두 곳에 두지 않는다.

## 4. 다음 단계

- [ ] 상봉대리점 설정의 기준 위치 정하기 (docs/writers_room/sangbong 권장) → works JSON은 참조만
- [x] `jopd-creative-core`, `webtoon-sitcom-writer` 스킬 초안 작성 (2026-10-16, 저장은 사장님 승인)
- [ ] `shorts-script-writer` 스킬 만들고 ai-sales 생성기 교체 검토
- [x] git에 없던 `.before_*` 백업 942개는 `_backups_before/`로 이동(.gitignore 처리), git에 올라가 있던 515개는 사장님 지시로 원래 위치에 그대로 유지. 삭제 없음, MANIFEST.csv 기록 (2026-10-16)
