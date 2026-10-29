from pathlib import Path
from datetime import datetime
from openai import OpenAI
import os, re, json

ROOT = Path("K-HOS")
BIBLE = ROOT / "HUMANITY_BLACK_BOX/004_BIBLE/KoreanRevisedVersion"

EVENT = ROOT / "HUMANITY_DATABASE/01_EVENT_BANK"
LESSON = ROOT / "HUMANITY_DATABASE/02_LESSON_BANK"
THEME = ROOT / "HUMANITY_DATABASE/03_THEME_BANK"
WRITER = ROOT / "HUMANITY_DATABASE/04_WRITER_ROOM"
SOUL = ROOT / "HUMANITY_DATABASE/05_SOUL_BANK"

MASTER1 = ROOT / "MASTER/COMMAND_CENTER.md"
MASTER2 = ROOT / "HUMANITY_BLACK_BOX/MASTER/COMMAND_CENTER.md"
LOG = ROOT / "LOG"
STATUS = ROOT / "STATUS"

for p in [EVENT, LESSON, THEME, WRITER, SOUL, LOG, STATUS, MASTER1.parent, MASTER2.parent]:
    p.mkdir(parents=True, exist_ok=True)

MODEL = os.getenv("KHOS_MODEL", "gpt-5")
client = OpenAI(timeout=180)

SOUL19 = [
"LOVE","RESPONSIBILITY","SACRIFICE","HOPE","SUFFERING","COMMUNITY",
"MEMORY","HERO","FAITH","BEAUTY","BIRTH","DEATH","CURIOSITY","FEAR",
"COURAGE","FREEDOM","PLAY","CREATION","TRANSCENDENCE"
]

def safe(s):
    s = str(s or "UNTITLED")
    s = s.replace("/", "_").replace("\\", "_").replace(":", "_")
    s = re.sub(r'[^\w가-힣\-_. ]+', '_', s)
    return s.strip(" ._")[:60] or "UNTITLED"

def book_no(path):
    m = re.match(r'(\d+)', path.parent.name)
    return int(m.group(1)) if m else 999

def chapter_no(path):
    m = re.search(r'(\d+)', path.stem)
    return int(m.group(1)) if m else 0

files = [f for f in BIBLE.rglob("*.md") if re.search(r'\d+', f.stem)]
files = sorted(files, key=lambda f: (book_no(f), path_name(f:=f), chapter_no(f), f.name)) if False else sorted(files, key=lambda f: (book_no(f), f.parent.name, chapter_no(f), f.name))
TOTAL = len(files)

def max_event_id():
    nums = []
    for f in EVENT.glob("BIB-*.md"):
        m = re.search(r'BIB-(\d+)', f.name)
        if m:
            nums.append(int(m.group(1)))
    return max(nums) if nums else 0

def start_index():
    env = os.getenv("KHOS_START_AT")
    if env:
        return max(0, int(env))
    for p in [MASTER1, MASTER2]:
        if p.exists():
            txt = p.read_text(encoding="utf-8", errors="ignore")
            m = re.search(r'(\d+)\s*/\s*(\d+)', txt)
            if m:
                return max(0, int(m.group(1)))
    return 0

event_id = max_event_id()
START = start_index()

def update(current_file, idx, events, status="🟢 WORKING", note=""):
    filled = int((idx / TOTAL) * 20) if TOTAL else 0
    bar = "█" * filled + "░" * (20 - filled)
    text = f"""# K-HOS LIVE COMMAND CENTER

STATUS
{status}

LAST UPDATE
{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

SOURCE
성경 66권

PHASE
FULL BIBLE EVENT / LESSON / THEME INDEXING

CURRENT FILE
{current_file}

PROGRESS
{bar}

{idx} / {TOTAL}

EVENTS
{events}

NOTE
{note}
"""
    MASTER1.write_text(text, encoding="utf-8")
    MASTER2.write_text(text, encoding="utf-8")
    (STATUS / "CURRENT_JOB.md").write_text(text, encoding="utf-8")

def clean(text):
    text = re.sub(r'#.*\n', '', text)
    text = re.sub(r'\|\|.*\n', '', text)
    text = text.replace("***", "")
    text = re.sub(r'######\s*(\d+)', r'\n[절 \1]', text)
    return text.strip()

def analyze(file, text):
    prompt = f"""
너는 K-HOS 성경 사건 인덱서다.
본문을 읽고 작가실에서 재사용 가능한 사건으로 분해하라.
절 단위 요약 금지. 사건 단위로 뽑아라.
반드시 JSON만 출력하라.

형식:
{{
  "events": [
    {{
      "title": "사건명",
      "characters": ["등장인물"],
      "beginning": "사건의 시작",
      "development": "사건의 전개",
      "conflict": "핵심 갈등",
      "choice": "주요 선택",
      "ending": "결말",
      "lesson": "짧은 교훈 한 줄",
      "themes": ["주제"],
      "souls": ["LOVE"]
    }}
  ]
}}

SOUL은 반드시 이 목록 중에서만 선택:
{SOUL19}

파일:
{file.parent.name}/{file.name}

본문:
{text[:18000]}
"""
    r = client.responses.create(model=MODEL, input=prompt)
    raw = r.output_text.strip()
    (STATUS / "LAST_RAW_RESPONSE.json").write_text(raw, encoding="utf-8")
    return json.loads(raw)

def save_event(eid, ev, source):
    title = ev.get("title", "UNTITLED")
    souls = [s for s in ev.get("souls", []) if s in SOUL19]
    themes = ev.get("themes", [])
    lesson = ev.get("lesson", "")

    md = f"""# {eid} {title}

SOURCE
{source}

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

LESSON
{lesson}

THEMES
{chr(10).join("- " + str(x) for x in themes)}

SOUL19
{chr(10).join("- " + str(x) for x in souls)}

WRITER USE
작가실에서 사건, 갈등, 교훈, 주제, SOUL 기준으로 검색하여 웅쌤/웅녀/공동농사국/옥암리/참교육 콘텐츠에 재가공한다.

STATUS
INDEXED
"""
    name = f"{eid}_{safe(title)}.md"
    (EVENT / name).write_text(md, encoding="utf-8")

    if lesson:
        d = LESSON / safe(lesson)
        d.mkdir(parents=True, exist_ok=True)
        (d / name).write_text(md, encoding="utf-8")

    for t in themes:
        d = THEME / safe(t)
        d.mkdir(parents=True, exist_ok=True)
        (d / name).write_text(md, encoding="utf-8")

    for s in souls:
        d = SOUL / safe(s)
        d.mkdir(parents=True, exist_ok=True)
        (d / name).write_text(md, encoding="utf-8")

    d = WRITER / "BIBLE"
    d.mkdir(parents=True, exist_ok=True)
    (d / name).write_text(md, encoding="utf-8")

print(f"RESUME FROM FILE INDEX: {START}", flush=True)
print(f"CURRENT EVENT ID: {event_id}", flush=True)
print(f"TOTAL FILES: {TOTAL}", flush=True)

for idx, file in enumerate(files[START:], START + 1):
    update(file.name, idx, event_id, note="분석 중")
    try:
        text = clean(file.read_text(encoding="utf-8", errors="ignore"))
        data = analyze(file, text)
        events = data.get("events", [])

        for ev in events:
            event_id += 1
            save_event(f"BIB-{event_id:06d}", ev, f"{file.parent.name}/{file.name}")

        with open(LOG / "BIBLE_INDEXER.log", "a", encoding="utf-8") as fp:
            fp.write(f"{datetime.now()} | OK | {idx}/{TOTAL} | {file} | events {len(events)} | total {event_id}\n")

        update(file.name, idx, event_id, note=f"완료: 사건 {len(events)}개")
        print(f"OK {idx}/{TOTAL} {file.name} events={len(events)} total={event_id}", flush=True)

    except Exception as e:
        with open(LOG / "ERROR.log", "a", encoding="utf-8") as fp:
            fp.write(f"{datetime.now()} | ERROR | {idx}/{TOTAL} | {file} | {e}\n")
        update(file.name, idx, event_id, status="🟡 ERROR SKIPPED", note=str(e))
        print(f"ERROR {idx}/{TOTAL} {file.name}: {e}", flush=True)
        continue

update("COMPLETE", TOTAL, event_id, status="🔵 COMPLETE", note="성경 66권 인덱싱 완료")
print(f"COMPLETE files={TOTAL} events={event_id}", flush=True)
