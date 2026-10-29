#!/bin/bash

COMMAND=$1
ACTOR_KEY=$2
ACTOR_NAME=$3
ACTOR_ID=$4

ROOT="KOREAN_MODERN_DANGUN_UNIVERSE"
ACTOR_ROOT="$ROOT/01_MASTER_CHARACTER"

if [ "$COMMAND" = "create" ]; then
  if [ -z "$ACTOR_KEY" ] || [ -z "$ACTOR_NAME" ] || [ -z "$ACTOR_ID" ]; then
    echo "사용법:"
    echo "./scripts/kagri-actor-engine.sh create WOONGSSAM 웅쌤 WOONGSSAM_DA_001"
    exit 1
  fi

  BASE="$ACTOR_ROOT/$ACTOR_KEY"

  mkdir -p "$BASE"/{00_IDENTITY,01_MASTER/{INBOX,HERO,FACE,BODY,HEADBAND,PROP,EMOTION,HAND,REFERENCE},02_FACE,03_BODY,04_EMOTION,05_HAND,06_PROP,07_COSTUME,08_FLOW_SAFE,09_PROMPT,10_MEMORY,99_ARCHIVE}

  cat > "$BASE/00_IDENTITY/ACTOR_ID.md" << EOT
# $ACTOR_NAME DIGITAL ACTOR ID

ACTOR_ID:
$ACTOR_ID

ACTOR_KEY:
$ACTOR_KEY

ACTOR_NAME:
$ACTOR_NAME

UNIVERSE:
KOREAN_MODERN_DANGUN_UNIVERSE

TYPE:
DIGITAL ACTOR

STATUS:
LOCKED

RULE:
This is not a character.
This is a locked digital actor.
EOT

  cat > "$BASE/09_PROMPT/LOCK_PROMPT.md" << EOT
# $ACTOR_NAME LOCK PROMPT

USE:
$ACTOR_ID

This is a locked digital actor.

KEEP:
- exact face
- exact body
- exact proportions
- exact identity

ALLOW:
- expression
- pose
- costume
- props
- camera
- lighting
- scene

FORBIDDEN:
- redesign
- new actor
- face change
- body change
- style change
EOT

  cat > "$BASE/10_MEMORY/ACTOR_PHILOSOPHY.md" << EOT
# $ACTOR_NAME ACTOR PHILOSOPHY

CORE VALUE:
사람을 널리 이롭게 해야 한다.

PRACTICE:
사람답게 살아야 한다.

MESSAGE:
마늘 먹고 사람 되자.

STATUS:
DRAFT
EOT

  echo "✅ ACTOR CREATED:"
  echo "$BASE"
  exit 0
fi

if [ "$COMMAND" = "import" ]; then
  if [ -z "$ACTOR_KEY" ]; then
    echo "사용법:"
    echo "./scripts/kagri-actor-engine.sh import WOONGSSAM"
    exit 1
  fi

  BASE="$ACTOR_ROOT/$ACTOR_KEY/01_MASTER"
  INBOX="$BASE/INBOX"

  mkdir -p "$INBOX"

  echo "📥 INBOX:"
  echo "$INBOX"
  echo ""
  echo "여기에 이미지 파일을 넣고 다시 import 실행."
  echo ""

  COUNT=$(find "$INBOX" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) | wc -l | tr -d ' ')

  if [ "$COUNT" = "0" ]; then
    echo "⚠️ INBOX에 이미지가 없습니다."
    echo "Finder 열기:"
    open "$INBOX"
    exit 0
  fi

  echo "🔍 이미지 $COUNT개 발견"

  i=1
  find "$INBOX" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) | while read FILE; do
    BASENAME=$(basename "$FILE")
    EXT="${BASENAME##*.}"

    echo ""
    echo "[$i] $BASENAME"
    echo "어떤 자산입니까?"
    echo "1) HERO"
    echo "2) BODY"
    echo "3) FACE"
    echo "4) HEADBAND"
    echo "5) PROP"
    echo "6) EMOTION"
    echo "7) HAND"
    echo "8) REFERENCE"
    read -p "번호 입력: " TYPE

    case $TYPE in
      1) ASSET="HERO" ;;
      2) ASSET="BODY" ;;
      3) ASSET="FACE" ;;
      4) ASSET="HEADBAND" ;;
      5) ASSET="PROP" ;;
      6) ASSET="EMOTION" ;;
      7) ASSET="HAND" ;;
      *) ASSET="REFERENCE" ;;
    esac

    DEST_DIR="$BASE/$ASSET"
    mkdir -p "$DEST_DIR"

    DEST_FILE="${ACTOR_KEY}_${ASSET}_MASTER_v${i}.${EXT}"
    cp "$FILE" "$DEST_DIR/$DEST_FILE"

    cat > "$DEST_DIR/${ACTOR_KEY}_${ASSET}_ASSET_INFO_v${i}.md" << EOT
# $ACTOR_KEY $ASSET MASTER ASSET

FILE:
$DEST_FILE

SOURCE:
$FILE

STATUS:
IMPORTED

REGISTERED:
$(date "+%Y-%m-%d %H:%M:%S")

RULE:
Do not overwrite.
Do not redesign.
Do not replace without version upgrade.
EOT

    echo "✅ 등록 완료: $DEST_DIR/$DEST_FILE"
    i=$((i+1))
  done

  echo ""
  echo "✅ IMPORT COMPLETE"
  exit 0
fi

echo "K-AGRI DIGITAL ACTOR ENGINE v0.1"
echo ""
echo "명령어:"
echo "./scripts/kagri-actor-engine.sh create WOONGSSAM 웅쌤 WOONGSSAM_DA_001"
echo "./scripts/kagri-actor-engine.sh import WOONGSSAM"
