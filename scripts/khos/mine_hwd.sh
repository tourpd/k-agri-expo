#!/bin/bash

START=$1
END=$2

BASE="K-HOS/HUMANITY_BLACK_BOX/003_SOURCE_ARCHIVES/hwandangogi/events"

mkdir -p "$BASE"

for ((i=START;i<=END;i++))
do
    ID=$(printf "HWD-%04d" $i)

    cat > "$BASE/$ID.md" << EOT
# $ID

## SOURCE
환단고기

## STATUS
MINED

## TITLE
채굴 예정

## HUMAN QUESTION
분석 예정

## HUMAN SOUL
분석 예정

## CONTENT
웅쌤
웅녀
공동농사국
참교육

## NOTES
K-HOS AUTO MINER GENERATED

EOT

    echo "CREATED: $ID"
done

echo ""
echo "================================"
echo "MINING COMPLETE"
echo "$START ~ $END"
echo "================================"
