/**
 * ニュースインポート関連の型定義
 */

/**
 * センチメント値（Prismaスキーマと一致）
 */
export type Sentiment = 'positive' | 'negative' | 'neutral';

/**
 * CSVから読み取ったニュースアイテム
 */
export interface NewsItem {
  publishedAt: string;           // 公開日時（YYYY-MM-DD HH:MM:SS形式またはISO 8601形式）
  title: string;                 // タイトル（必須、255文字以内）
  summary?: string;              // 要約（任意）
  url?: string;                  // URL（任意、500文字以内）
  source?: string;               // ソース（任意、100文字以内）
  sentiment?: Sentiment;         // センチメント（任意、デフォルト: neutral）
  sentimentScore?: number;       // センチメントスコア（任意、-1.00〜1.00）
}

/**
 * ニュースインポート結果
 */
export interface NewsImportResult {
  importId: string;              // インポートID
  stockCode: string;             // 銘柄コード
  stockName: string;             // 銘柄名
  totalRows: number;             // 総行数
  successCount: number;          // 成功件数
  skipCount: number;             // スキップ件数
  errorCount: number;            // エラー件数
  errors: NewsImportError[];     // エラー詳細
  importedAt: string;            // インポート日時
}

/**
 * ニュースインポートエラー詳細
 */
export interface NewsImportError {
  row: number;                   // 行番号
  publishedAt: string;           // 公開日時
  title: string;                 // タイトル
  message: string;               // エラーメッセージ
}

/**
 * ニュースインポート履歴アイテム
 */
export interface NewsImportHistoryItem {
  importId: string;              // インポートID
  stockCode: string;             // 銘柄コード
  importedAt: string;            // インポート日時
  totalRows: number;             // 総行数
  successCount: number;          // 成功件数
  skipCount: number;             // スキップ件数
  errorCount: number;            // エラー件数
  status: 'completed' | 'failed' | 'partial';  // ステータス
}

/**
 * 重複データの処理戦略
 */
export type DuplicateStrategy = 'skip' | 'overwrite';

/**
 * ニュースインポートオプション
 */
export interface NewsImportOptions {
  duplicateStrategy: DuplicateStrategy;  // 重複時の処理
  dateFrom?: string;                     // 日付範囲フィルター開始日（YYYY-MM-DD形式）
  dateTo?: string;                       // 日付範囲フィルター終了日（YYYY-MM-DD形式）
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  validItems: NewsItem[];        // バリデーション成功アイテム
  errors: NewsImportError[];     // バリデーションエラー
}

/**
 * 重複ニュース情報
 */
export interface DuplicateNews {
  publishedAt: string;           // 公開日時
  title: string;                 // タイトル
  existingNewsId: number;        // 既存のニュースID
}

/**
 * 重複チェック結果
 */
export interface DuplicateCheckResult {
  totalNews: number;             // 総ニュース数
  duplicateCount: number;        // 重複件数
  duplicates: DuplicateNews[];   // 重複ニュース詳細
}
