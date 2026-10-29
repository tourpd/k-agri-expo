#!/bin/bash

ACTOR_KEY=$1
ASSET_TYPE=$2
SOURCE_FILE=$3

if [ -z "$ACTOR_KEY" ] || [ -z "$ASSET_TYPE" ] || [ -z "$SOURCE_FILE" ]; then
  echo "사용법:"
  echo "./scripts/import-master.sh WOONGSSAM HERO ~/Downloads/image.png"
  echo "./scripts/import-master.sh WOONGSSAM BODY ~/Downloads/body.jpeg"
  exit 1
fi

BASE="KOREAN_MODERN_DANGUN_UNIVERSE/01_MASTER_CHARACTER/$ACTOR_KEY/01_MASTER"
DEST_DIR="$BASE/$ASSET_TYPE"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "❌ 원본 파일을 찾을 수 없습니다:"
  echo "$SOURCE_FILE"
  exit 1
fi

mkdir -p "$DEST_DIR"

EXT="${SOURCE_FILE##*.}"
DEST_FILE="${ACTOR_KEY}_${ASSET_TYPE}_MASTER_v1.${EXT}"

cp "$SOURCE_FILE" "$DEST_DIR/$DEST_FILE"

cat > "$DEST_DIR/ASSET_INFO.md" << EOT
# $ACTOR_KEY $ASSET_TYPE MASTER ASSET

ACTOR:
$ACTOR_KEY

ASSET_TYPE:
$ASSET_TYPE

FILE:
$DEST_FILE

STATUS:
APPROVED

REGISTERED:
$(date "+%Y-%m-%d %H:%M:%S")

RULE:
This file is a locked master asset.
Do not overwrite.
Do not redesign.
Do not replace without version upgrade.
EOT

echo "✅ MASTER ASSET IMPORTED"
echo "$DEST_DIR/$DEST_FILE"
