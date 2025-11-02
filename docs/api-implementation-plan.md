# API実装計画 - バックエンドAPI設計

## 概要

このドキュメントでは、Chart News TimelineアプリケーションのバックエンドAPI実装計画を定義します。現在フロントエンドで使用しているサンプルデータをデータベースから取得できるようにするRESTful APIを構築します。

フロントエンドでは統合データAPI（チャート表示用）のみを使用します。

---

## 目標

1. 株価データとニュースデータを統合して取得するAPIの実装
2. Prismaを使用したデータベースアクセス層の構築
3. Fastifyを使用したRESTful APIサーバーの構築

---

## 技術スタック

### バックエンドフレームワーク
- **Webフレームワーク**: Fastify 5.x（高速・軽量なNode.jsフレームワーク）
- **ORM**: Prisma（型安全なデータベースアクセス）
- **バリデーション**: Zod（TypeScript型安全なスキーマバリデーション）
- **言語**: TypeScript

### データベース
- **RDBMS**: PostgreSQL 16
- **接続**: Prisma Client

---

## APIエンドポイント設計

### 基本情報

- **ベースURL**: `http://localhost:3000/api/v1`
- **レスポンス形式**: JSON
- **文字コード**: UTF-8

---

## 統合データAPI（フロントエンド用）

### チャート表示用データ取得

**エンドポイント**: `GET /api/v1/stocks/:stockCode/chart-data`

**説明**: 株価データとニュースデータを統合して取得（フロントエンドのチャート表示用）

**パスパラメータ**:
- `stockCode` (string, required): 証券コード（4桁）

**クエリパラメータ**:
- `startDate` (string, optional): 開始日（YYYY-MM-DD形式）
- `endDate` (string, optional): 終了日（YYYY-MM-DD形式）
- `includeNews` (boolean, optional): ニュースデータを含めるか（デフォルト: true）

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "stock": {
      "stockCode": "7203",
      "stockName": "トヨタ自動車"
    },
    "prices": [
      {
        "date": "2024-01-15",
        "open": 150.50,
        "close": 152.30,
        "low": 149.80,
        "high": 153.00
      },
      {
        "date": "2024-01-16",
        "open": 152.30,
        "close": 151.00,
        "low": 150.50,
        "high": 153.50
      }
    ],
    "news": [
      {
        "id": "1",
        "date": "2024-01-15",
        "time": "09:30:00",
        "title": "新製品発表で株価上昇",
        "summary": "当社は革新的な新製品を発表しました。",
        "sentiment": "positive",
        "source": "日経新聞",
        "url": "https://example.com/news/001"
      }
    ]
  }
}
```

**ステータスコード**:
- `200 OK`: 正常取得
- `400 Bad Request`: パラメータ不正
- `404 Not Found`: 株が見つからない
- `500 Internal Server Error`: サーバーエラー

---

## エラーレスポンス形式

全エンドポイント共通のエラーレスポンス形式:

```json
{
  "success": false,
  "error": {
    "code": "STOCK_NOT_FOUND",
    "message": "指定された証券コードの株が見つかりません",
    "details": {
      "stockCode": "9999"
    }
  }
}
```

### エラーコード一覧

| エラーコード | HTTPステータス | 説明 |
|------------|--------------|------|
| `VALIDATION_ERROR` | 400 | リクエストパラメータのバリデーションエラー |
| `STOCK_NOT_FOUND` | 404 | 株が見つからない |
| `NEWS_NOT_FOUND` | 404 | ニュースが見つからない |
| `PRICE_DATA_NOT_FOUND` | 404 | 株価データが見つからない |
| `INVALID_DATE_RANGE` | 400 | 日付範囲が不正 |
| `DATABASE_ERROR` | 500 | データベースエラー |
| `INTERNAL_SERVER_ERROR` | 500 | その他のサーバーエラー |

---

## ディレクトリ構造

```
backend/
├── prisma/
│   ├── schema.prisma                    # Prismaスキーマ（既存）
│   ├── migrations/                      # マイグレーションファイル
│   └── seed.ts                          # シードデータ（新規作成）
├── src/
│   ├── index.ts                         # エントリーポイント
│   ├── server.ts                        # Fastifyサーバー設定（新規）
│   ├── config/
│   │   └── database.ts                  # データベース設定（新規）
│   ├── routes/
│   │   ├── chartData.ts                 # チャートデータルート（新規）
│   │   └── index.ts                     # ルート統合（新規）
│   ├── controllers/
│   │   └── chartDataController.ts       # チャートデータコントローラー（新規）
│   ├── services/
│   │   └── chartDataService.ts          # チャートデータビジネスロジック（新規）
│   ├── repositories/
│   │   ├── stockRepository.ts           # 株マスタデータアクセス（新規）
│   │   ├── priceRepository.ts           # 株価データアクセス（新規）
│   │   └── newsRepository.ts            # ニュースデータアクセス（新規）
│   ├── schemas/
│   │   └── chartDataSchemas.ts          # チャートデータバリデーション（新規）
│   ├── types/
│   │   ├── api.ts                       # API型定義（新規）
│   │   └── responses.ts                 # レスポンス型定義（新規）
│   └── utils/
│       ├── errorHandler.ts              # エラーハンドリング（新規）
│       └── logger.ts                    # ロガー設定（新規）
├── package.json                         # 依存関係更新
├── tsconfig.json
└── Dockerfile
```

---

## 実装アーキテクチャ

### レイヤー構造

```
Routes (ルート定義)
  ↓
Controllers (リクエスト処理・バリデーション)
  ↓
Services (ビジネスロジック)
  ↓
Repositories (データアクセス)
  ↓
Prisma Client (ORM)
  ↓
PostgreSQL Database
```

### 各レイヤーの責務

1. **Routes**: エンドポイント定義、HTTPメソッド、パス
2. **Controllers**: リクエスト受付、バリデーション、レスポンス返却
3. **Services**: ビジネスロジック、複数リポジトリの調整
4. **Repositories**: データベースアクセス、Prismaクエリ実行
5. **Schemas**: Zodを使用したリクエスト・レスポンスのバリデーション

---

## 依存関係追加

### package.json に追加する依存関係

```json
{
  "dependencies": {
    "@fastify/cors": "^10.0.1",
    "@prisma/client": "^6.5.0",
    "fastify": "^5.3.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "prisma": "^6.5.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

---

## シードデータ作成

### prisma/seed.ts

フロントエンドの `sampleData.ts` と `sampleNewsData.ts` をデータベースに登録するシードスクリプトを作成します。

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 データベースにシードデータを投入中...');

  // 株マスタ作成
  const stock = await prisma.stock.create({
    data: {
      stockCode: '7203',
      stockName: 'トヨタ自動車',
    },
  });

  console.log(`✅ 株マスタ作成: ${stock.stockName} (${stock.stockCode})`);

  // 株価データ作成（sampleData.tsの内容）
  const priceData = [
    { tradeDate: new Date('2024-01-15'), openPrice: 150.5, closePrice: 152.3, lowPrice: 149.8, highPrice: 153.0, volume: 15000000 },
    { tradeDate: new Date('2024-01-16'), openPrice: 152.3, closePrice: 151.0, lowPrice: 150.5, highPrice: 153.5, volume: 14500000 },
    // ... 他のデータ
  ];

  await prisma.stockPrice.createMany({
    data: priceData.map(price => ({
      stockId: stock.stockId,
      ...price,
    })),
  });

  console.log(`✅ 株価データ作成: ${priceData.length}件`);

  // ニュースデータ作成（sampleNewsData.tsの内容）
  const newsData = [
    {
      publishedAt: new Date('2024-01-15T09:30:00'),
      title: '新製品発表で株価上昇',
      summary: '当社は革新的な新製品を発表しました。市場からの評価は非常に高く、投資家の期待が高まっています。',
      sentiment: 'positive' as const,
      source: '日経新聞',
      url: 'https://example.com/news/001',
    },
    // ... 他のニュース
  ];

  await prisma.news.createMany({
    data: newsData.map(news => ({
      stockId: stock.stockId,
      ...news,
    })),
  });

  console.log(`✅ ニュースデータ作成: ${newsData.length}件`);
  console.log('🎉 シードデータ投入完了!');
}

main()
  .catch((e) => {
    console.error('❌ シードデータ投入エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### package.json にシードコマンド追加

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "scripts": {
    "db:seed": "prisma db seed"
  }
}
```

---

## 実装手順

### Phase 1: 環境セットアップ

- [ ] Prismaマイグレーション実行
- [ ] シードスクリプト作成
- [ ] シードデータ投入
- [ ] Fastify、Zod等の依存関係インストール

### Phase 2: 基盤実装

- [ ] Fastifyサーバー設定 (`src/server.ts`)
- [ ] データベース設定 (`src/config/database.ts`)
- [ ] エラーハンドリング (`src/utils/errorHandler.ts`)
- [ ] ロガー設定 (`src/utils/logger.ts`)
- [ ] レスポンス型定義 (`src/types/`)

### Phase 3: リポジトリ実装

- [ ] 株マスタリポジトリ実装 (`src/repositories/stockRepository.ts`)
- [ ] 株価リポジトリ実装 (`src/repositories/priceRepository.ts`)
- [ ] ニュースリポジトリ実装 (`src/repositories/newsRepository.ts`)

### Phase 4: チャートデータAPI実装

- [ ] スキーマ定義 (`src/schemas/chartDataSchemas.ts`)
- [ ] サービス実装 (`src/services/chartDataService.ts`)
- [ ] コントローラー実装 (`src/controllers/chartDataController.ts`)
- [ ] ルート定義 (`src/routes/chartData.ts`)
- [ ] ルート統合 (`src/routes/index.ts`)

### Phase 5: 統合とテスト

- [ ] エントリーポイント更新 (`src/index.ts`)
- [ ] APIエンドポイントの動作確認（curl / Postman）
- [ ] エラーハンドリングの確認

### Phase 6: フロントエンド統合

- [ ] フロントエンドにAPI呼び出しロジック追加
- [ ] サンプルデータからAPI取得に切り替え
- [ ] 環境変数設定（API URL）
- [ ] エラーハンドリング実装
- [ ] ローディング状態の実装

---

## API動作確認コマンド例

### チャート表示用データ取得
```bash
curl "http://localhost:3000/api/v1/stocks/7203/chart-data?startDate=2024-01-15&endDate=2024-02-23"
```

### includeNewsパラメータを指定
```bash
curl "http://localhost:3000/api/v1/stocks/7203/chart-data?startDate=2024-01-15&endDate=2024-02-23&includeNews=true"
```

---

## セキュリティ考慮事項

### 実装時の注意点

1. **CORS設定**: フロントエンドからのアクセスを許可
2. **SQLインジェクション対策**: Prismaを使用（自動エスケープ）
3. **入力バリデーション**: Zodを使用して全入力を検証
4. **エラー情報の露出**: 本番環境ではスタックトレースを隠す
5. **レートリミット**: 将来的に実装（fastify-rate-limit）

---

## パフォーマンス最適化

### データベースクエリ最適化

1. **インデックス活用**: Prismaスキーマで定義済み
2. **N+1問題回避**: Prismaの `include` / `select` を適切に使用
3. **ページネーション**: ニュース一覧等で実装
4. **日付範囲制限**: デフォルトで取得範囲を制限

---

## 今後の拡張案

### Phase 8以降で検討

1. **認証・認可**: JWT認証の実装
2. **データ登録API**: 株価・ニュースの登録・更新・削除
3. **CSVインポート**: ファイルアップロードによる一括登録
4. **リアルタイム更新**: WebSocketによる株価配信
5. **集計API**: 統計情報、チャート分析データ
6. **キャッシング**: Redisによるレスポンスキャッシュ
7. **API ドキュメント**: Swagger / OpenAPI統合

---

## 参考リンク

- [Fastify 公式ドキュメント](https://fastify.dev/)
- [Prisma 公式ドキュメント](https://www.prisma.io/docs)
- [Zod 公式ドキュメント](https://zod.dev/)
- [RESTful API設計ベストプラクティス](https://restfulapi.net/)

---

**作成日**: 2025-11-02
**最終更新**: 2025-11-02
**ステータス**: 設計完了・実装待ち
**想定実装時間**: 4-6時間
