from pathlib import Path
from datetime import datetime
import os, sys, json, time, re
from openai import OpenAI

sys.path.append("scripts/khme")
from khos_live_command_center import update_command_center

ROOT = Path("K-HOS")
SRC = ROOT / "HUMANITY_BLACK_BOX/004_BIBLE/KoreanRevisedVersion/01창세기"
OUT = ROOT / "HUMANITY_DATABASE/01_STORY_EVENT_BANK"
LESSON = ROOT / "HUMANITY_DATABASE/02_HUMAN_LESSON_BANK"
SOUL = ROOT / "HUMANITY_DATABASE/03_HUMAN_SOUL_BANK"
WRITER = ROOT / "HUMANITY_DATABASE/04_WRITER_ROOM_INDEX"
STATUS = ROOT / "STATUS"

for p in [OUT, LESSON, SOUL, WRITER, STATUS]:
    p.mkdir(parents=True, exist_ok=True)

MODEL = os.getenv("KHOS_MODEL", "gpt-4.1-mini")
MAX_CHAPTERS = int(os.getenv("KHOS_MAX_CHAPTERS", "50"))

client = OpenAI()

SOUL19 = [
"LOVE","RESPONSIBILITY","SACRIFICE","HOPE","SUFFERING","COMMUNITY",
"MEMORY","HERO","FAITH","BEAUTY","BIRTH","DEATH","CURIOSITY","FEAR",
"COURAGE","FREEDOM","PLAY","CREATION","TRANSCENDENCE"
]

def clean_chapter(text):
    text = re.sub(r"#.*\n", "", text)
    text = re.sub(r"\|\|.*\n", "", text)
    text = text.replace("***", "")
    text = re.sub(r"######\s*(\d+)", r"\n[절 \1]", text)
    return text.strip()

def read_chapter(n):
    p = SRC / f"창{n}.md"
    if not p.exists():
        return ""
    return clean_chapter(p.read_text(encoding="utf-8", errors="ignore"))

def analyze(chapter_no, text):
    prompt = f"""
너는 K-HOS HUMANITY STORY EVENT AGENT다.

입력된 성경 본문을 '절 단위'가 아니라 '사건 단위'로 나누어라.
하드코딩하지 말고 본문 안에서 사건을 찾아라.

각 사건은 작가실에서 바로 쓸 수 있어야 한다.

반드시 JSON만 출력하라.
스키마:
{{
  "events": [
    {{
      "event_title": "사건명",
      "reference": "창세기 {chapter_no}:절범위",
      "cast": ["등장인물"],
      "beginning": "사건의 시작",
      "development": "전개",
      "conflict": "핵심 갈등",
      "choice": "인물이 선택한 것",
      "ending": "결말",
      "result": "남은 결과",
      "short_lesson": "한 줄 교훈",
      "human_soul_19": ["{SOUL19[0]}", "..."],
      "themes": ["주제"],
      "writer_room_use": "웅쌤/웅녀/공동농사국/옥암리/참교육에서 쓸 수 있는 방식"
    }}
  ]
}}

규칙:
- human_soul_19는 반드시 다음 목록 중에서만 고른다: {SOUL19}
- 교훈은 짧게.
- 사건은 시작/전개/결말이 있어야 한다.
- 설교하지 말고 작가실 자료로 만든다.

본문:
{text}
"""
    res = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role":"system","content":"너는 성경을 사건 구조와 인간 행동 데이터로 변환하는 K-HOS 분석 엔진이다. 반드시 JSON만 출력한다."},
            {"role":"user","content":prompt}
        ],
        temperature=0.2,
        response_format={"type":"json_object"}
    )
    return json.loads(res.choices[0].message.content)

def safe(s):
    return re.sub(r"[^\w가-힣\-]+", "_", s).strip("_")[:80]

def save_event(eid, ev):
    title = ev.get("event_title", "UNTITLED")
    souls = [x for x in ev.get("human_soul_19", []) if x in SOUL19]

    md = f"""# {eid} {title}

================================
SOURCE
================================
성경 개역한글

================================
REFERENCE
================================
{ev.get("reference","")}

================================
EVENT TITLE
================================
{title}

================================
CAST
================================
""" + "\n".join(f"- {x}" for x in ev.get("cast", [])) + f"""

================================
BEGINNING
================================
{ev.get("beginning","")}

================================
DEVELOPMENT
================================
{ev.get("development","")}

================================
CONFLICT
================================
{ev.get("conflict","")}

================================
CHOICE
================================
{ev.get("choice","")}

================================
ENDING
================================
{ev.get("ending","")}

================================
RESULT
================================
{ev.get("result","")}

================================
SHORT LESSON
================================
{ev.get("short_lesson","")}

================================
HUMAN SOUL 19
================================
""" + "\n".join(f"- {x}" for x in souls) + f"""

================================
THEMES
================================
""" + "\n".join(f"- {x}" for x in ev.get("themes", [])) + f"""

================================
WRITER ROOM USE
================================
{ev.get("writer_room_use","")}

================================
STATUS
================================
AI_EVENT_EXTRACTED
"""

    filename = f"{eid}_{safe(title)}.md"
    (OUT / filename).write_text(md, encoding="utf-8")

    lesson_name = safe(ev.get("short_lesson","NO_LESSON"))
    ldir = LESSON / lesson_name
    ldir.mkdir(parents=True, exist_ok=True)
    (ldir / filename).write_text(md, encoding="utf-8")

    for soul in souls:
        sdir = SOUL / soul
        sdir.mkdir(parents=True, exist_ok=True)
        (sdir / filename).write_text(md, encoding="utf-8")

    wdir = WRITER / "BIBLE_GENESIS"
    wdir.mkdir(parents=True, exist_ok=True)
    (wdir / filename).write_text(md, encoding="utf-8")

def main():
    if not os.getenv("OPENAI_API_KEY"):
        print("ERROR: OPENAI_API_KEY 없음")
        print("먼저 실행: export OPENAI_API_KEY=os.environ.get("OPENAI_API_KEY", "")")
        sys.exit(1)

    total_chapters = MAX_CHAPTERS
    event_count = 0

    for ch in range(1, total_chapters + 1):
        text = read_chapter(ch)
        if not text:
            continue

        update_command_center(
            source="성경",
            phase="AI GENESIS EVENT EXTRACTION",
            current_id=f"GEN-CH-{ch:02d}",
            current_location=f"창세기 {ch}장",
            current_question="AI가 본문에서 사건을 찾는 중",
            current_soul="ANALYZING",
            current=ch-1,
            total=total_chapters,
            next_job=f"창세기 {ch}장 분석",
            status="🟢 WORKING"
        )

        try:
            data = analyze(ch, text)
            events = data.get("events", [])
        except Exception as e:
            (STATUS / "LAST_ERROR.md").write_text(f"# ERROR\n\n창세기 {ch}장\n\n{e}\n", encoding="utf-8")
            update_command_center(
                source="성경",
                phase="AI GENESIS EVENT EXTRACTION",
                current_id=f"GEN-CH-{ch:02d}",
                current_location=f"창세기 {ch}장 ERROR",
                current_question=str(e),
                current_soul="ERROR",
                current=ch-1,
                total=total_chapters,
                next_job="오류 확인",
                status="🔴 ERROR"
            )
            break

        for ev in events:
            event_count += 1
            eid = f"GEN-AI-{event_count:05d}"
            save_event(eid, ev)

        update_command_center(
            source="성경",
            phase="AI GENESIS EVENT EXTRACTION",
            current_id=f"GEN-CH-{ch:02d}",
            current_location=f"창세기 {ch}장 완료",
            current_question=f"추출 사건 {len(events)}개",
            current_soul="STORY EVENT",
            current=ch,
            total=total_chapters,
            next_job=f"창세기 {ch+1}장",
            status="🟢 WORKING"
        )
        time.sleep(0.2)

    update_command_center(
        source="성경",
        phase="AI GENESIS EVENT EXTRACTION",
        current_id=f"GEN-AI-{event_count:05d}",
        current_location="창세기 완료",
        current_question=f"AI 사건 추출 완료: {event_count}개",
        current_soul="EVENT + LESSON + SOUL",
        current=total_chapters,
        total=total_chapters,
        next_job="출애굽기 AI 사건 추출",
        status="🔵 COMPLETE"
    )

    print(f"COMPLETE: {event_count} events")

if __name__ == "__main__":
    main()
