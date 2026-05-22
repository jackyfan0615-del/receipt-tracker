# 電子帳單系統 (Receipt Tracker)

跨裝置同步的 AI 收據辨識電子帳單系統，支援手機與電腦即時連動。

## 功能

- **AI 收據辨識**：上傳收據圖片，自動提取金額、商家、日期、分類
- **多幣別支援**：HKD（預設）、TWD、USD、JPY
- **收據圖片附加**：每筆記錄自動保存並顯示原始收據圖片
- **Excel 匯出**：匯出 `.xlsx` 檔案，內含金額資料與嵌入的收據圖片
- **跨裝置同步**：部署至伺服器後，手機與電腦開啟同一網址即可同步
- **PWA 支援**：可將網頁加入手機主畫面，像 App 一樣使用

## 快速開始

### 1. 安裝依賴

```bash
cd receipt-tracker
npm install
```

### 2. 設定 AI 辨識（選填）

複製環境變數範例並填入 OpenAI API Key：

```bash
cp .env.example .env.local
```

編輯 `.env.local`：

```
OPENAI_API_KEY=sk-your-api-key-here
```

> 若未設定 API Key，仍可手動填寫收據資訊。

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)

### 4. 手機連動（同一 Wi-Fi）

在電腦上查看本機 IP，例如 `192.168.1.100`，手機瀏覽器開啟：

```
http://192.168.1.100:3000
```

兩台裝置將共用同一資料庫，即時同步。

## 部署（正式環境）

部署至 VPS、Railway、Render 等平台後，手機與電腦只需開啟部署網址即可永久同步。

```bash
npm run build
npm start
```

> 注意：需確保 `data/` 目錄有持久化儲存空間（volume），否則重啟後資料會遺失。

## 使用方式

1. **上傳收據**：前往「上傳」頁面，拍照或選擇收據圖片
2. **AI 辨識**：點擊「AI 自動辨識並儲存」，或選擇「手動填寫」
3. **查看記錄**：在「記錄」頁面瀏覽、編輯或刪除
4. **匯出**：在「匯出」頁面下載含圖片的 Excel 檔案

## 技術架構

- **前端**：Next.js 16 + React + Tailwind CSS
- **資料庫**：SQLite（better-sqlite3）
- **AI**：OpenAI GPT-4o-mini Vision
- **匯出**：ExcelJS（嵌入收據圖片）

## 資料儲存

- 資料庫：`data/receipts.db`
- 收據圖片：`data/uploads/`

---

## 常見問題

### 手機能連上 Cursor 的 repository 嗎？

**不能直接連。** Cursor 是電腦上的開發工具，手機無法像電腦一樣開啟 Cursor 專案或執行 Next.js。

| 用途 | 手機怎麼做 |
|------|-----------|
| **日常使用（上傳收據、查帳）** | 開啟**已部署的網站網址**（見下方部署說明） |
| **查看／修改程式碼** | 將專案 push 到 **GitHub**，用手機 GitHub App 查看 |
| **iCloud 資料夾** | iPhone「檔案」App 可能看得到 iCloud 資料夾，但**無法執行網站** |

重點：**上傳收據、同步資料 → 用部署後的網址**；**改程式 → 用 GitHub + Cursor（電腦）**。

### 如何讓手機隨時隨地都能用？

需要把網站**部署到網路上**，取得固定網址（例如 `https://your-app.railway.app`），手機用 Safari / Chrome 開啟即可上傳收據。

> ⚠️ 此系統使用 SQLite + 本地圖片儲存，**不適用 Vercel**（無持久化硬碟）。請用下方有 Volume 的方案。

#### 方案 A：Railway（推薦，有免費額度）

1. 將專案 push 到 GitHub（你的帳號：`jackyfan0615-del`）
2. 前往 [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. 選擇 `receipt-tracker` repository
4. 在 Railway 後台新增 **Volume**，掛載路徑：`/app/data`
5. 設定環境變數 `OPENAI_API_KEY`（選填）
6. 部署完成後取得公開網址，手機 bookmark 或「加入主畫面」

#### 方案 B：Docker（VPS 或本機）

```bash
docker compose up -d --build
```

資料會保存在 Docker volume，重啟不會遺失。

#### 方案 C：同一 Wi-Fi 暫時使用（免部署）

電腦執行 `npm run dev -- -H 0.0.0.0`，手機開 `http://<電腦IP>:3000`。  
**限制**：電腦要開機、同一 Wi-Fi，離家後無法使用。

### 手機上傳收據

部署完成後：

1. 手機瀏覽器開啟網站網址
2. 點「上傳」→ 可**直接拍照**或從相簿選圖
3. Safari：分享 → **加入主畫面**，之後像 App 一樣開啟

### Cursor 手機版：傳照片 → AI 自動記帳

已內建 **Agent 上傳 API**，讓 Cursor 收到收據照片後自動記帳。

#### 設定（一次性）

`.env.local` 需包含：

```
RECEIPT_AGENT_API_KEY=你的密鑰
RECEIPT_TRACKER_URL=http://localhost:3000   # 部署後改為公開網址
OPENAI_API_KEY=sk-...                       # 選填，AI 辨識用
```

#### 使用方式

在 **Cursor 手機版** 對話中：
1. 傳送收據照片
2. 說「幫我記帳」或「上傳這張收據」
3. Cursor AI 會自動執行 `./scripts/agent-upload.sh` 並回報記帳結果

專案已包含 `.cursor/rules/receipt-auto-upload.mdc` 規則，AI 會自動辨識收據並上傳。

#### Agent API

```
POST /api/receipts/agent-upload
Authorization: Bearer <RECEIPT_AGENT_API_KEY>
Content-Type: multipart/form-data
file: <收據圖片>
```

#### 手動測試

```bash
./scripts/agent-upload.sh /path/to/receipt.jpg --note "測試"
```


### 推送到 GitHub（一次性設定）

```bash
cd receipt-tracker
git add .
git commit -m "Add receipt tracker with AI recognition and export"
gh repo create receipt-tracker --public --source=. --push
```

若 repository 已存在，改用：

```bash
git remote add origin https://github.com/jackyfan0615-del/receipt-tracker.git
git push -u origin main
```

