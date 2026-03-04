このガイドは、Japan AIのホスティング環境（Webサイト置き場）で動くアプリケーションを作成・公開するためのPAGEアップロード用ZIPファイルの中身を開発するためのガイドです。

## 1. クイックスタート (Quick Start)

開発を始めるための手順は以下の6ステップです。

1. **アプリケーションの作成**
    - お好みのフレームワーク（Next.js、React、または単純なHTML/CSS/JavaScriptなど）を使ってアプリを作ります。
2. **必須エントリーポイント（入り口）の用意**
    - プログラムが動くアプリの場合：`package.json` ファイルに `build`（構築）と `start`（起動）というコマンドを記述する必要があります。
    - 静的なサイト（表示のみ）の場合：`index.html` ファイルを置きます。
3. **Next.jsのスタンドアローン出力の有効化**
    - Next.jsを使う場合は、設定で `output: "standalone"` を有効にします（詳細は後述）。
4. **ローカルでのテスト**
    - アップロードする前に、自分のパソコンで「本番用ビルド」を実行し、正しく動くか確認します。
5. **アップロードと公開**
    - Japan AI Studioの画面からファイルをアップロードし、Japan AIのアプリ上からそのページを開きます。
6. **プラットフォームAPIの利用**
    - ページと同じドメイン（場所）にある `/api/...` というURLや、`window.JapanAI.getContext()` という機能を使って、データのやり取りを行います。
    
    <aside>
    💡
    
    **利用可能なAPI**:
    
    1. [**カスタムオブジェクトAPI**: データの作成・読み取り・更新・削除（CRUD）が可能。](https://www.notion.so/1_STUDIO-PAGE-2026-01-20-2ee1d5dbe534808a8ee9c994d3a54779?pvs=21)
    2. [**エージェントチャットAPI**](https://www.notion.so/1_STUDIO-PAGE-2026-01-20-2ee1d5dbe534808a8ee9c994d3a54779?pvs=21)[: AI（LLM）に対してチャットで指示を出し、回答をもらう機能。](https://www.notion.so/1_STUDIO-PAGE-2026-01-20-2ee1d5dbe534808a8ee9c994d3a54779?pvs=21)
    </aside>
    

---

## 2. サポートされている実行環境 (Supported Runtimes)

プラットフォームは、アップロードされたファイルを自動的に分析し、以下の3つのうち最適な環境を選んで動かします。

1. **Bun (バン)**: JavaScriptを動かすための、新しくて非常に高速な環境です。
2. **Node.js (ノード・ジェイエス)**: JavaScriptを動かすための、標準的な環境です。
3. **Static (スタティック)**: HTMLやCSSだけの、裏でプログラムが動かない静的なサイト用です。

<aside>
💡

### 最高のパフォーマンスを出すための推奨事項

- **Bunを優先する**: インストールや起動が速いため、可能な限りNode.jsではなくBunを使いましょう。
- **Next.jsはスタンドアローン出力にする**: Next.jsを使う場合、このプラットフォームでは必須の設定です。
- **共有パッケージのバージョンに合わせる**: プラットフォーム側ですでに用意されているライブラリのバージョンを使うことで、構築時間とファイルサイズを節約できます。
- **サーバー側の処理を軽くする**: ユーザーからのリクエストを受け取る部分（ハンドラー）で時間のかかる処理をしないでください。重い処理は裏側（バックグラウンド）で行い、画面側からは定期的に状況を確認（ポーリング）するように作りましょう。
</aside>

---

## 3. プロジェクトの構成 (Project Structure)

ファイルやフォルダの構造に関する決まりごとです。

### 基本要件 (Basic Requirements)

**動的アプリ（Next.js, Reactなど）の場合**`package.json` という設定ファイルが必要です。この中には以下が含まれていなければなりません。
* `build` と `start` スクリプト（命令）
* アプリが `process.env.PORT` という環境変数で指定されたポート番号で通信を受け付けること

**`package.json` の例と解説**:

```json
{
  "name": "my-app",        // アプリの名前
  "version": "1.0.0",      // バージョン
  "scripts": {             // コマンド一覧
    "dev": "next dev",     // 開発用
    "build": "next build", // 構築用（必須）
    "start": "next start"  // 起動用（必須）
  },
  "dependencies": {        // 使うライブラリ
    "next": "16.1.1",
    "react": "19.2.3",
    "react-dom": "19.2.3"
  }
}
```

**静的サイトの場合**`package.json` は不要ですが、一番上の階層に `index.html` が必ず必要です。

> 共有パッケージのバージョンについて: ホスティング環境には特定のバージョンのライブラリがプリインストールされています。上記の例にあるバージョン（Next 16.1.1など）を使うと、構築が速くなります。
> 

### Next.js スタンドアローン出力（Next.js使用時は必須）

Next.jsを使う場合は、設定ファイルに `output: "standalone"` を記述します。

**CommonJS形式 (`next.config.js`) の場合**:

```jsx
/**@type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // この行が必要です
};
module.exports = nextConfig;
```

**ESM形式 (`next.config.mjs`) の場合**:

```jsx
const nextConfig = {
  output: "standalone",
};
export default nextConfig;
```

**なぜこれが必要か**:
プラットフォームはNext.jsアプリを「スタンドアローン（自立型）」モードで動かします。これにより、必要なファイルだけがコンパクトにまとまり、起動時間（コールドスタート）が短縮されます。

### バージョン管理 (.manifest.json)

アプリのバージョンを自分で明確に管理したい場合、`manifest.json` というファイルを置きます。

```json
{
  "version": "0.0.1"
}
```

ファイルを更新してアップロードする際、このバージョン番号を書き換えると、システムが「更新された」と判断します。もしこのファイルがない場合は、アップロードされたファイルの中身（`package.json` や `index.html`）が変わったかどうかで自動的に判断されます。

---

## 4. Bunの使用（推奨）

**Bun** はNode.js互換の高速なツールです。npmやyarnを使っているプロジェクトでもBunで動かせます。

**Bunを使う手順**:
1. **インストール**: `curl -fsSL https://bun.sh/install | bash` で自分のパソコンにBunを入れます。
2. **初期化**: プロジェクトのフォルダで `bun init` を実行します。
3. **ライブラリのインストール**: `bun install` を実行します（npm installより非常に高速です）。
4. **設定ファイルの変更**: `package.json` のスクリプトをBun用に書き換えます。
* 例: `"dev": "bun run next dev"`
* 例: `"build": "bun run next build"`
* 例: `"start": "bun run next start"`

---

## 5. プリインストール済みの共有パッケージ

プラットフォーム（サーバー側）のDockerイメージには、よく使われるライブラリ（パッケージ）があらかじめインストールされています。
これらと同じバージョンをあなたのアプリでも使うようにすると、そのライブラリはアップロードする必要がなくなり、サーバー側にあるものをコピーして使ってくれます。

### 共有パッケージリスト（本番用依存関係）

これらはアプリを動かすために必要な主なライブラリです。

| パッケージ名 | バージョン | 説明 |
| --- | --- | --- |
| `next` | 16.1.1 | Reactフレームワーク（本番用） |
| `react` | 19.2.3 | Reactライブラリ |
| `react-dom` | 19.2.3 | React DOM レンダラー |
| `tailwindcss` | 4.1.18 | ユーティリティファーストCSSフレームワーク |
| `postcss` | 8.5.6 | CSS変換ツール |
| `autoprefixer` | 10.4.23 | ベンダープレフィックス自動付与 |
| `@next/env` | 16.1.1 | Next.js環境変数管理 |
| `styled-jsx` | 5.1.7 | Next.js用CSS-in-JS |
| `caniuse-lite` | 1.0.30001761 | ブラウザ互換性データ |
| `scheduler` | 0.27.0 | Reactスケジューラー |
| `clsx` | 2.1.1 | クラス名ユーティリティ |
| `class-variance-authority` | 0.7.1 | バリアントクラスユーティリティ |
| `axios` | 1.13.2 | HTTPクライアント |
| `zod` | 4.2.1 | スキーマ検証 |
| `lucide-react` | 0.562.0 | アイコンライブラリ |
| `@radix-ui/react-slot` | 1.2.4 | UIプリミティブ |

### 共有パッケージリスト（開発用依存関係）

これらは開発やビルドのときだけ必要なツールです。

| パッケージ名 | バージョン | 説明 |
| --- | --- | --- |
| `@tailwindcss/forms` | 0.5.11 | Tailwind用フォームスタイル |
| `@tailwindcss/typography` | 0.5.19 | Tailwind用タイポグラフィプラグイン |
| `@types/react` | 19.2.7 | React用TypeScript型定義 |
| `@types/react-dom` | 19.2.3 | React DOM用TypeScript型定義 |
| `@types/node` | 25.0.3 | Node.js用TypeScript型定義 |
| `typescript` | 5.9.3 | TypeScriptコンパイラ |
| `eslint` | 9.39.2 | JavaScriptリンター |
| `eslint-config-next` | 16.1.1 | Next.js用ESLint設定 |
| `@typescript-eslint/parser` | 8.50.1 | TypeScript ESLintパーサー |
| `@typescript-eslint/eslint-plugin` | 8.50.1 | TypeScript ESLintルール |

### 共有バージョンを使うメリット

1. **ビルドが速い**: 共有パッケージはすでにインストール済みなので、`npm install` / `bun install` の時間が短縮されます。
2. **ファイルが軽い**: 共有パッケージはアップロードから除外されます。Next.jsのスタンドアローン出力と組み合わせると、通常の `node_modules` バンドルよりはるかに小さくなります。
3. **環境の統一**: すべてのページで同じテスト済みのパッケージバージョンが使われます。
4. **自動再利用**: プラットフォームがバージョン互換性をチェックして自動的に共有パッケージを再利用します。

### バージョンの互換性（ルール）

共有パッケージが使われるのは、リクエストされたバージョンが共有バージョンと互換性がある場合です。

- **完全一致 または `~` (チルダ)**: 同じメジャー.マイナーバージョンである必要があります。
- **`^` (キャレット)**: 同じメジャーバージョンで、かつマイナーバージョンが共有バージョンより新しくないこと。
- **`latest` や** : 個別にインストールされます。

**例**:
* `"next": "^16.1.0"` → 共有の `16.1.1` が使われる
* `"react": "~19.2.0"` → 共有の `19.2.3` が使われる
* `"next": "15.0.0"` → 個別にインストール（メジャーバージョンが異なる）
* `"react": "19.3.0"` → 個別にインストール（共有より新しいマイナーバージョン）

---

## 6. カスタムオブジェクトAPIの呼び出し

Japan AIのカスタムオブジェクトAPIを、作成したページから統合する方法です。

### 静的アセットの注意点（401エラー防止）

ページのURLは `/app/{組織}/{プロジェクト}/{ページID}` という形式です。もしページURLの末尾がページIDで終わっている場合（例: `/app/{org}/{project}/{pageId}`）、相対パスで書かれたアセット（`styles.css`など）は、ブラウザによって `/app/{org}/{project}/styles.css` に解決されます。これは末尾のセグメントがファイルとして扱われるためです。これによりページIDが欠落し、認証に失敗することがあります。

**対策**:
* 絶対パスを使う: `<link rel="stylesheet" href="/styles.css">`
* **または** ページURLに末尾スラッシュを追加（またはリダイレクト）: `/app/{org}/{project}/{pageId}/`
* **または** HTMLに `<base>` タグを設定: `<base href="/app/{org}/{project}/{pageId}/">`

これらのいずれかを行うことで、アセットリクエストに `pageId` が含まれ、正しくルーティング・認証されます。

### 推奨されるアクセスパターン

プラットフォームはセッションクッキーで認証を処理するため、自分で認証ヘッダーを管理する必要はありません。コンテキストを使ってパスを構築するだけです。

### クライアントサイド（最もシンプル）

```jsx
// app/page.js
'use client';

import { useEffect, useState } from 'react';

const OBJECT_ID = 'obj-customer-data-001';

export default function Customers() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const ctx = window.JapanAI?.getContext();
    if (!ctx) return;

    const path = `/api/custom-objects/v1/organizations/${ctx.orgId}/projects/${ctx.projectId}/objects/${OBJECT_ID}/records`;

    fetch(path, { headers: { 'Content-Type': 'application/json' } })
      .then((res) => res.json())
      .then((data) => setRows(data?.data ?? []))
      .catch(console.error);
  }, []);

  return<pre>{JSON.stringify(rows, null, 2)}</pre>;
}
```

セッションクッキーは同一オリジンリクエストで自動的に送信されるため、ビジネスヘッダーのみ必要です。

### ポーリング、ハートビート、オートスケーリング

- **ポーリング**: カスタムオブジェクトAPIへのポーリング（）は引き続き機能します。各リクエストでセッションクッキーが送信されます。

<aside>
💡

**ポーリング = 「結果がまだ？」と繰り返し確認すること**

宅配便の追跡ページを何度もリロードして「荷物届いたかな？」と確認する行為がポーリングです。

</aside>

- **ハートビート**: プラットフォームは自動的にハートビートを送信してセッションとプロセスを維持します。ハートビートが停止すると（タブを閉じた場合）、約20分後にセッション/プロセスが期限切れになり、ページが再度Japan AI経由で開かれるまでポーリングは401を返します。
- **負荷対策**: レート制限や不要なオートスケール（サーバーへの負荷増大による）を避けるため、ポーリング（結果確認の問い合わせ）は控えめにし、ジッターを入れてください。

<aside>
💡

**ジッター = 確認タイミングをわざとランダムにずらすこと**

Aさん: 2.1秒後にアクセス
Bさん: 2.7秒後にアクセス
Cさん: 2.3秒後にアクセス
→ アクセスが分散してサーバーが安定

</aside>

### カスタムオブジェクトのレート制限

- インスタンスあたり: 秒間約25リクエスト、バースト容量約200。
- 超過すると、リクエストはHTTP 429を返します。指数バックオフとジッターで再試行してください。

<aside>
💡

**指数バックオフ = エラー時に待機時間を2倍ずつ増やしてリトライ**

サーバーが混雑している (HTTP 429エラー) 時に、すぐリトライすると余計に混雑します。

**[なぜ指数？]**

1回目失敗 → 5秒待つ
2回目失敗 → 10秒待つ (5 × 2)
3回目失敗 → 20秒待つ (10 × 2)
4回目失敗 → 40秒待つ (20 × 2)
5回目失敗 → 80秒待つ (40 × 2)

</aside>

以上の内容を満たす、PAGE内における`ポーリング（状況確認） + ジッター（ランダムアクセス） + 指数バックオフ（状況確認時のエラー発生時は待機時間を2倍）` のコード例です。（五藤追記: 2026-01-20）

```python
// ポーリング（状況確認） + ジッター（ランダム確認） + 指数バックオフ（待機時間を2倍）
const pollWithRetry = async (taskId) => {
  let waitTime = 5000; // バックオフ用
  
  while (true) {
    try {
      // ジッター（ランダムアクセス）付きポーリング (2〜3秒間隔の不定期状況確認)
      const pollDelay = 2000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, pollDelay));
      
      const res = await fetch(`/api/status/${taskId}`);
      
      if (res.status === 429) {
        // 指数バックオフ（エラー時は待機時間を2倍）
        const jitter = waitTime * 0.2 * (Math.random() - 0.5);
        await new Promise(r => setTimeout(r, waitTime + jitter));
        waitTime *= 2; // 次回は2倍
        continue; // ループ継続
      }
      
      const data = await res.json();
      if (data.completed) return data.result;
      
      waitTime = 5000; // 成功したらリセット
      
    } catch (error) {
      console.error('ポーリング（状況確認）エラー:', error);
      throw error;
    }
  }
};
```

### 静的サイト

静的サイト（純粋なHTML/CSS/JS）は、ブラウザから相対URLでAPI呼び出しを行います。

```jsx
// static/app.js
const OBJECT_ID = 'obj-customer-data-001';

function fetchRecords() {
  const ctx = window.JapanAI.getContext();
  const endpoint = `/api/custom-objects/v1/organizations/${ctx.orgId}/projects/${ctx.projectId}/objects/${OBJECT_ID}/records`;

  fetch(endpoint, {
    headers: { 'Content-Type': 'application/json' }
  })
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(console.error);
}
```

### Next.js ルートハンドラー（SSR）

サーバーサイドのルートハンドラーは相対URLを使用できます。

```jsx
// app/api/customers/route.js
const OBJECT_ID = 'obj-customer-data-001';

export async function POST(request) {
  const { orgId, projectId, payload } = await request.json();

  // 相対URLはSSRで機能 - プラットフォームがURL解決を処理
  const endpoint = `/api/custom-objects/v1/organizations/${orgId}/projects/${projectId}/objects/${OBJECT_ID}/records`;

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: payload })
  });

  if (!resp.ok) {
    return Response.json({ error: await resp.text() }, { status: resp.status });
  }

  return Response.json(await resp.json());
}
```

### やってはいけないこと

- カスタムIDや認証ヘッダーを設定**しない**でください。プラットフォームが認証とIDを処理します。
- 組織/プロジェクトIDはパスに含めてください。カスタムオブジェクトのパスには `pageId` は含まれません。

### バンドルサイズの最適化

```bash
# バンドルサイズを分析
bun run build
# または
npm run build
```

### アップロード前のローカルテスト

```bash
# 開発モード
bun run dev

# 本番モード
bun run build && bun run start
# または
npm run build && npm run start
```

---

## 7. エージェントチャットAPIの呼び出し

プラットフォームは `/api/agent-chat` エンドポイントを提供しており、ホストされたページからLLMチャット補完を行うことができます。これにより、AI機能をアプリケーションに直接組み込むことができます。

出典: [Making API Calls to Agent Chat](https://www.notion.so/2ea1d5dbe534813897eddc8e16db2b4d?pvs=21)

<aside>
💡

従来の`https://api.japan-ai.co.jp/chat/v2`と`/api/agent-chat` との違いは、

[CHAT API（従来の`https://api.japan-ai.co.jp/chat/v2`と`/api/agent-chat`）比較ガイド](https://www.notion.so/2f51d5dbe53480748d20fa8077362904?pvs=21) も確認してみてください。

</aside>

### 概要

エージェントチャットAPIは以下を提供します。

- **シンプルなチャットインターフェース**: メッセージを送信してAI生成の応答を受け取ります。
- **自動認証**: 他のプラットフォームAPIと同じセッションクッキーを使用します。
- **構造化出力サポート**: 構造化応答のためのオプションのJSONスキーマ。

### リクエスト形式

**エンドポイント**: `POST /api/agent-chat`

**リクエストボディ**:

```json
{
  "messages": [
    { "role": "system", "content": "あなたは親切なアシスタントです。" },
    { "role": "user", "content": "日本の首都は何ですか？" }
  ],
  "model": "gpt-4o",           // オプション: モデル識別子
  "max_tokens": 1000,          // オプション: 最大応答トークン数（デフォルト: 1000、最大: 2000）
  "temperature": 0.7,          // オプション: サンプリング温度（デフォルト: 0.7、範囲: 0.0-2.0）
  "response_format": {         // オプション: 構造化JSON出力用
    "type": "json_schema",
    "json_schema": {
      "name": "my_response",
      "schema": { ... }
    }
  }
}
```

**リクエストフィールド**:

| フィールド | 型 | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- | --- |
| `messages` | array | はい | - | `role` と `content` を持つチャットメッセージの配列 |
| `model` | string | いいえ | - | モデル識別子（例: “gpt-4o”） |
| `max_tokens` | integer | いいえ | 1000 | 応答の最大トークン数（2000に制限） |
| `temperature` | float | いいえ | 0.7 | サンプリング温度（0.0-2.0に制限） |
| `response_format` | object | いいえ | - | 構造化出力用のJSONスキーマ形式 |

**メッセージの役割**:
* `system`: AIの動作を導くシステム指示
* `user`: ユーザー入力/質問
* `assistant`: 過去のAI応答（複数ターンのコンテキスト用）

### レスポンス形式

**成功レスポンス** (HTTP 200):

```json
{
  "content": "日本の首都は東京です。",
  "model": "gpt-4o",
  "finish_reason": "stop"
}
```

| フィールド | 型 | 説明 |
| --- | --- | --- |
| `content` | string | AI生成の応答テキスト |
| `model` | string | 補完に使用されたモデル識別子 |
| `finish_reason` | string | 応答が終了した理由（例: “stop”, “length”） |

**エラーレスポンス**:

```json
{
  "error": "エラーメッセージ",
  "error_code": "ERROR_CODE"
}
```

| ステータス | エラーコード | 説明 |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | 無効なリクエストボディまたは `messages` が欠落 |
| 401 | `UNAUTHORIZED` | セッションが欠落または無効（認証されていない） |
| 502 | `SERVICE_UNAVAILABLE` | サービスが一時的に利用不可 |
| 504 | `TIMEOUT` | リクエストがタイムアウト |

### クライアントサイドでの使用（推奨）

エージェントチャットを使用する最も簡単な方法は、クライアントサイドのコードからです。セッションクッキーは同一オリジンリクエストで自動的に含まれます。

### 基本的な例

```jsx
// app/components/ChatBot.js
'use client';

import { useState } from 'react';

export default function ChatBot() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'あなたは親切なアシスタントです。' },
            { role: 'user', content: input }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'リクエストが失敗しました');
      }

      const data = await res.json();
      setResponse(data.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="質問を入力..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? '考え中...' : '送信'}
        </button>
      </form>

      {error &&<p className="error">{error}</p>}
      {response &&<p className="response">{response}</p>}
    </div>
  );
}
```

### 複数ターンの会話

コンテキストを持つ会話の場合、過去のメッセージを含めます。

```jsx
'use client';

import { useState } from 'react';

export default function Conversation() {
  const [messages, setMessages] = useState([
    { role: 'system', content: 'あなたは親切なカスタマーサポートエージェントです。' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // ユーザーメッセージを履歴に追加
    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          max_tokens: 1000
        })
      });

      if (!res.ok) {
        throw new Error('リクエストが失敗しました');
      }

      const data = await res.json();

      // アシスタントの応答を履歴に追加
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: data.content }
      ]);
    } catch (err) {
      console.error('チャットエラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div key={i} className={msg.role}>
            <strong>{msg.role === 'user' ? 'あなた' : 'AI'}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        disabled={loading}
        placeholder="メッセージを入力..."
      />
      <button onClick={sendMessage} disabled={loading}>
        送信
      </button>
    </div>
  );
}
```

### JSONスキーマによる構造化出力

`response_format` フィールドを使用して構造化されたJSON応答をリクエストします。

```jsx
const res = await fetch('/api/agent-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: '3つの色とそのHEXコードをリストしてください' }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'colors',
        schema: {
          type: 'object',
          properties: {
            colors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  hex: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  })
});

const data = await res.json();
const parsed = JSON.parse(data.content); // { colors: [...] }
```

### **`/api/agent-chat` の60秒以上待機方法**

<aside>
💡

ドキュメントには**ストリーミングパラメータの記載がない**ため、以下の方法で長時間処理に対応します。

### **ポーリング（定期問い合わせ）方式**

```python
// 1. エージェント呼び出し開始
const response = await fetch('/api/agent-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'タスク実行' })
});
const { taskId } = await response.json();

// 2. 結果をポーリング (ジッター付き)（ランダムなタイミングで定期的に状況確認）
const pollResult = async () => {
  const delay = 2000 + Math.random() * 1000; // 2-3秒間隔
  await new Promise(r => setTimeout(r, delay));
  
  const res = await fetch(`/api/agent-chat/status/${taskId}`);
  if (res.status === 401) throw new Error('セッション期限切れ');
  if (res.status === 429) {
    await new Promise(r => setTimeout(r, 5000)); // 429 のときは5秒待機
    return pollResult();
  }
  
  const data = await res.json();
  if (data.status === 'completed') return data.result;
  if (data.status === 'failed') throw new Error(data.error);
  return pollResult(); // 継続ポーリング
};

const result = await pollResult();
```

</aside>

### 静的サイトでの使用

静的なHTML/CSS/JSサイトの場合:

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>AIチャット</title>
</head>
<body>
  <div id="app">
    <input type="text" id="userInput" placeholder="何か聞いてください...">
    <button onclick="sendMessage()">送信</button>
    <div id="response"></div>
  </div>

  <script>
    async function sendMessage() {
      const input = document.getElementById('userInput');
      const responseDiv = document.getElementById('response');
      const message = input.value.trim();

      if (!message) return;

      responseDiv.textContent = '考え中...';

      try {
        const response = await fetch('/api/agent-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: message }
            ],
            max_tokens: 500
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'リクエストが失敗しました');
        }

        const data = await response.json();
        responseDiv.textContent = data.content;
      } catch (error) {
        responseDiv.textContent = 'エラー: ' + error.message;
      }
    }
  </script>
</body>
</html>
```

### Next.js ルートハンドラー（SSR）

エージェントチャットを呼び出す必要があるサーバーサイドAPIルートの場合:

```jsx
// app/api/analyze/route.js
export async function POST(request) {
  const { prompt } = await request.json();

  // 相対URLはSSRで機能 - プラットフォームがURL解決を処理
  const response = await fetch('/api/agent-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'あなたは親切なアナリストです。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const error = await response.json();
    return Response.json({ error: error.error }, { status: response.status });
  }

  const data = await response.json();
  return Response.json({ result: data.content });
}
```

### カスタムオブジェクトとの併用

エージェントチャットとカスタムオブジェクトデータを組み合わせて、コンテキストを考慮したAI応答を実現します。

```jsx
'use client';

import { useEffect, useState } from 'react';

export default function SmartAssistant() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [aiResponse, setAiResponse] = useState('');

  // カスタムオブジェクトから顧客を取得
  useEffect(() => {
    const ctx = window.JapanAI?.getContext();
    if (!ctx?.customObjects?.customers) return;

    const objectId = ctx.customObjects.customers;
    fetch(`/api/custom-objects/v1/organizations/${ctx.orgId}/projects/${ctx.projectId}/objects/${objectId}/records`)
      .then(res => res.json())
      .then(data => setCustomers(data.data ?? []));
  }, []);

  // 選択された顧客についてAIインサイトを取得
  const analyzeCustomer = async () => {
    if (!selectedCustomer) return;

    const res = await fetch('/api/agent-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'あなたはカスタマーサクセスアナリストです。' },
          { role: 'user', content: `この顧客を分析してください:${JSON.stringify(selectedCustomer)}` }
        ],
        max_tokens: 500
      })
    });

    if (res.ok) {
      const data = await res.json();
      setAiResponse(data.content);
    }
  };

  return (
    <div>
      <select onChange={(e) => setSelectedCustomer(customers[e.target.value])}>
        <option value="">顧客を選択...</option>
        {customers.map((c, i) => (
          <option key={i} value={i}>{c.name}</option>
        ))}
      </select>
      <button onClick={analyzeCustomer} disabled={!selectedCustomer}>
        AIインサイトを取得
      </button>
      {aiResponse &&<p>{aiResponse}</p>}
    </div>
  );
}
```

### TypeScript型定義

```tsx
// types/agent-chat.ts

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AgentChatRequest {
  messages: ChatMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
  response_format?: {
    type: 'json_schema';
    json_schema: { name: string; schema: Record<string, unknown> };
  };
}

interface AgentChatResponse {
  content: string;
  model: string;
  finish_reason: string;
}

interface AgentChatError {
  error: string;
  error_code: 'BAD_REQUEST' | 'UNAUTHORIZED' | 'SERVICE_UNAVAILABLE' | 'TIMEOUT';
}
```

### ベストプラクティス

**エラーを適切に処理する**:

```jsx
async function safeChatRequest(messages) {
  try {
    const response = await fetch('/api/agent-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_tokens: 500 })
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.error_code === 'UNAUTHORIZED') {
        // セッション期限切れ - ユーザーはリフレッシュが必要
        console.error('セッションが期限切れです。ページをリフレッシュしてください。');
      }
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('ネットワークエラー:', err);
    return null;
  }
}
```

**会話履歴をクライアントサイドで管理する**:

```jsx
// サーバーは会話履歴を保持しないため、
// コンポーネントの状態で管理します
function trimConversation(messages, maxMessages = 10) {
  const systemMessages = messages.filter(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');
  return [...systemMessages, ...otherMessages.slice(-maxMessages)];
}
```

### 重要な注意事項

- **認証**: 他のプラットフォームAPIと同じセッションクッキーを使用 - 追加設定は不要です。
- **会話の永続化なし**: 各リクエストは独立しています。サーバーはチャット履歴を保存しません。
- **応答はストリーミングされません**: 完全な応答が単一のJSONオブジェクトとして返されます。
- メッセージに機密データ（パスワード、APIキー、認証情報）を含め**ない**でください。
- カスタム認証ヘッダーを設定**しない**でください - セッションクッキーで十分です。

---

## 8. リクエストタイムアウト（デフォルト）

これらはプラットフォームによって強制されるデフォルトのタイムアウトです。環境によって異なる場合があります。

| リクエストタイプ | 通常のタイムアウト | 期待される動作 |
| --- | --- | --- |
| **エージェントチャット** (`/api/agent-chat`) | サーバーサイド約55秒 | リクエストが長時間実行されると `504 TIMEOUT` を返します |
| **カスタムオブジェクト** (`/api/custom-objects/*`) | 全体で約60秒（最初のバイトまで約30秒） | アップストリームが遅い、または応答しない場合は `504` を返します |
| **アプリエンドポイント** (SSR/ルート/アセット) | 最初のバイトまで約30秒 | アプリが迅速に応答を開始しない場合、リクエストは失敗します。ハンドラーを高速に保ち、長時間の作業をオフロードしてください |

**ベストプラクティス**:
* クライアントサイドのタイムアウト（例: 60-65秒）を設定し、指数バックオフで再試行を処理。
* 重い作業は非同期に保ちます。ジョブIDを返し、ステータスをポーリングします。

1. **55秒を超える（例えば300秒）の処理には必ずジョブキュー方式を使用**
2. **状態管理にカスタムオブジェクトAPIを使用**（セッション期限20分以内に完了する必要あり）

```python
// ステップ1: バックエンドでジョブを非同期実行
// app/api/long-task/route.js (Next.js APIルート)
export async function POST(request) {
  const { prompt } = await request.json();
  
  // ジョブIDを生成して即座に返す（55秒以内）
  const jobId = crypto.randomUUID();
  
  // バックグラウンドで長時間タスクを実行
  executeLongTask(jobId, prompt); // 非同期実行（awaitしない）
  
  return Response.json({ jobId, status: 'processing' });
}

async function executeLongTask(jobId, prompt) {
  try {
    // カスタムオブジェクトに状態を保存
    const ctx = getServerContext(); // サーバー側でコンテキスト取得
    const statusEndpoint = `/api/custom-objects/v1/organizations/${ctx.orgId}/projects/${ctx.projectId}/objects/job-status/records`;
    
    // 初期状態を保存
    await fetch(statusEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: { jobId, status: 'processing', progress: 0 }
      })
    });
    
    // 長時間処理（300秒など）
    const result = await performHeavyComputation(prompt);
    
    // 完了状態を保存
    await fetch(statusEndpoint, {
      method: 'PUT',
      body: JSON.stringify({
        data: { jobId, status: 'completed', result, progress: 100 }
      })
    });
  } catch (error) {
    // エラー状態を保存
    await saveJobStatus(jobId, 'failed', { error: error.message });
  }
}

// ステップ2: クライアント側でポーリング（ジッター + 指数バックオフ）
const pollJobStatus = async (jobId) => {
  let waitTime = 5000; // 初期待機時間
  
  while (true) {
    // ジッター付きポーリング（2-3秒間隔）
    const pollDelay = 2000 + Math.random() * 1000;
    await new Promise(r => setTimeout(r, pollDelay));
    
    try {
      const ctx = window.JapanAI.getContext();
      const statusEndpoint = `/api/custom-objects/v1/organizations/${ctx.orgId}/projects/${ctx.projectId}/objects/job-status/records?filter=jobId:${jobId}`;
      
      const res = await fetch(statusEndpoint);
      
      // レート制限対応（指数バックオフ）
      if (res.status === 429) {
        const jitter = waitTime * 0.2 * (Math.random() - 0.5);
        await new Promise(r => setTimeout(r, waitTime + jitter));
        waitTime *= 2; // 次回は2倍
        continue;
      }
      
      const data = await res.json();
      const job = data.data[0];
      
      if (job.status === 'completed') return job.result;
      if (job.status === 'failed') throw new Error(job.error);
      
      // 進捗表示（オプション）
      console.log(`進捗: ${job.progress}%`);
      
      waitTime = 5000; // 成功したらリセット
      
    } catch (error) {
      console.error('ポーリングエラー:', error);
      throw error;
    }
  }
};

// 使用例
const startLongTask = async () => {
  // ジョブ開始
  const res = await fetch('/api/long-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: '300秒かかるタスク' })
  });
  const { jobId } = await res.json();
  
  // 結果をポーリング
  const result = await pollJobStatus(jobId);
  console.log('完了:', result);
};
```

---

## 9. トラブルシューティング

### アプリケーションが起動しない

- `package.json` に `start` スクリプトが存在するか確認してください。
- ビルドが正常に完了したか確認してください（`.next` ディレクトリが存在する）。
- アプリが `process.env.PORT` でリッスンしているか確認してください。

### API呼び出しが失敗する

- 組織/プロジェクト/オブジェクトIDが正しいか確認してください。
- API呼び出しには相対パス `/api/custom-objects/...` を使用してください。
- Japan AIアプリケーション経由でページを開いてください（直接URL アクセスには認証が必要です）。

### エージェントチャットが応答しない

- 401エラーを確認 - セッションが期限切れの可能性があります。ページをリフレッシュしてください。
- `messages` 配列が空でなく、有効な形式であることを確認してください。
- タイムアウトエラーの場合、`max_tokens` を減らすか、プロンプトを簡略化してください。
- サービス利用不可エラーの場合、短い遅延後に再試行してください。
- `POST` メソッドと `Content-Type: application/json` ヘッダーを使用しているか確認してください。

### ビルドエラー

- `bun install` または `npm install` を実行して依存関係を更新してください。
- `.next` をクリアして再ビルド: `rm -rf .next && bun run build`
- TypeScriptを使用している場合、TypeScriptエラーを確認してください。

---

## 10. JapanAI 統合API

プラットフォームは、すべてのホストされたページにJavaScript APIを自動的に注入し、JapanAIプラットフォームとの統合を提供します。

### 仕組み

1. **自動注入**: プラットフォームはJapanAI統合スクリプトをページに自動的に注入します。
2. **シームレスな認証**: ユーザーがJapan AI経由でページにアクセスすると、自動的に認証されます。
3. **コンテキスト利用可能**: `window.JapanAI.getContext()` 経由でユーザーと組織のコンテキストが利用可能です。
4. **親との通信**: アプリは `openTask()` を使用してメインのJapanAIプラットフォームにデータを送信できます。
5. **UTF-8セーフ**: 非ASCII値（例: 日本語/絵文字）は完全にサポートされています。

### ユーザーコンテキストへのアクセス

注入されたAPIは、`window.JapanAI.getContext()` を通じてユーザーと組織のコンテキストへのアクセスを提供します。

```jsx
// 現在のユーザーと組織のコンテキストを取得
const context = window.JapanAI.getContext();

console.log(context);
// {
//   userId: "user-abc123-def456",
//   email: "tanaka@example.co.jp",
//   userName: "Tanaka Taro",
//   memberRole: "ADMIN",
//   orgId: "org-xyz789-uvw012",
//   orgName: "Yamada Shoji KK",
//   projectId: "proj-mno345-pqr678",
//   pageId: "page-abc123-xyz789",
//   customObjects: {
//     "customers": "550e8400-e29b-41d4-a716-446655440000",
//     "orders": "660f9500-e29b-41d4-a716-446655440001"
//   }
// }
```

### カスタムオブジェクトマッピングの使用

`customObjects` フィールドは、オブジェクト名（DDLで使用）をオブジェクトID（APIパスで使用）にマッピングします。これにより、リストオブジェクトAPIを呼び出す必要がなくなります。

```jsx
'use client';
import { useEffect, useState } from 'react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const ctx = window.JapanAI?.getContext();
    if (!ctx?.customObjects?.customers) return;

    // コンテキストから直接オブジェクトIDを使用
    const objectId = ctx.customObjects.customers;
    const path = `/api/custom-objects/v1/organizations/${ctx.orgId}/projects/${ctx.projectId}/objects/${objectId}/records`;

    fetch(path)
      .then(res => res.json())
      .then(data => setCustomers(data.data ?? []));
  }, []);

  return<pre>{JSON.stringify(customers, null, 2)}</pre>;
}
```

**注意**: `customObjects` は認証されたセッションに対して自動的に入力されます。プロジェクトにカスタムオブジェクトが存在しない場合、このフィールドは空または存在しません。

### Next.js App Routerの考慮事項

Next.js App Routerを使用する場合、`window.JapanAI` にはクライアントコンポーネントでのみ、かつブラウザガードの後ろでアクセスして、SSR/ハイドレーション警告を避けてください。

```jsx
'use client';
import { useEffect, useState } from 'react';

export default function Page() {
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.JapanAI?.getContext) {
      setCtx(window.JapanAI.getContext());
    }
  }, []);

  if (!ctx) return<div>コンテキストを読み込み中…</div>;
  return<div>組織: {ctx.orgName}</div>;
}
```

### サーバーサイドAPIルートへのコンテキスト渡し

`window.JapanAI` はブラウザ専用なので、クライアントからサーバーにコンテキストを渡す必要があります。

```jsx
// クライアントサイドコンポーネント
'use client';
import { useEffect, useState } from 'react';

export default function MyComponent() {
  const [context, setContext] = useState(null);

  useEffect(() => {
    if (window.JapanAI?.getContext) {
      const ctx = window.JapanAI.getContext();
      setContext(ctx);

      // コンテキストをAPIルートに渡す
      fetch('/api/my-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: ctx.userId,
          orgId: ctx.orgId,
          projectId: ctx.projectId,
          // 必要に応じて他のコンテキストフィールドを渡す
        })
      });
    }
  }, []);

  // ... コンポーネントの残り
}
```

```jsx
// サーバーサイドAPIルート (app/api/my-endpoint/route.js)
export async function POST(request) {
  const body = await request.json();
  const { userId, orgId, projectId } = body;

  // サーバーでコンテキストを使用可能
  console.log('User ID:', userId);
  console.log('Org ID:', orgId);
  console.log('Project ID:', projectId);

  // API呼び出し、認証などにコンテキストを使用
  // ...
}
```

### カスタムオブジェクトでAIタスクを開く

`openTask()` を使用して、アプリからのコンテキストでメインのJapanAIプラットフォームでAIタスクをトリガーします。

### メソッドシグネチャ

```jsx
window.JapanAI.openTask(data, userPrompt)
```

**パラメータ**:
* `data` (Object|Array|null): コンテキストとして提供するカスタムオブジェクトデータまたはオブジェクトの配列
* `userPrompt` (String|optional): AIへのオプションのユーザープロンプト/指示

**少なくとも1つのパラメータを提供する必要があります。**

### 例1: カスタムオブジェクトデータを送信

```jsx
'use client';

export default function ProjectList() {
  const handleAnalyzeProject = (project) => {
    // プロジェクトデータをJapanAIに送信してAI分析
    window.JapanAI.openTask({
      objectName: 'project',
      displayName: project.name,
      fields: {
        id: project.id,
        name: project.name,
        status: project.status,
        budget: project.budget,
        deadline: project.deadline,
        description: project.description
      }
    });
  };

  return (
    <div>
      <button onClick={() => handleAnalyzeProject(currentProject)}>
        AIで分析
      </button>
    </div>
  );
}
```

### 例2: 複数のオブジェクトを送信

```jsx
// バッチ分析のためにオブジェクトの配列を送信
const handleAnalyzeMultiple = (projects) => {
  const projectsData = projects.map(p => ({
    objectName: 'project',
    displayName: p.name,
    fields: {
      id: p.id,
      name: p.name,
      budget: p.budget
    }
  }));

  window.JapanAI.openTask(
    projectsData,
    'これらのプロジェクトを比較して、最適なものを推奨してください'
  );
};
```

### 例3: カスタムプロンプトのみ

```jsx
// データコンテキストなしでプロンプトのみでAIタスクを開く
const handleCustomQuery = () => {
  window.JapanAI.openTask(null, 'プロジェクトのタイムラインを作成するのを手伝ってください');
};
```

### 例4: データとプロンプトの組み合わせ

```jsx
const handleSmartAnalysis = (customer) => {
  window.JapanAI.openTask(
    {
      objectName: 'customer',
      displayName: customer.name,
      fields: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalPurchases: customer.totalPurchases,
        lastPurchaseDate: customer.lastPurchaseDate
      }
    },
    'この顧客を分析して、パーソナライズされたマーケティング戦略を提案してください'
  );
};
```

### カスタムオブジェクトデータ形式

カスタムオブジェクトデータを送信する場合、この構造を使用します。

```jsx
{
  objectName: string,      // タイプ識別子（例: 'project', 'customer', 'task'）
  displayName: string,     // UIに表示される人間が読める名前
  fields: {                // オブジェクトプロパティ
    [key: string]: any     // JSONシリアライズ可能な値
  }
}
```

**例 - 営業リード**:

```jsx
window.JapanAI.openTask({
  objectName: 'sales_lead',
  displayName: 'Suzuki Kigyo KK',
  fields: {
    id: 'lead-001',
    companyName: 'Suzuki Kigyo KK',
    contactPerson: 'Suzuki Hanako',
    email: 'suzuki@example.co.jp',
    phone: '03-1234-5678',
    estimatedValue: 5000000,
    status: 'qualified',
    notes: 'エンタープライズプランに興味あり'
  }
}, '日本語でフォローアップメールの下書きを作成してください');
```

### 統合のベストプラクティス

### 1. API可用性を確認

プラットフォームは、JapanAI APIの準備ができたときに `prs-auth-ready` イベントをディスパッチします。イベントベースまたはポーリングベースのアプローチを使用できます。

```jsx
// オプション1: イベントベース（推奨）
useEffect(() => {
  const handleAuthReady = (event) => {
    const context = event.detail.context;
    console.log('JapanAI APIがコンテキストと共に準備完了:', context);
    // APIを使用
  };

  // すでに準備ができているか確認
  if (window.JapanAI) {
    console.log('JapanAI APIはすでに利用可能です');
    // window.JapanAI.getContext() を直接使用
  }

  // 準備完了イベントをリッスン
  window.addEventListener('prs-auth-ready', handleAuthReady);
  return () => window.removeEventListener('prs-auth-ready', handleAuthReady);
}, []);

// オプション2: ポーリングベース（フォールバック）
useEffect(() => {
  const checkAPI = () => {
    if (window.JapanAI) {
      console.log('JapanAI API準備完了');
      // APIを使用
    } else {
      console.warn('JapanAI APIはまだ利用できません');
      setTimeout(checkAPI, 100); // 再試行
    }
  };

  checkAPI();
}, []);
```

### 2. 送信前にデータを検証

```jsx
const openTaskSafely = (data, prompt) => {
  if (!window.JapanAI) {
    console.error('JapanAI APIが利用できません');
    return;
  }

  // 少なくとも1つのパラメータが提供されていることを確認
  if (!data && !prompt) {
    console.error('dataまたはpromptのいずれかを提供する必要があります');
    return;
  }

  window.JapanAI.openTask(data, prompt);
};
```

### 3. コンテキストの変更を処理

```jsx
// JapanAIコンテキストを取得するReactフック
function useJapanAIContext() {
  const [context, setContext] = useState(null);

  useEffect(() => {
    if (window.JapanAI) {
      setContext(window.JapanAI.getContext());
    }
  }, []);

  return context;
}

// 使用法
function MyComponent() {
  const context = useJapanAIContext();

  // パーソナライゼーションにコンテキストを使用
  const greeting = context
    ? `こんにちは、${context.userName}さん！`
    : 'こんにちは！';

  return<h1>{greeting}</h1>;
}
```

### ナビゲーション用のパス構築

アプリは `/app/{org}/{project}/{pageId}` でホストされているため、ナビゲーション用にパスを動的に構築する必要があります。`window.JapanAI.getContext()` を使用して完全なベースパスを構築します。

<aside>
💡

ナビゲーション用のパスの使い方の例や詳細な解説は、以下のページをご確認ください。

[`同一ページ内での内部リンク・別ページ指定箇所へのURLリンクを生成する方法（2026-03-02現在）`](https://www.notion.so/URL-2026-03-02-3171d5dbe534801f8433c101673cadae?pvs=21)

</aside>

### ナビゲーションヘルパーの作成

```jsx
// lib/navigation.js
export function getBasePath() {
  if (typeof window === 'undefined') return '';
  const ctx = window.JapanAI?.getContext();
  if (!ctx) return '';
  return `/app/${ctx.orgId}/${ctx.projectId}/${ctx.pageId}`;
}

export function buildPath(path) {
  const base = getBasePath();
  // '/path' と 'path' の両方の形式を処理
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/${cleanPath}`;
}
```

### Next.js Routerでの使用

```jsx
'use client';
import { useRouter } from 'next/navigation';
import { buildPath } from '@/lib/navigation';

export default function MyComponent() {
  const router = useRouter();

  const handleNavigate = () => {
    // router.push('/dashboard') の代わりに
    router.push(buildPath('dashboard'));
  };

  return<button onClick={handleNavigate}>ダッシュボードへ</button>;
}
```

### Linkコンポーネントでの使用

```jsx
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buildPath } from '@/lib/navigation';

export default function Navigation() {
  const [paths, setPaths] = useState({ dashboard: '#', settings: '#' });

  useEffect(() => {
    setPaths({
      dashboard: buildPath('dashboard'),
      settings: buildPath('settings'),
    });
  }, []);

  return (
    <nav>
      <Link href={paths.dashboard}>ダッシュボード</Link>
      <Link href={paths.settings}>設定</Link>
    </nav>
  );
}
```

> 重要: window.JapanAIが利用可能になった後、常にクライアントサイドでパスを構築してください。サーバーサイドレンダリングはページコンテキストにアクセスできません。
> 

### セキュリティとプライバシー

- **安全な認証**: すべてのリクエストはサーバーサイドで認証および検証されます。
- **セッション管理**: 自動期限切れを伴う安全なセッション処理。
- **テナント分離**: ユーザーは自分の組織内のデータにのみアクセスできます。

---

## 11. サポート

追加のヘルプについては、Japan AIサポートチームにお問い合わせください。