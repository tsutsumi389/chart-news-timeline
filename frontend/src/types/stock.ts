/**
 * ローソク足データの型定義
 */
export interface CandlestickData {
  date: string;    // 日付 (YYYY-MM-DD)
  open: number;    // 始値
  close: number;   // 終値
  low: number;     // 安値
  high: number;    // 高値
}
