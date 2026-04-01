from pathlib import Path
import re

ROOT = Path(".")
TARGET_EXTS = {".ts", ".tsx"}

SKIP_DIRS = {
    "node_modules",
    ".next",
    ".git",
    ".vercel",
}

def should_skip(path: Path) -> bool:
    parts = set(path.parts)
    return any(p in parts for p in SKIP_DIRS)

def clean_server_import(import_block: str) -> str:
    """
    server import에서 createSupabaseAdminClient만 제거하고 나머지는 유지
    """
    m = re.match(
        r'import\s*\{(?P<body>.*?)\}\s*from\s*["\']@/lib/supabase/server["\'];?',
        import_block,
        flags=re.DOTALL,
    )
    if not m:
        return import_block

    body = m.group("body")
    names = [x.strip() for x in body.split(",") if x.strip()]
    names = [x for x in names if x != "createSupabaseAdminClient"]

    if not names:
        return ""

    return f'import {{ {", ".join(names)} }} from "@/lib/supabase/server";'

def ensure_admin_import(text: str) -> str:
    if 'from "@/lib/supabase/admin"' in text:
        return text

    lines = text.splitlines()
    insert_at = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            insert_at = i + 1

    lines.insert(insert_at, 'import { getSupabaseAdmin } from "@/lib/supabase/admin";')
    return "\n".join(lines)

def process_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    text = original

    if "createSupabaseAdminClient" not in text:
        return False

    changed = False

    # 1) server import 정리
    server_import_pattern = re.compile(
        r'import\s*\{.*?\}\s*from\s*["\']@/lib/supabase/server["\'];?',
        flags=re.DOTALL,
    )

    def repl_server_import(match: re.Match) -> str:
        nonlocal changed
        block = match.group(0)
        if "createSupabaseAdminClient" not in block:
            return block
        changed = True
        return clean_server_import(block)

    text = server_import_pattern.sub(repl_server_import, text)

    # 2) admin import 경로 잘못된 경우 수정
    wrong_admin_import = 'import { createSupabaseAdminClient } from "@/lib/supabase/admin";'
    if wrong_admin_import in text:
        text = text.replace(
            wrong_admin_import,
            'import { getSupabaseAdmin } from "@/lib/supabase/admin";'
        )
        changed = True

    # 3) createSupabaseAdminClient() 호출 변경
    if "createSupabaseAdminClient()" in text:
        text = text.replace("createSupabaseAdminClient()", "getSupabaseAdmin()")
        changed = True

    # 4) 여전히 getSupabaseAdmin() 호출이 생겼는데 import 없으면 추가
    if "getSupabaseAdmin()" in text and 'from "@/lib/supabase/admin"' not in text:
        text = ensure_admin_import(text)
        changed = True

    # 5) 빈 import 줄/중복 공백 정리
    text = re.sub(r'^\s*\n', '', text, flags=re.MULTILINE)

    # 6) 특수 예외는 수동 검토
    # buyer/farmer bootstrap은 createSupabaseServerClient 유지 필요
    # 이 스크립트는 createSupabaseServerClient는 건드리지 않음

    if changed and text != original:
        path.write_text(text, encoding="utf-8")
        return True

    return False

def main():
    changed_files = []

    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if should_skip(path):
            continue
        if path.suffix not in TARGET_EXTS:
            continue

        if process_file(path):
            changed_files.append(str(path))

    print("Changed files:")
    for f in changed_files:
        print("-", f)

    print(f"\nTotal changed: {len(changed_files)}")

if __name__ == "__main__":
    main()