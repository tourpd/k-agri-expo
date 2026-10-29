from pathlib import Path
from datetime import datetime
from openai import OpenAI
import os, json, re, shutil

ROOT = Path("K-HOS/UNIVERSAL_ASSIMILATION_SYSTEM")

INPUT = ROOT / "00_INPUT"
ARCHIVE = ROOT / "01_ORIGINAL_ARCHIVE"
PRESCAN = ROOT / "02_PRESCAN"
PLAN = ROOT / "03_INGEST_PLAN"
EXTRACTED = ROOT / "04_EXTRACTED"
CLASSIFIED = ROOT / "05_CLASSIFIED"
CONNECTED = ROOT / "06_CONNECTED"
OUTPUT = ROOT / "07_OUTPUT"
WRITER = ROOT / "08_WRITER_ROOM"
BUSINESS = ROOT / "09_BUSINESS_ROOM"
CMD = ROOT / "10_COMMAND_CENTER"
FAILED = ROOT / "99_FAILED"

for p in [INPUT, ARCHIVE, PRESCAN, PLAN, EXTRACTED, CLASSIFIED, CONNECTED, OUTPUT, WRITER, BUSINESS, CMD, FAILED]:
    p.mkdir(parents=True, exist_ok=True)

MODEL = os.getenv("KHOS_MODEL", "gpt-4.1-mini")
client = OpenAI(timeout=240)

def safe(s):
    s = str(s or "UNTITLED")
    s = s.replace("/", "_").replace("\\", "_").replace(":", "_")
    s = re.sub(r"[^\w가-힣\-_. ]+", "_", s)
    return s.strip(" ._")[:80] or "UNTITLED"

def update(job, phase, status, note):
    text = f"""# K-HOS UNIVERSAL COMMAND CENTER

STATUS
{status}

LAST UPDATE
{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

CURRENT JOB
{job}

PHASE
{phase}

NOTE
{note}
"""
    (CMD / "COMMAND_CENTER.md").write_text(text, encoding="utf-8")

def read_text(path):
    if path.suffix.lower() in [".txt", ".md", ".csv"]:
        return path.read_text(encoding="utf-8", errors="ignore")
    raise RuntimeError(f"현재 v1은 txt/md/csv만 직접 처리 가능: {path.name}")

def ai_json(prompt):
    r = client.responses.create(
        model=MODEL,
        input=prompt,
        text={"format": {"type": "json_object"}}
    )
    return json.loads(r.output_text)

def prescan(file, text):
    return ai_json(f"""
너는 K-HOS PRE-SCAN AGENT다.
자료의 종류를 미리 가정하지 말고, 이 자료가 무엇인지 판단하라.

JSON만 출력하라.

{{
  "material_type": "",
  "language": "",
  "domains": [],
  "possible_categories": [],
  "structure": "",
  "value_for_khos": "",
  "recommended_analysis": []
}}

파일명:
{file.name}

본문:
{text[:12000]}
""")

def make_plan(file, text, scan):
    return ai_json(f"""
너는 K-HOS INGEST PLANNER다.
PRE-SCAN 결과를 바탕으로 이 자료를 어떻게 흡수할지 계획하라.

JSON만 출력하라.

{{
  "analysis_plan": [],
  "expected_outputs": [],
  "custom_categories": [],
  "writer_room_targets": [],
  "business_room_targets": [],
  "priority": ""
}}

PRE_SCAN:
{json.dumps(scan, ensure_ascii=False)}

본문:
{text[:12000]}
""")

def extract(file, text, scan, plan):
    return ai_json(f"""
너는 K-HOS UNIVERSAL EXTRACTION AGENT다.
자료 유형을 고정하지 말고, 이 자료 안에서 실제로 필요한 것을 추출하라.

JSON만 출력하라.

{{
  "events": [],
  "knowledge": [],
  "concepts": [],
  "people": [],
  "methods": [],
  "data_points": [],
  "lessons": [],
  "questions": [],
  "writer_room_ideas": [],
  "business_ideas": [],
  "new_categories": []
}}

PRE_SCAN:
{json.dumps(scan, ensure_ascii=False)}

PLAN:
{json.dumps(plan, ensure_ascii=False)}

본문:
{text[:22000]}
""")

def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

def write_md(path, title, data):
    path.write_text(
        "# " + title + "\n\n```json\n" + json.dumps(data, ensure_ascii=False, indent=2) + "\n```",
        encoding="utf-8"
    )

def process(file):
    job = safe(file.stem)
    update(file.name, "ARCHIVE", "🟢 WORKING", "원본 보존 중")
    shutil.copy2(file, ARCHIVE / file.name)

    text = read_text(file)

    update(file.name, "PRE-SCAN", "🟢 WORKING", "자료 정체 판단 중")
    scan = prescan(file, text)
    write_json(PRESCAN / f"{job}_PRESCAN.json", scan)

    update(file.name, "INGEST PLAN", "🟢 WORKING", "분석 계획 생성 중")
    plan = make_plan(file, text, scan)
    write_json(PLAN / f"{job}_PLAN.json", plan)

    update(file.name, "EXTRACTION", "🟢 WORKING", "사건/지식/개념/아이디어 추출 중")
    result = extract(file, text, scan, plan)
    write_json(EXTRACTED / f"{job}_EXTRACTED.json", result)

    update(file.name, "CLASSIFICATION", "🟢 WORKING", "자동 분류 저장 중")

    domains = scan.get("domains", [])
    categories = scan.get("possible_categories", []) + result.get("new_categories", [])

    for d in domains:
        folder = CLASSIFIED / safe(d)
        folder.mkdir(parents=True, exist_ok=True)
        write_md(folder / f"{job}.md", job, result)

    for c in categories:
        folder = CONNECTED / safe(c)
        folder.mkdir(parents=True, exist_ok=True)
        write_md(folder / f"{job}.md", job, result)

    write_md(OUTPUT / f"{job}_OUTPUT.md", job, result)
    write_md(WRITER / f"{job}_WRITER.md", job, result)
    write_md(BUSINESS / f"{job}_BUSINESS.md", job, result)

    update(file.name, "COMPLETE", "🔵 COMPLETE", "K-HOS 흡수 완료")

def main():
    files = [p for p in INPUT.iterdir() if p.is_file()]
    if not files:
        update("NONE", "WAITING", "🟡 READY", "00_INPUT에 파일을 넣어라.")
        print("NO INPUT")
        return

    for file in files:
        try:
            process(file)
            print(f"OK {file.name}", flush=True)
        except Exception as e:
            (FAILED / f"{safe(file.name)}_ERROR.md").write_text(str(e), encoding="utf-8")
            update(file.name, "ERROR", "🔴 ERROR", str(e))
            print(f"ERROR {file.name}: {e}", flush=True)

if __name__ == "__main__":
    main()
