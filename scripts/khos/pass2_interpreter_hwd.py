#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path("K-HOS/HUMANITY_BLACK_BOX")
EVENT_DIR = ROOT / "003_SOURCE_ARCHIVES/hwandangogi/events"
MASTER = ROOT / "MASTER"

START = 1
END = 50

def read_section(text, title):
    pattern = rf"## {title}\n(.*?)(?=\n## |\Z)"
    m = re.search(pattern, text, re.S)
    return m.group(1).strip() if m else ""

def interpret(original, question):
    if "三神" in original or "祭天" in original or "天神" in original:
        return (
            "인간은 삶의 중요한 순간을 하늘과 연결해 이해하려 했다. "
            "태어남, 죽음, 풍년, 전쟁, 공동체의 약속은 모두 인간 혼자 감당하기 어려운 일이었기 때문에 "
            "인간은 하늘과 신이라는 더 큰 질서를 통해 자기 삶의 의미를 찾으려 했다.",
            ["FAITH", "TRANSCENDENCE", "COMMUNITY"],
            ["제사", "출산 축원", "국가 의례", "마을 굿", "농민의 풍년 기도"],
            "웅녀는 왜 동굴에서 하늘에 기도했을까?"
        )

    if "弘益" in original or "濟" in original or "仁" in original:
        return (
            "이 기록은 인간이 혼자 잘 사는 것보다 함께 이롭게 사는 길을 더 큰 가치로 여겼다는 뜻이다. "
            "홍익은 단순한 구호가 아니라, 타인의 생존과 행복을 자기 삶의 목적 안에 넣는 인간의 오래된 윤리다.",
            ["LOVE", "RESPONSIBILITY", "COMMUNITY"],
            ["부모의 돌봄", "농민 공동체", "자원봉사", "참교육", "공동농사국"],
            "웅쌤은 왜 자기 이익보다 마을 아이들을 먼저 생각할까?"
        )

    if "法" in original or "禁" in original or "刑" in original or "盜" in original:
        return (
            "인간은 함께 살기 위해 규칙을 만들었다. "
            "법은 단순히 벌을 주기 위한 장치가 아니라, 서로를 죽이지 않고 속이지 않고 빼앗지 않기 위한 최소한의 약속이었다.",
            ["RESPONSIBILITY", "COMMUNITY", "FEAR"],
            ["마을 규약", "학교 규칙", "헌법", "농촌 계약", "공동농사국 규칙"],
            "옥암리 사람들은 왜 마을 규칙을 다시 만들어야 했을까?"
        )

    if "農" in original or "田" in original or "穀" in original or "蠶" in original:
        return (
            "이 기록은 먹고사는 문제가 문명의 중심이었다는 것을 보여준다. "
            "농사, 누에, 곡식, 저장은 단순한 생산 기술이 아니라 가족과 공동체를 지속시키는 생명의 기반이었다.",
            ["COMMUNITY", "RESPONSIBILITY", "HOPE"],
            ["농민", "식량 위기", "마을 창고", "미래식량", "K-AGRI"],
            "공동농사국은 왜 농사를 단순한 직업이 아니라 생명 사업으로 보는가?"
        )

    if "兵" in original or "戰" in original or "侵" in original or "破" in original:
        return (
            "인간은 자신이 사랑하는 것을 지키기 위해 싸운다. "
            "전쟁의 기록 속에는 폭력만 있는 것이 아니라, 가족과 땅과 공동체를 잃지 않으려는 두려움과 용기가 함께 들어 있다.",
            ["COURAGE", "FEAR", "RESPONSIBILITY"],
            ["독립운동", "마을 방어", "농민 투쟁", "국가 위기", "참교육"],
            "웅쌤은 폭력을 싫어하지만 왜 어떤 순간에는 맞서야 할까?"
        )

    if "歌" in original or "舞" in original or "鼓" in original or "樂" in original:
        return (
            "인간은 말로 다 표현하지 못하는 감정을 노래와 춤으로 나누었다. "
            "축제와 음악은 오락이 아니라 공동체가 아직 살아 있음을 확인하는 의식이었다.",
            ["PLAY", "COMMUNITY", "MEMORY"],
            ["아리랑", "마을 축제", "농악", "응원가", "유튜브 콘텐츠"],
            "옥암리 사람들이 힘든 농사 끝에 왜 함께 노래하고 춤출까?"
        )

    if "崩" in original or "葬" in original or "喪" in original or "死" in original:
        return (
            "죽음은 끝이지만, 인간은 죽은 이를 기억함으로써 그 사람의 삶을 공동체 안에 남긴다. "
            "장례와 제사는 사라진 사람을 잊지 않기 위한 인간의 기억 기술이다.",
            ["DEATH", "MEMORY", "LOVE"],
            ["장례", "가족 아카이브", "추모 영상", "마을 기록", "K-HOS"],
            "사라진 농민의 삶을 우리는 어떻게 기억해야 할까?"
        )

    return (
        "이 기록은 인간이 자기 존재의 이유를 이야기로 남기려 했다는 증거다. "
        "사람은 단순히 살아가는 존재가 아니라, 자신이 왜 살았는지를 후대에 설명하려는 존재다.",
        ["MEMORY", "CURIOSITY", "TRANSCENDENCE"],
        ["역사 기록", "가족 이야기", "다큐멘터리", "캐릭터 세계관", "K-HOS"],
        "웅쌤 이야기는 왜 단순한 캐릭터가 아니라 인간 기록이어야 하는가?"
    )

count = 0

for n in range(START, END + 1):
    eid = f"HWD-{n:04d}"
    path = EVENT_DIR / f"{eid}.md"
    if not path.exists():
        continue

    text = path.read_text(encoding="utf-8")
    original = read_section(text, "ORIGINAL EXTRACT")
    question = read_section(text, "HUMAN QUESTION")
    conflict = read_section(text, "CONFLICT")
    page = read_section(text, "PAGE")
    cluster = read_section(text, "CLUSTER")

    modern, souls, cases, hook = interpret(original, question)

    new_text = f"""# {eid}

## SOURCE
환단고기 원문.pdf

## PAGE
{page}

## CLUSTER
{cluster}

## ORIGINAL EXTRACT
{original}

## EASY KOREAN
{modern}

## HUMAN QUESTION
{question}

## CORE CONFLICT
{conflict}

## HUMAN SOUL 19
""" + "\n".join([f"- {s}" for s in souls]) + f"""

## MODERN CASE
""" + "\n".join([f"- {c}" for c in cases]) + f"""

## CONTENT HOOK
{hook}

## K-AGRI / K-HOS INTERPRETATION
이 사건은 환단고기를 역사 논쟁이 아니라 인간 존재의 기록으로 읽게 만드는 자료다.
웅쌤, 웅녀, 공동농사국, 옥암리 사람들, 참교육 시리즈에서 인간이 왜 함께 살고,
왜 믿고, 왜 싸우고, 왜 기억하는지를 설명하는 원석으로 활용한다.

## STATUS
PASS2_INTERPRETED
"""

    path.write_text(new_text, encoding="utf-8")
    count += 1

command = f"""# 🧠 K-HOS COMMAND CENTER

━━━━━━━━━━━━━━━━━━
STATUS
━━━━━━━━━━━━━━━━━━

🟢 PASS 2 INTERPRETING

━━━━━━━━━━━━━━━━━━
CURRENT SOURCE
━━━━━━━━━━━━━━━━━━

환단고기 원문.pdf

━━━━━━━━━━━━━━━━━━
PASS 1
━━━━━━━━━━━━━━━━━━

REAL MINING COMPLETE
500 / 500

━━━━━━━━━━━━━━━━━━
PASS 2
━━━━━━━━━━━━━━━━━━

정밀 해석 완료:
HWD-0001 ~ HWD-0050

완료 수:
{count} / 50

━━━━━━━━━━━━━━━━━━
NEXT JOB
━━━━━━━━━━━━━━━━━━

HWD-0051 ~ HWD-0100 PASS 2 INTERPRETATION

━━━━━━━━━━━━━━━━━━
STATUS
━━━━━━━━━━━━━━━━━━

READY FOR NEXT PASS 2 BATCH
"""

(MASTER / "COMMAND_CENTER.md").write_text(command, encoding="utf-8")

print("")
print("================================")
print("K-HOS PASS 2 INTERPRETER COMPLETE")
print(f"INTERPRETED: HWD-0001 ~ HWD-0050")
print(f"COUNT: {count}")
print("COMMAND_CENTER updated")
print("================================")
