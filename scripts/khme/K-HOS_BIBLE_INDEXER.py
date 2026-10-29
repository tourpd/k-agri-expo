from pathlib import Path
from datetime import datetime
from openai import OpenAI
import json, os, re, sys

ROOT = Path("K-HOS")
BIBLE = ROOT / "HUMANITY_BLACK_BOX/004_BIBLE/KoreanRevisedVersion"

EVENT = ROOT / "HUMANITY_DATABASE/01_EVENT_BANK"
LESSON = ROOT / "HUMANITY_DATABASE/02_LESSON_BANK"
THEME = ROOT / "HUMANITY_DATABASE/03_THEME_BANK"
WRITER = ROOT / "HUMANITY_DATABASE/04_WRITER_ROOM"

MASTER = ROOT / "MASTER"
STATUS = ROOT / "STATUS"
LOG = ROOT / "LOG"

for p in [EVENT, LESSON, THEME, WRITER, MASTER, STATUS, LOG]:
    p.mkdir(parents=True, exist_ok=True)

client = OpenAI()

files = sorted(BIBLE.rglob("*.md"))
total = len(files)
count = 0
event_id = 0

def update_status(fname):
    progress = int((count / total) * 20)
    bar = "█" * progress + "░" * (20 - progress)

    cmd = f"""# K-HOS LIVE COMMAND CENTER

STATUS
🟢 WORKING

SOURCE
성경

CURRENT FILE
{fname}

PROGRESS
{bar}

{count} / {total}

EVENTS
{event_id}
"""
    (MASTER/"COMMAND_CENTER.md").write_text(cmd, encoding="utf-8")
    (STATUS/"CURRENT_JOB.md").write_text(cmd, encoding="utf-8")

for f in files:

    count += 1
    update_status(f.name)

    text = f.read_text(encoding="utf-8", errors="ignore")
    text = text[:15000]

    prompt = f"""
다음 성경 본문을 읽고
사건 단위로 분해하라.

반드시 JSON만 출력.

{{
 "events":[
   {{
    "title":"",
    "characters":[],
    "beginning":"",
    "development":"",
    "conflict":"",
    "choice":"",
    "ending":"",
    "lesson":"",
    "themes":[],
    "writer_room":""
   }}
 ]
}}

본문:
{text}
"""

    try:
        r = client.responses.create(
            model="gpt-5",
            input=prompt
        )

        raw = r.output_text
        data = json.loads(raw)

        for ev in data["events"]:
            event_id += 1

            eid = f"BIB-{event_id:06d}"

            md = f"""# {eid}

TITLE
{ev['title']}

CHARACTERS
{chr(10).join(ev['characters'])}

BEGINNING
{ev['beginning']}

DEVELOPMENT
{ev['development']}

CONFLICT
{ev['conflict']}

CHOICE
{ev['choice']}

ENDING
{ev['ending']}

LESSON
{ev['lesson']}

THEMES
{chr(10).join(ev['themes'])}

WRITER ROOM
{ev['writer_room']}
"""

            (EVENT/f"{eid}.md").write_text(md,encoding="utf-8")

            ldir = LESSON/ev["lesson"][:40]
            ldir.mkdir(exist_ok=True)
            (ldir/f"{eid}.md").write_text(md,encoding="utf-8")

            for t in ev["themes"]:
                tdir = THEME/t[:30]
                tdir.mkdir(exist_ok=True)
                (tdir/f"{eid}.md").write_text(md,encoding="utf-8")

    except Exception as e:
        with open(LOG/"ERROR.log","a") as fp:
            fp.write(f"{f}: {e}\n")

(MASTER/"COMMAND_CENTER.md").write_text(
f"# COMPLETE\n\nFILES:{count}\nEVENTS:{event_id}",
encoding="utf-8"
)

print()
print("================================")
print("K-HOS BIBLE INDEX COMPLETE")
print("FILES :",count)
print("EVENTS:",event_id)
print("================================")
