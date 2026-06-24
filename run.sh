#!/bin/bash

echo "🚀 K-AGRI FULL START"

# 1. Next 캐시 제거
rm -rf .next

# 2. 의존성 확인
npm install

# 3. EXPO ENGINE 실행 (백엔드)
cd expo-engine 2>/dev/null || echo "no expo-engine folder"
npx nodemon server.js &

cd ..

# 4. 프론트 실행
npm run dev
