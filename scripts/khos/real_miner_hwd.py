#!/usr/bin/env python3
from pathlib import Path
import re, sys, subprocess

try:
    from pypdf import PdfReader
except Exception:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "pypdf"])
    from pypdf import PdfReader

ROOT = Path("K-HOS/HUMANITY_BLACK_BOX")
PDF = ROOT / "003_SOURCE_ARCHIVES/hwandangogi/source/HWANDANGOGI_ORIGINAL.pdf"
EVENT_DIR = ROOT / "003_SOURCE_ARCHIVES/hwandangogi/events"
MASTER = ROOT / "MASTER"

EVENT_DIR.mkdir(parents=True, exist_ok=True)
MASTER.mkdir(parents=True, exist_ok=True)

if not PDF.exists():
    print("PDF 없음:", PDF)
    print("먼저 환단고기 원문.pdf를 source 폴더에 넣어라.")
    sys.exit(1)

reader = PdfReader(str(PDF))
pages = []
for i, page in enumerate(reader.pages, start=1):
    text = page.extract_text() or ""
    text = re.sub(r"\s+", " ", text).strip()
    if text:
        pages.append((i, text))

chunks = []
for page_no, text in pages:
    parts = re.split(r"(?<=[。.!?])\s+|(?=檀君|桓雄|桓仁|熊|虎|蚩尤|王儉|詔曰|命|祭天|弘益|在世理化)", text)
    for p in parts:
        p = p.strip()
        if len(p) >= 35:
            chunks.append((page_no, p[:900]))

def cluster_of(text):
    if "太白逸史" in text or "三神" in text or "蘇塗" in text:
        return "태백일사"
    if "北夫餘" in text or "解慕漱" in text:
        return "북부여기"
    if "檀君" in text or "王儉" in text or "朝鮮" in text:
        return "단군세기"
    if "桓雄" in text or "神市" in text or "熊" in text or "虎" in text:
        return "신시/환웅"
    if "桓仁" in text or "桓國" in text:
        return "환국"
    return "환단고기"

def soul_question(text):
    rules = [
        (["弘益", "濟人", "愛"], "인간은 왜 남을 이롭게 하려 하는가?", "LOVE, RESPONSIBILITY, COMMUNITY"),
        (["在世理化", "治", "命", "詔"], "인간은 왜 세상을 다스릴 질서를 만드는가?", "RESPONSIBILITY, COMMUNITY, CREATION"),
        (["祭天", "三神", "天神", "天帝"], "인간은 왜 하늘과 신을 찾는가?", "FAITH, TRANSCENDENCE, COMMUNITY"),
        (["熊", "虎", "忌", "修", "耐"], "인간은 왜 고통을 견디며 변하려 하는가?", "SUFFERING, SACRIFICE, HOPE"),
        (["火", "熟食", "鑄", "鐵", "船", "書契", "文字"], "인간은 왜 도구와 문자를 만드는가?", "CREATION, CURIOSITY, MEMORY"),
        (["法", "禁", "刑", "善惡", "盜"], "인간은 왜 법과 금기를 만드는가?", "RESPONSIBILITY, COMMUNITY, FEAR"),
        (["農", "田", "穀", "蠶", "食"], "인간은 왜 먹을 것을 공동체의 근본으로 삼는가?", "COMMUNITY, RESPONSIBILITY, HOPE"),
        (["兵", "戰", "征", "侵", "破"], "인간은 왜 싸우고 지키려 하는가?", "COURAGE, FEAR, RESPONSIBILITY"),
        (["歌", "舞", "鼓", "樂"], "인간은 왜 노래하고 춤추는가?", "PLAY, COMMUNITY, MEMORY"),
        (["崩", "葬", "喪", "死"], "인간은 왜 죽음을 기억으로 남기는가?", "DEATH, MEMORY, LOVE"),
    ]
    for keys, q, souls in rules:
        if any(k in text for k in keys):
            return q, souls
    return "인간은 왜 자신의 존재 이유를 기록하려 하는가?", "MEMORY, CURIOSITY, TRANSCENDENCE"

def conflict_of(q):
    if "하늘" in q or "신" in q: return "현실 VS 초월"
    if "법" in q or "질서" in q: return "혼돈 VS 질서"
    if "고통" in q: return "고통 VS 변화"
    if "싸우고" in q: return "위협 VS 생존"
    if "먹을 것" in q: return "굶주림 VS 공동체"
    if "노래" in q: return "고독 VS 연대"
    if "죽음" in q: return "소멸 VS 기억"
    return "무지 VS 의미"

limit = min(500, len(chunks))
for idx in range(limit):
    n = idx + 1
    eid = f"HWD-{n:04d}"
    page_no, original = chunks[idx]
    cluster = cluster_of(original)
    question, souls = soul_question(original)
    conflict = conflict_of(question)

    md = f"""# {eid}

## SOURCE
환단고기 원문.pdf

## PAGE
{page_no}

## CLUSTER
{cluster}

## ORIGINAL EXTRACT
{original}

## HUMAN QUESTION
{question}

## CONFLICT
{conflict}

## HUMAN SOUL
{souls}

## MODERN CASE
- 가족
- 농민
- 마을 공동체
- 국가
- 교육
- AI 시대 인간성

## CONTENT USE
- 웅쌤
- 웅녀
- 공동농사국
- 옥암리 사람들
- 참교육

## STORY SEED
이 원문은 인간이 왜 함께 살고, 믿고, 싸우고, 기억하고, 더 나은 세상을 꿈꾸는지를 보여주는 이야기 원석이다.

## STATUS
REAL_MINED
"""
    (EVENT_DIR / f"{eid}.md").write_text(md, encoding="utf-8")
    if n % 25 == 0:
        print(f"REAL MINED {n}/{limit}")

bar = "█" * 20
command = f"""# 🧠 K-HOS COMMAND CENTER

━━━━━━━━━━━━━━━━━━
STATUS
━━━━━━━━━━━━━━━━━━

🟢 REAL MINING COMPLETE - PASS 1

━━━━━━━━━━━━━━━━━━
CURRENT SOURCE
━━━━━━━━━━━━━━━━━━

환단고기 원문.pdf

━━━━━━━━━━━━━━━━━━
PROGRESS
━━━━━━━━━━━━━━━━━━

{bar} 100%

{limit} / {limit}

━━━━━━━━━━━━━━━━━━
RESULT
━━━━━━━━━━━━━━━━━━

환단고기 원문 기반 REAL MINING 1차 완료

생성/갱신:
HWD-0001 ~ HWD-{limit:04d}

━━━━━━━━━━━━━━━━━━
NEXT PHASE
━━━━━━━━━━━━━━━━━━

PASS 2:
각 EVENT를 작가실용으로 정밀 보강

- 원전 근거 정리
- 쉬운 한국어 해석
- 장면화
- 캐릭터 연결
- 웅쌤/웅녀/공동농사국/참교육 아이템화

━━━━━━━━━━━━━━━━━━
NEXT JOB
━━━━━━━━━━━━━━━━━━

HWD-0001 ~ HWD-0050 정밀 보강

━━━━━━━━━━━━━━━━━━
STATUS
━━━━━━━━━━━━━━━━━━

READY FOR PASS 2
"""
(MASTER / "COMMAND_CENTER.md").write_text(command, encoding="utf-8")

print("")
print("================================")
print("K-HOS REAL MINER COMPLETE")
print(f"REAL MINED: HWD-0001 ~ HWD-{limit:04d}")
print("Obsidian events 폴더와 COMMAND_CENTER 갱신 완료")
print("================================")
