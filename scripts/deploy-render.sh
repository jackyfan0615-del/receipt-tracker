#!/usr/bin/env bash
# 一鍵部署到 Render（需先在 render.com 用 GitHub 登入）
# 用法：./scripts/deploy-render.sh

set -euo pipefail

REPO="https://github.com/jackyfan0615-del/receipt-tracker"
DEPLOY_URL="https://dashboard.render.com/blueprint/new?repo=${REPO}"

echo "=========================================="
echo "  電子帳單系統 - Render 一鍵部署"
echo "=========================================="
echo ""
echo "1. 即將開啟 Render 部署頁面"
echo "2. 請用 GitHub 登入（jackyfan0615-del）"
echo "3. 確認 render.yaml 設定後點 Deploy"
echo "4. 在 Environment 加入 OPENAI_API_KEY（選填）"
echo "5. 部署完成後取得永久網址"
echo ""
echo "Repository: ${REPO}"
echo "Deploy URL: ${DEPLOY_URL}"
echo ""

if command -v open >/dev/null 2>&1; then
  open "${DEPLOY_URL}"
fi

echo "完成登入與部署後，將網址加入手機主畫面即可隨時使用。"
