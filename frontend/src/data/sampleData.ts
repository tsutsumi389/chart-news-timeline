import { CandlestickData } from '../types/stock';

/**
 * サンプル株価データ
 * 実際のニュースイベントを想定した株価変動パターンを含む
 */
export const sampleStockData: CandlestickData[] = [
  { date: '2024-01-15', open: 150.5, close: 152.3, low: 149.8, high: 153.0 },
  { date: '2024-01-16', open: 152.3, close: 151.0, low: 150.5, high: 153.5 },
  { date: '2024-01-17', open: 151.0, close: 154.2, low: 150.8, high: 154.5 },
  { date: '2024-01-18', open: 154.2, close: 153.8, low: 152.5, high: 155.0 },
  { date: '2024-01-19', open: 153.8, close: 156.5, low: 153.5, high: 157.0 },
  // 大きな上昇(好材料ニュース想定)
  { date: '2024-01-22', open: 156.5, close: 162.0, low: 156.0, high: 162.5 },
  { date: '2024-01-23', open: 162.0, close: 161.5, low: 160.0, high: 163.0 },
  { date: '2024-01-24', open: 161.5, close: 160.2, low: 159.5, high: 162.0 },
  { date: '2024-01-25', open: 160.2, close: 158.5, low: 157.8, high: 161.0 },
  { date: '2024-01-26', open: 158.5, close: 159.8, low: 157.5, high: 160.5 },
  // 横ばい期間
  { date: '2024-01-29', open: 159.8, close: 160.2, low: 158.5, high: 161.0 },
  { date: '2024-01-30', open: 160.2, close: 159.5, low: 158.0, high: 161.5 },
  { date: '2024-01-31', open: 159.5, close: 160.8, low: 159.0, high: 161.5 },
  { date: '2024-02-01', open: 160.8, close: 161.2, low: 159.5, high: 162.0 },
  { date: '2024-02-02', open: 161.2, close: 160.5, low: 159.0, high: 162.5 },
  // 急落(悪材料ニュース想定)
  { date: '2024-02-05', open: 160.5, close: 155.0, low: 154.5, high: 161.0 },
  { date: '2024-02-06', open: 155.0, close: 153.2, low: 152.0, high: 156.0 },
  { date: '2024-02-07', open: 153.2, close: 154.5, low: 152.5, high: 155.5 },
  { date: '2024-02-08', open: 154.5, close: 156.0, low: 153.8, high: 156.8 },
  { date: '2024-02-09', open: 156.0, close: 157.5, low: 155.5, high: 158.0 },
  // 回復トレンド
  { date: '2024-02-12', open: 157.5, close: 159.0, low: 157.0, high: 159.5 },
  { date: '2024-02-13', open: 159.0, close: 160.5, low: 158.5, high: 161.0 },
  { date: '2024-02-14', open: 160.5, close: 162.0, low: 160.0, high: 162.5 },
  { date: '2024-02-15', open: 162.0, close: 163.5, low: 161.5, high: 164.0 },
  { date: '2024-02-16', open: 163.5, close: 165.0, low: 163.0, high: 165.5 },
  // 高値圏での推移
  { date: '2024-02-19', open: 165.0, close: 164.5, low: 163.0, high: 166.0 },
  { date: '2024-02-20', open: 164.5, close: 166.0, low: 164.0, high: 167.0 },
  { date: '2024-02-21', open: 166.0, close: 165.2, low: 164.0, high: 167.5 },
  { date: '2024-02-22', open: 165.2, close: 167.5, low: 165.0, high: 168.0 },
  { date: '2024-02-23', open: 167.5, close: 166.8, low: 165.5, high: 168.5 },
];
