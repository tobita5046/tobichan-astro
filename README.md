# tobichan-astro

水素のお兄さん **とびchan.** のAstro製サイト（フェーズ2 — ブログ機能版）

---

## 🚀 デプロイ手順（GitHub Web UI + Netlify）

このプロジェクトは、ローカル環境がなくてもブラウザだけで本番デプロイできます。

### Step 1：GitHubに新しいリポジトリを作成

1. [github.com](https://github.com) にログイン
2. 右上の「**+**」→「**New repository**」
3. 設定：
   - **Repository name**: `tobichan-astro`
   - **Description**: `水素のお兄さん とびchan. のAstroブログサイト` (任意)
   - **Public** または **Private** どちらでも可
   - **Add a README file** はチェックを **外す**（このフォルダのREADMEを使うため）
4. 「**Create repository**」をクリック

### Step 2：このフォルダの中身をすべてアップロード

1. 作ったリポジトリの画面で「**uploading an existing file**」リンクをクリック
2. このフォルダの中身（`package.json`, `astro.config.mjs`, `src/` フォルダなど）を**すべて**ドラッグ&ドロップ
   - 注意：`src/` などのフォルダごとアップロードする
3. ページ下部の「**Commit changes**」をクリック

### Step 3：Netlify で新規プロジェクト作成

1. [app.netlify.com](https://app.netlify.com) にログイン
2. 上部「**Add new site**」→「**Import an existing project**」
3. 「**Deploy with GitHub**」を選択
4. リポジトリ一覧から `tobichan-astro` を選択
5. ビルド設定は自動で読み込まれます（`netlify.toml` から）：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. 「**Deploy site**」をクリック

⚠️ 初回デプロイは**環境変数なしのため失敗します**。次の Step 4 を実行してください。

### Step 4：Netlify に環境変数を設定

1. 作成されたサイトの **Site configuration** → **Environment variables**
2. 「**Add a variable**」を2回クリックして以下を追加：

| Key | Value |
| :--- | :--- |
| `NOTION_API_KEY` | Notion 内部コネクトシークレット（`secret_xxx...` または `ntn_xxx...`） |
| `NOTION_DATABASE_ID` | ブログDBのID（32文字の英数字） |

3. **Deploys** タブ → 右上「**Trigger deploy**」→「**Deploy site**」

### Step 5：動作確認

ビルド完了後（1〜3分）、Netlifyの自動URL（例: `https://tobichan-astro.netlify.app`）を開きます。

- `/` → 移行作業中ページ
- `/blog` → 記事一覧ページ
- `/blog/{slug}` → 個別記事

Notionで Status を「**公開済み**」または「**公開予定**」にした記事だけが表示されます。

---

## 📁 ファイル構成

```
tobichan-astro/
├── package.json              # 依存パッケージ
├── astro.config.mjs          # Astro設定
├── tailwind.config.mjs       # Tailwind設定
├── tsconfig.json             # TypeScript設定
├── netlify.toml              # Netlifyビルド設定
├── .env.example              # 環境変数の例
├── .gitignore                # Git除外設定
├── README.md                 # このファイル
└── src/
    ├── lib/
    │   └── notion.ts         # Notion API クライアント
    ├── layouts/
    │   └── BaseLayout.astro  # 共通レイアウト
    ├── components/
    │   ├── Header.astro      # ヘッダー
    │   ├── Footer.astro      # フッター
    │   └── BlogCard.astro    # 記事カード
    └── pages/
        ├── index.astro       # トップページ
        └── blog/
            ├── index.astro   # 記事一覧
            └── [slug].astro  # 個別記事
```

---

## 📝 ブログ記事の追加方法

### 1. Notion で新規記事ページを作成

ブログDB（「とびchan. ブログ記事」）で、新しい行を追加。

### 2. プロパティを設定

| プロパティ | 入力例 |
| :--- | :--- |
| タイトル | 水素とは？元素番号1番の最も軽い元素を解説 |
| Slug | `what-is-hydrogen-basic-properties-1`（英数字とハイフン） |
| Status | 下書き → 公開予定 → 公開済み |
| Category | 社会人のための水素講座 |
| Tags | 水素, 軽水素, 重水素 |
| 公開日 | 2026/05/03 |
| Description | （SEO用に120〜160字） |
| YouTube URL | `https://youtu.be/xxx` |
| 訂正動画 URL | （あれば） |
| アイキャッチURL | `https://i.ytimg.com/vi/xxx/maxresdefault.jpg` |

### 3. ページ本文に記事を書く

NotionページのIcon下のスペースに、見出し・段落・画像などをMarkdown感覚で書きます。

### 4. Status を「公開済み」または「公開予定」に変更

### 5. Netlify で再ビルドをトリガー

Netlify は **Notionの変更を自動検知できないため**、手動で再ビルドが必要です：

- **Deploys** タブ → 右上「**Trigger deploy**」→「**Deploy site**」

または、Notionで自動再ビルドさせたい場合は **Build hook** + **Notion Webhook** を後で設定可能。

---

## 🔑 環境変数

| 変数名 | 説明 | 設定場所 |
| :--- | :--- | :--- |
| `NOTION_API_KEY` | Notion 内部コネクトシークレット | Netlify Environment variables |
| `NOTION_DATABASE_ID` | ブログDBのID（32文字） | Netlify Environment variables |

⚠️ Astroの環境変数は `PUBLIC_` プレフィックスがない場合、**サーバーサイド/ビルド時のみ参照可能** で、ブラウザJSには出力されません。Notion APIキーの安全管理に最適です。

---

## 💻 ローカル開発（オプション・上級者向け）

ローカルマシンで動作確認したい場合：

```bash
# 1. 依存関係をインストール
npm install

# 2. 環境変数ファイルを準備
cp .env.example .env
# .env を開いて NOTION_API_KEY と NOTION_DATABASE_ID を記入

# 3. 開発サーバー起動
npm run dev

# → http://localhost:4321 で確認
```

---

## 🛠️ トラブルシューティング

### ビルドエラー「NOTION_API_KEY が設定されていません」

→ Netlify の Environment variables を確認してください。設定後は **Trigger deploy** で再ビルド。

### `/blog` を開いても記事が出ない

→ Notion でその記事の Status が「公開済み」になっているか確認。確認後、Netlifyで再ビルド。

### 記事タイトルが文字化けする

→ Notion API のプロパティ名と `src/lib/notion.ts` 内のプロパティ名が一致しているか確認。日本語プロパティ名を変更した場合は notion.ts も合わせて修正。

### 個別記事ページ（/blog/xxx）が404になる

→ Slug プロパティが正しく入力されているか確認（英数字とハイフンのみ使用）。

---

## 📋 今後の拡張予定（Phase 5b〜）

- 既存ページ（トップ・水素コンテンツ・見積もり・お問い合わせ）の Astro 移植
- カテゴリ別・タグ別ページ
- RSS フィード自動生成
- 検索機能
- Notion の更新を自動検知する Webhook
- 関連記事レコメンド

---

## 📞 連絡先

水素のお兄さん **とびchan.**
support@tobichan.com
