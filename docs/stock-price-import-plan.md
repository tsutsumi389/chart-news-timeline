# 株価インポート機能 実装計画

## 概要

Chart News Timelineアプリケーションに株価データをインポートする機能を追加します。企業（銘柄）ごとにCSVファイルまたはWeb APIから株価データを取得し、データベースに登録できる画面とバックエンドAPIを実装します。

**目的**: 手動またはバッチで株価データをデータベースに取り込み、チャート表示で使用できるようにする

**対象ユーザー**: 管理者・データ管理者

---

## 機能要件

### 1. 株価インポート画面（フロントエンド）

企業（銘柄）を選択し、株価データをインポートするための管理画面を実装します。

#### 画面構成

1. **銘柄選択セクション**
   - 銘柄コード入力フィールド（4桁）
   - 銘柄名表示（銘柄コードを入力すると自動取得）
   - 銘柄検索機能（後続フェーズで実装）

2. **インポート方法選択**
   - CSVファイルアップロード
   - Web API取得（将来拡張）

3. **CSVファイルアップロード**
   - ファイル選択ボタン
   - ドラッグ&ドロップエリア
   - CSVフォーマット説明
   - プレビュー機能（アップロード前に内容確認）

4. **インポート設定**
   - 重複データの扱い
     - スキップ（既存データを保持）
     - 上書き（既存データを更新）
   - バリデーションルール
     - 日付形式チェック
     - 価格の妥当性チェック（負の値、異常値）
     - 出来高チェック

5. **インポート実行**
   - インポート実行ボタン
   - 進捗表示（プログレスバー）
   - 結果サマリー表示
     - 成功件数
     - スキップ件数
     - エラー件数
     - エラー詳細リスト

6. **履歴表示**
   - 過去のインポート履歴一覧
   - インポート日時
   - インポート件数
   - ステータス

#### CSVフォーマット仕様

**標準フォーマット（Yahoo!ファイナンス形式に準拠）**

```csv
日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000
2024-01-16,152.3,153.5,150.5,151.0,14500000
2024-01-17,151.0,152.8,150.2,152.5,13800000
```

- **日付**: YYYY-MM-DD形式（必須）
- **始値**: 小数点以下2桁まで（必須）
- **高値**: 小数点以下2桁まで（必須）
- **安値**: 小数点以下2桁まで（必須）
- **終値**: 小数点以下2桁まで（必須）
- **出来高**: 整数（必須）

**バリデーションルール**:
- 日付は過去の日付であること
- 高値 ≥ 始値、終値、安値
- 安値 ≤ 始値、終値、高値
- 全ての価格が正の数値であること
- 出来高が0以上の整数であること

### 2. 株価インポートAPI（バックエンド）

#### エンドポイント設計

##### 2.1 銘柄情報取得API

**エンドポイント**: `GET /api/v1/stocks/:stockCode`

**説明**: 銘柄コードから銘柄情報を取得

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "stockId": 1,
    "stockCode": "7203",
    "stockName": "トヨタ自動車",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

##### 2.2 CSVファイルアップロードAPI

**エンドポイント**: `POST /api/v1/stocks/:stockCode/import/csv`

**説明**: CSVファイルから株価データを一括インポート

**リクエスト**:
- Content-Type: `multipart/form-data`
- Body:
  - `file`: CSVファイル（必須）
  - `duplicateStrategy`: 重複時の処理（`skip` or `overwrite`、デフォルト: `skip`）

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "importId": "import_20240115_123456",
    "stockCode": "7203",
    "stockName": "トヨタ自動車",
    "totalRows": 100,
    "successCount": 95,
    "skipCount": 3,
    "errorCount": 2,
    "errors": [
      {
        "row": 10,
        "date": "2024-01-20",
        "message": "高値が始値より低い値です"
      },
      {
        "row": 25,
        "date": "2024-02-05",
        "message": "日付形式が不正です"
      }
    ],
    "importedAt": "2024-01-15T12:34:56Z"
  }
}
```

**ステータスコード**:
- `200 OK`: インポート成功
- `400 Bad Request`: CSVフォーマットエラー、バリデーションエラー
- `404 Not Found`: 銘柄が見つからない
- `413 Payload Too Large`: ファイルサイズ超過
- `500 Internal Server Error`: サーバーエラー

##### 2.3 株価データ削除API

**エンドポイント**: `DELETE /api/v1/stocks/:stockCode/prices`

**説明**: 指定銘柄の株価データを削除（再インポート前のクリーンアップ用）

**クエリパラメータ**:
- `startDate` (string, optional): 削除開始日（YYYY-MM-DD形式）
- `endDate` (string, optional): 削除終了日（YYYY-MM-DD形式）

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "stockCode": "7203",
    "deletedCount": 50,
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-03-31"
    }
  }
}
```

##### 2.4 インポート履歴取得API

**エンドポイント**: `GET /api/v1/stocks/:stockCode/import/history`

**説明**: 指定銘柄のインポート履歴を取得

**クエリパラメータ**:
- `limit` (number, optional): 取得件数（デフォルト: 20）
- `offset` (number, optional): オフセット（デフォルト: 0）

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "total": 10,
    "history": [
      {
        "importId": "import_20240115_123456",
        "stockCode": "7203",
        "importedAt": "2024-01-15T12:34:56Z",
        "totalRows": 100,
        "successCount": 95,
        "skipCount": 3,
        "errorCount": 2,
        "status": "completed"
      }
    ]
  }
}
```

---

## 技術仕様

### フロントエンド実装

#### ディレクトリ構造

```
frontend/src/
├── pages/
│   └── StockPriceImport.tsx           # 株価インポート画面（新規）
├── components/
│   ├── import/
│   │   ├── StockSelector.tsx          # 銘柄選択コンポーネント（新規）
│   │   ├── CsvUploader.tsx            # CSVアップローダー（新規）
│   │   ├── ImportProgress.tsx         # インポート進捗表示（新規）
│   │   ├── ImportResult.tsx           # インポート結果表示（新規）
│   │   └── ImportHistory.tsx          # インポート履歴表示（新規）
│   └── common/
│       ├── FileDropZone.tsx           # ファイルドロップゾーン（新規）
│       └── ProgressBar.tsx            # プログレスバー（新規）
├── services/
│   └── importService.ts               # インポートAPI呼び出し（新規）
├── types/
│   └── import.ts                      # インポート関連型定義（新規）
├── hooks/
│   └── useStockImport.ts              # インポートカスタムフック（新規）
└── utils/
    ├── csvParser.ts                   # CSVパーサー（新規）
    └── csvValidator.ts                # CSVバリデーター（新規）
```

#### 主要コンポーネント

##### StockPriceImport.tsx（メイン画面）

```typescript
// 株価インポート画面
// 銘柄選択、CSVアップロード、インポート実行、履歴表示を統合

interface StockPriceImportProps {}

export const StockPriceImport: React.FC<StockPriceImportProps> = () => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { importCsv, isLoading, error } = useStockImport();

  return (
    <div className="stock-price-import">
      <h1>株価データインポート</h1>

      <StockSelector onSelect={setSelectedStock} />

      {selectedStock && (
        <>
          <CsvUploader
            onFileSelect={setCsvFile}
            disabled={isLoading}
          />

          <ImportProgress
            isLoading={isLoading}
            progress={/* 進捗率 */}
          />

          {importResult && (
            <ImportResult result={importResult} />
          )}

          <ImportHistory stockCode={selectedStock.stockCode} />
        </>
      )}
    </div>
  );
};
```

##### CsvUploader.tsx（CSVアップロード）

```typescript
// CSVファイルアップロードコンポーネント
// ドラッグ&ドロップ、ファイル選択、プレビュー機能

interface CsvUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({
  onFileSelect,
  disabled
}) => {
  const [previewData, setPreviewData] = useState<string[][] | null>(null);

  const handleFileChange = async (file: File) => {
    // CSVパース&プレビュー生成
    const preview = await parseCsvPreview(file);
    setPreviewData(preview);
    onFileSelect(file);
  };

  return (
    <div className="csv-uploader">
      <FileDropZone
        onDrop={handleFileChange}
        accept=".csv"
        disabled={disabled}
      />

      {previewData && (
        <CsvPreview data={previewData} />
      )}

      <CsvFormatGuide />
    </div>
  );
};
```

#### 型定義（types/import.ts）

```typescript
// 株価インポート関連の型定義

export interface ImportResult {
  importId: string;
  stockCode: string;
  stockName: string;
  totalRows: number;
  successCount: number;
  skipCount: number;
  errorCount: number;
  errors: ImportError[];
  importedAt: string;
}

export interface ImportError {
  row: number;
  date: string;
  message: string;
}

export interface ImportHistoryItem {
  importId: string;
  stockCode: string;
  importedAt: string;
  totalRows: number;
  successCount: number;
  skipCount: number;
  errorCount: number;
  status: 'completed' | 'failed' | 'partial';
}

export interface CsvRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type DuplicateStrategy = 'skip' | 'overwrite';
```

### バックエンド実装

#### ディレクトリ構造

```
backend/src/
├── routes/
│   └── stockImport.ts                 # 株価インポートルート（新規）
├── controllers/
│   └── stockImportController.ts       # 株価インポートコントローラー（新規）
├── services/
│   ├── stockImportService.ts          # 株価インポートビジネスロジック（新規）
│   └── csvParserService.ts            # CSVパーサーサービス（新規）
├── repositories/
│   └── stockPriceRepository.ts        # 株価データアクセス（新規）
├── schemas/
│   └── stockImportSchemas.ts          # 株価インポートバリデーション（新規）
├── types/
│   └── import.ts                      # インポート型定義（新規）
└── utils/
    ├── csvValidator.ts                # CSVバリデーター（新規）
    └── fileUpload.ts                  # ファイルアップロード処理（新規）
```

#### 主要サービス

##### stockImportService.ts

```typescript
// 株価インポートのビジネスロジック
// CSVパース、バリデーション、データベース登録

export class StockImportService {
  /**
   * CSVファイルから株価データをインポート
   * @param stockCode 銘柄コード
   * @param csvContent CSVファイル内容
   * @param strategy 重複時の処理戦略
   * @returns インポート結果
   */
  async importFromCsv(
    stockCode: string,
    csvContent: string,
    strategy: DuplicateStrategy
  ): Promise<ImportResult> {
    // 1. 銘柄存在チェック
    const stock = await stockRepository.findByCode(stockCode);
    if (!stock) {
      throw new NotFoundError(`銘柄コード ${stockCode} が見つかりません`);
    }

    // 2. CSVパース
    const rows = await csvParserService.parse(csvContent);

    // 3. バリデーション
    const validationResult = await this.validateRows(rows);

    // 4. データベース登録（トランザクション）
    const importResult = await this.bulkInsertPrices(
      stock.stockId,
      validationResult.validRows,
      strategy
    );

    // 5. インポート履歴保存
    await this.saveImportHistory(importResult);

    return importResult;
  }

  /**
   * 株価データのバリデーション
   */
  private async validateRows(rows: CsvRow[]): Promise<ValidationResult> {
    const validRows: CsvRow[] = [];
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validationError = csvValidator.validate(row);

      if (validationError) {
        errors.push({
          row: i + 2, // ヘッダー行を考慮
          date: row.date,
          message: validationError,
        });
      } else {
        validRows.push(row);
      }
    }

    return { validRows, errors };
  }

  /**
   * 株価データの一括登録
   */
  private async bulkInsertPrices(
    stockId: number,
    rows: CsvRow[],
    strategy: DuplicateStrategy
  ): Promise<ImportResult> {
    let successCount = 0;
    let skipCount = 0;
    const errors: ImportError[] = [];

    for (const row of rows) {
      try {
        if (strategy === 'skip') {
          // 既存データをスキップ
          const exists = await stockPriceRepository.existsByDate(
            stockId,
            row.date
          );
          if (exists) {
            skipCount++;
            continue;
          }
        }

        await stockPriceRepository.upsert(stockId, row);
        successCount++;
      } catch (error) {
        errors.push({
          row: 0, // 行番号は後で追加
          date: row.date,
          message: error.message,
        });
      }
    }

    return {
      importId: generateImportId(),
      successCount,
      skipCount,
      errorCount: errors.length,
      errors,
      importedAt: new Date().toISOString(),
    };
  }
}
```

##### csvParserService.ts

```typescript
// CSVファイルのパース処理
// ヘッダー検証、データ型変換

export class CsvParserService {
  /**
   * CSVファイル内容をパースして構造化データに変換
   */
  async parse(csvContent: string): Promise<CsvRow[]> {
    const lines = csvContent.split('\n');

    // ヘッダー行検証
    const header = lines[0].split(',');
    this.validateHeader(header);

    // データ行をパース
    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');
      const row = this.parseRow(values);
      rows.push(row);
    }

    return rows;
  }

  /**
   * ヘッダー行の検証
   */
  private validateHeader(header: string[]): void {
    const expectedHeaders = ['日付', '始値', '高値', '安値', '終値', '出来高'];

    for (let i = 0; i < expectedHeaders.length; i++) {
      if (header[i]?.trim() !== expectedHeaders[i]) {
        throw new Error(
          `CSVヘッダーが不正です。期待: ${expectedHeaders.join(',')}`
        );
      }
    }
  }

  /**
   * データ行のパース
   */
  private parseRow(values: string[]): CsvRow {
    return {
      date: values[0].trim(),
      open: parseFloat(values[1]),
      high: parseFloat(values[2]),
      low: parseFloat(values[3]),
      close: parseFloat(values[4]),
      volume: parseInt(values[5], 10),
    };
  }
}
```

##### csvValidator.ts

```typescript
// CSV行のバリデーション
// 日付形式、価格妥当性、OHLC関係性チェック

export class CsvValidator {
  /**
   * CSV行のバリデーション
   * @returns エラーメッセージ（正常な場合はnull）
   */
  validate(row: CsvRow): string | null {
    // 日付形式チェック
    if (!this.isValidDate(row.date)) {
      return '日付形式が不正です（YYYY-MM-DD形式で入力してください）';
    }

    // 価格の正数チェック
    if (row.open <= 0 || row.high <= 0 || row.low <= 0 || row.close <= 0) {
      return '価格は正の数値である必要があります';
    }

    // OHLC関係性チェック
    if (row.high < row.low) {
      return '高値が安値より低い値です';
    }

    if (row.high < row.open || row.high < row.close) {
      return '高値が始値または終値より低い値です';
    }

    if (row.low > row.open || row.low > row.close) {
      return '安値が始値または終値より高い値です';
    }

    // 出来高チェック
    if (row.volume < 0 || !Number.isInteger(row.volume)) {
      return '出来高は0以上の整数である必要があります';
    }

    return null;
  }

  /**
   * 日付形式チェック（YYYY-MM-DD）
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
```

#### リポジトリ拡張

##### stockPriceRepository.ts（既存に追加）

```typescript
// 株価データアクセス層にインポート用メソッドを追加

export class StockPriceRepository {
  /**
   * 指定日の株価データが存在するかチェック
   */
  async existsByDate(stockId: number, tradeDate: string): Promise<boolean> {
    const count = await prisma.stockPrice.count({
      where: {
        stockId,
        tradeDate: new Date(tradeDate),
      },
    });
    return count > 0;
  }

  /**
   * 株価データのUpsert（存在する場合は更新、しない場合は挿入）
   */
  async upsert(stockId: number, data: CsvRow): Promise<StockPrice> {
    return await prisma.stockPrice.upsert({
      where: {
        stockId_tradeDate: {
          stockId,
          tradeDate: new Date(data.date),
        },
      },
      update: {
        openPrice: data.open,
        highPrice: data.high,
        lowPrice: data.low,
        closePrice: data.close,
        volume: data.volume,
      },
      create: {
        stockId,
        tradeDate: new Date(data.date),
        openPrice: data.open,
        highPrice: data.high,
        lowPrice: data.low,
        closePrice: data.close,
        volume: data.volume,
      },
    });
  }

  /**
   * 指定範囲の株価データを削除
   */
  async deleteByDateRange(
    stockId: number,
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const where: any = { stockId };

    if (startDate || endDate) {
      where.tradeDate = {};
      if (startDate) where.tradeDate.gte = new Date(startDate);
      if (endDate) where.tradeDate.lte = new Date(endDate);
    }

    const result = await prisma.stockPrice.deleteMany({ where });
    return result.count;
  }
}
```

---

## 依存関係追加

### フロントエンド（frontend/package.json）

```json
{
  "dependencies": {
    "papaparse": "^5.4.1",        // CSVパーサー
    "react-dropzone": "^14.2.3"   // ファイルドロップゾーン
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14"
  }
}
```

### バックエンド（backend/package.json）

```json
{
  "dependencies": {
    "@fastify/multipart": "^8.3.0"  // ファイルアップロード処理
  }
}
```

---

## データベース拡張

### インポート履歴テーブル追加（将来拡張）

```prisma
// prisma/schema.prisma に追加

model ImportHistory {
  importId      String   @id @default(uuid()) @map("import_id")
  stockId       Int      @map("stock_id")
  importedAt    DateTime @default(now()) @map("imported_at") @db.Timestamp()
  totalRows     Int      @map("total_rows")
  successCount  Int      @map("success_count")
  skipCount     Int      @map("skip_count")
  errorCount    Int      @map("error_count")
  status        ImportStatus
  errorDetails  Json?    @map("error_details")

  // リレーション
  stock Stock @relation(fields: [stockId], references: [stockId], onDelete: Cascade)

  @@index([stockId, importedAt], map: "idx_import_history")
  @@map("import_history")
}

enum ImportStatus {
  completed  // 完了
  failed     // 失敗
  partial    // 一部成功
}
```

---

## UI/UXデザイン

### カラースキーム

- **プライマリ**: #1976D2（青）- アクションボタン
- **成功**: #4CAF50（緑）- 成功メッセージ、成功カウント
- **警告**: #FF9800（オレンジ）- スキップメッセージ
- **エラー**: #F44336（赤）- エラーメッセージ、エラーカウント
- **背景**: #F5F5F5（グレー）- ドロップゾーン背景

### レスポンシブデザイン

- **デスクトップ**: 3カラムレイアウト（銘柄選択 | アップロード | 履歴）
- **タブレット**: 2カラムレイアウト
- **モバイル**: 1カラムレイアウト（アコーディオン式）

---

## セキュリティ考慮事項

### 1. ファイルアップロード

- **ファイルサイズ制限**: 最大10MB
- **許可拡張子**: `.csv` のみ
- **MIMEタイプチェック**: `text/csv`, `application/csv`
- **ファイル内容検証**: CSVヘッダーの厳密チェック

### 2. CSVインジェクション対策

- 特殊文字のエスケープ処理
- 数式開始文字（`=`, `+`, `-`, `@`）のサニタイズ

### 3. レート制限

- 同一銘柄へのインポート: 1分間に3回まで
- ファイルアップロード: 1分間に10回まで

### 4. 権限管理（将来実装）

- 管理者ロールのみインポート機能にアクセス可能
- 一般ユーザーは閲覧のみ

---

## パフォーマンス最適化

### 1. バルクインサート

- Prismaの `createMany` を使用して一括登録
- トランザクション内でバッチ処理（1000件ごと）

### 2. 非同期処理

- 大量データのインポートはバックグラウンドジョブで処理
- 進捗状況をWebSocketでリアルタイム通知（将来拡張）

### 3. フロントエンド最適化

- CSVパースをWeb Workerで実行（UIブロッキング回避）
- 大きなCSVファイルのプレビューは先頭100行のみ表示

---

## エラーハンドリング

### バリデーションエラー

| エラーコード | HTTPステータス | 説明 |
|------------|--------------|------|
| `INVALID_CSV_FORMAT` | 400 | CSVフォーマットが不正 |
| `INVALID_CSV_HEADER` | 400 | CSVヘッダーが不正 |
| `INVALID_DATE_FORMAT` | 400 | 日付形式が不正 |
| `INVALID_PRICE_VALUE` | 400 | 価格値が不正 |
| `INVALID_OHLC_RELATIONSHIP` | 400 | OHLC関係性が不正 |
| `FILE_TOO_LARGE` | 413 | ファイルサイズ超過 |
| `UNSUPPORTED_FILE_TYPE` | 415 | サポートされていないファイル形式 |

### データベースエラー

| エラーコード | HTTPステータス | 説明 |
|------------|--------------|------|
| `STOCK_NOT_FOUND` | 404 | 銘柄が見つからない |
| `DUPLICATE_ENTRY` | 409 | データ重複エラー |
| `DATABASE_ERROR` | 500 | データベースエラー |

---

## テスト計画

### 単体テスト

1. **csvParserService.test.ts**: CSVパース機能
2. **csvValidator.test.ts**: バリデーション機能
3. **stockImportService.test.ts**: インポートビジネスロジック
4. **stockPriceRepository.test.ts**: データベースアクセス

### 統合テスト

1. **CSVアップロードAPI**: エンドツーエンドテスト
2. **バリデーションエラーハンドリング**: 異常系テスト
3. **重複データ処理**: skip/overwrite戦略テスト

### E2Eテスト

1. 正常系: CSVアップロード → インポート成功
2. 異常系: 不正CSV → エラー表示
3. 異常系: ファイルサイズ超過 → エラー表示

---

## 実装手順

### Phase 1: バックエンド基盤（2-3日）

- [x] CSVパーサーサービス実装
- [x] CSVバリデーター実装
- [x] 株価リポジトリ拡張（upsert, existsByDate, deleteByDateRange）
- [x] 単体テスト作成

### Phase 2: バックエンドAPI実装（2-3日）

- [x] 銘柄情報取得API実装
- [x] CSVアップロードAPI実装
- [x] 株価データ削除API実装
- [x] ファイルアップロード処理実装
- [x] エラーハンドリング実装
- [x] 統合テスト作成

### Phase 3: フロントエンド基盤（2-3日）

- [x] 型定義作成（types/import.ts）
- [x] インポートサービス実装（services/importService.ts）
- [x] CSVパーサー実装（utils/csvParser.ts）
- [x] CSVバリデーター実装（utils/csvValidator.ts）
- [x] カスタムフック実装（hooks/useStockImport.ts）

### Phase 4: フロントエンドコンポーネント実装（3-4日）

- [x] StockSelector コンポーネント実装
- [x] CsvUploader コンポーネント実装
- [x] FileDropZone コンポーネント実装
- [x] ImportProgress コンポーネント実装
- [x] ImportResult コンポーネント実装
- [x] StockPriceImport メイン画面実装

### Phase 5: インポート履歴機能（2日）

- [ ] インポート履歴テーブル追加（マイグレーション）
- [ ] インポート履歴保存処理実装
- [ ] インポート履歴取得API実装
- [ ] ImportHistory コンポーネント実装

### Phase 6: 統合テスト・動作確認（2日）

- [x] E2Eテスト作成
- [x] 実際のCSVファイルでテスト
- [x] エラーハンドリング確認
- [x] パフォーマンステスト

### Phase 7: UI/UX改善（1-2日）

- [ ] レスポンシブデザイン対応
- [ ] ローディング状態の改善
- [ ] エラーメッセージの改善
- [ ] CSVフォーマットガイド追加

---

## 将来拡張案

### Phase 8以降

1. **Web API連携**: Yahoo!ファイナンス、Alpha Vantage等のAPIから自動取得
2. **スケジュール実行**: 定期的な自動インポート（cron）
3. **バックグラウンドジョブ**: 大量データのインポートをキューで処理
4. **進捗通知**: WebSocketによるリアルタイム進捗通知
5. **インポート設定保存**: よく使う設定をプリセットとして保存
6. **複数銘柄一括インポート**: ZIPファイルに複数CSVを含めて一括処理
7. **データ検証機能**: インポート前に株価データの異常値検出
8. **ロールバック機能**: インポート失敗時の自動ロールバック

---

## 参考リンク

- [Papa Parse（CSVパーサー）](https://www.papaparse.com/)
- [React Dropzone](https://react-dropzone.js.org/)
- [Fastify Multipart](https://github.com/fastify/fastify-multipart)
- [Prisma Bulk Operations](https://www.prisma.io/docs/orm/prisma-client/queries/crud#create-multiple-records)

---

## サンプルCSVファイル

**toyota_stock_prices.csv**

```csv
日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000
2024-01-16,152.3,153.5,150.5,151.0,14500000
2024-01-17,151.0,152.8,150.2,152.5,13800000
2024-01-18,152.5,154.2,151.8,153.8,16200000
2024-01-19,153.8,155.0,153.0,154.5,14800000
2024-01-22,154.5,155.8,153.5,155.2,15500000
2024-01-23,155.2,156.5,154.5,155.8,16000000
2024-01-24,155.8,157.0,155.0,156.5,15200000
2024-01-25,156.5,158.2,156.0,157.8,17000000
2024-01-26,157.8,159.0,157.0,158.5,16500000
```

---

**作成日**: 2025-11-03
**最終更新**: 2025-11-03
**ステータス**: 設計完了・実装待ち
**想定実装時間**: 14-19日（約3-4週間）
