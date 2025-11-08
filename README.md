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

### 1. 銘柄管理
- 銘柄の新規登録
- 銘柄一覧表示・検索（銘柄コード・名前）
- 銘柄詳細情報の取得

### 2. 株価データインポート
- CSVファイルのアップロード
- データ形式のバリデーション
- 重複検出と処理（スキップ/上書き選択可能）
- インポート結果のプレビュー表示
- データベースへの永続化

### 3. ニュースデータインポート
- CSVファイルのアップロード
- 日付範囲フィルタリング
- センチメント分類（positive/negative/neutral）
- 重複検出と処理（スキップ/上書き選択可能）
- インポート結果のプレビュー表示
- データベースへの永続化

### 4. チャート表示
- ローソク足チャートの描画（Apache ECharts）
- 銘柄選択による株価データ表示
- インタラクティブな操作（ズーム、パン等）
- ニュース情報のタイムラインマーカー表示（実装済み）

## 技術スタック

### フロントエンド
- **フレームワーク**: React + TypeScript
- **ルーティング**: React Router v6
- **チャートライブラリ**: Apache ECharts
- **ビルドツール**: Vite
- **状態管理**: React Hooks（カスタムフック活用）
- **スタイリング**: CSS Modules
- **開発環境**: Docker + Docker Compose (Node.js 24)

#### 主な実装コンポーネント
- **Pages**: StocksPage, StockChartPage, StockNewPage, StockPriceImport, NewsImportPage
- **Components**: StockChart, StockList, StockForm, CsvUploader, ImportProgress, ImportResult
- **Custom Hooks**: useStockImport, useNewsImport

#### 選定理由
- **Apache ECharts**: 吹き出し機能（tooltip）が標準装備で、ニュースマーカー表示が容易
- **React + TypeScript**: 型安全性とコンポーネント再利用性
- **Vite**: 高速な開発サーバーとビルド

### バックエンド
- **ランタイム**: Node.js 24 (Alpine)
- **言語**: TypeScript
- **フレームワーク**: Fastify
- **ORM**: Prisma Client
- **バリデーション**: Zod
- **テスト**: Vitest（ユニットテスト + E2Eテスト）
- **開発環境**: Docker + Docker Compose

#### 主な実装機能
- **Routes**: stocks, stockImport, newsImport（RESTful API）
- **Services**: stockService, stockPriceService, stockImportService, newsImportService
- **CSV Parser**: csvParserService, newsCsvParserService
- **Utils**: errorHandler, logger

### データベース
- **RDBMS**: PostgreSQL 16 (Alpine)
- **スキーマ管理**: Prisma
- **データ永続化**: Docker Volume
- **モデル**:
  - Stock（株マスタ）- 銘柄コード、銘柄名
  - StockPrice（株価OHLC）- 日付、始値、高値、安値、終値、出来高
  - News（ニュース）- 発行日時、タイトル、センチメント、URL
- **リレーション**: Stock 1:N StockPrice, Stock 1:N News

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

# データベースマイグレーション実行
docker compose run --rm backend npx prisma migrate deploy

# サンプルデータ投入（オプション）
docker compose run --rm backend npm run db:seed

# 全コンテナを起動（Watch モード）
docker compose up --watch
```

### アクセスURL

起動後、以下のURLでアクセスできます：

- **フロントエンド**: http://localhost:5173
  - `/` - 銘柄一覧
  - `/stocks/new` - 銘柄新規登録
  - `/stocks/:stockCode/chart` - チャート表示
  - `/stocks/import` - 株価データインポート
  - `/news/import` - ニュースデータインポート
- **バックエンドAPI**: http://localhost:3000
  - `/api/stocks` - 銘柄API
  - `/api/stock-import` - 株価インポートAPI
  - `/api/news-import` - ニュースインポートAPI
- **PostgreSQL**: localhost:5432

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

# Prismaコマンド（バックエンドコンテナ内で実行）
docker compose exec backend npx prisma migrate dev    # マイグレーション作成・適用
docker compose exec backend npx prisma studio         # Prisma Studio起動
docker compose exec backend npx prisma generate       # Prismaクライアント生成
docker compose exec backend npm run db:seed           # サンプルデータ投入

# テスト実行（バックエンドコンテナ内で実行）
docker compose exec backend npm test                  # テスト実行
docker compose exec backend npm run test:watch        # テストウォッチモード
docker compose exec backend npm run test:coverage     # カバレッジレポート生成
```
