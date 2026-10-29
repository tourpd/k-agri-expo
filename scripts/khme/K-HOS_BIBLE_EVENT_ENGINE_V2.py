from pathlib import Path
from datetime import datetime
from openai import OpenAI
import os, re, json, time

ROOT = Path("K-HOS")
BIBLE = ROOT / "HUMANITY_BLACK_BOX/004_BIBLE/KoreanRevisedVersion"

DB = ROOT / "HUMANITY_DATABASE"
EVENT = DB / "01_STORY_EVENT_BANK"
LESSON = DB / "02_HUMAN_LESSON_BANK"
THEME = DB / "03_THEME_BANK"
QUESTION = DB / "04_HUMAN_QUESTION_BANK"
SOUL = DB / "05_SOUL_BANK"
WRITER = DB / "06_WRITER_ROOM_INDEX"

MASTER1 = ROOT / "MASTER/COMMAND_CENTER.md"
MASTER2 = ROOT / "HUMANITY_BLACK_BOX/MASTER/COMMAND_CENTER.md"
STATUS = ROOT / "STATUS"
LOG = ROOT / "LOG"

for p in [EVENT, LESSON, THEME, QUESTION, SOUL, WRITER, MASTER1.parent, MASTER2.parent, STATUS, LOG]:
    p.mkdir(parents=True, exist_ok=True)

MODEL = os.getenv("KHOS_MODEL", "gpt-5")
START_AT = int(os.getenv("KHOS_START_AT", "0"))
LIMIT = int(os.getenv("KHOS_LIMIT", "0"))

client = OpenAI(timeout=240)

SOUL19 = [
"LOVE","RESPONSIBILITY","SACRIFICE","HOPE","SUFFERING","COMMUNITY",
"MEMORY","HERO","FAITH","BEAUTY","BIRTH","DEATH","CURIOSITY","FEAR",
"COURAGE","FREEDOM","PLAY","CREATION","TRANSCENDENCE"
]

def safe(s):
    s = str(s or "UNTITLED")
    s = s.replace("/", "_").replace("\\", "_").replace(":", "_")
    s = re.sub(r'[^\w가-힣\-_. ]+', '_', s)
    return s.strip(" ._")[:70] or "UNTITLED"

def book_no(path):
    m = re.match(r"(\d+)", path.parent.name)
    return int(m.group(1)) if m else 999

def chapter_no(path):
    m = re.search(r"(\d+)", path.stem)
    return int(m.group(1)) if m else 0

files = [f for f in BIBLE.rglob("*.md") if re.search(r"\d+", f.stem)]
files = sorted(files, key=lambda f: (book_no(f), f.parent.name, chapter_no(f), f.name))

if LIMIT > 0:
    files = files[START_AT:START_AT + LIMIT]
else:
    files = files[START_AT:]

TOTAL_ALL = len([f for f in BIBLE.rglob("*.md") if re.search(r"\d+", f.stem)])
TOTAL_RUN = len(files)

def max_event_id():
    nums = []
    for f in EVENT.glob("BIB-EVT-*.md"):
        m = re.search(r"BIB-EVT-(\d+)", f.name)
        if m:
            nums.append(int(m.group(1)))
    return max(nums) if nums else 0

event_id = max_event_id()

def clean(text):
    text = re.sub(r"#.*\n", "", text)
    text = re.sub(r"\|\|.*\n", "", text)
    text = text.replace("***", "")
    text = re.sub(r"######\s*(\d+)", r"\n[절 \1]", text)
    return text.strip()

def update(file_name, absolute_idx, run_idx, events, status="🟢 WORKING", note=""):
    filled = int((absolute_idx / TOTAL_ALL) * 20) if TOTAL_ALL else 0
    bar = "█" * filled + "░" * (20 - filled)

    text = f"""# K-HOS LIVE COMMAND CENTER

STATUS
{status}

LAST UPDATE
{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

SOURCE
성경 66권

PHASE
BIBLE HUMAN STORY EVENT ENGINE V2

CURRENT FILE
{file_name}

TOTAL PROGRESS
{bar}

{absolute_idx} / {TOTAL_ALL}

THIS RUN
{run_idx} / {TOTAL_RUN}

EVENTS
{events}

NOTE
{note}
"""
    MASTER1.write_text(text, encoding="utf-8")
    MASTER2.write_text(text, encoding="utf-8")
    (STATUS / "CURRENT_JOB.md").write_text(text, encoding="utf-8")

def analyze(file, text):
    prompt = f"""
너는 K-HOS 작가실용 성경 사건 인덱서다.

아래 성경 본문에서 작가실이 재사용할 수 있는 '독립 사건'을 가능한 한 촘촘하게 추출하라.

절 요약 금지.
장 요약 금지.
설교 금지.
사건 중심.
교훈은 짧게.
한 장 안에서 여러 사건을 뽑아라.
작가가 바로 쓸 수 있도록 시작/전개/갈등/선택/결말/결과를 반드시 채워라.

반드시 JSON만 출력하라.

형식:
{{
  "events": [
    {{
      "title": "사건명",
      "reference": "파일명 또는 절 범위",
      "characters": ["등장인물"],
      "beginning": "사건의 시작",
      "development": "사건의 전개",
      "conflict": "핵심 갈등",
      "choice": "주요 선택",
      "ending": "결말",
      "result": "결과",
      "human_question": "인간은 왜 ... 하는가?",
      "lesson": "짧은 교훈 한 줄",
      "themes": ["주제"],
      "souls": ["LOVE"],
      "writer_room": "웅쌤/웅녀/공동농사국/옥암리/참교육 활용법"
    }}
  ]
}}

SOUL은 반드시 이 목록 중에서만 선택:
{SOUL19}

파일:
{file.parent.name}/{file.name}

본문:
{text[:22000]}
"""
    r = client.responses.create(
        model=MODEL,
        input=prompt,
        text={"format": {"type": "json_object"}}
    )
    raw = r.output_text.strip()
    (STATUS / "LAST_RAW_RESPONSE.json").write_text(raw, encoding="utf-8")
    return json.loads(raw)

def save_indexed_file(folder, key, filename, md):
    d = folder / safe(key)
    d.mkdir(parents=True, exist_ok=True)
    (d / filename).write_text(md, encoding="utf-8")

def save_event(eid, ev, source):
    title = ev.get("title", "UNTITLED")
    lesson = ev.get("lesson", "")
    question = ev.get("human_question", "")
    themes = ev.get("themes", [])
    souls = [s for s in ev.get("souls", []) if s in SOUL19]

    md = f"""# {eid} {title}

SOURCE
{source}

REFERENCE
{ev.get("reference","")}

TITLE
{title}

CHARACTERS
{chr(10).join("- " + str(x) for x in ev.get("characters", []))}

BEGINNING
{ev.get("beginning","")}

DEVELOPMENT
{ev.get("development","")}

CONFLICT
{ev.get("conflict","")}

CHOICE
{ev.get("choice","")}

ENDING
{ev.get("ending","")}

RESULT
{ev.get("result","")}

HUMAN QUESTION
{question}

LESSON
{lesson}

THEMES
{chr(10).join("- " + str(x) for x in themes)}

SOUL19
{chr(10).join("- " + str(x) for x in souls)}

WRITER ROOM
{ev.get("writer_room","")}

STATUS
STORY_EVENT_INDEXED
"""
    filename = f"{eid}_{safe(title)}.md"
    (EVENT / filename).write_text(md, encoding="utf-8")

    if lesson:
        save_indexed_file(LESSON, lesson, filename, md)
    if question:
        save_indexed_file(QUESTION, question, filename, md)

    for t in themes:
        save_indexed_file(THEME, t, filename, md)

    for s in souls:
        save_indexed_file(SOUL, s, filename, md)

    save_indexed_file(WRITER, "BIBLE", filename, md)

print("K-HOS BIBLE EVENT ENGINE V2 START")
print("MODEL:", MODEL)
print("START_AT:", START_AT)
print("RUN FILES:", TOTAL_RUN)
print("CURRENT EVENT ID:", event_id)

for run_idx, file in enumerate(files, 1):
    absolute_idx = START_AT + run_idx
    update(file.name, absolute_idx, run_idx, event_id, note="사건 추출 중")

    try:
        text = clean(file.read_text(encoding="utf-8", errors="ignore"))
        data = analyze(file, text)
        events = data.get("events", [])

        for ev in events:
            event_id += 1
            eid = f"BIB-EVT-{event_id:06d}"
            save_event(eid, ev, f"{file.parent.name}/{file.name}")

        with open(LOG / "BIBLE_EVENT_ENGINE_V2.log", "a", encoding="utf-8") as fp:
            fp.write(f"{datetime.now()} | OK | {absolute_idx}/{TOTAL_ALL} | {file} | events {len(events)} | total {event_id}\n")

        update(file.name, absolute_idx, run_idx, event_id, note=f"완료: 사건 {len(events)}개")
        print(f"OK {absolute_idx}/{TOTAL_ALL} {file.parent.name}/{file.name} events={len(events)} total={event_id}", flush=True)

    except Exception as e:
        with open(LOG / "BIBLE_EVENT_ENGINE_V2_ERROR.log", "a", encoding="utf-8") as fp:
            fp.write(f"{datetime.now()} | ERROR | {absolute_idx}/{TOTAL_ALL} | {file} | {e}\n")
        update(file.name, absolute_idx, run_idx, event_id, status="🟡 ERROR SKIPPED", note=str(e))
        print(f"ERROR {absolute_idx}/{TOTAL_ALL} {file.name}: {e}", flush=True)
        continue

update("RUN COMPLETE", min(START_AT + TOTAL_RUN, TOTAL_ALL), TOTAL_RUN, event_id, status="🔵 COMPLETE", note="이번 실행 완료")
print(f"RUN COMPLETE files={TOTAL_RUN} events={event_id}", flush=True)
