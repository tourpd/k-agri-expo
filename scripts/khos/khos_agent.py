#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path("K-HOS/HUMANITY_BLACK_BOX")
EVENT_DIR = ROOT / "003_SOURCE_ARCHIVES/hwandangogi/events"
MASTER_DIR = ROOT / "MASTER"

EVENT_DIR.mkdir(parents=True, exist_ok=True)
MASTER_DIR.mkdir(parents=True, exist_ok=True)

TOTAL = 500
BATCH_SIZE = int(sys.argv[1]) if len(sys.argv) > 1 else 20

EVENTS = {
31: ("인간은 왜 정의를 찾는가?", "RESPONSIBILITY, COMMUNITY, FAITH", "불의 VS 정의", "참교육, 웅쌤, 공동농사국 헌법"),
32: ("인간은 왜 질서를 만드는가?", "COMMUNITY, RESPONSIBILITY, FEAR", "혼돈 VS 질서", "공동농사국, 옥암리 사람들"),
33: ("인간은 왜 아름다움을 찾는가?", "BEAUTY, CREATION, HOPE", "혼란 VS 조화", "K-AGRI 디자인, 웅녀"),
34: ("인간은 왜 노래하는가?", "PLAY, COMMUNITY, MEMORY", "고독 VS 연결", "아리랑, 옥암리 사람들"),
35: ("인간은 왜 춤추는가?", "PLAY, FREEDOM, COMMUNITY", "억압 VS 자유", "마을축제, 공동농사국"),
36: ("인간은 왜 창조하는가?", "CREATION, HOPE, TRANSCENDENCE", "현실 VS 이상", "K-AGRI, 웅쌤 세계관"),
37: ("인간은 왜 초월을 꿈꾸는가?", "TRANSCENDENCE, FAITH, CURIOSITY", "한계 VS 무한", "AI 인간성, 참교육"),
38: ("인간은 왜 영웅을 기다리는가?", "HERO, HOPE, RESPONSIBILITY", "무력감 VS 구원", "웅쌤, 환웅"),
39: ("인간은 왜 기억하려 하는가?", "MEMORY, DEATH, HOPE", "소멸 VS 기록", "K-HOS, 가족 아카이브"),
40: ("인간은 왜 희생을 숭고하게 여기는가?", "SACRIFICE, LOVE, RESPONSIBILITY", "이기심 VS 헌신", "웅녀, 농민, 어머니"),
}

def existing_numbers():
    nums = []
    for p in EVENT_DIR.glob("HWD-*.md"):
        try:
            nums.append(int(p.stem.split("-")[1]))
        except:
            pass
    return sorted(nums)

def make_event(n):
    title, souls, conflict, content = EVENTS.get(
        n,
        (
            f"환국 STORY SEED {n:04d}",
            "COMMUNITY, HOPE, TRANSCENDENCE",
            "혼돈 VS 인간의 질서",
            "웅쌤, 웅녀, 공동농사국, 참교육"
        )
    )
    event_id = f"HWD-{n:04d}"
    text = f"""# {event_id}

## SOURCE
환단고기

## CLUSTER
환국

## TITLE
{title}

## EVENT
환국 세계관 안에서 인간은 자신의 존재 이유와 공동체의 질서를 찾으려 한다.

## HUMAN QUESTION
{title}

## CONFLICT
{conflict}

## HUMAN SOUL
{souls}

## MODERN CASE
- 가족
- 농민
- 마을 공동체
- 교육
- 리더십

## CONTENT USE
{content}

## STORY SEED
이 질문을 현대 농민, 부모, 리더, 아이들의 이야기로 바꾸면 웅쌤 세계관의 한 장면이 된다.

## STATUS
MINED
"""
    (EVENT_DIR / f"{event_id}.md").write_text(text, encoding="utf-8")

def update_command_center(current):
    progress = round(current / TOTAL * 100, 1)
    bar_count = max(1, int(progress // 5))
    bar = "█" * bar_count + "░" * (20 - bar_count)
    next_start = min(current + 1, TOTAL)
    next_end = min(current + BATCH_SIZE, TOTAL)

    text = f"""# 🧠 K-HOS HUMANITY BLACK BOX COMMAND CENTER

━━━━━━━━━━━━━━━━━━
STATUS
━━━━━━━━━━━━━━━━━━

🟢 WORKING

━━━━━━━━━━━━━━━━━━
CURRENT SOURCE
━━━━━━━━━━━━━━━━━━

환단고기

━━━━━━━━━━━━━━━━━━
PROGRESS
━━━━━━━━━━━━━━━━━━

{bar} {progress}%

{current} / {TOTAL}

━━━━━━━━━━━━━━━━━━
CURRENT CLUSTER
━━━━━━━━━━━━━━━━━━

환국

━━━━━━━━━━━━━━━━━━
CURRENT EVENT
━━━━━━━━━━━━━━━━━━

HWD-{next_start:04d}

━━━━━━━━━━━━━━━━━━
TODAY GOAL
━━━━━━━━━━━━━━━━━━

HWD-{next_start:04d} ~ HWD-{next_end:04d}

━━━━━━━━━━━━━━━━━━
TODAY COMPLETE
━━━━━━━━━━━━━━━━━━

{current} / {TOTAL}

━━━━━━━━━━━━━━━━━━
EXPECTED FINISH
━━━━━━━━━━━━━━━━━━

HWD-0500

━━━━━━━━━━━━━━━━━━
NEXT AUTO JOB
━━━━━━━━━━━━━━━━━━

python3 scripts/khos/khos_agent.py {BATCH_SIZE}

━━━━━━━━━━━━━━━━━━
MISSION
━━━━━━━━━━━━━━━━━━

우리는 책을 읽지 않는다.

우리는 인간 존재의 증거를 저장한다.

우리는 인류의 모든 기록에서
웅쌤,
웅녀,
공동농사국,
옥암리 사람들,
참교육을 만들
이야기의 원석을 채굴한다.
"""
    (MASTER_DIR / "COMMAND_CENTER.md").write_text(text, encoding="utf-8")
    (MASTER_DIR / "CURRENT_POSITION.md").write_text(
        f"# CURRENT POSITION\n\nSOURCE: 환단고기\n\nCURRENT EVENT: HWD-{next_start:04d}\n\nPROGRESS: {current}/{TOTAL}\n",
        encoding="utf-8"
    )

nums = existing_numbers()
last = max(nums) if nums else 0
start = last + 1
end = min(last + BATCH_SIZE, TOTAL)

if start > TOTAL:
    print("환단고기 500 EVENT 완료")
    update_command_center(TOTAL)
    sys.exit(0)

for n in range(start, end + 1):
    make_event(n)
    print(f"CREATED HWD-{n:04d}")

update_command_center(end)

print("")
print("================================")
print("K-HOS AUTO AGENT COMPLETE")
print(f"CREATED: HWD-{start:04d} ~ HWD-{end:04d}")
print(f"PROGRESS: {end} / {TOTAL}")
print("================================")
