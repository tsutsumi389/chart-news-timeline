# Chart News Timeline

株価チャート（ローソク足）とニュース情報を統合表示するWEBアプリケーション

## プロジェクト概要

このプロジェクトは、株価のローソク足チャートにニュース情報を重ねて表示することで、ニュースが株価に与えた影響を視覚的に分析できるWEBアプリケーションです。

## 目的

株価チャートとニュースを統合表示することで、以下のメリットを実現します：

- ニュース発表が株価に与えた影響の可視化
- 時系列でのニュースと株価変動の相関関係の把握
- より直感的な市場分析の実現

## 主な機能

### 1. データインポート機能
- 株価データのインポート（CSV、JSON等）
- ニュースデータのインポート（CSV、JSON等）
- データの検証とエラーハンドリング

### 2. データ保存
- データベースへの永続化
- 株価データとニュースデータの関連付け

### 3. チャート表示
- ローソク足チャートの描画
- ニュース情報のタイムラインマーカー表示
- インタラクティブな操作（ズーム、パン等）

## 技術スタック

### フロントエンド
- **フレームワーク**: React + TypeScript
- **チャートライブラリ**: Apache ECharts
- **ビルドツール**: Vite
- **状態管理**: React Hooks
- **開発環境**: Docker + Docker Compose (Node.js 24)

#### 選定理由
- **Apache ECharts**: 吹き出し機能（tooltip）が標準装備で、ニュースマーカー表示が容易
- **React + TypeScript**: 型安全性とコンポーネント再利用性
- **Vite**: 高速な開発サーバーとビルド

### バックエンド
- **ランタイム**: Node.js 24 (Alpine)
- **言語**: TypeScript
- **開発環境**: Docker + Docker Compose
- **データベースクライアント**: node-postgres (pg)

### データベース
- **RDBMS**: PostgreSQL 16 (Alpine)
- **データ永続化**: Docker Volume

## 開発環境

### 必要なツール
- Docker Desktop
- Docker Compose V2

### セットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd chart-news-timeline

# 全コンテナをビルド
docker compose build

# 全コンテナを起動（Watch モード）
docker compose up --watch
```

### アクセスURL

- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:3000
- **PostgreSQL**: localhost:5432

### Docker構成

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
└─────────────────────────────────────────────────┘
```

### よく使うコマンド

```bash
# ログ確認
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# コンテナ状態確認
docker compose ps

# コンテナ停止
docker compose down

# データベース含めて完全削除
docker compose down -v

# バックエンドコンテナのシェルに入る
docker compose exec backend sh

# データベースに接続
docker compose exec db psql -U chartuser -d chartdb
```

## プロジェクト構造

```
chart-news-timeline/
├── frontend/                       # フロントエンド (React + Vite)
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── backend/                        # バックエンド (Node.js + TypeScript)
│   ├── src/
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── compose.yml                     # Docker Compose設定
├── docs/                           # ドキュメント
│   ├── frontend-implementation-plan.md
│   └── backend-docker-setup-plan.md
└── README.md
```

## 開発ステータス

- ✅ フロントエンド環境構築完了
- ✅ バックエンド環境構築完了
- ✅ データベース環境構築完了
- ✅ Docker Compose統合完了
- ⬜ Prisma ORM セットアップ（予定）
- ⬜ APIエンドポイント実装（予定）
- ⬜ フロントエンド・バックエンド統合（予定）

## ライセンス

（未定）
