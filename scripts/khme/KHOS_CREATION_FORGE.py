from pathlib import Path
from datetime import datetime
from openai import OpenAI
import json, os, shutil, requests
from bs4 import BeautifulSoup

try:
    import fitz
except Exception:
    fitz = None

ROOT = Path("K-HOS/CREATION_FORGE")
INPUT = ROOT/"00_INPUT"
ORIGINAL = ROOT/"01_ORIGINAL"
RESULT = ROOT/"02_RESULT"
KLIB = ROOT/"03_K_LIBRARY"
WRITER = ROOT/"04_WRITER_ROOM"
BUSINESS = ROOT/"05_BUSINESS_ROOM"
GRAPH = ROOT/"06_WORLD_GRAPH"
RECREATE = ROOT/"07_RECREATION"
LOG = ROOT/"99_LOG"

for p in [INPUT, ORIGINAL, RESULT, KLIB, WRITER, BUSINESS, GRAPH, RECREATE, LOG]:
    p.mkdir(parents=True, exist_ok=True)

client = OpenAI()
MODEL = os.getenv("KHOS_MODEL", "gpt-4.1-mini")

def write_status(status, message, current="", index=0, total=0):
    payload = {
        "status": status,
        "message": message,
        "current": current,
        "index": index,
        "total": total,
        "updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    (RESULT/"status.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

def read_text(path: Path):
    suffix = path.suffix.lower()

    if path.name.endswith("_URL.md"):
        raw = path.read_text(encoding="utf-8", errors="ignore")
        url = raw.strip().splitlines()[-1].strip()

        write_status("WORKING", "홈페이지 읽는 중", url, 1, 1)

        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X) K-HOS/1.0"
        }

        res = requests.get(url, headers=headers, timeout=30)
        res.raise_for_status()

        soup = BeautifulSoup(res.text, "html.parser")

        for tag in soup(["script", "style", "noscript", "svg"]):
            tag.decompose()

        title = soup.title.get_text(" ", strip=True) if soup.title else url
        body = soup.get_text("\n", strip=True)

        if len(body.strip()) < 100:
            raise RuntimeError("홈페이지 본문 추출 실패 또는 본문이 너무 짧음")

        return f"# URL: {url}\n# TITLE: {title}\n\n{body}"

    if suffix == ".pdf":
        write_status("WORKING", "PDF 텍스트 추출 중", path.name, 1, 1)
        if fitz is None:
            raise RuntimeError("PyMuPDF not installed")
        doc = fitz.open(path)
        return "\n".join(page.get_text() for page in doc)

    if suffix in [".txt", ".md", ".csv"]:
        return path.read_text(encoding="utf-8", errors="ignore")

    return path.read_text(encoding="utf-8", errors="ignore")

def analyze_collection(title, text):
    prompt = f"""
너는 K-HOS CORE ENGINE v1.0이다.

너의 임무는 문서를 요약하는 것이 아니다.
자료를 K-HOS의 작가실, 사업실, 세계관, 영구기억에서 계속 재사용할 수 있는
'인류 원형 데이터'로 변환하는 것이다.

절대 추상적 감상문을 쓰지 마라.
반드시 사건, 인물, 갈등, 인간 원형, 현대 연결, 작가실 자산, 사업실 자산, 세계관 법칙으로 뽑아라.

JSON만 출력하라.

{{
  "source_name": "{title}",

  "identity": {{
    "what_is_this": "",
    "category": "",
    "era": "",
    "civilization": "",
    "core_keywords": [],
    "human_impact_score": "",
    "khos_importance_score": ""
  }},

  "final_decision": {{
    "one_line": "",
    "recommendation": "폐기|참고자료|작가실 자산|사업실 자산|세계관 자산|인류 원형 자산|K-HOS 영구보존 코어",
    "level": "LEVEL 0|LEVEL 1|LEVEL 2|LEVEL 3|LEVEL 4|LEVEL 5|LEVEL 6",
    "reason": ""
  }},

  "archetypal_events": [
    {{
      "event": "",
      "human_archetype": "",
      "conflict_engine": "",
      "modern_parallel": "",
      "writer_use": "",
      "business_use": ""
    }}
  ],

  "character_archetypes": [
    {{
      "character": "",
      "human_type": "",
      "desire": "",
      "conflict": "",
      "modern_version": "",
      "content_use": ""
    }}
  ],

  "khos_laws": [
    {{
      "law_id": "LAW-001",
      "law": "",
      "derived_from": "",
      "why_it_matters": "",
      "how_to_use": ""
    }}
  ],

  "modern_connections": [
    {{
      "source_pattern": "",
      "modern_case": "",
      "ai_age_connection": "",
      "khos_future_use": ""
    }}
  ],

  "writer_room_assets": {{
    "characters": [],
    "conflicts": [],
    "story_seeds": [],
    "symbolic_objects": [],
    "possible_titles": []
  }},

  "business_room_assets": {{
    "youtube_series": [],
    "shorts_series": [],
    "documentary": [],
    "education": [],
    "brand": [],
    "ip_products": [],
    "business_models": []
  }},

  "world_graph": [
    {{
      "node": "",
      "connects_to": [],
      "reason": ""
    }}
  ],

  "permanent_memory_value": {{
    "why_preserve_forever": "",
    "core_memory_level": "",
    "reuse_scenarios": []
  }},

  "approval_options": [
    "참고자료 저장",
    "작가실 저장",
    "사업실 저장",
    "세계관 저장",
    "인류 원형 저장",
    "K-HOS CORE 영구보존"
  ],

  "approval_question": ""
}}

작성 규칙:
1. archetypal_events는 최소 7개 이상 작성하라.
2. character_archetypes는 최소 7개 이상 작성하라.
3. khos_laws는 최소 7개 이상 작성하라.
4. modern_connections는 최소 7개 이상 작성하라.
5. writer_room_assets와 business_room_assets는 실제 콘텐츠 제목으로 바로 쓸 수 있게 작성하라.
6. "인간성", "영성", "철학" 같은 추상어만 쓰지 마라.
7. 반드시 '이걸 우리가 무엇으로 만들 수 있는가'까지 써라.
8. 본문에 근거가 부족하면 '본문 근거 부족'이라고 표시하라.
9. 성경, 환단고기, 농업자료, 논문, 홈페이지, 유튜브 모두 이 구조로 변환하라.

본문:
{text[:90000]}
"""
    r = client.responses.create(
        model=MODEL,
        input=prompt,
        text={"format": {"type": "json_object"}}
    )
    return json.loads(r.output_text)

def save_md(path, title, data):
    path.write_text(
        "# " + title + "\n\n```json\n" +
        json.dumps(data, ensure_ascii=False, indent=2) +
        "\n```",
        encoding="utf-8"
    )

def main():
    files = [p for p in INPUT.iterdir() if p.is_file()]
    total = len(files)

    if total == 0:
        write_status("READY", "자료 대기 중")
        print("NO INPUT")
        return

    write_status("WORKING", "입력 자료 확인", "", 0, total)

    collection_text = []
    names = []

    for i, f in enumerate(files, start=1):
        write_status("WORKING", "텍스트 추출 중", f.name, i, total)

        try:
            txt = read_text(f)
            if txt.strip():
                names.append(f.name)
                collection_text.append(f"\n\n===== FILE {i}: {f.name} =====\n\n{txt[:12000]}")
                shutil.copy2(f, ORIGINAL/f.name)
        except Exception as e:
            (LOG/"error.log").write_text(f"{f.name}: {e}\n", encoding="utf-8")

    if not collection_text:
        write_status("ERROR", "텍스트 추출 실패", "", total, total)
        return

    title = " / ".join(names[:3])
    if total > 3:
        title += f" 외 {total-3}개"

    write_status("WORKING", "AI가 K-HOS 방식으로 재해석 중", title, total, total)

    result = analyze_collection(title, "\n".join(collection_text))

    write_status("WORKING", "K-LIBRARY / 작가실 / 사업실 / 세계관 저장 중", title, total, total)

    payload = {
        "status": "COMPLETE",
        "message": "K-HOS 재창조 분석 완료",
        "current": title,
        "index": total,
        "total": total,
        "updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "result": result
    }

    (RESULT/"latest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    (RESULT/"status.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    safe = datetime.now().strftime("%Y%m%d_%H%M%S")
    save_md(KLIB/f"{safe}_K_LIBRARY.md", result.get("source_name", safe), result)
    save_md(WRITER/f"{safe}_WRITER_ROOM.md", result.get("source_name", safe), result.get("writer_room_assets", []))
    save_md(BUSINESS/f"{safe}_BUSINESS_ROOM.md", result.get("source_name", safe), result.get("business_room_assets", []))
    save_md(GRAPH/f"{safe}_WORLD_GRAPH.md", result.get("source_name", safe), result.get("world_graph_connections", []))
    save_md(RECREATE/f"{safe}_RECREATION.md", result.get("source_name", safe), result.get("recreation_outputs", {}))

    print("COMPLETE", title)

if __name__ == "__main__":
    main()
