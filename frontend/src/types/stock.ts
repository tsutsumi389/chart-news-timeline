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
