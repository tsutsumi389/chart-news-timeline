// 株価インポート関連の型定義

/**
 * インポート結果
 */
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

/**
 * インポートエラー
 */
export interface ImportError {
  row: number;
  date: string;
  message: string;
}

/**
 * インポート履歴アイテム
 */
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

/**
 * CSV行データ
 */
export interface CsvRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * CSV行データ（検証前・文字列型）
 */
export interface RawCsvRow {
  date: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

/**
 * 重複データ処理戦略
 */
export type DuplicateStrategy = 'skip' | 'overwrite';

/**
 * CSVバリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ImportError[];
  validRows: CsvRow[];
}

/**
 * CSVプレビューデータ
 */
export interface CsvPreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

/**
 * インポート進捗状態
 */
export interface ImportProgress {
  isLoading: boolean;
  progress: number; // 0-100
  status: 'idle' | 'parsing' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}

/**
 * APIレスポンス型（成功）
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * APIレスポンス型（エラー）
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * APIレスポンス型（共通）
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
