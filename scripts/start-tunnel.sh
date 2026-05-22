#!/usr/bin/env bash
# 本機快速公開連線（電腦需保持開機）
# 用法：./scripts/start-tunnel.sh

set -euo pipefail

export PATH="/Users/jackyfan/.nvm/versions/node/v22.22.2/bin:${PATH}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 下載 cloudflared（若尚未安裝）
if ! command -v cloudflared >/dev/null 2>&1; then
  if [ ! -x /tmp/cloudflared ]; then
    echo "下載 cloudflared..."
    ARCH="$(uname -m)"
    if [ "$ARCH" = "arm64" ]; then
      URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz"
    else
      URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz"
    fi
    curl -L "$URL" -o /tmp/cloudflared.tgz
    tar -xzf /tmp/cloudflared.tgz -C /tmp
    chmod +x /tmp/cloudflared
  fi
  CLOUDFLARED=/tmp/cloudflared
else
  CLOUDFLARED=cloudflared
fi

# 啟動 dev server（若尚未運行）
if ! curl -s -o /dev/null http://localhost:3000 2>/dev/null; then
  echo "啟動 Next.js 開發伺服器..."
  npm run dev -- -H 0.0.0.0 &
  sleep 3
fi

echo ""
echo "建立公開連線中..."
echo "完成後會顯示 https://xxx.trycloudflare.com 網址"
echo "手機可直接開啟該網址上傳收據"
echo ""

exec "$CLOUDFLARED" tunnel --url http://localhost:3000
