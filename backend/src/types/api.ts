/**
 * API型定義
 */

// チャートデータレスポンス
export interface ChartDataResponse {
  stock: {
    stockCode: string;
    stockName: string;
  };
  prices: PriceData[];
  news: NewsData[];
}

// 株価データ
export interface PriceData {
  date: string; // YYYY-MM-DD形式
  open: number;
  close: number;
  low: number;
  high: number;
}

// ニュースデータ
export interface NewsData {
  id: string;
  date: string; // YYYY-MM-DD形式
  time: string; // HH:mm:ss形式
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  source: string;
  url: string;
}

// クエリパラメータ型
export interface ChartDataQuery {
  startDate?: string;
  endDate?: string;
  includeNews?: boolean;
}
