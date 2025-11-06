# ニュースインポート機能 実装計画

## 概要

Chart News Timelineアプリケーションにニュース情報をインポートする機能を追加します。企業（銘柄）ごとにCSVファイルからニュースデータを取得し、データベースに登録できる画面とバックエンドAPIを実装します。

**目的**: 手動またはバッチでニュースデータをデータベースに取り込み、株価チャート上にニュースマーカーとして表示できるようにする

**対象ユーザー**: 管理者・データ管理者

---

## 機能要件

### 1. ニュースインポート画面（フロントエンド）

企業（銘柄）を選択し、ニュースデータをインポートするための管理画面を実装します。

#### 画面構成

1. **銘柄選択セクション**
   - 銘柄コード入力フィールド（4桁）
   - 銘柄名表示（銘柄コードを入力すると自動取得）
   - 銘柄検索機能（後続フェーズで実装）

2. **CSVファイルアップロード**
   - ファイル選択ボタン
   - ドラッグ&ドロップエリア
   - CSVフォーマット説明
   - プレビュー機能（アップロード前に内容確認）

3. **インポート設定**
   - 重複データの扱い
     - スキップ（既存データを保持）
     - 上書き（既存データを更新）
   - センチメント自動分析（将来拡張）
     - タイトル・本文からAIで自動判定
     - 手動設定優先
   - 日付範囲フィルター
     - 指定期間外のニュースを除外

4. **インポート実行**
   - インポート実行ボタン
   - 進捗表示（プログレスバー）
   - 結果サマリー表示
     - 成功件数
     - スキップ件数
     - エラー件数
     - エラー詳細リスト

5. **履歴表示**
   - 過去のインポート履歴一覧
   - インポート日時
   - インポート件数
   - ステータス

#### CSVフォーマット仕様

**標準フォーマット**

```csv
公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、2024年世界販売台数で過去最高を記録,2024年の世界販売台数が前年比7%増となり、過去最高を更新した。,https://example.com/news/1,日経新聞,positive,0.85
2024-01-16 14:30:00,トヨタ、米国工場で生産一時停止,部品供給の遅延により、米国の一部工場で生産を一時停止する。,https://example.com/news/2,Bloomberg,negative,-0.60
2024-01-17 10:15:00,トヨタ、EV新モデル発表,2025年発売予定の新型電気自動車を発表した。,https://example.com/news/3,ロイター,positive,0.70
```

**カラム定義**:
- **公開日時**: YYYY-MM-DD HH:MM:SS形式（必須）
- **タイトル**: 255文字以内（必須）
- **要約**: テキスト（任意）
- **URL**: 500文字以内（任意）
- **ソース**: 100文字以内（任意）
- **センチメント**: positive/negative/neutral（任意、デフォルト: neutral）
- **センチメントスコア**: -1.00 〜 1.00の小数点2桁（任意）

**バリデーションルール**:
- 公開日時は有効な日時形式であること
- タイトルは255文字以内
- URLは有効なURL形式（http/https）
- センチメントは positive/negative/neutral のいずれか
- センチメントスコアは -1.00 〜 1.00 の範囲内


### 2. ニュースインポートAPI（バックエンド）

#### エンドポイント設計

##### 2.1 銘柄情報取得API

**エンドポイント**: `GET /api/v1/stocks/:stockCode`

**説明**: 銘柄コードから銘柄情報を取得（株価インポートAPIと共通）

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

**エンドポイント**: `POST /api/v1/stocks/:stockCode/news/import/csv`

**説明**: CSVファイルからニュースデータを一括インポート

**リクエスト**:
- Content-Type: `multipart/form-data`
- Body:
  - `file`: CSVファイル（必須）
  - `duplicateStrategy`: 重複時の処理（`skip` or `overwrite`、デフォルト: `skip`）
  - `dateFrom`: 日付範囲フィルター開始日（任意、YYYY-MM-DD形式）
  - `dateTo`: 日付範囲フィルター終了日（任意、YYYY-MM-DD形式）

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "importId": "news_import_20240115_123456",
    "stockCode": "7203",
    "stockName": "トヨタ自動車",
    "totalRows": 50,
    "successCount": 45,
    "skipCount": 3,
    "errorCount": 2,
    "errors": [
      {
        "row": 10,
        "publishedAt": "2024-01-20 09:00:00",
        "title": "トヨタ、新工場建設",
        "message": "URLの形式が不正です"
      },
      {
        "row": 25,
        "publishedAt": "invalid-date",
        "title": "トヨタ、業績発表",
        "message": "公開日時の形式が不正です"
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

##### 2.3 ニュースデータ削除API

**エンドポイント**: `DELETE /api/v1/stocks/:stockCode/news`

**説明**: 指定銘柄のニュースデータを削除（再インポート前のクリーンアップ用）

**クエリパラメータ**:
- `startDate` (string, optional): 削除開始日時（YYYY-MM-DD形式）
- `endDate` (string, optional): 削除終了日時（YYYY-MM-DD形式）

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "stockCode": "7203",
    "deletedCount": 30,
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-03-31"
    }
  }
}
```

##### 2.4 インポート履歴取得API

**エンドポイント**: `GET /api/v1/stocks/:stockCode/news/import/history`

**説明**: 指定銘柄のニュースインポート履歴を取得

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
        "importId": "news_import_20240115_123456",
        "stockCode": "7203",
        "importedAt": "2024-01-15T12:34:56Z",
        "totalRows": 50,
        "successCount": 45,
        "skipCount": 3,
        "errorCount": 2,
        "status": "completed"
      }
    ]
  }
}
```

##### 2.5 重複ニュース検出API

**エンドポイント**: `POST /api/v1/stocks/:stockCode/news/check-duplicates`

**説明**: インポート前に重複ニュースを検出

**リクエスト**:
```json
{
  "news": [
    {
      "publishedAt": "2024-01-15T09:00:00+09:00",
      "title": "トヨタ、2024年世界販売台数で過去最高を記録"
    }
  ]
}
```

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "totalNews": 10,
    "duplicateCount": 3,
    "duplicates": [
      {
        "publishedAt": "2024-01-15T09:00:00+09:00",
        "title": "トヨタ、2024年世界販売台数で過去最高を記録",
        "existingNewsId": 123
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
│   └── NewsImport.tsx                 # ニュースインポート画面（新規）
├── components/
│   ├── newsImport/
│   │   ├── StockSelector.tsx          # 銘柄選択コンポーネント（株価インポートと共通化）
│   │   ├── CsvUploader.tsx            # CSVアップローダー（新規）
│   │   ├── NewsPreview.tsx            # ニュースプレビュー（新規）
│   │   ├── ImportProgress.tsx         # インポート進捗表示（株価インポートと共通化）
│   │   ├── ImportResult.tsx           # インポート結果表示（株価インポートと共通化）
│   │   └── ImportHistory.tsx          # インポート履歴表示（株価インポートと共通化）
│   └── common/
│       ├── FileDropZone.tsx           # ファイルドロップゾーン（既存）
│       └── ProgressBar.tsx            # プログレスバー（既存）
├── services/
│   └── newsImportService.ts           # ニュースインポートAPI呼び出し（新規）
├── types/
│   └── newsImport.ts                  # ニュースインポート関連型定義（新規）
├── hooks/
│   └── useNewsImport.ts               # ニュースインポートカスタムフック（新規）
└── utils/
    ├── csvParser.ts                   # CSVパーサー（新規）
    └── newsValidator.ts               # ニュースバリデーター（新規）
```

#### 主要コンポーネント

##### NewsImport.tsx（メイン画面）

```typescript
// ニュースインポート画面
// 銘柄選択、CSVアップロード、インポート実行、履歴表示を統合

interface NewsImportProps {}

export const NewsImport: React.FC<NewsImportProps> = () => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { importCsv, isLoading, error } = useNewsImport();

  return (
    <div className="news-import">
      <h1>ニュースデータインポート</h1>

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

          <ImportHistory
            stockCode={selectedStock.stockCode}
            importType="news"
          />
        </>
      )}
    </div>
  );
};
```

##### CsvUploader.tsx（CSVアップロード）

```typescript
// CSVアップロードコンポーネント
// ドラッグ&ドロップ、ファイル選択、プレビュー機能

interface CsvUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({
  onFileSelect,
  disabled
}) => {
  const [previewData, setPreviewData] = useState<NewsItem[] | null>(null);

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
        <NewsPreview data={previewData} />
      )}

      <CsvFormatGuide />
    </div>
  );
};
```

##### NewsPreview.tsx（ニュースプレビュー）

```typescript
// ニュースプレビューコンポーネント
// アップロード前のニュースデータをテーブル形式で表示

interface NewsPreviewProps {
  data: NewsItem[];
}

export const NewsPreview: React.FC<NewsPreviewProps> = ({ data }) => {
  return (
    <div className="news-preview">
      <h3>プレビュー（先頭10件）</h3>
      <table>
        <thead>
          <tr>
            <th>公開日時</th>
            <th>タイトル</th>
            <th>ソース</th>
            <th>センチメント</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((news, index) => (
            <tr key={index}>
              <td>{news.publishedAt}</td>
              <td>{news.title}</td>
              <td>{news.source || '-'}</td>
              <td>
                <SentimentBadge sentiment={news.sentiment} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

#### 型定義（types/newsImport.ts）

```typescript
// ニュースインポート関連の型定義

export interface NewsItem {
  publishedAt: string;
  title: string;
  summary?: string;
  url?: string;
  source?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
}

export interface NewsImportResult {
  importId: string;
  stockCode: string;
  stockName: string;
  totalRows: number;
  successCount: number;
  skipCount: number;
  errorCount: number;
  errors: NewsImportError[];
  importedAt: string;
}

export interface NewsImportError {
  row: number;
  publishedAt: string;
  title: string;
  message: string;
}

export interface NewsImportHistoryItem {
  importId: string;
  stockCode: string;
  importedAt: string;
  totalRows: number;
  successCount: number;
  skipCount: number;
  errorCount: number;
  status: 'completed' | 'failed' | 'partial';
}

export type DuplicateStrategy = 'skip' | 'overwrite';

export interface NewsImportOptions {
  duplicateStrategy: DuplicateStrategy;
  dateFrom?: string;
  dateTo?: string;
}
```

### バックエンド実装

#### ディレクトリ構造

```
backend/src/
├── routes/
│   └── newsImport.ts                  # ニュースインポートルート（新規）
├── controllers/
│   └── newsImportController.ts        # ニュースインポートコントローラー（新規）
├── services/
│   ├── newsImportService.ts           # ニュースインポートビジネスロジック（新規）
│   ├── csvParserService.ts            # CSVパーサーサービス（新規）
│   └── sentimentAnalysisService.ts    # センチメント分析サービス（将来拡張）
├── repositories/
│   └── newsRepository.ts              # ニュースデータアクセス（新規）
├── schemas/
│   └── newsImportSchemas.ts           # ニュースインポートバリデーション（新規）
├── types/
│   └── newsImport.ts                  # ニュースインポート型定義（新規）
└── utils/
    ├── newsValidator.ts               # ニュースバリデーター（新規）
    └── fileUpload.ts                  # ファイルアップロード処理（既存、拡張）
```

#### 主要サービス

##### newsImportService.ts

```typescript
// ニュースインポートのビジネスロジック
// CSVパース、バリデーション、データベース登録

export class NewsImportService {
  /**
   * CSVファイルからニュースデータをインポート
   * @param stockCode 銘柄コード
   * @param csvContent CSVファイル内容
   * @param options インポートオプション
   * @returns インポート結果
   */
  async importFromCsv(
    stockCode: string,
    csvContent: string,
    options: NewsImportOptions
  ): Promise<NewsImportResult> {
    // 1. 銘柄存在チェック
    const stock = await stockRepository.findByCode(stockCode);
    if (!stock) {
      throw new NotFoundError(`銘柄コード ${stockCode} が見つかりません`);
    }

    // 2. CSVパース
    const newsItems = await csvParserService.parseCsv(csvContent);

    // 3. 日付範囲フィルター
    const filteredItems = this.filterByDateRange(
      newsItems,
      options.dateFrom,
      options.dateTo
    );

    // 4. バリデーション
    const validationResult = await this.validateNewsItems(filteredItems);

    // 5. データベース登録（トランザクション）
    const importResult = await this.bulkInsertNews(
      stock.stockId,
      validationResult.validItems,
      options.duplicateStrategy
    );

    // 6. インポート履歴保存（将来実装）
    await this.saveImportHistory(importResult);

    return importResult;
  }

  /**
   * 日付範囲でニュースをフィルター
   */
  private filterByDateRange(
    newsItems: NewsItem[],
    dateFrom?: string,
    dateTo?: string
  ): NewsItem[] {
    if (!dateFrom && !dateTo) {
      return newsItems;
    }

    return newsItems.filter(item => {
      const publishedDate = new Date(item.publishedAt);
      if (dateFrom && publishedDate < new Date(dateFrom)) {
        return false;
      }
      if (dateTo && publishedDate > new Date(dateTo)) {
        return false;
      }
      return true;
    });
  }

  /**
   * ニュースデータのバリデーション
   */
  private async validateNewsItems(items: NewsItem[]): Promise<ValidationResult> {
    const validItems: NewsItem[] = [];
    const errors: NewsImportError[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const validationError = newsValidator.validate(item);

      if (validationError) {
        errors.push({
          row: i + 2, // ヘッダー行を考慮
          publishedAt: item.publishedAt,
          title: item.title,
          message: validationError,
        });
      } else {
        validItems.push(item);
      }
    }

    return { validItems, errors };
  }

  /**
   * ニュースデータの一括登録
   */
  private async bulkInsertNews(
    stockId: number,
    items: NewsItem[],
    strategy: DuplicateStrategy
  ): Promise<NewsImportResult> {
    let successCount = 0;
    let skipCount = 0;
    const errors: NewsImportError[] = [];

    for (const item of items) {
      try {
        if (strategy === 'skip') {
          // 既存データをスキップ（同一銘柄・同一日時・同一タイトル）
          const exists = await newsRepository.existsByTitleAndDate(
            stockId,
            item.publishedAt,
            item.title
          );
          if (exists) {
            skipCount++;
            continue;
          }
        }

        await newsRepository.upsert(stockId, item);
        successCount++;
      } catch (error) {
        errors.push({
          row: 0, // 行番号は後で追加
          publishedAt: item.publishedAt,
          title: item.title,
          message: error.message,
        });
      }
    }

    return {
      importId: generateImportId('news'),
      successCount,
      skipCount,
      errorCount: errors.length,
      errors,
      importedAt: new Date().toISOString(),
    };
  }

  /**
   * 重複ニュースの検出
   */
  async checkDuplicates(
    stockCode: string,
    newsItems: NewsItem[]
  ): Promise<DuplicateCheckResult> {
    const stock = await stockRepository.findByCode(stockCode);
    if (!stock) {
      throw new NotFoundError(`銘柄コード ${stockCode} が見つかりません`);
    }

    const duplicates: DuplicateNews[] = [];

    for (const item of newsItems) {
      const existingNews = await newsRepository.findByTitleAndDate(
        stock.stockId,
        item.publishedAt,
        item.title
      );

      if (existingNews) {
        duplicates.push({
          publishedAt: item.publishedAt,
          title: item.title,
          existingNewsId: existingNews.newsId,
        });
      }
    }

    return {
      totalNews: newsItems.length,
      duplicateCount: duplicates.length,
      duplicates,
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
  async parseCsv(csvContent: string): Promise<NewsItem[]> {
    const lines = csvContent.split('\n');

    // ヘッダー行検証
    const header = lines[0].split(',');
    this.validateCsvHeader(header);

    // データ行をパース
    const newsItems: NewsItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCsvLine(line);
      const item = this.parseNewsItem(values);
      newsItems.push(item);
    }

    return newsItems;
  }

  /**
   * CSVヘッダー行の検証
   */
  private validateCsvHeader(header: string[]): void {
    const expectedHeaders = [
      '公開日時',
      'タイトル',
      '要約',
      'URL',
      'ソース',
      'センチメント',
      'センチメントスコア'
    ];

    for (let i = 0; i < expectedHeaders.length; i++) {
      if (header[i]?.trim() !== expectedHeaders[i]) {
        throw new Error(
          `CSVヘッダーが不正です。期待: ${expectedHeaders.join(',')}`
        );
      }
    }
  }

  /**
   * CSV行のパース（カンマとダブルクォートに対応）
   */
  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * ニュースアイテムのパース
   */
  private parseNewsItem(values: string[]): NewsItem {
    return {
      publishedAt: values[0],
      title: values[1],
      summary: values[2] || undefined,
      url: values[3] || undefined,
      source: values[4] || undefined,
      sentiment: values[5] || 'neutral',
      sentimentScore: values[6] ? parseFloat(values[6]) : undefined,
    };
  }
}
```

##### newsValidator.ts

```typescript
// ニュースデータのバリデーション
// 日付形式、タイトル長、URL形式、センチメント値チェック

export class NewsValidator {
  /**
   * ニュースアイテムのバリデーション
   * @returns エラーメッセージ（正常な場合はnull）
   */
  validate(item: NewsItem): string | null {
    // 公開日時チェック
    if (!this.isValidDateTime(item.publishedAt)) {
      return '公開日時の形式が不正です（YYYY-MM-DD HH:MM:SS形式で入力してください）';
    }

    // タイトル必須チェック
    if (!item.title || item.title.trim() === '') {
      return 'タイトルは必須です';
    }

    // タイトル長チェック
    if (item.title.length > 255) {
      return 'タイトルは255文字以内で入力してください';
    }

    // URL形式チェック
    if (item.url && !this.isValidUrl(item.url)) {
      return 'URLの形式が不正です（http://またはhttps://で始まる必要があります）';
    }

    // URL長チェック
    if (item.url && item.url.length > 500) {
      return 'URLは500文字以内で入力してください';
    }

    // ソース長チェック
    if (item.source && item.source.length > 100) {
      return 'ソースは100文字以内で入力してください';
    }

    // センチメント値チェック
    if (item.sentiment && !['positive', 'negative', 'neutral'].includes(item.sentiment)) {
      return 'センチメントはpositive、negative、neutralのいずれかである必要があります';
    }

    // センチメントスコア範囲チェック
    if (item.sentimentScore !== undefined) {
      if (item.sentimentScore < -1.0 || item.sentimentScore > 1.0) {
        return 'センチメントスコアは-1.00〜1.00の範囲内である必要があります';
      }
    }

    return null;
  }

  /**
   * 日時形式チェック（YYYY-MM-DD HH:MM:SS または ISO 8601）
   */
  private isValidDateTime(dateTimeString: string): boolean {
    const date = new Date(dateTimeString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * URL形式チェック
   */
  private isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
```

#### リポジトリ実装

##### newsRepository.ts（新規）

```typescript
// ニュースデータアクセス層

export class NewsRepository {
  /**
   * 指定タイトル・日時のニュースが存在するかチェック
   */
  async existsByTitleAndDate(
    stockId: number,
    publishedAt: string,
    title: string
  ): Promise<boolean> {
    const count = await prisma.news.count({
      where: {
        stockId,
        publishedAt: new Date(publishedAt),
        title,
      },
    });
    return count > 0;
  }

  /**
   * 指定タイトル・日時のニュースを取得
   */
  async findByTitleAndDate(
    stockId: number,
    publishedAt: string,
    title: string
  ): Promise<News | null> {
    return await prisma.news.findFirst({
      where: {
        stockId,
        publishedAt: new Date(publishedAt),
        title,
      },
    });
  }

  /**
   * ニュースデータのUpsert（存在する場合は更新、しない場合は挿入）
   */
  async upsert(stockId: number, data: NewsItem): Promise<News> {
    // 同一銘柄・同一公開日時・同一タイトルのニュースを一意とする
    const existingNews = await this.findByTitleAndDate(
      stockId,
      data.publishedAt,
      data.title
    );

    if (existingNews) {
      // 更新
      return await prisma.news.update({
        where: { newsId: existingNews.newsId },
        data: {
          summary: data.summary,
          url: data.url,
          source: data.source,
          sentiment: data.sentiment,
          sentimentScore: data.sentimentScore,
        },
      });
    } else {
      // 新規挿入
      return await prisma.news.create({
        data: {
          stockId,
          publishedAt: new Date(data.publishedAt),
          title: data.title,
          summary: data.summary,
          url: data.url,
          source: data.source,
          sentiment: data.sentiment,
          sentimentScore: data.sentimentScore,
        },
      });
    }
  }

  /**
   * 指定範囲のニュースデータを削除
   */
  async deleteByDateRange(
    stockId: number,
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const where: any = { stockId };

    if (startDate || endDate) {
      where.publishedAt = {};
      if (startDate) where.publishedAt.gte = new Date(startDate);
      if (endDate) where.publishedAt.lte = new Date(endDate);
    }

    const result = await prisma.news.deleteMany({ where });
    return result.count;
  }

  /**
   * 銘柄のニュース一覧取得
   */
  async findByStockId(
    stockId: number,
    options?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<News[]> {
    const where: any = { stockId };

    if (options?.startDate || options?.endDate) {
      where.publishedAt = {};
      if (options.startDate) where.publishedAt.gte = new Date(options.startDate);
      if (options.endDate) where.publishedAt.lte = new Date(options.endDate);
    }

    return await prisma.news.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    });
  }
}
```

---

## 依存関係追加

### フロントエンド（frontend/package.json）

```json
{
  "dependencies": {
    "papaparse": "^5.4.1",        // CSVパーサー（既存）
    "react-dropzone": "^14.2.3"   // ファイルドロップゾーン（既存）
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14"  // 型定義（既存）
  }
}
```

### バックエンド（backend/package.json）

```json
{
  "dependencies": {
    "@fastify/multipart": "^8.3.0"  // ファイルアップロード処理（既存）
  }
}
```

---

## データベース拡張

### インポート履歴テーブル追加（将来拡張）

```prisma
// prisma/schema.prisma に追加

model NewsImportHistory {
  importId      String   @id @default(uuid()) @map("import_id")
  stockId       Int      @map("stock_id")
  importedAt    DateTime @default(now()) @map("imported_at") @db.Timestamp()
  totalRows     Int      @map("total_rows")
  successCount  Int      @map("success_count")
  skipCount     Int      @map("skip_count")
  errorCount    Int      @map("error_count")
  status        ImportStatus
  errorDetails  Json?    @map("error_details")
  importType    String   @map("import_type") @db.VarChar(20) // 'csv'

  // リレーション
  stock Stock @relation(fields: [stockId], references: [stockId], onDelete: Cascade)

  @@index([stockId, importedAt], map: "idx_news_import_history")
  @@map("news_import_history")
}
```

---

## UI/UXデザイン

### カラースキーム

- **プライマリ**: #1976D2（青）- アクションボタン
- **成功**: #4CAF50（緑）- 成功メッセージ、ポジティブセンチメント
- **警告**: #FF9800（オレンジ）- スキップメッセージ
- **エラー**: #F44336（赤）- エラーメッセージ、ネガティブセンチメント
- **ニュートラル**: #9E9E9E（グレー）- ニュートラルセンチメント
- **背景**: #F5F5F5（グレー）- ドロップゾーン背景

### センチメントバッジ

- **positive**: 緑色の丸バッジ + テキスト「ポジティブ」
- **negative**: 赤色の丸バッジ + テキスト「ネガティブ」
- **neutral**: 灰色の丸バッジ + テキスト「ニュートラル」

### レスポンシブデザイン

- **デスクトップ**: 3カラムレイアウト（銘柄選択 | アップロード | 履歴）
- **タブレット**: 2カラムレイアウト
- **モバイル**: 1カラムレイアウト（アコーディオン式）

---

## セキュリティ考慮事項

### 1. ファイルアップロード

- **ファイルサイズ制限**: 最大5MB
- **許可拡張子**: `.csv` のみ
- **MIMEタイプチェック**: `text/csv`, `application/csv`
- **ファイル内容検証**: ヘッダーの厳密チェック

### 2. インジェクション対策

- **CSVインジェクション**: 特殊文字のエスケープ処理
- **XSS対策**: タイトル・要約・ソース等のサニタイズ
- **SQLインジェクション**: Prisma ORMによる自動エスケープ

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
- トランザクション内でバッチ処理（500件ごと）

### 2. 非同期処理

- 大量データのインポートはバックグラウンドジョブで処理（将来拡張）
- 進捗状況をWebSocketでリアルタイム通知（将来拡張）

### 3. フロントエンド最適化

- ファイルパースをWeb Workerで実行（UIブロッキング回避）
- 大きなファイルのプレビューは先頭50件のみ表示

---

## エラーハンドリング

### バリデーションエラー

| エラーコード | HTTPステータス | 説明 |
|------------|--------------|------|
| `INVALID_CSV_FORMAT` | 400 | CSVフォーマットが不正 |
| `INVALID_CSV_HEADER` | 400 | CSVヘッダーが不正 |
| `INVALID_DATETIME_FORMAT` | 400 | 日時形式が不正 |
| `INVALID_TITLE` | 400 | タイトルが不正 |
| `INVALID_URL` | 400 | URL形式が不正 |
| `INVALID_SENTIMENT` | 400 | センチメント値が不正 |
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
2. **newsValidator.test.ts**: バリデーション機能
3. **newsImportService.test.ts**: インポートビジネスロジック
4. **newsRepository.test.ts**: データベースアクセス

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
- [x] ニュースバリデーター実装
- [x] ニュースリポジトリ実装（upsert, existsByTitleAndDate, deleteByDateRange）
- [x] 単体テスト作成

### Phase 2: バックエンドAPI実装（2-3日）

- [x] CSVアップロードAPI実装
- [x] ニュースデータ削除API実装
- [x] 重複ニュース検出API実装
- [x] エラーハンドリング実装
- [x] 統合テスト作成

### Phase 3: フロントエンド基盤（2-3日）

- [x] 型定義作成（types/newsImport.ts）
- [x] ニュースインポートサービス実装（services/newsImportService.ts）
- [x] CSVパーサー実装（utils/csvParser.ts）
- [x] ニュースバリデーター実装（utils/newsValidator.ts）
- [x] カスタムフック実装（hooks/useNewsImport.ts）

### Phase 4: フロントエンドコンポーネント実装（3-4日）

- [x] StockSelector コンポーネント実装（株価インポートと共通化）
- [x] CsvUploader コンポーネント実装
- [x] NewsPreview コンポーネント実装
- [x] SentimentBadge コンポーネント実装
- [x] ImportProgress コンポーネント実装（株価インポートと共通化）
- [x] ImportResult コンポーネント実装（株価インポートと共通化）
- [x] NewsImport メイン画面実装

### Phase 5: インポート履歴機能（2日）

- [ ] ニュースインポート履歴テーブル追加（マイグレーション）
- [ ] インポート履歴保存処理実装
- [ ] インポート履歴取得API実装
- [ ] ImportHistory コンポーネント実装（株価インポートと共通化）

### Phase 6: 統合テスト・動作確認（2日）

- [ ] E2Eテスト作成
- [ ] 実際のCSV/JSONファイルでテスト
- [ ] エラーハンドリング確認
- [ ] パフォーマンステスト

### Phase 7: UI/UX改善（1-2日）

- [ ] レスポンシブデザイン対応
- [ ] ローディング状態の改善
- [ ] エラーメッセージの改善
- [ ] ファイルフォーマットガイド追加
- [ ] センチメントバッジのデザイン改善

---

## 将来拡張案

### Phase 8以降

1. **JSONインポート対応**: JSON形式でのインポートに対応
2. **Web API連携**: Google News API、NewsAPI等から自動取得
3. **センチメント自動分析**: 機械学習モデル（GPT-4、BERTなど）でタイトル・本文からセンチメントを自動判定
4. **スケジュール実行**: 定期的な自動インポート（cron）
5. **バックグラウンドジョブ**: 大量データのインポートをキューで処理
6. **進捗通知**: WebSocketによるリアルタイム進捗通知
7. **インポート設定保存**: よく使う設定をプリセットとして保存
8. **複数銘柄一括インポート**: ZIPファイルに複数CSVを含めて一括処理
9. **ニュース重複度検出**: タイトル類似度でほぼ同じニュースを検出
10. **ニュースクローリング**: 指定URLからニュースを自動収集

---

## 参考リンク

- [Papa Parse（CSVパーサー）](https://www.papaparse.com/)
- [React Dropzone](https://react-dropzone.js.org/)
- [Fastify Multipart](https://github.com/fastify/fastify-multipart)
- [Prisma Bulk Operations](https://www.prisma.io/docs/orm/prisma-client/queries/crud#create-multiple-records)
- [NewsAPI](https://newsapi.org/)
- [Google News API](https://newsapi.org/s/google-news-api)

---

## サンプルファイル

### toyota_news.csv

```csv
公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、2024年世界販売台数で過去最高を記録,2024年の世界販売台数が前年比7%増となり、過去最高を更新した。,https://example.com/news/1,日経新聞,positive,0.85
2024-01-16 14:30:00,トヨタ、米国工場で生産一時停止,部品供給の遅延により、米国の一部工場で生産を一時停止する。,https://example.com/news/2,Bloomberg,negative,-0.60
2024-01-17 10:15:00,トヨタ、EV新モデル発表,2025年発売予定の新型電気自動車を発表した。,https://example.com/news/3,ロイター,positive,0.70
2024-01-18 16:45:00,トヨタ、中国市場でシェア拡大,中国市場での販売台数が前年比15%増加。,https://example.com/news/4,日経新聞,positive,0.65
2024-01-19 11:00:00,トヨタ、リコール発表,エアバッグの不具合で約10万台をリコール。,https://example.com/news/5,朝日新聞,negative,-0.50
```


---

**作成日**: 2025-11-07
**最終更新**: 2025-11-07
**ステータス**: 設計完了・実装待ち
**想定実装時間**: 14-19日（約3-4週間）
