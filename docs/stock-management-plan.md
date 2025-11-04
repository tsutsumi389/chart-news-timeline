# 株一覧・株登録画面実装計画

## 概要

このドキュメントでは、株マスタの一覧表示と新規登録機能の実装計画を定義します。ユーザーが株銘柄を管理できるUI画面と、バックエンドAPIの両方を構築します。

**現在のステータス**: 設計段階

---

## 目標

1. 株一覧画面の実装（登録済み銘柄の一覧表示）
2. 株登録画面の実装（新規銘柄の登録フォーム）
3. 株一覧・登録用のバックエンドAPIの実装
4. バリデーション・エラーハンドリングの実装

---

## 機能要件

### 株一覧画面

**画面パス**: `/stocks`

**機能**:
- 登録済み株銘柄の一覧表示（テーブル形式）
- 各銘柄の基本情報表示（銘柄コード、銘柄名、登録日時）
- 検索機能（銘柄コード・銘柄名で絞り込み、リアルタイム検索）
- 新規登録ボタン（株登録画面へ遷移）
- チャート表示ボタン（各銘柄のチャート画面へ遷移）
- ローディング状態の表示
- エラーハンドリング

**検索機能**:
- テキストボックス1つで銘柄コードと銘柄名を同時検索
- 部分一致検索（例: 「トヨタ」で「トヨタ自動車」がヒット）
- リアルタイム検索（入力と同時にフィルタリング）
- 大文字小文字を区別しない
- フロントエンド側でフィルタリング処理を実行

**表示項目**:
| 列名 | 内容 | 備考 |
|-----|------|------|
| 銘柄コード | 英数字4桁の証券コード | 例: 7203、AAPL |
| 銘柄名 | 銘柄の名称 | 例: トヨタ自動車、Apple Inc. |
| 登録日時 | 作成日時 | YYYY-MM-DD HH:mm:ss 形式 |
| アクション | チャート表示ボタン | クリックでチャート画面へ遷移 |

### 株登録画面

**画面パス**: `/stocks/new`

**機能**:
- 銘柄コード入力（英数字4桁）
- 銘柄名入力（100文字以内）
- 登録ボタン
- キャンセルボタン（株一覧画面へ戻る）
- バリデーション
- 成功・エラーメッセージ表示

**入力項目**:
| 項目 | 必須 | 型 | バリデーション |
|-----|------|-----|---------------|
| 銘柄コード | ✅ | string | 英数字4桁、重複不可 |
| 銘柄名 | ✅ | string | 1〜100文字 |

**バリデーションルール**:
- 銘柄コード:
  - 必須入力
  - 英数字4桁（例: 7203、AAPL）
  - 大文字・小文字可（データベース保存時は大文字に統一）
  - 重複チェック（既存の銘柄コードと重複不可）
- 銘柄名:
  - 必須入力
  - 1文字以上100文字以内
  - 前後の空白はトリム

---

## UIデザイン

### 株一覧画面レイアウト

```
┌─────────────────────────────────────────────────────┐
│  株一覧                           [+ 新規登録]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  検索: ┌────────────────────────────────┐ 🔍       │
│       │ 銘柄コードまたは銘柄名          │            │
│       └────────────────────────────────┘            │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ 銘柄コード │ 銘柄名        │ 登録日時     │ アクション │ │
│  ├───────────────────────────────────────────────┤  │
│  │ 7203     │ トヨタ自動車   │ 2024-01-15  │ [チャート] │ │
│  │ 9984     │ ソフトバンクG  │ 2024-01-16  │ [チャート] │ │
│  │ 6758     │ ソニーG       │ 2024-01-17  │ [チャート] │ │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  表示: 3件 / 全3件                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 株登録画面レイアウト

```
┌─────────────────────────────────────────────────────┐
│  株の新規登録                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  銘柄コード *                                       │
│  ┌─────────────────────────────────────┐            │
│  │ 7203 または AAPL                  │            │
│  └─────────────────────────────────────┘            │
│  英数字4桁の証券コードを入力してください              │
│                                                     │
│  銘柄名 *                                           │
│  ┌─────────────────────────────────────┐            │
│  │ トヨタ自動車                        │            │
│  └─────────────────────────────────────┘            │
│  銘柄名を入力してください（100文字以内）              │
│                                                     │
│  [キャンセル]  [登録]                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## カラースキーム

- **プライマリカラー**: #26A69A（緑）- 登録ボタン、チャートボタン
- **セカンダリカラー**: #EF5350（赤）- エラーメッセージ
- **グレー**: #9E9E9E - キャンセルボタン
- **背景色**: #FAFAFA
- **テーブルヘッダー**: #E0E0E0

---

## APIエンドポイント設計

### ベースURL

`http://localhost:3000/api/v1`

### 1. 株一覧取得API

**エンドポイント**: `GET /api/v1/stocks`

**説明**: 登録済み株銘柄の一覧を取得

**クエリパラメータ**: なし（将来的にページネーション対応）

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "stocks": [
      {
        "stockId": 1,
        "stockCode": "7203",
        "stockName": "トヨタ自動車",
        "createdAt": "2024-01-15T12:34:56.789Z",
        "updatedAt": "2024-01-15T12:34:56.789Z"
      },
      {
        "stockId": 2,
        "stockCode": "9984",
        "stockName": "ソフトバンクグループ",
        "createdAt": "2024-01-16T09:12:34.567Z",
        "updatedAt": "2024-01-16T09:12:34.567Z"
      }
    ],
    "total": 2
  }
}
```

**ステータスコード**:
- `200 OK`: 正常取得
- `500 Internal Server Error`: サーバーエラー

---

### 2. 株登録API

**エンドポイント**: `POST /api/v1/stocks`

**説明**: 新規株銘柄を登録

**リクエストボディ**:
```json
{
  "stockCode": "7203",
  "stockName": "トヨタ自動車"
}
```

**レスポンス例（成功）**:
```json
{
  "success": true,
  "data": {
    "stock": {
      "stockId": 1,
      "stockCode": "7203",
      "stockName": "トヨタ自動車",
      "createdAt": "2024-01-15T12:34:56.789Z",
      "updatedAt": "2024-01-15T12:34:56.789Z"
    }
  },
  "message": "株を登録しました"
}
```

**レスポンス例（エラー - 重複）**:
```json
{
  "success": false,
  "error": {
    "code": "STOCK_CODE_DUPLICATE",
    "message": "この銘柄コードは既に登録されています",
    "details": {
      "stockCode": "7203"
    }
  }
}
```

**レスポンス例（エラー - バリデーション）**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": {
      "stockCode": "銘柄コードは4桁の数字である必要があります",
      "stockName": "銘柄名は1文字以上100文字以内で入力してください"
    }
  }
}
```

**ステータスコード**:
- `201 Created`: 登録成功
- `400 Bad Request`: バリデーションエラー
- `409 Conflict`: 銘柄コード重複
- `500 Internal Server Error`: サーバーエラー

---

### 3. 株詳細取得API（将来対応）

**エンドポイント**: `GET /api/v1/stocks/:stockId`

**説明**: 特定の株銘柄の詳細情報を取得

**パスパラメータ**:
- `stockId` (number, required): 株ID

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "stock": {
      "stockId": 1,
      "stockCode": "7203",
      "stockName": "トヨタ自動車",
      "createdAt": "2024-01-15T12:34:56.789Z",
      "updatedAt": "2024-01-15T12:34:56.789Z"
    }
  }
}
```

**ステータスコード**:
- `200 OK`: 正常取得
- `404 Not Found`: 株が見つからない
- `500 Internal Server Error`: サーバーエラー

---

## エラーコード一覧

| エラーコード | HTTPステータス | 説明 |
|------------|--------------|------|
| `VALIDATION_ERROR` | 400 | リクエストパラメータのバリデーションエラー |
| `STOCK_CODE_DUPLICATE` | 409 | 銘柄コード重複 |
| `STOCK_NOT_FOUND` | 404 | 株が見つからない |
| `DATABASE_ERROR` | 500 | データベースエラー |
| `INTERNAL_SERVER_ERROR` | 500 | その他のサーバーエラー |

---

## バックエンド実装

### ディレクトリ構造

```
backend/
├── src/
│   ├── routes/
│   │   ├── stocks.ts                    # 株関連ルート（新規）
│   │   └── index.ts                     # ルート統合（更新）
│   ├── controllers/
│   │   └── stockController.ts           # 株コントローラー（新規）
│   ├── services/
│   │   └── stockService.ts              # 株ビジネスロジック（新規）
│   ├── repositories/
│   │   └── stockRepository.ts           # 株マスタデータアクセス（既存更新）
│   ├── schemas/
│   │   └── stockSchemas.ts              # 株バリデーション（新規）
│   └── types/
│       └── stock.ts                     # 株型定義（新規）
```

### 実装ファイル

#### 1. schemas/stockSchemas.ts

```typescript
import { z } from 'zod';

// 株登録リクエストスキーマ
export const createStockSchema = z.object({
  stockCode: z
    .string()
    .regex(/^[A-Za-z0-9]{4}$/, '銘柄コードは英数字4桁である必要があります')
    .trim()
    .transform((val) => val.toUpperCase()), // 大文字に統一
  stockName: z
    .string()
    .min(1, '銘柄名は1文字以上入力してください')
    .max(100, '銘柄名は100文字以内で入力してください')
    .trim(),
});

export type CreateStockInput = z.infer<typeof createStockSchema>;
```

#### 2. repositories/stockRepository.ts（既存ファイル拡張）

```typescript
import { getPrismaClient } from '../config/database';
import { CreateStockInput } from '../schemas/stockSchemas';

// 株一覧取得
export const findAllStocks = async () => {
  const prisma = getPrismaClient();
  return await prisma.stock.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// 銘柄コードで検索
export const findStockByCode = async (stockCode: string) => {
  const prisma = getPrismaClient();
  return await prisma.stock.findUnique({
    where: { stockCode },
  });
};

// 株IDで検索
export const findStockById = async (stockId: number) => {
  const prisma = getPrismaClient();
  return await prisma.stock.findUnique({
    where: { stockId },
  });
};

// 株登録
export const createStock = async (input: CreateStockInput) => {
  const prisma = getPrismaClient();
  return await prisma.stock.create({
    data: input,
  });
};
```

#### 3. services/stockService.ts

```typescript
import { CreateStockInput } from '../schemas/stockSchemas';
import * as stockRepository from '../repositories/stockRepository';

// 株一覧取得
export const getAllStocks = async () => {
  const stocks = await stockRepository.findAllStocks();
  return {
    stocks,
    total: stocks.length,
  };
};

// 株登録（重複チェック含む）
export const registerStock = async (input: CreateStockInput) => {
  // 既存の銘柄コードチェック
  const existingStock = await stockRepository.findStockByCode(input.stockCode);
  if (existingStock) {
    throw {
      code: 'STOCK_CODE_DUPLICATE',
      message: 'この銘柄コードは既に登録されています',
      details: { stockCode: input.stockCode },
    };
  }

  // 株登録
  const newStock = await stockRepository.createStock(input);
  return newStock;
};

// 株詳細取得
export const getStockById = async (stockId: number) => {
  const stock = await stockRepository.findStockById(stockId);
  if (!stock) {
    throw {
      code: 'STOCK_NOT_FOUND',
      message: '指定された株が見つかりません',
      details: { stockId },
    };
  }
  return stock;
};
```

#### 4. controllers/stockController.ts

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { createStockSchema } from '../schemas/stockSchemas';
import * as stockService from '../services/stockService';

// 株一覧取得
export const getStocks = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const data = await stockService.getAllStocks();
    return reply.status(200).send({
      success: true,
      data,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
};

// 株登録
export const createStock = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // バリデーション
    const validatedData = createStockSchema.parse(request.body);

    // 株登録
    const stock = await stockService.registerStock(validatedData);

    return reply.status(201).send({
      success: true,
      data: { stock },
      message: '株を登録しました',
    });
  } catch (error: any) {
    request.log.error(error);

    // Zodバリデーションエラー
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details: error.errors,
        },
      });
    }

    // 重複エラー
    if (error.code === 'STOCK_CODE_DUPLICATE') {
      return reply.status(409).send({
        success: false,
        error,
      });
    }

    // その他のエラー
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
};

// 株詳細取得
export const getStockById = async (
  request: FastifyRequest<{ Params: { stockId: string } }>,
  reply: FastifyReply
) => {
  try {
    const stockId = parseInt(request.params.stockId, 10);
    if (isNaN(stockId)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な株IDです',
        },
      });
    }

    const stock = await stockService.getStockById(stockId);

    return reply.status(200).send({
      success: true,
      data: { stock },
    });
  } catch (error: any) {
    request.log.error(error);

    if (error.code === 'STOCK_NOT_FOUND') {
      return reply.status(404).send({
        success: false,
        error,
      });
    }

    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
};
```

#### 5. routes/stocks.ts

```typescript
import { FastifyInstance } from 'fastify';
import * as stockController from '../controllers/stockController';

export default async function stockRoutes(fastify: FastifyInstance) {
  // 株一覧取得
  fastify.get('/stocks', stockController.getStocks);

  // 株登録
  fastify.post('/stocks', stockController.createStock);

  // 株詳細取得
  fastify.get('/stocks/:stockId', stockController.getStockById);
}
```

#### 6. routes/index.ts（更新）

```typescript
import { FastifyInstance } from 'fastify';
import chartDataRoutes from './chartData';
import stockRoutes from './stocks'; // 追加

export default async function routes(fastify: FastifyInstance) {
  fastify.register(chartDataRoutes, { prefix: '/api/v1' });
  fastify.register(stockRoutes, { prefix: '/api/v1' }); // 追加
}
```

---

## フロントエンド実装

### ディレクトリ構造

```
frontend/
├── src/
│   ├── components/
│   │   ├── StockList.tsx            # 株一覧コンポーネント（新規）
│   │   ├── StockForm.tsx            # 株登録フォームコンポーネント（新規）
│   │   └── StockChart.tsx           # 株価チャートコンポーネント（既存）
│   ├── pages/
│   │   ├── StocksPage.tsx           # 株一覧ページ（新規）
│   │   └── StockNewPage.tsx         # 株登録ページ（新規）
│   ├── services/
│   │   └── stockApi.ts              # 株API通信（新規）
│   ├── types/
│   │   └── stock.ts                 # 株型定義（更新）
│   ├── App.tsx                      # ルーティング設定（更新）
│   └── main.tsx
```

### 実装ファイル

#### 1. types/stock.ts（更新）

```typescript
// 既存の型定義
export interface CandlestickData {
  date: string;
  open: number;
  close: number;
  low: number;
  high: number;
}

export interface NewsItem {
  id: string;
  date: string;
  time: string;
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
  url: string;
}

// 新規追加: 株マスタ型定義
export interface Stock {
  stockId: number;
  stockCode: string;
  stockName: string;
  createdAt: string;
  updatedAt: string;
}

// 新規追加: 株登録入力型
export interface CreateStockInput {
  stockCode: string;
  stockName: string;
}

// 新規追加: API共通レスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}
```

#### 2. services/stockApi.ts

```typescript
import { Stock, CreateStockInput, ApiResponse } from '../types/stock';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 株一覧取得
export const fetchStocks = async (): Promise<Stock[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/stocks`);
  const data: ApiResponse<{ stocks: Stock[]; total: number }> =
    await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || '株一覧の取得に失敗しました');
  }

  return data.data.stocks;
};

// 株登録
export const createStock = async (
  input: CreateStockInput
): Promise<Stock> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/stocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data: ApiResponse<{ stock: Stock }> = await response.json();

  if (!response.ok || !data.success) {
    throw {
      code: data.error?.code || 'UNKNOWN_ERROR',
      message: data.error?.message || '株の登録に失敗しました',
      details: data.error?.details,
    };
  }

  return data.data!.stock;
};
```

#### 3. components/StockList.tsx

```typescript
import React from 'react';
import { Stock } from '../types/stock';
import './StockList.css';

interface StockListProps {
  stocks: Stock[];
  onChartClick: (stockCode: string) => void;
}

export const StockList: React.FC<StockListProps> = ({ stocks, onChartClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="stock-list">
      <table className="stock-table">
        <thead>
          <tr>
            <th>銘柄コード</th>
            <th>銘柄名</th>
            <th>登録日時</th>
            <th>アクション</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr key={stock.stockId}>
              <td>{stock.stockCode}</td>
              <td>{stock.stockName}</td>
              <td>{formatDate(stock.createdAt)}</td>
              <td>
                <button
                  className="chart-button"
                  onClick={() => onChartClick(stock.stockCode)}
                >
                  チャート
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

#### 4. components/StockForm.tsx

```typescript
import React, { useState } from 'react';
import { CreateStockInput } from '../types/stock';
import './StockForm.css';

interface StockFormProps {
  onSubmit: (input: CreateStockInput) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const StockForm: React.FC<StockFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [stockCode, setStockCode] = useState('');
  const [stockName, setStockName] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // バリデーション
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!stockCode) {
      newErrors.stockCode = '銘柄コードは必須です';
    } else if (!/^[A-Za-z0-9]{4}$/.test(stockCode)) {
      newErrors.stockCode = '銘柄コードは英数字4桁である必要があります';
    }

    if (!stockName) {
      newErrors.stockName = '銘柄名は必須です';
    } else if (stockName.length > 100) {
      newErrors.stockName = '銘柄名は100文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        stockCode: stockCode.trim().toUpperCase(), // 大文字に統一
        stockName: stockName.trim(),
      });
    } catch (error) {
      // エラーは親コンポーネントで処理
    }
  };

  return (
    <form className="stock-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="stockCode">
          銘柄コード <span className="required">*</span>
        </label>
        <input
          id="stockCode"
          type="text"
          value={stockCode}
          onChange={(e) => setStockCode(e.target.value)}
          placeholder="7203 または AAPL"
          maxLength={4}
          disabled={isLoading}
        />
        {errors.stockCode && (
          <p className="error-message">{errors.stockCode}</p>
        )}
        <p className="help-text">英数字4桁の証券コードを入力してください</p>
      </div>

      <div className="form-group">
        <label htmlFor="stockName">
          銘柄名 <span className="required">*</span>
        </label>
        <input
          id="stockName"
          type="text"
          value={stockName}
          onChange={(e) => setStockName(e.target.value)}
          placeholder="トヨタ自動車"
          maxLength={100}
          disabled={isLoading}
        />
        {errors.stockName && (
          <p className="error-message">{errors.stockName}</p>
        )}
        <p className="help-text">
          銘柄名を入力してください(100文字以内)
        </p>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={onCancel}
          disabled={isLoading}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading ? '登録中...' : '登録'}
        </button>
      </div>
    </form>
  );
};
```

#### 5. pages/StocksPage.tsx

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockList } from '../components/StockList';
import { fetchStocks } from '../services/stockApi';
import { Stock } from '../types/stock';
import './StocksPage.css';

export const StocksPage: React.FC = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchStocks();
      setStocks(data);
    } catch (err: any) {
      setError(err.message || '株一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChartClick = (stockCode: string) => {
    navigate(`/chart/${stockCode}`);
  };

  const handleNewStock = () => {
    navigate('/stocks/new');
  };

  return (
    <div className="stocks-page">
      <div className="page-header">
        <h1>株一覧</h1>
        <button className="new-button" onClick={handleNewStock}>
          + 新規登録
        </button>
      </div>

      {isLoading && <p className="loading">読み込み中...</p>}

      {error && <p className="error">{error}</p>}

      {!isLoading && !error && stocks.length === 0 && (
        <p className="empty-message">
          登録されている株がありません。新規登録してください。
        </p>
      )}

      {!isLoading && !error && stocks.length > 0 && (
        <StockList stocks={stocks} onChartClick={handleChartClick} />
      )}
    </div>
  );
};
```

#### 6. pages/StockNewPage.tsx

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockForm } from '../components/StockForm';
import { createStock } from '../services/stockApi';
import { CreateStockInput } from '../types/stock';
import './StockNewPage.css';

export const StockNewPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (input: CreateStockInput) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      await createStock(input);

      setSuccessMessage('株を登録しました');

      // 2秒後に一覧画面へ遷移
      setTimeout(() => {
        navigate('/stocks');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '株の登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/stocks');
  };

  return (
    <div className="stock-new-page">
      <h1>株の新規登録</h1>

      {error && <div className="error-banner">{error}</div>}
      {successMessage && <div className="success-banner">{successMessage}</div>}

      <StockForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
};
```

#### 7. App.tsx（更新）

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StocksPage } from './pages/StocksPage';
import { StockNewPage } from './pages/StockNewPage';
import { StockChart } from './components/StockChart';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/stocks" replace />} />
        <Route path="/stocks" element={<StocksPage />} />
        <Route path="/stocks/new" element={<StockNewPage />} />
        <Route path="/chart/:stockCode" element={<StockChart />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## スタイリング（CSS）

### StockList.css

```css
.stock-list {
  margin: 20px 0;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stock-table thead {
  background-color: #E0E0E0;
}

.stock-table th,
.stock-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #E0E0E0;
}

.stock-table th {
  font-weight: bold;
  color: #333;
}

.stock-table tbody tr:hover {
  background-color: #F5F5F5;
}

.chart-button {
  background-color: #26A69A;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.chart-button:hover {
  background-color: #1F8A7F;
}
```

### StockForm.css

```css
.stock-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.required {
  color: #EF5350;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #26A69A;
}

.form-group input:disabled {
  background-color: #F5F5F5;
  cursor: not-allowed;
}

.help-text {
  margin-top: 4px;
  font-size: 12px;
  color: #757575;
}

.error-message {
  margin-top: 4px;
  font-size: 12px;
  color: #EF5350;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}

.cancel-button {
  padding: 10px 24px;
  background-color: #9E9E9E;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-button:hover {
  background-color: #757575;
}

.submit-button {
  padding: 10px 24px;
  background-color: #26A69A;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.submit-button:hover {
  background-color: #1F8A7F;
}

.cancel-button:disabled,
.submit-button:disabled {
  background-color: #E0E0E0;
  cursor: not-allowed;
}
```

### StocksPage.css

```css
.stocks-page {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
}

.new-button {
  padding: 10px 20px;
  background-color: #26A69A;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.new-button:hover {
  background-color: #1F8A7F;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #757575;
}

.error {
  padding: 16px;
  background-color: #FFEBEE;
  color: #C62828;
  border-radius: 4px;
  margin-bottom: 20px;
}

.empty-message {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #757575;
}
```

### StockNewPage.css

```css
.stock-new-page {
  padding: 40px 20px;
  max-width: 800px;
  margin: 0 auto;
}

.stock-new-page h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 24px;
}

.error-banner {
  padding: 16px;
  background-color: #FFEBEE;
  color: #C62828;
  border-radius: 4px;
  margin-bottom: 20px;
}

.success-banner {
  padding: 16px;
  background-color: #E8F5E9;
  color: #2E7D32;
  border-radius: 4px;
  margin-bottom: 20px;
}
```

---

## 必要な依存関係

### フロントエンド（package.json に追加）

```json
{
  "dependencies": {
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@types/react-router-dom": "^5.3.3"
  }
}
```

---

## 実装手順

### Phase 1: バックエンドAPI実装

- [x] Zodスキーマ定義 (`schemas/stockSchemas.ts`)
- [x] リポジトリ拡張 (`repositories/stockRepository.ts`)
- [x] サービス実装 (`services/stockService.ts`)
- [x] コントローラー実装 (`controllers/stockController.ts`)
- [x] ルート定義 (`routes/stocks.ts`)
- [x] ルート統合 (`routes/index.ts`)
- [x] APIエンドポイントの動作確認（curl / Postman）

### Phase 2: フロントエンド実装

- [ ] 型定義更新 (`types/stock.ts`)
- [ ] API通信実装 (`services/stockApi.ts`)
- [ ] 株一覧コンポーネント実装 (`components/StockList.tsx`)
- [ ] 株登録フォームコンポーネント実装 (`components/StockForm.tsx`)
- [ ] 株一覧ページ実装 (`pages/StocksPage.tsx`)
- [ ] 株登録ページ実装 (`pages/StockNewPage.tsx`)
- [ ] ルーティング設定 (`App.tsx`)
- [ ] CSSスタイリング

### Phase 3: 統合テスト

- [ ] 株一覧表示の確認
- [ ] 株登録フォームのバリデーション確認
- [ ] 株登録成功の確認
- [ ] エラーハンドリング確認（重複、バリデーションエラー等）
- [ ] チャート画面への遷移確認

---

## 動作確認コマンド

### バックエンドAPIテスト

```bash
# 株一覧取得
curl http://localhost:3000/api/v1/stocks

# 株登録
curl -X POST http://localhost:3000/api/v1/stocks \
  -H "Content-Type: application/json" \
  -d '{"stockCode":"7203","stockName":"トヨタ自動車"}'

# 株詳細取得
curl http://localhost:3000/api/v1/stocks/1
```

---

## 今後の拡張案

### Phase 4以降で検討

1. **株編集機能**: 銘柄名の編集
2. **株削除機能**: 株の削除（関連データの削除も検討）
3. **検索機能**: 銘柄コード・銘柄名での検索
4. **ページネーション**: 大量データ対応
5. **ソート機能**: 登録日時、銘柄コード等でソート
6. **CSVインポート**: ファイルアップロードによる一括登録
7. **株価データ自動取得**: 外部APIからの株価データ取得

---

## 参考リンク

- [Fastify Routing](https://fastify.dev/docs/latest/Reference/Routes/)
- [Zod Documentation](https://zod.dev/)
- [React Router v6 Documentation](https://reactrouter.com/)
- [Prisma CRUD Operations](https://www.prisma.io/docs/concepts/components/prisma-client/crud)

---

**作成日**: 2025-11-05
**最終更新**: 2025-11-05
**ステータス**: 設計完了・実装待ち
**想定実装時間**: 6-8時間
