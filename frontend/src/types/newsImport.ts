// ニュースインポート関連の型定義

/**
 * ニュースアイテム
 */
export interface NewsItem {
  publishedAt: string;
  title: string;
  summary?: string;
  url?: string;
  source?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
}

/**
 * ニュースインポート結果
 */
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

/**
 * ニュースインポートエラー
 */
export interface NewsImportError {
  row: number;
  publishedAt: string;
  title: string;
  message: string;
}

/**
 * ニュースインポート履歴アイテム
 */
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

/**
 * 重複戦略
 */
export type DuplicateStrategy = 'skip' | 'overwrite';

/**
 * ニュースインポートオプション
 */
export interface NewsImportOptions {
  duplicateStrategy: DuplicateStrategy;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * 重複ニュース
 */
export interface DuplicateNews {
  publishedAt: string;
  title: string;
  existingNewsId: number;
}

/**
 * 重複チェック結果
 */
export interface DuplicateCheckResult {
  totalNews: number;
  duplicateCount: number;
  duplicates: DuplicateNews[];
}

/**
 * CSVプレビューデータ
 */
export interface CsvPreviewData {
  items: NewsItem[];
  totalRows: number;
  hasError: boolean;
  errorMessage?: string;
}
