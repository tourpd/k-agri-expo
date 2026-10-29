from pathlib import Path
from datetime import datetime
from openai import OpenAI
import os, re, json, shutil

ROOT = Path("K-HOS/UNIVERSAL_ENGINE")

INBOX = ROOT / "00_INBOX"
ARCHIVE = ROOT / "01_ORIGINAL_ARCHIVE"
DOMAIN = ROOT / "02_DOMAIN_CLASSIFICATION"
EVENT = ROOT / "03_EVENT_DATABASE"
KNOWLEDGE = ROOT / "04_KNOWLEDGE_DATABASE"
CONCEPT = ROOT / "05_CONCEPT_DATABASE"
LESSON = ROOT / "06_LESSON_DATABASE"
WRITER = ROOT / "07_WRITER_ROOM_INDEX"
REPORT = ROOT / "08_REPORT"
FAILED = ROOT / "09_FAILED_QUEUE"
CMD = ROOT / "10_COMMAND_CENTER"

for p in [INBOX, ARCHIVE, DOMAIN, EVENT, KNOWLEDGE, CONCEPT, LESSON, WRITER, REPORT, FAILED, CMD]:
    p.mkdir(parents=True, exist_ok=True)

MODEL = os.getenv("KHOS_MODEL", "gpt-4.1-mini")
client = OpenAI(timeout=240)

def safe(s):
    s = str(s or "UNTITLED")
    s = s.replace("/", "_").replace("\\", "_").replace(":", "_")
    s = re.sub(r"[^\w가-힣\-_. ]+", "_", s)
    return s.strip(" ._")[:80] or "UNTITLED"

def update_status(file_name, status, note):
    text = f"""# K-HOS UNIVERSAL ENGINE COMMAND CENTER

STATUS
{status}

LAST UPDATE
{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

CURRENT FILE
{file_name}

NOTE
{note}
"""
    (CMD / "COMMAND_CENTER.md").write_text(text, encoding="utf-8")

def read_text_file(path):
    if path.suffix.lower() in [".txt", ".md", ".csv"]:
        return path.read_text(encoding="utf-8", errors="ignore")
    return ""

def analyze(file_name, text):
    prompt = f"""
너는 K-HOS UNIVERSAL INGEST ENGINE이다.

아래 자료를 특정 분야의 전문 자료라고 가정하고,
K-HOS 작가실과 사업실에서 재사용할 수 있도록 구조화하라.

반드시 JSON만 출력하라.

형식:
{{
  "domain": ["분야"],
  "summary": "전체 요약",
  "events": [
    {{
      "title": "사건/사례/과정명",
      "beginning": "시작",
      "development": "전개",
      "conflict": "문제/갈등/핵심 이슈",
      "choice": "선택/해결 방향",
      "result": "결과",
      "use": "작가실 활용"
    }}
  ],
  "knowledge": [
    {{
      "title": "지식 항목",
      "fact": "핵심 정보",
      "why_it_matters": "왜 중요한가",
      "use": "활용법"
    }}
  ],
  "concepts": [
    {{
      "concept": "핵심 개념",
      "meaning": "뜻",
      "related": ["연결 개념"]
    }}
  ],
  "lessons": [
    {{
      "lesson": "짧은 교훈/시사점",
      "use": "콘텐츠 활용"
    }}
  ],
  "writer_room": [
    {{
      "hook": "콘텐츠 훅",
      "format": "다큐/쇼츠/웹툰/교육/브랜드/세계관 등",
      "idea": "구체적 아이디어"
    }}
  ]
}}

파일명:
{file_name}

본문:
{text[:25000]}
"""
    r = client.responses.create(
        model=MODEL,
        input=prompt,
        text={"format": {"type": "json_object"}}
    )
    raw = r.output_text.strip()
    return json.loads(raw)

def write_md(path, title, body):
    path.write_text(f"# {title}\n\n{body}", encoding="utf-8")

def save_result(file, data):
    base = safe(file.stem)

    shutil.copy2(file, ARCHIVE / file.name)

    write_md(
        REPORT / f"{base}_REPORT.md",
        f"{base} 분석 리포트",
        f"""DOMAIN
{', '.join(data.get('domain', []))}

SUMMARY
{data.get('summary', '')}
"""
    )

    for d in data.get("domain", []):
        folder = DOMAIN / safe(d)
        folder.mkdir(parents=True, exist_ok=True)
        write_md(folder / f"{base}.md", base, data.get("summary", ""))

    for i, ev in enumerate(data.get("events", []), 1):
        title = ev.get("title", f"EVENT_{i}")
        md = f"""SOURCE
{file.name}

BEGINNING
{ev.get('beginning','')}

DEVELOPMENT
{ev.get('development','')}

CONFLICT / ISSUE
{ev.get('conflict','')}

CHOICE / SOLUTION
{ev.get('choice','')}

RESULT
{ev.get('result','')}

WRITER USE
{ev.get('use','')}
"""
        write_md(EVENT / f"{base}_EVENT_{i:03d}_{safe(title)}.md", title, md)

    for i, k in enumerate(data.get("knowledge", []), 1):
        title = k.get("title", f"KNOWLEDGE_{i}")
        md = f"""SOURCE
{file.name}

FACT
{k.get('fact','')}

WHY IT MATTERS
{k.get('why_it_matters','')}

USE
{k.get('use','')}
"""
        write_md(KNOWLEDGE / f"{base}_KNOWLEDGE_{i:03d}_{safe(title)}.md", title, md)

    for i, c in enumerate(data.get("concepts", []), 1):
        title = c.get("concept", f"CONCEPT_{i}")
        md = f"""SOURCE
{file.name}

MEANING
{c.get('meaning','')}

RELATED
{chr(10).join('- ' + str(x) for x in c.get('related', []))}
"""
        write_md(CONCEPT / f"{base}_CONCEPT_{i:03d}_{safe(title)}.md", title, md)

    for i, l in enumerate(data.get("lessons", []), 1):
        title = l.get("lesson", f"LESSON_{i}")
        md = f"""SOURCE
{file.name}

LESSON
{l.get('lesson','')}

USE
{l.get('use','')}
"""
        write_md(LESSON / f"{base}_LESSON_{i:03d}_{safe(title)}.md", title, md)

    for i, w in enumerate(data.get("writer_room", []), 1):
        title = w.get("hook", f"WRITER_{i}")
        md = f"""SOURCE
{file.name}

HOOK
{w.get('hook','')}

FORMAT
{w.get('format','')}

IDEA
{w.get('idea','')}
"""
        write_md(WRITER / f"{base}_WRITER_{i:03d}_{safe(title)}.md", title, md)

def main():
    files = [p for p in INBOX.iterdir() if p.is_file()]

    if not files:
        update_status("NONE", "🟡 READY", "00_INBOX에 분석할 파일을 넣어라.")
        print("NO FILES IN INBOX")
        return

    for idx, file in enumerate(files, 1):
        update_status(file.name, "🟢 WORKING", f"{idx}/{len(files)} 분석 중")

        try:
            text = read_text_file(file)
            if not text.strip():
                raise RuntimeError("현재 v1은 txt/md/csv만 지원. PDF/DOCX는 v2에서 처리.")

            data = analyze(file.name, text)
            save_result(file, data)

            update_status(file.name, "🔵 COMPLETE", f"{idx}/{len(files)} 분석 완료")
            print(f"OK {idx}/{len(files)} {file.name}", flush=True)

        except Exception as e:
            (FAILED / f"{safe(file.name)}_ERROR.md").write_text(str(e), encoding="utf-8")
            update_status(file.name, "🟡 ERROR", str(e))
            print(f"ERROR {file.name}: {e}", flush=True)

if __name__ == "__main__":
    main()
