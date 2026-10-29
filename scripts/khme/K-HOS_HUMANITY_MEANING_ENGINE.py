#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
K-HOS HUMANITY MEANING ENGINE
VERSION : 0.1
DATE    : 2026.06.30

MISSION:
우리는 사건을 저장하지 않는다.
우리는 인간이 왜 그 사건을 만들었는지를 저장한다.
"""

from pathlib import Path
import re
from datetime import datetime

ROOT = Path("K-HOS")
EVENT_DIR = ROOT / "HUMANITY_BLACK_BOX/003_SOURCE_ARCHIVES/hwandangogi/events"
OUTPUT_DIR = ROOT / "HUMANITY_MEANING_ENGINE/10_MEMORY"

SOUL19 = [
    "LOVE",
    "RESPONSIBILITY",
    "SACRIFICE",
    "HOPE",
    "SUFFERING",
    "COMMUNITY",
    "MEMORY",
    "HERO",
    "FAITH",
    "BEAUTY",
    "BIRTH",
    "DEATH",
    "CURIOSITY",
    "FEAR",
    "COURAGE",
    "FREEDOM",
    "PLAY",
    "CREATION",
    "TRANSCENDENCE"
]


def extract_section(text, name):
    p = rf"## {re.escape(name)}\n(.*?)(?=\n## |\Z)"
    m = re.search(p, text, re.S)
    return m.group(1).strip() if m else ""


def direct_translate(original):
    """
    임시 직역기
    나중에 LLM 연결
    """
    return f"[직역 필요] {original}"


def extract_real_event(text):
    return "인간이 어떤 경험을 기록하고 후대에 전달하려 한 사건"


def extract_action(text):
    return [
        "기록한다",
        "보존한다",
        "전달한다"
    ]


def extract_emotion(text):
    return [
        "책임감",
        "두려움",
        "희망"
    ]


def make_question(text):
    return "인간은 왜 자신의 경험을 기록하려 하는가?"


def classify_soul(actions, emotions):
    return [
        "MEMORY",
        "RESPONSIBILITY",
        "COMMUNITY"
    ]


def make_lesson():
    return (
        "인간은 자신의 육체보다 "
        "기억을 더 오래 남기려 한다."
    )


def modern_analog():
    return [
        "가족 앨범",
        "유튜브",
        "국가기록원",
        "K-HOS"
    ]


def writer_room():
    return """
웅쌤:
"우리가 기록하는 이유는
영원히 살기 위해서가 아니라
잊히지 않기 위해서다."
"""


def save_result(event_id, result):

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    outfile = OUTPUT_DIR / f"{event_id}.md"

    with open(outfile, "w", encoding="utf-8") as f:
        f.write(result)


def process(file):

    text = file.read_text(encoding="utf-8")

    event_id = file.stem

    original = extract_section(
        text,
        "ORIGINAL EXTRACT"
    )

    direct = direct_translate(original)

    event = extract_real_event(direct)

    actions = extract_action(event)

    emotions = extract_emotion(event)

    question = make_question(event)

    souls = classify_soul(
        actions,
        emotions
    )

    lesson = make_lesson()

    analog = modern_analog()

    writer = writer_room()

    result = f"""
# {event_id}

DATE:
{datetime.now()}

SOURCE:
{file.name}

--------------------------------

ORIGINAL

{original}

--------------------------------

DIRECT TRANSLATION

{direct}

--------------------------------

REAL EVENT

{event}

--------------------------------

HUMAN ACTION

{chr(10).join('- '+x for x in actions)}

--------------------------------

HUMAN EMOTION

{chr(10).join('- '+x for x in emotions)}

--------------------------------

HUMAN QUESTION

{question}

--------------------------------

HUMAN SOUL 19

{chr(10).join('- '+x for x in souls)}

--------------------------------

HUMAN LESSON

{lesson}

--------------------------------

MODERN ANALOG

{chr(10).join('- '+x for x in analog)}

--------------------------------

WRITER ROOM

{writer}

--------------------------------

STATUS

MEANING_EXTRACTED
"""

    save_result(
        event_id,
        result
    )

    return event_id


def main():

    files = sorted(
        EVENT_DIR.glob("HWD-*.md")
    )

    total = len(files)

    print("")
    print("================================")
    print("K-HOS HUMANITY MEANING ENGINE")
    print("================================")

    for i, f in enumerate(files, 1):

        eid = process(f)

        if i % 25 == 0:
            print(
                f"PROCESSED {i}/{total} : {eid}"
            )

    print("")
    print("================================")
    print("KHME COMPLETE")
    print(total)
    print("================================")


if __name__ == "__main__":
    main()
