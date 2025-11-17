# バックエンド環境構築計画 - Docker コンテナセットアップ

## 概要

このドキュメントでは、Chart News Timelineプロジェクトのバックエンド・データベースコンテナの構築手順を定義します。Node.js + PostgreSQLのDocker環境を構築し、基本的な動作確認を行います。

---

## 目標

1. バックエンドコンテナ（Node.js 24）の作成
2. データベースコンテナ（PostgreSQL 16）の作成
3. Docker Composeによる統合管理
4. コンテナ間の接続確認

---

## 技術スタック

### バックエンドコンテナ
- **ランタイム**: Node.js 24 (Alpine)
- **言語**: TypeScript
- **開発環境**: Docker + Docker Compose

### データベースコンテナ
- **RDBMS**: PostgreSQL 16 (Alpine)
- **データ永続化**: Docker Volume

---

## ディレクトリ構造

```
chart-news-timeline/
├── frontend/                       # フロントエンド (既存)
├── backend/                        # バックエンド (新規作成)
│   ├── src/                        # ソースコード
│   │   └── index.ts                # エントリーポイント（仮）
│   ├── package.json                # Node.js パッケージ設定
│   ├── tsconfig.json               # TypeScript設定
│   ├── Dockerfile                  # Dockerイメージ定義
│   ├── .dockerignore               # Docker除外ファイル
│   └── .env.example                # 環境変数サンプル
├── compose.yml                     # Docker Compose設定 (更新)
└── docs/
    └── backend-docker-setup-plan.md  # このファイル
```

---

## Docker構成

### 全体構成図

```
┌─────────────────────────────────────────────────┐
│              Docker Compose                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐    ┌──────────────────┐ │
│  │   frontend       │    │   backend        │ │
│  │  (React+Vite)    │◄───┤  (Node.js 24)    │ │
│  │  Port: 5173      │    │  Port: 3000      │ │
│  └──────────────────┘    └────────┬─────────┘ │
│                                   │            │
│                          ┌────────▼─────────┐ │
│                          │   db             │ │
│                          │  (PostgreSQL 16) │ │
│                          │  Port: 5432      │ │
│                          └──────────────────┘ │
│                                   │            │
│                          ┌────────▼─────────┐ │
│                          │   pgdata         │ │
│                          │  (Volume)        │ │
│                          └──────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 実装ファイル

### 1. backend/package.json

```json
{
  "name": "chart-news-backend",
  "version": "1.0.0",
  "description": "Chart News Timeline Backend API",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "pg": "^8.13.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "@types/pg": "^8.11.10",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

### 2. backend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. backend/src/index.ts

```typescript
/**
 * バックエンドエントリーポイント（仮実装）
 * データベース接続テスト用
 */

import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://chartuser:chartpass@db:5432/chartdb';

async function main() {
  console.log('🚀 Backend starting...');
  console.log(`📊 Database URL: ${DATABASE_URL}`);

  // PostgreSQL接続テスト
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Database connected successfully!');

    // バージョン確認
    const result = await client.query('SELECT version()');
    console.log('📦 PostgreSQL version:', result.rows[0].version);

    await client.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  console.log('✨ Backend is ready!');
}

main();
```

### 4. backend/Dockerfile

```dockerfile
FROM node:24-alpine

WORKDIR /app

# OpenSSL をインストール（将来のPrisma用）
RUN apk add --no-cache openssl

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# アプリケーションコードをコピー
COPY . .

# ポート公開
EXPOSE 3000

# 開発サーバー起動
CMD ["npm", "run", "dev"]
```

### 5. backend/.dockerignore

```
node_modules
dist
.git
.gitignore
.env
npm-debug.log
*.md
.vscode
.idea
```

### 6. backend/.env.example

```bash
# データベース設定
DATABASE_URL=postgresql://chartuser:chartpass@db:5432/chartdb

# アプリケーション設定
NODE_ENV=development
PORT=3000
```

### 7. compose.yml (更新版)

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: chart-news-frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:3000
    stdin_open: true
    tty: true
    develop:
      watch:
        - action: sync
          path: ./frontend/src
          target: /app/src
        - action: rebuild
          path: ./frontend/package.json
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: chart-news-backend
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://chartuser:chartpass@db:5432/chartdb
      - PORT=3000
    stdin_open: true
    tty: true
    develop:
      watch:
        - action: sync
          path: ./backend/src
          target: /app/src
        - action: rebuild
          path: ./backend/package.json
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    container_name: chart-news-db
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=chartdb
      - POSTGRES_USER=chartuser
      - POSTGRES_PASSWORD=chartpass
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U chartuser -d chartdb"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
    driver: local
```

---

## 実装手順

### Step 1: バックエンドディレクトリ作成

```bash
# プロジェクトルートで実行
mkdir -p backend/src
```

### Step 2: バックエンドファイル作成

以下のファイルを作成：
- [x] `backend/package.json`
- [x] `backend/tsconfig.json`
- [x] `backend/src/index.ts`
- [x] `backend/Dockerfile`
- [x] `backend/.dockerignore`
- [x] `backend/.env.example`

### Step 3: compose.yml を更新

- [ ] `compose.yml` にbackendとdbサービスを追加
- [ ] volumeの設定を追加

### Step 4: Docker コンテナのビルドと起動

```bash
# 全コンテナをビルド
docker compose build

# 全コンテナを起動（Watch モード）
docker compose up --watch
```

### Step 5: 動作確認

#### データベース接続確認

```bash
# バックエンドログを確認（DB接続成功メッセージ）
docker compose logs backend

# 期待される出力:
# 🚀 Backend starting...
# 📊 Database URL: postgresql://chartuser:chartpass@db:5432/chartdb
# ✅ Database connected successfully!
# 📦 PostgreSQL version: PostgreSQL 16.x ...
# ✨ Backend is ready!
```

#### PostgreSQLコンテナに直接接続

```bash
# PostgreSQLコンテナに接続
docker compose exec db psql -U chartuser -d chartdb

# PostgreSQLコマンド例
chartdb=# \l          # データベース一覧
chartdb=# \q          # 終了
```

#### ヘルスチェック確認

```bash
# データベースのヘルスチェック
docker compose exec db pg_isready -U chartuser -d chartdb

# 期待される出力:
# /var/run/postgresql:5432 - accepting connections
```

#### コンテナ一覧確認

```bash
docker compose ps

# 期待される出力:
# NAME                   STATUS          PORTS
# chart-news-frontend    Up              0.0.0.0:5173->5173/tcp
# chart-news-backend     Up              0.0.0.0:3000->3000/tcp
# chart-news-db          Up (healthy)    0.0.0.0:5432->5432/tcp
```

---

## Docker コマンドリファレンス

### 基本操作

```bash
# 全サービス起動（Watch モード）
docker compose up --watch

# バックグラウンドで起動
docker compose up -d

# 特定サービスのみ起動
docker compose up backend db

# ログ確認
docker compose logs -f backend
docker compose logs -f db

# コンテナ停止
docker compose down

# データベース含めて完全削除
docker compose down -v
```

### コンテナ内でコマンド実行

```bash
# バックエンドコンテナでコマンド実行
docker compose exec backend npm install <package-name>

# データベースコンテナに接続
docker compose exec db psql -U chartuser -d chartdb

# バックエンドコンテナのシェルに入る
docker compose exec backend sh
```

### トラブルシューティング

```bash
# コンテナ再起動
docker compose restart backend
docker compose restart db

# コンテナ再ビルド（キャッシュなし）
docker compose build --no-cache backend

# ボリュームの確認
docker volume ls
docker volume inspect chart-news-timeline_pgdata

# ネットワークの確認
docker network ls
docker network inspect chart-news-timeline_default
```

---

## 環境変数設定

### backend/.env (作成方法)

```bash
# .env.example をコピーして .env を作成
cd backend
cp .env.example .env

# 必要に応じて編集
# vi .env
```

**注意**: `.env` ファイルは `.gitignore` に追加してコミットしないこと

---

## トラブルシューティング

### 1. PostgreSQL接続エラー

**症状**: `Database connection failed`

**原因**:
- データベースコンテナが起動していない
- データベース認証情報が間違っている
- ヘルスチェックが通っていない

**対処法**:
```bash
# データベースステータス確認
docker compose ps db

# ログ確認
docker compose logs db

# ヘルスチェック確認
docker compose exec db pg_isready -U chartuser -d chartdb

# コンテナ再起動
docker compose restart db
```

### 2. ポート競合エラー

**症状**: `port is already allocated`

**対処法**:
```bash
# ポート使用状況確認
lsof -i :3000
lsof -i :5432

# プロセス終了
kill -9 <PID>

# または compose.yml でポート番号を変更
```

### 3. ボリュームパーミッションエラー

**対処法**:
```bash
# ボリュームを削除して再作成
docker compose down -v
docker compose up --watch
```

### 4. 依存関係インストールエラー

**対処法**:
```bash
# node_modules を削除して再インストール
docker compose exec backend rm -rf node_modules
docker compose exec backend npm install

# またはコンテナ再ビルド
docker compose build --no-cache backend
```

---

## 次のステップ（このドキュメントの範囲外）

コンテナ環境が正常に動作したら、次のフェーズに進みます：

1. **Prismaのセットアップ**
   - Prismaスキーマ定義
   - マイグレーション実行
   - Prismaクライアント生成

2. **Fastifyサーバーの実装**
   - ルーティング設定
   - APIエンドポイント実装

3. **フロントエンド統合**
   - API接続
   - データ取得・表示

---

## チェックリスト

環境構築完了の確認項目：

- [x] `backend/` ディレクトリが作成されている
- [x] `backend/package.json` が作成されている
- [x] `backend/Dockerfile` が作成されている
- [ ] `compose.yml` にbackendとdbサービスが追加されている
- [ ] `docker compose up --watch` でコンテナが起動する
- [ ] バックエンドログに「✅ Database connected successfully!」が表示される
- [ ] `docker compose ps` で全コンテナが「Up」状態
- [ ] `docker compose exec db psql -U chartuser -d chartdb` で接続できる
- [ ] PostgreSQLのバージョン情報が表示される

---

**作成日**: 2025-11-01
**最終更新**: 2025-11-01
**ステータス**: 実装待ち
**想定実装時間**: 30-60分
