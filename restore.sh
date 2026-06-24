#!/bin/bash

# 1. AgriTradeCenterEntry 복원 (page.tsx용 최소 안전 버전)
sed -i '' '/AgriTradeCenterEntry/d' src/app/expo/page.tsx

# 2. 호출 복구
sed -i '' 's/<AgriTradeCenterEntry \/>//g' src/app/expo/page.tsx

# 3. 캐시 삭제
rm -rf .next

echo "RESTORE DONE"
