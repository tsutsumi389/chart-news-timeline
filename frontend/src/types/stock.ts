/**
 * 銘柄情報の型定義
 */
export interface Stock {
  stockId: number;
  stockCode: string;
  stockName: string;
  createdAt: string;
  updatedAt: string;
}

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

/**
 * ニュース項目の型定義
 */
export interface NewsItem {
  id: string;                    // ニュースID
  date: string;                  // 日付 (YYYY-MM-DD)
  time?: string;                 // 時刻 (HH:mm:ss) ※オプション
  title: string;                 // ニュースタイトル
  summary?: string;              // 要約 ※オプション
  url?: string;                  // ニュース元URL ※オプション
  sentiment: 'positive' | 'negative' | 'neutral';  // センチメント
  source?: string;               // ニュースソース名 ※オプション
}

/**
 * センチメント情報の型定義
 */
export interface SentimentConfig {
  positive: {
    color: string;
    label: string;
  };
  negative: {
    color: string;
    label: string;
  };
  neutral: {
    color: string;
    label: string;
  };
}

/**
 * 株登録入力型
 */
export interface CreateStockInput {
  stockCode: string;
  stockName: string;
}

/**
 * 株価データの型定義（DBから取得）
 */
export interface StockPrice {
  priceId: string;
  stockId: number;
  tradeDate: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * API共通レスポンス型
 */
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
