#!/bin/zsh
set -e

ROOT="${1:-$HOME/안이영 소장 자료}"
LIMIT="${2:-20}"
OUT_DIR="tmp/ppt-test"
REPORT="$OUT_DIR/legacy-ppt-convert-report.csv"

mkdir -p "$OUT_DIR"

echo "file,status,message" > "$REPORT"

echo "===== 구형 PPT 변환 테스트 시작 ====="
echo "대상 폴더: $ROOT"
echo "테스트 개수: $LIMIT"
echo ""

count=0

find "$ROOT" -type f -iname "*.ppt" | while read -r file; do
  count=$((count+1))
  if [ "$count" -gt "$LIMIT" ]; then
    break
  fi

  base="$(basename "$file" .ppt)"
  work="$OUT_DIR/$count"
  mkdir -p "$work"

  echo "[$count] 테스트: $file"

  if soffice --headless --convert-to pdf --outdir "$work" "$file" >/tmp/kagri_soffice.log 2>&1; then
    pdf_count=$(find "$work" -type f -iname "*.pdf" | wc -l | tr -d ' ')
    if [ "$pdf_count" -gt 0 ]; then
      echo "\"$file\",\"success\",\"pdf_created\"" >> "$REPORT"
      echo "  ✅ PDF 변환 성공"
    else
      echo "\"$file\",\"fail\",\"no_pdf_output\"" >> "$REPORT"
      echo "  ❌ PDF 출력 없음"
    fi
  else
    msg=$(cat /tmp/kagri_soffice.log | tr '\n' ' ' | sed 's/"/""/g')
    echo "\"$file\",\"fail\",\"$msg\"" >> "$REPORT"
    echo "  ❌ 변환 실패"
  fi
done

echo ""
echo "===== 결과 ====="
cat "$REPORT"
echo ""
echo "리포트: $REPORT"
