#!/bin/bash

BATCH_SIZE=20
TOTAL=500

echo "================================"
echo "K-HOS HWANDANGOGI AUTO RUNNER"
echo "목표: HWD-0500까지 자동 채굴"
echo "================================"

while true
do
  CURRENT=$(ls K-HOS/HUMANITY_BLACK_BOX/003_SOURCE_ARCHIVES/hwandangogi/events/HWD-*.md 2>/dev/null | sed 's/.*HWD-\([0-9]*\).md/\1/' | sort -n | tail -1)

  if [ -z "$CURRENT" ]; then
    CURRENT=0
  fi

  if [ "$CURRENT" -ge "$TOTAL" ]; then
    echo ""
    echo "================================"
    echo "환단고기 EVENT 500개 완료"
    echo "현재: $CURRENT / $TOTAL"
    echo "================================"
    break
  fi

  echo ""
  echo "현재 진행: $CURRENT / $TOTAL"
  echo "다음 배치 실행..."

  python3 scripts/khos/khos_agent.py $BATCH_SIZE

  sleep 1
done
