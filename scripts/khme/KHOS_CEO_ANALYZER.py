from pathlib import Path
from datetime import datetime
from openai import OpenAI
import json, os, shutil

try:
    import fitz
except Exception:
    fitz = None

ROOT = Path("K-HOS/CEO_DESK")
INBOX = ROOT / "INBOX"
RESULT = ROOT / "RESULT"
ARCHIVE = ROOT / "ARCHIVE"
LOG = ROOT / "LOG"

for p in [INBOX, RESULT, ARCHIVE, LOG]:
    p.mkdir(parents=True, exist_ok=True)

client = OpenAI()
MODEL = os.getenv("KHOS_MODEL", "gpt-4.1-mini")

def extract_text(path: Path):
    if path.suffix.lower() == ".pdf":
        if fitz is None:
            raise RuntimeError("PyMuPDF not installed")
        doc = fitz.open(path)
        return "\n".join(page.get_text() for page in doc)
    if path.suffix.lower() in [".txt", ".md", ".csv"]:
        return path.read_text(encoding="utf-8", errors="ignore")
    return path.read_text(encoding="utf-8", errors="ignore")

def analyze(name, text):
    prompt = f"""
너는 K-HOS CEO DESK 분석관이다.
대표가 30초 안에 승인/보류/폐기를 판단할 수 있게 정리하라.

반드시 JSON만 출력하라.

{{
  "source_name": "{name}",
  "one_line_conclusion": "",
  "recommendation": "승인|보류|폐기",
  "confidence": "",
  "value_score": "",
  "risk_score": "",
  "what_is_this": "",
  "why_important": [],
  "business_value": [],
  "creative_value": [],
  "auto_actions": [],
  "generated_results": {{
    "youtube": [],
    "shorts": [],
    "business_models": [],
    "brand": [],
    "education": [],
    "worldview": []
  }},
  "evidence": [],
  "decision_question": ""
}}

본문:
{text[:30000]}
"""
    r = client.responses.create(
        model=MODEL,
        input=prompt,
        text={"format": {"type": "json_object"}}
    )
    return json.loads(r.output_text)

def main():
    files = [p for p in INBOX.iterdir() if p.is_file()]
    if not files:
        return

    target = max(files, key=lambda p: p.stat().st_mtime)

    status = {
        "status": "WORKING",
        "file": target.name,
        "updated": datetime.now().isoformat(),
        "message": "파일 읽는 중"
    }
    (RESULT / "status.json").write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")

    try:
        text = extract_text(target)
        if not text.strip():
            raise RuntimeError("텍스트 추출 실패")

        status["message"] = "AI 분석 중"
        (RESULT / "status.json").write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")

        result = analyze(target.name, text)

        payload = {
            "status": "COMPLETE",
            "updated": datetime.now().isoformat(),
            "result": result
        }

        (RESULT / "latest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        (RESULT / "status.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

        shutil.copy2(target, ARCHIVE / target.name)

    except Exception as e:
        payload = {
            "status": "ERROR",
            "updated": datetime.now().isoformat(),
            "file": target.name,
            "error": str(e)
        }
        (RESULT / "status.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        (LOG / "error.log").write_text(str(e), encoding="utf-8")

if __name__ == "__main__":
    main()
