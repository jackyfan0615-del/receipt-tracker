#!/usr/bin/env bash
# Cursor Agent 收據上傳腳本
# 用法：
#   ./scripts/agent-upload.sh /path/to/receipt.jpg
#   ./scripts/agent-upload.sh /path/to/receipt.jpg --note "午餐"
#   ./scripts/agent-upload.sh /path/to/receipt.jpg --manual --amount 128.5 --currency HKD --title "午餐"

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 讀取 .env.local
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

API_KEY="${RECEIPT_AGENT_API_KEY:-}"
BASE_URL="${RECEIPT_TRACKER_URL:-http://localhost:3000}"

if [ -z "$API_KEY" ]; then
  echo "錯誤：未設定 RECEIPT_AGENT_API_KEY，請在 .env.local 加入此變數" >&2
  exit 1
fi

IMAGE_PATH=""
NOTES=""
MANUAL=""
TITLE=""
AMOUNT=""
CURRENCY=""
MERCHANT=""
CATEGORY=""
DATE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --note) NOTES="$2"; shift 2 ;;
    --manual) MANUAL="true"; shift ;;
    --title) TITLE="$2"; shift 2 ;;
    --amount) AMOUNT="$2"; shift 2 ;;
    --currency) CURRENCY="$2"; shift 2 ;;
    --merchant) MERCHANT="$2"; shift 2 ;;
    --category) CATEGORY="$2"; shift 2 ;;
    --date) DATE="$2"; shift 2 ;;
    --url) BASE_URL="$2"; shift 2 ;;
    -*) echo "未知參數: $1" >&2; exit 1 ;;
    *)
      if [ -z "$IMAGE_PATH" ]; then
        IMAGE_PATH="$1"
      else
        echo "多餘參數: $1" >&2
        exit 1
      fi
      shift
      ;;
  esac
done

if [ -z "$IMAGE_PATH" ]; then
  echo "用法: $0 <收據圖片路徑> [--note 備註] [--manual --amount 金額 --currency HKD]" >&2
  exit 1
fi

if [ ! -f "$IMAGE_PATH" ]; then
  echo "錯誤：找不到圖片 $IMAGE_PATH" >&2
  exit 1
fi

CURL_ARGS=(
  -sS
  -X POST
  "${BASE_URL}/api/receipts/agent-upload"
  -H "Authorization: Bearer ${API_KEY}"
  -F "file=@${IMAGE_PATH}"
)

[ -n "$NOTES" ] && CURL_ARGS+=(-F "notes=${NOTES}")
[ -n "$MANUAL" ] && CURL_ARGS+=(-F "manual=true")
[ -n "$TITLE" ] && CURL_ARGS+=(-F "title=${TITLE}")
[ -n "$AMOUNT" ] && CURL_ARGS+=(-F "amount=${AMOUNT}")
[ -n "$CURRENCY" ] && CURL_ARGS+=(-F "currency=${CURRENCY}")
[ -n "$MERCHANT" ] && CURL_ARGS+=(-F "merchant=${MERCHANT}")
[ -n "$CATEGORY" ] && CURL_ARGS+=(-F "category=${CATEGORY}")
[ -n "$DATE" ] && CURL_ARGS+=(-F "date=${DATE}")

RESPONSE="$(curl "${CURL_ARGS[@]}")"

if command -v python3 >/dev/null 2>&1; then
  printf '%s' "$RESPONSE" | python3 -c 'import json,sys; data=json.load(sys.stdin); print(data.get("summary") or data) if data.get("success") else (print("❌ 上傳失敗:", data.get("error","未知錯誤")) or sys.exit(1))'
else
  echo "$RESPONSE"
fi
