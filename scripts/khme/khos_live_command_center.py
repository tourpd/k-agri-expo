from pathlib import Path
from datetime import datetime

ROOT = Path("K-HOS")
MASTER = ROOT / "MASTER"
LOG = ROOT / "LOG"
STATUS = ROOT / "STATUS"

MASTER.mkdir(parents=True, exist_ok=True)
LOG.mkdir(parents=True, exist_ok=True)
STATUS.mkdir(parents=True, exist_ok=True)

def bar(current, total, width=20):
    if total <= 0:
        return "░" * width
    filled = int((current / total) * width)
    return "█" * filled + "░" * (width - filled)

def update_command_center(
    source,
    phase,
    current_id,
    current_location,
    current_question,
    current_soul,
    current,
    total,
    next_job,
    status="🟢 WORKING"
):
    percent = round((current / total) * 100, 2) if total else 0
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    text = f"""# 🧠 K-HOS LIVE COMMAND CENTER

━━━━━━━━━━━━━━━━━━
STATUS
━━━━━━━━━━━━━━━━━━

{status}

━━━━━━━━━━━━━━━━━━
LAST UPDATE
━━━━━━━━━━━━━━━━━━

{now}

━━━━━━━━━━━━━━━━━━
SOURCE
━━━━━━━━━━━━━━━━━━

{source}

━━━━━━━━━━━━━━━━━━
PHASE
━━━━━━━━━━━━━━━━━━

{phase}

━━━━━━━━━━━━━━━━━━
CURRENT POSITION
━━━━━━━━━━━━━━━━━━

CURRENT ID:
{current_id}

CURRENT LOCATION:
{current_location}

━━━━━━━━━━━━━━━━━━
CURRENT QUESTION
━━━━━━━━━━━━━━━━━━

{current_question}

━━━━━━━━━━━━━━━━━━
CURRENT SOUL
━━━━━━━━━━━━━━━━━━

{current_soul}

━━━━━━━━━━━━━━━━━━
PROGRESS
━━━━━━━━━━━━━━━━━━

{bar(current, total)} {percent}%

{current} / {total}

━━━━━━━━━━━━━━━━━━
NEXT JOB
━━━━━━━━━━━━━━━━━━

{next_job}

━━━━━━━━━━━━━━━━━━
MISSION
━━━━━━━━━━━━━━━━━━

K-HOS는 데이터를 저장하지 않는다.

K-HOS는 인간이 왜 사랑하고,
왜 싸우고,
왜 믿고,
왜 기록하고,
왜 공동체를 만들고,
왜 죽음을 기억하는지를 저장한다.

━━━━━━━━━━━━━━━━━━
"""

    (MASTER / "COMMAND_CENTER.md").write_text(text, encoding="utf-8")

    (STATUS / "CURRENT_JOB.md").write_text(f"""# CURRENT JOB

SOURCE: {source}

PHASE: {phase}

CURRENT ID: {current_id}

CURRENT LOCATION: {current_location}

CURRENT QUESTION: {current_question}

CURRENT SOUL: {current_soul}

PROGRESS: {current} / {total}

LAST UPDATE: {now}
""", encoding="utf-8")

    with open(LOG / "LIVE_LOG.md", "a", encoding="utf-8") as f:
        f.write(f"- {now} | {source} | {phase} | {current_id} | {current}/{total} | {current_question}\n")

if __name__ == "__main__":
    update_command_center(
        source="성경",
        phase="BIBLE EVENT BUILD",
        current_id="BIB-000000",
        current_location="대기",
        current_question="작업 시작 전",
        current_soul="READY",
        current=0,
        total=31102,
        next_job="BIBLE_KHME_ENGINE 실행",
        status="🟡 READY"
    )
    print("K-HOS LIVE COMMAND CENTER CREATED")
