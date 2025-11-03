/**
 * 株価インポート関連の型定義
 */

/**
 * CSVの1行分のデータ
 */
export interface CsvRow {
  date: string;      // 取引日（YYYY-MM-DD形式）
  open: number;      // 始値
  high: number;      // 高値
  low: number;       // 安値
  close: number;     // 終値
  volume: number;    // 出来高
}

/**
 * インポート結果
 */
export interface ImportResult {
  importId: string;         // インポートID
  stockCode: string;        // 銘柄コード
  stockName: string;        // 銘柄名
  totalRows: number;        // 総行数
  successCount: number;     // 成功件数
  skipCount: number;        // スキップ件数
  errorCount: number;       // エラー件数
  errors: ImportError[];    // エラー詳細
  importedAt: string;       // インポート日時
}

/**
 * インポートエラー詳細
 */
export interface ImportError {
  row: number;       // 行番号
  date: string;      // 日付
  message: string;   // エラーメッセージ
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  validRows: CsvRow[];      // バリデーション成功行
  errors: ImportError[];    // バリデーションエラー
}

/**
 * 重複データの処理戦略
 */
export type DuplicateStrategy = 'skip' | 'overwrite';

/**
 * インポート履歴アイテム
 */
export interface ImportHistoryItem {
  importId: string;         // インポートID
  stockCode: string;        // 銘柄コード
  importedAt: string;       // インポート日時
  totalRows: number;        // 総行数
  successCount: number;     // 成功件数
  skipCount: number;        // スキップ件数
  errorCount: number;       // エラー件数
  status: ImportStatus;     // ステータス
}

/**
 * インポートステータス
 */
export type ImportStatus = 'completed' | 'failed' | 'partial';
